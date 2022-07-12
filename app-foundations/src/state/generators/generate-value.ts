import { generateSerializableValue } from "@previewjs/serializable-values";
import {
  CollectedTypes,
  dereferenceType,
  objectType,
  ValueType,
} from "@previewjs/type-analyzer";

/**
 * Generates a value for a specific component.
 *
 * Example:
 * ```
 * properties = { title: "foo" }
 * ```
 */
export function generateValue(
  propsType: ValueType,
  providedKeys: string[],
  collected: CollectedTypes
) {
  const providedKeySet = new Set(providedKeys);
  [propsType] = dereferenceType(propsType, collected, []);
  if (propsType.kind === "object") {
    propsType = objectType(
      Object.fromEntries(
        Object.entries(propsType.fields).filter(
          ([fieldName]) => !providedKeySet.has(fieldName)
        )
      )
    );
  }
  return generateSerializableValue(propsType, collected);
}
