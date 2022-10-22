import type { Component } from "@previewjs/core";
import {
  extractCsf3Stories,
  extractDefaultComponent,
  resolveComponent,
} from "@previewjs/csf3";
import { helpers, TypeResolver } from "@previewjs/type-analyzer";
import ts from "typescript";

export function extractSvelteComponents(
  resolver: TypeResolver,
  absoluteFilePath: string
): Component[] {
  const sourceFile = resolver.sourceFile(absoluteFilePath);
  if (!sourceFile) {
    return [];
  }

  const functions: Array<[string, ts.Statement, ts.Node]> = [];
  for (const statement of sourceFile.statements) {
    if (ts.isVariableStatement(statement)) {
      for (const declaration of statement.declarationList.declarations) {
        if (!ts.isIdentifier(declaration.name) || !declaration.initializer) {
          continue;
        }
        functions.push([
          declaration.name.text,
          statement,
          declaration.initializer,
        ]);
      }
    } else if (ts.isFunctionDeclaration(statement)) {
      const isDefaultExport =
        !!statement.modifiers?.find(
          (m) => m.kind === ts.SyntaxKind.ExportKeyword
        ) &&
        !!statement.modifiers?.find(
          (m) => m.kind === ts.SyntaxKind.DefaultKeyword
        );
      const name = statement.name?.text;
      if (isDefaultExport || name) {
        functions.push([
          isDefaultExport || !name ? "default" : name,
          statement,
          statement,
        ]);
      }
    }
  }

  const storiesDefaultComponent = extractDefaultComponent(sourceFile);
  const resolvedStoriesComponent = storiesDefaultComponent
    ? resolveComponent(resolver.checker, storiesDefaultComponent)
    : null;
  const components: Component[] = [];
  const args = helpers.extractArgs(sourceFile);
  const nameToExportedName = helpers.extractExportedNames(sourceFile);
  for (const [name, statement] of functions) {
    const hasArgs = !!args[name];
    const isExported = !!nameToExportedName[name];
    if (hasArgs && isExported) {
      components.push({
        absoluteFilePath,
        name,
        offsets: [[statement.getStart(), statement.getEnd()]],
        info: {
          kind: "story",
          associatedComponent: resolvedStoriesComponent,
        },
      });
    }
  }
  return [...components, ...extractCsf3Stories(resolver, sourceFile)];
}
