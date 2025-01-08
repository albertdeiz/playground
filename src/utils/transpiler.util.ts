import * as recast from "recast";
import { parser } from "recast/parsers/babel";

const { builders: b } = recast.types;

export function preprocessCode(code: string): string {
  const recastAST = recast.parse(code, {
    parser,
  });

  recast.types.visit(recastAST, {
    visitNewExpression() {
      return false;
    },

    visitCallExpression(path) {
      const { node } = path;

      const lineNumber = node.loc?.start.line ?? "unknown";

      const lineInfo = b.literal(`${lineNumber}`);

      if (
        node.callee.type === "MemberExpression" &&
        node.callee.object.type === "Identifier" &&
        node.callee.object.name === "console" &&
        node.callee.property.type === "Identifier" &&
        ["log", "error", "warn"].includes(node.callee.property.name)
      ) {
        const myObjectNode = b.objectExpression([
          b.property("init", b.identifier("line"), lineInfo),
          b.property(
            "init",
            b.identifier("type"),
            b.literal(node.callee.property.name)
          ),
          b.property(
            "init",
            b.identifier("args"),
            b.arrayExpression(node.arguments)
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

      const lineInfo = b.literal(`${lineNumber}`);

      if (
        node.expression.type === "Identifier" ||
        node.expression.type === "BinaryExpression" ||
        node.expression.type === "ArrayExpression" ||
        node.expression.type === "ObjectExpression"
      ) {
        const myObjectNode = b.objectExpression([
          b.property("init", b.identifier("line"), lineInfo),
          b.property("init", b.identifier("type"), b.literal("log")),
          b.property(
            "init",
            b.identifier("args"),
            b.arrayExpression([node.expression])
          ),
        ]);

        // Crear un nuevo CallExpression que incluye el número de línea
        node.expression = b.callExpression(
          b.memberExpression(b.identifier("console"), b.identifier("log")),
          [myObjectNode]
        );

        return false;
      }

      this.traverse(path);
    },
  });

  return recast.print(recastAST).code;
}
