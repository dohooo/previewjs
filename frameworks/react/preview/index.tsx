import type { RendererLoader } from "@previewjs/core/controller";
import React from "react";
// @ts-ignore Vite is fine with this
import { version } from "react/package.json";

const moduleName = parseInt(version) >= 18 ? "./render-18" : "./render-16";

export const load: RendererLoader = async ({
  wrapperModule,
  wrapperName,
  storiesModule,
  componentModule,
  componentName,
}) => {
  const Wrapper =
    (wrapperModule && wrapperModule[wrapperName || "Wrapper"]) ||
    React.Fragment;
  const ComponentOrStory =
    componentModule[
      componentName === "default" ? "default" : `__previewjs__${componentName}`
    ];
  if (!ComponentOrStory) {
    throw new Error(`No component named '${componentName}'`);
  }
  const ComponentRenderer = generateRenderer(
    Wrapper,
    componentModule,
    ComponentOrStory
  );
  const { render } = await import(/* @vite-ignore */ moduleName);
  const variants = [
    ...(ComponentOrStory.__previewjs_variants || []),
    {
      key: "custom",
      label: componentName,
      isEditorDriven: true,
    },
  ].map((variant) => {
    return {
      key: variant.key,
      label: variant.label,
      props: variant.props,
      isEditorDriven: variant.isEditorDriven,
      render: async (defaultProps, props) => {
        await render(ComponentRenderer, {
          ...defaultProps,
          ...variant.props,
          ...props,
        });
      },
    };
  });
  if (storiesModule && storiesModule.default?.component === ComponentOrStory) {
    // There are stories for the current component.
    // TODO: Support SFC 3.
    variants.push(
      ...Object.entries(storiesModule)
        .filter(
          ([key, value]) =>
            key !== "default" &&
            !key.startsWith("__previewjs__") &&
            key !== "template" &&
            value &&
            typeof value === "function"
        )
        .map(([key, value]) => {
          const StoryRenderer = generateRenderer(Wrapper, storiesModule, value);
          return {
            key,
            label: key,
            props: (value as any).args || {},
            isEditorDriven: false,
            render: async (defaultProps, props) => {
              await render(StoryRenderer, {
                ...defaultProps,
                ...props,
              });
            },
          };
        })
    );
  }
  return {
    variants,
  };
};

function generateRenderer(Wrapper, module, ComponentOrStory) {
  const decorators = [
    ...(ComponentOrStory.decorators || []),
    ...(module.default?.decorators || []),
  ];
  return (props) => {
    return (
      <Wrapper>
        {decorators.reduce(
          (component, decorator) => () => decorator(component),
          () => <ComponentOrStory {...ComponentOrStory.args} {...props} />
        )()}
      </Wrapper>
    );
  };
}

export async function detach() {
  const { render } = await import(/* @vite-ignore */ moduleName);
  render(null, {});
}
