import { ChangeEvent, useCallback, useEffect, useRef, useState } from "react";
import Editor from "@monaco-editor/react";
import { useApp } from "./useApp";
import { Imports } from "../utils/SandboxManager";

function App() {
  const monacoRef = useRef(null);
  const [imports, setImports] = useState<Imports>({
    vue: "https://jspm.dev/vue/dist/vue.esm-browser.prod.js",
    "vue-router": "https://jspm.dev/vue-router/dist/vue-router.esm-browser.js",
    react: "https://jspm.dev/react@16",
    "react-dom": "https://jspm.dev/react-dom@16",
  });

  const { code, error, logs, runCode, setCode } = useApp(imports);

  const handleClickRun = (): void => {
    runCode();
  };

  function handleEditorValidation(markers: any[]) {
    if (markers.length < 1) {
      handleClickRun();
    }
  }

  function handleEditorWillMount(monaco) {
    monacoRef.current = monaco;

    monaco.languages.typescript.typescriptDefaults.setCompilerOptions({
      module: monaco.languages.typescript.ModuleKind.ESNext, // Usar ESNext para habilitar top-level await
      target: monaco.languages.typescript.ScriptTarget.ES2022, // Compatibilidad con top-level await
      allowJs: true, // Permitir JavaScript (opcional)
      noLib: true, // No incluir librerías por defecto (opcional)
      moduleResolution: monaco.languages.typescript.ModuleResolutionKind.NodeJs, // Resolución de módulos estilo Node.js
      esModuleInterop: true, // Compatibilidad con ES Modules
      allowNonTsExtensions: true,
    });

    setMonacoLibs();
  }

  function handleChangeImportValue(key: string) {
    return function (e: ChangeEvent<HTMLInputElement>): void {
      const { value } = e.target;

      setImports((prev) => ({ ...prev, [key]: value }));
    };
  }

  const setMonacoLibs = useCallback(
    function () {
      if (!monacoRef.current) {
        return;
      }

      const libsType = Object.keys(imports)
        .map(
          (importItem) =>
            `declare module '${importItem}' {export default { } as any;}`
        )
        .join("\n");

      monacoRef.current.languages.typescript.typescriptDefaults.addExtraLib(
        libsType
      );
    },
    [imports]
  );

  useEffect(() => {
    setMonacoLibs();
  }, [imports]);

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
      <div style={{}}>
        <button type="button" onClick={handleClickRun}>
          Run
        </button>
        <div>
          {Object.entries(imports).map(([key, value]) => (
            <div
              key={key}
              style={{ display: "flex", gap: "16px", marginBottom: "16px" }}
            >
              <input
                style={{ display: "flex", flex: 1 / 2 }}
                type="text"
                value={key}
              />
              <input
                style={{ display: "flex", flex: 1 / 2 }}
                type="text"
                value={value}
                onChange={handleChangeImportValue(key)}
              />
            </div>
          ))}
        </div>
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
            beforeMount={handleEditorWillMount}
            onValidate={handleEditorValidation}
            options={{fontSize: 14}}
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
