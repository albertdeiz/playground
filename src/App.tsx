import { EventData, useApp } from "./hooks/use-app";
import { Editor } from "./components/editor";
import { editor } from "monaco-editor";
import { useState } from "react";

interface LogLine {
  text: string;
}

const parseLogs = (data: EventData[]): LogLine[] => {
  const maxLineIndex = Math.max(...data.map(({ line }) => line));

  return Array.from({ length: maxLineIndex }, (_, i) => {
    i += 1;

    const lineData = data.filter((d) => d.line === i);

    return {
      text: lineData
        .map(({ args }) =>
          (args ?? [])
            .map((arg) =>
              typeof arg === "object"
                ? JSON.stringify(arg, null, 1)
                : String(arg)
            )
            .join(" ")
        )
        .join(" "),
    };
  });
};

function App() {
  const { code, error, logs, runCode, setCode } = useApp();
  const [scrollTop, setScrollTop] = useState(0);

  const handleClickRun = (): void => {
    runCode();
  };

  function handleEditorValidation(markers: editor.IMarker[]) {
    if (markers.length < 1) {
      handleClickRun();
    }
  }

  return (
    <div className="container mx-auto flex p-5 h-screen">
      <div
        className="flex flex-col flex-1 bg-slate-100 rounded-xl overflow-hidden"
        style={{ backgroundColor: "#282a36" }}
      >
        <div className="flex justify-end p-5">
          <button
            className="h-10 px-6 font-semibold rounded-md bg-black text-white"
            type="button"
            onClick={handleClickRun}
          >
            Run
          </button>
        </div>
        <div className="flex flex-grow overflow-hidden">
          <div className="w-2/3">
            <Editor
              code={code}
              setCode={setCode}
              onValidate={handleEditorValidation}
              onScrollChange={setScrollTop}
            />
          </div>
          <div className="relative flex flex-col w-1/3 he-full">
            {error && (
              <div className="flex sticky top-0 left-0 w-full h-full py-2 pl-0 pr-2 z-10">
                <div className="flex-1 bg-red-600 rounded-md p-2">
                  <p className="text-white text-md">{error}</p>
                </div>
              </div>
            )}
            <div
              className="absolute top-0 w-full left-0 text-white flex-1"
              style={{
                borderTop: "1px solid rgba(255,255,255, 0.1)",
                transform: `translateY(-${scrollTop}px)`,
              }}
            >
              {parseLogs(logs).map((log, i) => (
                <p
                  key={i}
                  className="text-sm"
                  style={{
                    height: "21px",
                    borderBottom: "1px solid rgba(255,255,255, 0.1)",
                  }}
                >
                  {log.text}
                </p>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
