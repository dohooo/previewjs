import type { PreviewConfig } from "@previewjs/config";
import fs from "fs-extra";
import path from "path";
import { URLSearchParams } from "url";
import type { Plugin } from "vite";

const COMPONENT_LOADER_MODULE = "/@component-loader.js";
const PREVIEW_POSSIBLE_EXTENSIONS = new Set([".js", ".jsx", ".ts", ".tsx"]);

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
      let previewModuleId: string | null = null;
      for (const ext of PREVIEW_POSSIBLE_EXTENSIONS) {
        if (await fs.pathExists(filePathWithoutExt + ".preview" + ext)) {
          previewModuleId = componentModuleId + ".preview";
          break;
        }
      }
      return generateComponentLoaderModule({
        filePath,
        componentName,
        componentModuleId,
        previewModuleId,
        wrapper: options.config.wrapper || null,
      });
    },
  };
}

function generateComponentLoaderModule({
  filePath,
  componentName,
  componentModuleId,
  previewModuleId,
  wrapper,
}: {
  filePath: string;
  componentName: string;
  componentModuleId: string;
  previewModuleId: string | null;
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
    previewModuleId
      ? `
  let previewModulePromise;
  if (import.meta.hot.data.preloadedPreviewModule) {
    previewModulePromise = Promise.resolve(import.meta.hot.data.preloadedPreviewModule);
  } else {
    previewModulePromise = import("${previewModuleId}");
  }
  const previewModule = await previewModulePromise.catch(e => {
    console.error(e);
    loadingError = e.stack || e.message || null;
    return null;
  });
  `
      : `
  const previewModule = null;
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
    previewModule,
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
  previewModuleId
    ? `
import.meta.hot.accept(["${previewModuleId}"], ([previewModule]) => {
  import.meta.hot.data.preloadedPreviewModule = previewModule;
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
