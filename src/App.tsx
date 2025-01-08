import { EventData, useApp } from "./hooks/use-app";
import { Editor } from "./components/editor";
import { editor } from "monaco-editor";
import { useState } from "react";

interface LogLine {
  text: string;
}

const parseLogs = (data: EventData[], linesCount: number): LogLine[] => {
  return Array.from({ length: linesCount }, (_, i) => {
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
  const { code, error, logs, setCode } = useApp();
  const [lineCount, setLinesCount] = useState(0);
  const [scrollTop, setScrollTop] = useState(0);

  return (
    <div className="container mx-auto flex p-5 h-screen">
      <div
        className="flex flex-col flex-1 bg-slate-100 rounded-xl overflow-hidden"
        style={{ backgroundColor: "#282a36" }}
      >
        <div
          className="flex justify-between items-center"
          style={{ backgroundColor: "#363848" }}
        >
          <div
            className="flex items-center h-10 px-6 gap-1"
            style={{ backgroundColor: "#44475a" }}
          >
            <svg
              className="block"
              width="24px"
              height="24px"
              viewBox="0 0 32 32"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M23.827,8.243A4.424,4.424,0,0,1,26.05,9.524a5.853,5.853,0,0,1,.852,1.143c.011.045-1.534,1.083-2.471,1.662-.034.023-.169-.124-.322-.35a2.014,2.014,0,0,0-1.67-1c-1.077-.074-1.771.49-1.766,1.433a1.3,1.3,0,0,0,.153.666c.237.49.677.784,2.059,1.383,2.544,1.095,3.636,1.817,4.31,2.843a5.158,5.158,0,0,1,.416,4.333,4.764,4.764,0,0,1-3.932,2.815,10.9,10.9,0,0,1-2.708-.028,6.531,6.531,0,0,1-3.616-1.884,6.278,6.278,0,0,1-.926-1.371,2.655,2.655,0,0,1,.327-.208c.158-.09.756-.434,1.32-.761L19.1,19.6l.214.312a4.771,4.771,0,0,0,1.35,1.292,3.3,3.3,0,0,0,3.458-.175,1.545,1.545,0,0,0,.2-1.974c-.276-.395-.84-.727-2.443-1.422a8.8,8.8,0,0,1-3.349-2.055,4.687,4.687,0,0,1-.976-1.777,7.116,7.116,0,0,1-.062-2.268,4.332,4.332,0,0,1,3.644-3.374A9,9,0,0,1,23.827,8.243ZM15.484,9.726l.011,1.454h-4.63V24.328H7.6V11.183H2.97V9.755A13.986,13.986,0,0,1,3.01,8.289c.017-.023,2.832-.034,6.245-.028l6.211.017Z"
                fill="#007acc"
              />
            </svg>
            <p className="text-sm text-white">example.ts</p>
          </div>
        </div>
        <div className="flex flex-grow overflow-hidden">
          <div className="w-2/3">
            <Editor
              code={code}
              setCode={setCode}
              onScrollChange={setScrollTop}
              onChangeLinesCount={setLinesCount}
            />
          </div>
          <div className="relative flex flex-col w-1/3 h-full mt-3">
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
                transform: `translateY(-${scrollTop}px)`,
              }}
            >
              {parseLogs(logs, lineCount).map((log, i) => (
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
