import * as recast from "recast";
import { parser } from "recast/parsers/babel";

export function preprocessCode(code: string): string {
  const recastAST = recast.parse(code, {
    parser,
  });

  recast.types.visit(recastAST, {
    visitCallExpression(path) {
      const { node } = path;
      const lineNumber = node.loc?.start.line ?? "unknown";
      const lineInfo = recast.types.builders.literal(`${lineNumber}`);

      if (
        node.callee.type === "MemberExpression" &&
        node.callee.object.type === "CallExpression" &&
        node.callee.object.callee.type === "Identifier"
      ) {
        console.log(node.callee.object)
        const myObjectNode = recast.types.builders.objectExpression([
          recast.types.builders.property(
            "init",
            recast.types.builders.identifier("line"),
            lineInfo
          ),
          recast.types.builders.property(
            "init",
            recast.types.builders.identifier("type"),
            recast.types.builders.literal("log")
          ),
          recast.types.builders.property(
            "init",
            recast.types.builders.identifier("args"),
            node
          ),
        ]);

        node.callee = recast.types.builders.callExpression(
          recast.types.builders.memberExpression(
            recast.types.builders.identifier("console"),
            recast.types.builders.identifier("log")
          ),
          [myObjectNode]
        );

        return false;
      }

      if (
        node.callee.type === "MemberExpression" &&
        node.callee.object.type === "Identifier" &&
        node.callee.object.name === "console" &&
        node.callee.property.type === "Identifier" &&
        ["log", "error", "warn"].includes(node.callee.property.name)
      ) {
        
        const myObjectNode = recast.types.builders.objectExpression([
          recast.types.builders.property(
            "init",
            recast.types.builders.identifier("line"),
            lineInfo
          ),
          recast.types.builders.property(
            "init",
            recast.types.builders.identifier("type"),
            recast.types.builders.literal(node.callee.property.name)
          ),
          recast.types.builders.property(
            "init",
            recast.types.builders.identifier("args"),
            recast.types.builders.arrayExpression(node.arguments)
          ),
        ]);

        node.arguments = [myObjectNode];

        return false;
      }

      this.traverse(path);
    },

    visitExpressionStatement(path) {
      const { node } = path;

      const lineNumber = node.loc?.start.line ?? "unknown";

      const lineInfo = recast.types.builders.literal(`${lineNumber}`);

      if (
        node.expression.type === "Identifier" ||
        node.expression.type === "BinaryExpression" ||
        node.expression.type === "ArrayExpression" ||
        node.expression.type === "ObjectExpression"
      ) {
        const myObjectNode = recast.types.builders.objectExpression([
          recast.types.builders.property(
            "init",
            recast.types.builders.identifier("line"),
            lineInfo
          ),
          recast.types.builders.property(
            "init",
            recast.types.builders.identifier("type"),
            recast.types.builders.literal("log")
          ),
          recast.types.builders.property(
            "init",
            recast.types.builders.identifier("args"),
            recast.types.builders.arrayExpression([node.expression])
          ),
        ]);

        // Crear un nuevo CallExpression que incluye el número de línea
        node.expression = recast.types.builders.callExpression(
          recast.types.builders.memberExpression(
            recast.types.builders.identifier("console"),
            recast.types.builders.identifier("log")
          ),
          [myObjectNode]
        );

        return false;
      }

      this.traverse(path);
    },
  });

  return recast.print(recastAST).code;
}
