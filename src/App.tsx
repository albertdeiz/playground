import { useRef, useState } from "react";
import Editor from "@monaco-editor/react";
import Sval from "sval";

type Arg = any;

function App() {
  const editorRef = useRef(null);
  const [code, setCode] = useState(`import * as vue from 'vue';
console.log(vue);`);
  const [logs, setLogs] = useState<string[]>([]);
  const [error, setError] = useState("");

  const handleClickRun = async (): void => {
    setLogs([]);
    setError("");

    const customConsole = {
      log: (...args: any[]) =>
        setLogs((prev) => [
          ...prev,
          ...(args ?? []).map((arg: Arg) =>
            typeof arg === "object" ? JSON.stringify(arg, null, 1) : String(arg)
          ),
        ]),
    };

    const interpreter = new Sval({ sandBox: true, sourceType: 'script'});

    interpreter.import({
      vue: await import('https://cdnjs.cloudflare.com/ajax/libs/vue/3.5.13/vue.esm-browser.prod.min.js'),
      moment: await import('https://cdnjs.cloudflare.com/ajax/libs/moment.js/2.30.1/moment.min.js'),
    });
    
    const originalConsoleLog = console.log;

    try {
      console.log = customConsole.log;

      interpreter.run(code);

    } catch (error) {
      setError(`Error: ${error.toString()}`);
    } finally {
      console.log = originalConsoleLog;
    }
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
