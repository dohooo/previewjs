import { RendererLoader } from "../..";
import { sendMessageFromPreview } from "./messages";
import { getState } from "./state";

export async function updateComponent({
  wrapperModule,
  wrapperName,
  previewModule,
  componentModule,
  componentFilePath,
  componentName,
  loadingError,
  load,
}: {
  wrapperModule: any;
  wrapperName: string;
  previewModule: any;
  componentModule: any;
  componentFilePath: string;
  componentName: string;
  loadingError: string | null;
  load: RendererLoader;
}) {
  const currentState = getState();
  if (!currentState) {
    return;
  }
  try {
    if (loadingError) {
      sendMessageFromPreview({
        kind: "rendering-error",
        message: loadingError,
      });
      return;
    }
    sendMessageFromPreview({
      kind: "before-render",
    });
    const { component, variants, render } = await load({
      wrapperModule,
      wrapperName,
      componentFilePath,
      componentModule,
      componentName,
    });
    if (previewModule) {
      for (const [key, value] of Object.entries(previewModule)) {
        if (
          key === "default" ||
          key.startsWith("__previewjs__") ||
          !value ||
          typeof value !== "object"
        ) {
          continue;
        }
        const variant = value as any;
        if (variant.component !== component) {
          continue;
        }
        variants.push({
          key,
          label: variant.name || key,
          props: variant.args || {},
        });
      }
    }
    variants.push({
      key: "custom",
      label: componentName,
      props: {},
      isEditorDriven: true,
    });
    const variant =
      variants.find((v) => v.key === currentState.variantKey) || variants[0];
    if (!variant) {
      throw new Error(`No variant was found.`);
    }
    const fn = (path: string, returnValue: any) => () => {
      sendMessageFromPreview({ kind: "action", type: "fn", path });
      return returnValue;
    };
    let defaultProps = {
      // Note: this is only there so `fn` doesn't get optimised
      // away :)
      _: fn("", null),
    };
    eval(`
      defaultProps = ${currentState.defaultPropsSource};
      `);
    if (variant.key === "custom") {
      eval(`
        let properties = {};
        ${currentState.customVariantPropsSource};
        variant.props = properties;
        `);
    }
    sendMessageFromPreview({
      kind: "renderer-updated",
      filePath: componentFilePath,
      componentName,
      variantKey: variant.key,
      // Note: we must remove `props` since it may not be serialisable.
      variants: variants.map(({ props, ...rest }) => rest),
      loadingError,
    });
    await render({
      ...defaultProps,
      ...variant.props,
    });
  } catch (error: any) {
    sendMessageFromPreview({
      kind: "rendering-error",
      message: error.stack || error.message,
    });
  }
}
