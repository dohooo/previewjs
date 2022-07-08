import ts from "typescript";
import { describe, expect, it } from "vitest";
import { parseSerializableValue } from "./parser";
import { NULL, SerializableValue } from "./serializable-value";

describe("parseSerializableValue", () => {
  it("parses null", () => {
    expect(parseExpressionFromSource(`null`)).toEqual<SerializableValue>(NULL);
  });

  it("parses parenthesized expression", () => {
    expect(parseExpressionFromSource(`(null)`)).toEqual<SerializableValue>(
      NULL
    );
  });
});

function parseExpressionFromSource(
  expressionSource: string
): SerializableValue {
  const sourceFile = ts.createSourceFile(
    __filename,
    `${expressionSource}`,
    ts.ScriptTarget.Latest,
    false /* setParentNodes */,
    ts.ScriptKind.TSX
  );
  const statement = sourceFile.statements[0];
  if (!statement) {
    throw new Error(`No statement found in source code`);
  }
  if (!ts.isExpressionStatement(statement)) {
    throw new Error(`Expected expression statement, got ${statement.kind}`);
  }
  return parseSerializableValue(statement.expression);
}
