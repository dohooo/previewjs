import { CollectedTypes, ValueType } from "@previewjs/type-analyzer";
import { Endpoint } from "./endpoint";
import { PersistedState } from "./persisted-state";

export const GetInfo: Endpoint<
  void,
  {
    appInfo: {
      platform: string;
      version: string;
    };
  }
> = {
  path: "get-info",
};

export const GetState: Endpoint<void, PersistedState> = {
  path: "get-state",
};

export const UpdateState: Endpoint<Partial<PersistedState>, PersistedState> = {
  path: "update-state",
};

export const ComputeProps: Endpoint<
  {
    filePath: string;
    componentName: string;
  },
  PreviewSources | null
> = {
  path: "compute-props",
};

export interface PreviewSources {
  propsType: ValueType;
  types: CollectedTypes;
  // TODO: Generate some of these fields client-side?
  typeDeclarationsSource: string;
  defaultPropsSource: string;
  defaultInvocationSource: string;
}
