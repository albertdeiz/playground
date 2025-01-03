import * as recast from "recast";
import { parser } from "recast/parsers/babel";

export function preprocessCode(code: string): string {
  const recastAST = recast.parse(code, {
    parser,
  });

  recast.types.visit(recastAST, {
    // visitImportDeclaration(path) {
    //   const { node } = path;
    //   const moduleUrl = node.source.value ?? "";
    //   const { specifiers: nodeSpecifiers = [] } = node;

    //   // Caso 1: Importación por defecto (import package from 'package-name';)
    //   if (
    //     nodeSpecifiers.length === 1 &&
    //     nodeSpecifiers[0].type === "ImportDefaultSpecifier"
    //   ) {
    //     const localName = nodeSpecifiers[0].local?.name ?? "";

    //     // Crear una variable temporal para el módulo importado
    //     const moduleVariableName = `__imported_${localName}`;

    //     // Crear el dynamic import
    //     const dynamicImport = recast.types.builders.variableDeclaration(
    //       "const",
    //       [
    //         recast.types.builders.variableDeclarator(
    //           recast.types.builders.identifier(moduleVariableName),
    //           recast.types.builders.awaitExpression(
    //             recast.types.builders.callExpression(
    //               recast.types.builders.identifier("import"),
    //               [recast.types.builders.literal(moduleUrl)]
    //             )
    //           )
    //         ),
    //       ]
    //     );

    //     // Crear la asignación del valor por defecto a la variable original
    //     const defaultAssignment = recast.types.builders.variableDeclaration(
    //       "const",
    //       [
    //         recast.types.builders.variableDeclarator(
    //           recast.types.builders.identifier(localName),
    //           recast.types.builders.memberExpression(
    //             recast.types.builders.identifier(moduleVariableName),
    //             recast.types.builders.identifier("default")
    //           )
    //         ),
    //       ]
    //     );

    //     // Reemplazar el import con las declaraciones correctas
    //     path.replace(dynamicImport, defaultAssignment);
    //   }

    //   // Caso 2: Importación con namespace (import * as package from 'package-name';)
    //   else if (
    //     nodeSpecifiers.length === 1 &&
    //     nodeSpecifiers[0].type === "ImportNamespaceSpecifier"
    //   ) {
    //     const localName = nodeSpecifiers[0].local?.name;

    //     const dynamicImport = recast.types.builders.variableDeclaration(
    //       "const",
    //       [
    //         recast.types.builders.variableDeclarator(
    //           recast.types.builders.identifier(localName),
    //           recast.types.builders.awaitExpression(
    //             recast.types.builders.callExpression(
    //               recast.types.builders.identifier("import"),
    //               [recast.types.builders.literal(moduleUrl)]
    //             )
    //           )
    //         ),
    //       ]
    //     );

    //     path.replace(dynamicImport);
    //   }
    //   // Caso 3: Importaciones específicas (import { someExport } from 'package-name';)
    //   else if (
    //     nodeSpecifiers.length > 0 &&
    //     nodeSpecifiers.every(
    //       (specifier) => specifier.type === "ImportSpecifier"
    //     )
    //   ) {
    //     const dynamicImportName = `__imported_${String(moduleUrl).replace(
    //       /[^a-zA-Z0-9]/g,
    //       "_"
    //     )}`;
    //     const dynamicImport = recast.types.builders.variableDeclaration(
    //       "const",
    //       [
    //         recast.types.builders.variableDeclarator(
    //           recast.types.builders.identifier(dynamicImportName),
    //           recast.types.builders.awaitExpression(
    //             recast.types.builders.callExpression(
    //               recast.types.builders.identifier("import"),
    //               [recast.types.builders.literal(moduleUrl)]
    //             )
    //           )
    //         ),
    //       ]
    //     );

    //     const specificImports = nodeSpecifiers.map((specifier) => {
    //       const importedName = specifier.imported.name;
    //       const localName = specifier.local?.name;

    //       return recast.types.builders.variableDeclaration("const", [
    //         recast.types.builders.variableDeclarator(
    //           recast.types.builders.identifier(localName),
    //           recast.types.builders.memberExpression(
    //             recast.types.builders.identifier(dynamicImportName),
    //             recast.types.builders.identifier(importedName)
    //           )
    //         ),
    //       ]);
    //     });

    //     // Reemplazar con dynamic import + las asignaciones individuales
    //     path.replace(dynamicImport, ...specificImports);
    //   }

    //   return false;
    // },

    visitCallExpression(path) {
      const { node } = path;
      // Obtenemos el número de línea
      const lineNumber = node.loc?.start.line ?? "unknown";

      // Crear el argumento adicional con la línea de código
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

        // Crear un nuevo CallExpression que incluye el número de línea
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
        
        // Creamos el objeto con la línea y los argumentos
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

        // Reemplazamos la expresión original por la nueva
        node.arguments = [myObjectNode];

        return false;
      }

      // Continuamos con la siguiente expresión
      this.traverse(path);
    },

    visitExpressionStatement(path) {
      const { node } = path;

      // Obtener el número de línea
      const lineNumber = node.loc?.start.line ?? "unknown";

      // Crear el argumento adicional con la línea de código
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
