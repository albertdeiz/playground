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

  function handleEditorDidMount() {
    monacoRef.current.languages.typescript.typescriptDefaults.addExtraLib(
      `
      declare module '@vue/compiler-dom' {
        export function CompilerOptions(): void;
      }

      declare module '@vue/runtime-dom' {
        export function RenderFunction(): void;
        export function createApp({ template }: { template: string }): void;
      }

      declare module 'vue' {
        import { CompilerOptions } from '@vue/compiler-dom';
        import { RenderFunction } from '@vue/runtime-dom';

        export declare function compile(template: string | HTMLElement, options?: CompilerOptions): RenderFunction;


        export * from "@vue/runtime-dom";

        export { }
      }`
    );
  }

  function handleEditorWillMount(monaco) {
    monacoRef.current = monaco;
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
            onMount={handleEditorDidMount}
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
