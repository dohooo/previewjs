import { RendererLoader } from "../..";
import { sendMessageFromPreview } from "./messages";
import { serialize } from "./serializer";
import { getState } from "./state";

export async function updateComponent({
  wrapperModule,
  wrapperName,
  storiesModule,
  componentModule,
  componentFilePath,
  componentName,
  loadingError,
  load,
}: {
  wrapperModule: any;
  wrapperName: string;
  storiesModule: any;
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
    const { variants } = await load({
      wrapperModule,
      wrapperName,
      storiesModule,
      componentFilePath,
      componentModule,
      componentName,
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
    let properties = {
      title: "Overriding!",
    };
    if (variant.key === "custom") {
      eval(`
        ${currentState.customVariantPropsSource};
        `);
    }
    sendMessageFromPreview({
      kind: "renderer-updated",
      filePath: componentFilePath,
      componentName,
      variantKey: variant.key,
      // Note: we must remove `render` since it may not be serialisable.
      variants: variants.map(({ render, props, ...rest }) => ({
        props: serialize(props || {}),
        ...rest,
      })),
      loadingError,
    });
    await variant.render(defaultProps, properties);
  } catch (error: any) {
    sendMessageFromPreview({
      kind: "rendering-error",
      message: error.stack || error.message,
    });
  }
}
