import type { PreviewConfig } from "@previewjs/config";
import fs from "fs-extra";
import path from "path";
import { URLSearchParams } from "url";
import type { Plugin } from "vite";

const COMPONENT_LOADER_MODULE = "/@component-loader.js";
const STORIES_POSSIBLE_SUFFIXES = [".stories", ".story"];
const POSSIBLE_EXTENSIONS = [".js", ".jsx", ".ts", ".tsx"];

export function componentLoaderPlugin(options: {
  config: PreviewConfig;
}): Plugin {
  return {
    name: "previewjs:component-loader",
    resolveId: async function (id) {
      if (id.startsWith(COMPONENT_LOADER_MODULE)) {
        return id;
      }
      return null;
    },
    load: async function (id) {
      if (!id.startsWith(COMPONENT_LOADER_MODULE)) {
        return null;
      }
      const params = new URLSearchParams(id.split("?")[1] || "");
      const filePath = params.get("p");
      const componentName = params.get("c");
      if (filePath === null || componentName === null) {
        throw new Error(`Invalid use of /@component-loader.js module`);
      }
      const ext = path.extname(filePath);
      const filePathWithoutExt = filePath.substring(
        0,
        filePath.length - ext.length
      );
      const componentModuleId = `/${filePathWithoutExt.replace(/\\/g, "/")}`;
      let storiesModuleId: string | null = null;
      for (const suffix of STORIES_POSSIBLE_SUFFIXES) {
        for (const ext of POSSIBLE_EXTENSIONS) {
          if (await fs.pathExists(filePathWithoutExt + suffix + ext)) {
            storiesModuleId = componentModuleId + suffix;
            break;
          }
        }
      }
      return generateComponentLoaderModule({
        filePath,
        componentName,
        componentModuleId,
        storiesModuleId,
        wrapper: options.config.wrapper || null,
      });
    },
  };
}

function generateComponentLoaderModule({
  filePath,
  componentName,
  componentModuleId,
  storiesModuleId,
  wrapper,
}: {
  filePath: string;
  componentName: string;
  componentModuleId: string;
  storiesModuleId: string | null;
  wrapper: {
    path: string;
    componentName?: string;
  } | null;
}): string {
  return `import { updateComponent } from '/__previewjs_internal__/update-component';
import { load } from '/__previewjs_internal__/renderer/index';

let counter = 0;
export async function refresh() {
  const currentCounter = ++counter;
  let loadingError = null;
  ${
    wrapper
      ? `
  let wrapperModulePromise;
  if (import.meta.hot.data.preloadedWrapperModule) {
    wrapperModulePromise = Promise.resolve(import.meta.hot.data.preloadedWrapperModule);
  } else {
    wrapperModulePromise = import("/${wrapper.path}");
  }
  const wrapperModule = await wrapperModulePromise.catch(e => {
    console.error(e);
    loadingError = e.stack || e.message || null;
    return null;
  });
  `
      : `
  const wrapperModule = null;
  `
  }
  ${
    storiesModuleId
      ? `
  let storiesModulePromise;
  if (import.meta.hot.data.preloadedStoriesModule) {
    storiesModulePromise = Promise.resolve(import.meta.hot.data.preloadedStoriesModule);
  } else {
    storiesModulePromise = import("${storiesModuleId}");
  }
  const storiesModule = await storiesModulePromise.catch(e => {
    console.error(e);
    loadingError = e.stack || e.message || null;
    return null;
  });
  `
      : `
  const storiesModule = null;
  `
  }
  let componentModulePromise;
  if (import.meta.hot.data.preloadedComponentModule) {
    componentModulePromise = Promise.resolve(import.meta.hot.data.preloadedComponentModule);
  } else {
    componentModulePromise = import("${componentModuleId}");
  }
  const componentModule = await componentModulePromise.catch(e => {
    console.error(e);
    loadingError = e.stack || e.message || null;
    return null;
  });
  if (currentCounter !== counter) {
    // Abort to avoid double rendering.
    return;
  }
  await updateComponent({
    wrapperModule,
    wrapperName: ${JSON.stringify(wrapper?.componentName || null)},
    storiesModule,
    componentModule,
    componentFilePath: ${JSON.stringify(filePath)},
    componentName: ${JSON.stringify(componentName)},
    loadingError,
    load,
  })
}

import.meta.hot.accept();

${
  wrapper
    ? `
import.meta.hot.accept(["${wrapper.path}"], ([wrapperModule]) => {
  import.meta.hot.data.preloadedWrapperModule = wrapperModule;
  refresh();
});
`
    : ``
}

${
  storiesModuleId
    ? `
import.meta.hot.accept(["${storiesModuleId}"], ([storiesModule]) => {
  import.meta.hot.data.preloadedStoriesModule = storiesModule;
  refresh();
});
`
    : ``
}

import.meta.hot.accept(["${componentModuleId}"], ([componentModule]) => {
  import.meta.hot.data.preloadedComponentModule = componentModule;
  refresh();
});
`;
}
