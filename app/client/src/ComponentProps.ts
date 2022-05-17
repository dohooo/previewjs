import { CollectedTypes, ValueType } from "@previewjs/type-analyzer";
import { makeAutoObservable, observable } from "mobx";
import { extractFunctionKeys } from "./generators/extract-function-keys";
import { generateDefaultProps } from "./generators/generate-default-props";
import { generateInvocation } from "./generators/generate-invocation";
import { generateTypeDeclarations } from "./generators/generate-type-declarations";
import { SerializableValue, unknown } from "./generators/serializable-value";
import { serializableValueToJavaScript } from "./generators/serializable-value-to-js";

export class ComponentProps {
  private _value: SerializableValue;

  constructor(
    private readonly name: string,
    readonly types: {
      props: ValueType;
      all: CollectedTypes;
    },
    private readonly argKeys: string[],
    cachedInvocationSource: string | null
  ) {
    // TODO: Cached structured value.
    this._value = unknown(cachedInvocationSource);
    makeAutoObservable<ComponentProps, "_value">(this, {
      _value: observable.ref,
    });
  }

  get value() {
    return this._value;
  }

  setValue(value: SerializableValue) {
    this._value = value;
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
    return `properties = ${serializableValueToJavaScript(this._value)}`;
  }

  get isDefaultInvocationSource(): boolean {
    return (
      !this.invocationSource ||
      this.invocationSource === this.defaultInvocationSource
    );
  }

  /**
   * Default source of invocation, used to fill the initial content of the props editor (unless
   * a preconfigured variant is used).
   *
   * This is typically `properties = {};` unless we're able to infer information about the
   * component's props.
   */
  private get defaultInvocationSource() {
    return generateInvocation(
      this.types.props,
      [
        ...extractFunctionKeys(this.types.props, this.types.all),
        ...this.argKeys,
      ],
      this.types.all
    );
  }
}
