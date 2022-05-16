import assertNever from "assert-never";
import { SerializableValue } from "./serializable-value";

export function serializableValueToJavaScript(
  value: SerializableValue
): string {
  switch (value.kind) {
    case "array":
      return `[${value.items
        .map((item) => serializableValueToJavaScript(item))
        .join(", ")}]`;
    case "boolean":
      return value.value ? "true" : "false";
    case "function":
      return `() => ${
        value.returnValue.kind === "undefined"
          ? "{}"
          : `(${serializableValueToJavaScript(value.returnValue)})`
      }`;
    case "map":
      return `new Map(Object.entries(${serializableValueToJavaScript(
        value.values
      )}))`;
    case "null":
      return "null";
    case "number":
      return value.value.toString(10);
    case "object": {
      if (Object.entries(value.entries).length === 0) {
        return "{}";
      }
      let text = "";
      text += "{\n";
      for (const entry of value.entries) {
        text += `${
          entry.key.kind === "string"
            ? JSON.stringify(entry.key.value)
            : `[${serializableValueToJavaScript(entry.key)}]`
        }: ${serializableValueToJavaScript(entry.value)},\n`;
      }
      text += "\n}";
      return text;
    }
    case "promise":
      if (value.value.type === "reject") {
        return `Promise.reject(${
          value.value.message === null
            ? ""
            : JSON.stringify(value.value.message)
        })`;
      } else {
        return `Promise.resolve(${serializableValueToJavaScript(
          value.value.value
        )})`;
      }
    case "set":
      return `new Set(${serializableValueToJavaScript(value.values)})`;
    case "string":
      return JSON.stringify(value.value);
    case "undefined":
      return "undefined";
    case "unknown":
      return value.source || "{}";
    default:
      throw assertNever(value);
  }
}
