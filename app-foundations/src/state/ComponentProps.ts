import {
  SerializableValue,
  serializableValueToJavaScript,
  UNKNOWN,
} from "@previewjs/serializable-values";
import type { CollectedTypes, ValueType } from "@previewjs/type-analyzer";
import { makeAutoObservable } from "mobx";
import prettier from "prettier";
import parserBabel from "prettier/parser-babel";
import { extractFunctionKeys } from "./generators/extract-function-keys";
import { generateDefaultProps } from "./generators/generate-default-props";
import { generateTypeDeclarations } from "./generators/generate-type-declarations";
import { generateValue } from "./generators/generate-value";

export class ComponentProps {
  private _value: SerializableValue;

  constructor(
    private readonly name: string,
    private readonly types: {
      props: ValueType;
      all: CollectedTypes;
    },
    private readonly argKeys: string[],
    cachedValue: SerializableValue | null
  ) {
    this._value = cachedValue || UNKNOWN;
    makeAutoObservable(this);
  }

  setValue(value: SerializableValue | null) {
    this._value = value || UNKNOWN;
  }

  get value(): SerializableValue {
    return this._value;
  }

  /**
   * Source of default props that should be passed to the component.
   *
   * Typically this is "{}" (empty object) but when we know more about the component, we may
   * provide better defaults such as callback implementations, e.g. "{ onClick: fn(...) }".
   *
   * Unlike defaultInvocation, defaultProps is not shown to the user.
   */
  get defaultPropsSource() {
    return generateDefaultProps(this.types.props, this.types.all);
  }

  /**
   * Type declarations used by the props editor to offer better autocomplete and type checking.
   */
  get typeDeclarations(): string {
    return generateTypeDeclarations(
      this.name,
      this.types.props,
      this.argKeys,
      this.types.all
    );
  }

  get invocationSource(): string {
    return formatSerializableProps(this._value);
  }

  get isDefaultInvocationSource(): boolean {
    return this.invocationSource === this.defaultInvocationSource;
  }

  /**
   * Default source of invocation, used to fill the initial content of the props editor (unless
   * a preconfigured variant is used).
   *
   * This is typically `properties = {};` unless we're able to infer information about the
   * component's props.
   */
  private get defaultInvocationSource() {
    return formatSerializableProps(
      generateValue(
        this.types.props,
        [
          ...extractFunctionKeys(this.types.props, this.types.all),
          ...this.argKeys,
        ],
        this.types.all
      )
    );
  }
}

/**
 * Generates an invocation source for a specific component.
 *
 * Example:
 * ```
 * properties = { title: "foo" }
 * ```
 */
export function formatSerializableProps(props: SerializableValue) {
  let valueSource = serializableValueToJavaScript(props);
  if (valueSource === "undefined") {
    valueSource = "{}";
  }
  const source = `properties = ${valueSource}`;
  return prettier
    .format(source, {
      parser: "babel",
      plugins: [parserBabel],
      filepath: "component.js",
    })
    .trim();
}
