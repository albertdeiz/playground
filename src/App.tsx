import { useRef, useState } from "react";
import Editor from "@monaco-editor/react";

import Sval from "sval";
import * as recast from "recast";
import { parser } from "recast/parsers/babel";
import useLocalStorage from "./hooks/use-local-storage";

class CustomConsole {
  constructor(
    private logHandler: (
      type: "log" | "error",
      line: number | null,
      message: string
    ) => void
  ) {}

  log(...args: any[]) {
    if (typeof args[0] === "object") {
      const { line, args: _args } = args[0];

      this.logHandler(
        "log",
        line,
        (Array.isArray(_args) ? _args
          .map((arg) => JSON.stringify(arg, null, 2))
          .join(" ") : _args)
      );
    } else {
      this.logHandler(
        "log",
        null,
        args
          .map((arg) => JSON.stringify(arg, null, 2))
          .join(" ")
      );
    }
  }

  error(...args: any[]) {
    const lineNumber = args[0];
    this.logHandler(
      "error",
      lineNumber,
      args
        .splice(1)
        .map((arg) => JSON.stringify(arg, null, 2))
        .join(" ")
    );
  }
}

function App() {
  const editorRef = useRef(null);
  const [code, setCode] = useLocalStorage(
    "CODE",
    `import { BaseTransition } from 'vue';
import moment from 'moment';
moment();
console.log(BaseTransition);`
  );
  const [logs, setLogs] = useState<string[]>([]);
  const [error, setError] = useState("");

  const handleClickRun = async (): void => {
    setLogs([]);
    setError("");
    handleRun();
  };

  const handleRun = async () => {
    function preprocessCode(code: string) {
      const recastAST = recast.parse(code, {
        parser,
      });

      recast.types.visit(recastAST, {
        visitImportDeclaration(path) {
          const { node } = path;
          const moduleUrl = node.source.value ?? "";
          const { specifiers: nodeSpecifiers = [] } = node;

          // Caso 1: Importación por defecto (import package from 'package-name';)
          if (
            nodeSpecifiers.length === 1 &&
            nodeSpecifiers[0].type === "ImportDefaultSpecifier"
          ) {
            const localName = nodeSpecifiers[0].local?.name ?? "";

            // Crear una variable temporal para el módulo importado
            const moduleVariableName = `__imported_${localName}`;

            // Crear el dynamic import
            const dynamicImport = recast.types.builders.variableDeclaration(
              "const",
              [
                recast.types.builders.variableDeclarator(
                  recast.types.builders.identifier(moduleVariableName),
                  recast.types.builders.awaitExpression(
                    recast.types.builders.callExpression(
                      recast.types.builders.identifier("import"),
                      [recast.types.builders.literal(moduleUrl)]
                    )
                  )
                ),
              ]
            );

            // Crear la asignación del valor por defecto a la variable original
            const defaultAssignment = recast.types.builders.variableDeclaration(
              "const",
              [
                recast.types.builders.variableDeclarator(
                  recast.types.builders.identifier(localName),
                  recast.types.builders.memberExpression(
                    recast.types.builders.identifier(moduleVariableName),
                    recast.types.builders.identifier("default")
                  )
                ),
              ]
            );

            // Reemplazar el import con las declaraciones correctas
            path.replace(dynamicImport, defaultAssignment);
          }

          // Caso 2: Importación con namespace (import * as package from 'package-name';)
          else if (
            nodeSpecifiers.length === 1 &&
            nodeSpecifiers[0].type === "ImportNamespaceSpecifier"
          ) {
            const localName = nodeSpecifiers[0].local?.name;

            const dynamicImport = recast.types.builders.variableDeclaration(
              "const",
              [
                recast.types.builders.variableDeclarator(
                  recast.types.builders.identifier(localName),
                  recast.types.builders.awaitExpression(
                    recast.types.builders.callExpression(
                      recast.types.builders.identifier("import"),
                      [recast.types.builders.literal(moduleUrl)]
                    )
                  )
                ),
              ]
            );

            path.replace(dynamicImport);
          }
          // Caso 3: Importaciones específicas (import { someExport } from 'package-name';)
          else if (
            nodeSpecifiers.length > 0 &&
            nodeSpecifiers.every(
              (specifier) => specifier.type === "ImportSpecifier"
            )
          ) {
            const dynamicImportName = `__imported_${String(moduleUrl).replace(
              /[^a-zA-Z0-9]/g,
              "_"
            )}`;
            const dynamicImport = recast.types.builders.variableDeclaration(
              "const",
              [
                recast.types.builders.variableDeclarator(
                  recast.types.builders.identifier(dynamicImportName),
                  recast.types.builders.awaitExpression(
                    recast.types.builders.callExpression(
                      recast.types.builders.identifier("import"),
                      [recast.types.builders.literal(moduleUrl)]
                    )
                  )
                ),
              ]
            );

            const specificImports = nodeSpecifiers.map((specifier) => {
              const importedName = specifier.imported.name;
              const localName = specifier.local?.name;

              return recast.types.builders.variableDeclaration("const", [
                recast.types.builders.variableDeclarator(
                  recast.types.builders.identifier(localName),
                  recast.types.builders.memberExpression(
                    recast.types.builders.identifier(dynamicImportName),
                    recast.types.builders.identifier(importedName)
                  )
                ),
              ]);
            });

            // Reemplazar con dynamic import + las asignaciones individuales
            path.replace(dynamicImport, ...specificImports);
          }

          return false;
        },

        visitExpressionStatement(path) {
          const { node } = path;

          // Obtener el número de línea
          const lineNumber = node.loc?.start.line ?? "unknown";

          // Crear el argumento adicional con la línea de código
          const lineInfo = recast.types.builders.literal(`${lineNumber}`);

          if (node.expression.type === "ArrowFunctionExpression") {
            return false;
          }

          // Verificar si la expresión es un CallExpression
          if (
            node.expression.type === "CallExpression" &&
            node.expression.callee.type === "MemberExpression" &&
            node.expression.callee.object.type === "Identifier" &&
            node.expression.callee.object.name === "console" &&
            node.expression.callee.property.type === "Identifier" &&
            ["log", "error", "warn"].includes(
              node.expression.callee.property.name
            )
          ) {
            const argumentsArray = node.expression.arguments.map((arg) => {
              if (arg.type === "Literal") {
                // Para valores primitivos (string, number, boolean, etc.)
                return recast.types.builders.literal(arg.value);
              } else if (arg.type === "Identifier") {
                // Para identificadores
                return recast.types.builders.identifier(arg.name);
              }
              // Agrega otros casos si es necesario (e.g., objetos, arrays, funciones)
              return arg;
            });

            const myObjectNode = recast.types.builders.objectExpression([
              recast.types.builders.property(
                "init",
                recast.types.builders.identifier("line"),
                lineInfo
              ),
              recast.types.builders.property(
                "init",
                recast.types.builders.identifier("args"),
                recast.types.builders.arrayExpression(argumentsArray)
              ),
            ]);

            node.expression.arguments = [myObjectNode];

            return false; // No hacemos nada si ya es un console.log
          }

          if (node.expression.type === "AssignmentExpression") {
            return false;
          }

          const myObjectNode = recast.types.builders.objectExpression([
            recast.types.builders.property(
              "init",
              recast.types.builders.identifier("line"),
              lineInfo
            ),
            recast.types.builders.property(
              "init",
              recast.types.builders.identifier("args"),
              node.expression,
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

          this.traverse(path);
        },
      });

      return recast.print(recastAST).code;
    }

    function executeCode() {
      try {
        const interpreter = new Sval({
          ecmaVer: "latest",
          sandBox: true,
          sourceType: "module",
        });

        interpreter.import({
          console: {
            default: new CustomConsole((type, line, message) => {
              if (type === "error") {
                setError(message);
              } else {
                if (line) {
                  setLogs((prev) => [...prev, `[${line}]: ${message}`]);
                } else {
                  setLogs((prev) => [...prev, `${message}`]);
                }
              }
            }),
          },
          moment: import("https://jspm.dev/moment"),
          vue: import("https://jspm.dev/vue"),
        });

        const preprocessedCode = preprocessCode(code);

        const wrappedCode = `
          import console from 'console';

          (async () => {
            try {
              ${preprocessedCode}
            } catch (e) {
              console.error('u', e.toString());
            }
          })();
        `;

        console.log(preprocessedCode);

        interpreter.run(wrappedCode);
      } catch (err) {
        setError(err.toString());
      }
    }

    executeCode();
  };

  function handleEditorValidation(markers: any[]) {
    if (markers.length < 1) {
      handleClickRun();
    }
  }

  return (
    <div
      style={{
        height: "100%",
        width: "100%",
        display: "flex",
        flexDirection: "column",
        gap: "16px",
        flexWrap: "nowrap",
      }}
    >
      <div>
        <button type="button" onClick={handleClickRun}>
          Run
        </button>
      </div>
      <div
        style={{
          display: "flex",
          height: "100%",
          gap: "16px",
        }}
      >
        <div style={{ flex: 1 / 2 }}>
          <Editor
            height="100%"
            defaultLanguage="typescript"
            defaultValue={code}
            theme="vs-dark"
            onChange={(value = "") => setCode(value)}
            overrideServices={{}}
            onValidate={handleEditorValidation}
            onMount={(editor) => {
              editorRef.current = editor;
            }}
          />
        </div>
        <div style={{ flex: 1 / 2, display: "flex", flexDirection: "column" }}>
          <div style={{ border: "1px solid #ccc", flexGrow: 1 }}>
            {logs.map((log, i) => (
              <p key={i} style={{ margin: 0 }}>
                {log}
              </p>
            ))}
          </div>
          {error && <div>{error}</div>}
        </div>
      </div>
    </div>
  );
}

export default App;
