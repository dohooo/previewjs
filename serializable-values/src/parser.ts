import ts from "typescript";
import type { SerializableValue } from "./serializable-value";

export function parseSerializableValue(
  expression: ts.Expression
): SerializableValue {
  if (ts.isParenthesizedExpression(expression)) {
    return parseSerializableValue(expression.expression);
  }

  if (expression.kind === ts.SyntaxKind.NullKeyword) {
    return {
      kind: "null",
    };
  }

  return {
    kind: "unknown",
  };
}
