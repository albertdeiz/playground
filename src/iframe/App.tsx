import { useRef } from "react";
import Editor from "@monaco-editor/react";
import { useApp } from "./useApp";

function App() {
  const monacoRef = useRef(null);
  const { code, error, logs, runCode, setCode } = useApp();

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

    monaco.editor.defineTheme("default", {
      base: "vs-dark",
      inherit: true,
      rules: [],
      colors: {},
    });
    monaco.editor.setTheme('default')

    setMonacoLibs();
  }

  function setMonacoLibs() {
    if (!monacoRef.current) {
      return;
    }

    const libsType = Object.keys({})
      .map(
        (importItem) =>
          `declare module '${importItem}' {export default { } as any;}`
      )
      .join("\n");

    monacoRef.current.languages.typescript.typescriptDefaults.addExtraLib(
      libsType
    );
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
      <div style={{}}>
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
            beforeMount={handleEditorWillMount}
            onValidate={handleEditorValidation}
            options={{ fontSize: 14, minimap: { enabled: false } }}
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
