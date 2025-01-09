import { useRef, useState, useEffect } from "react";
import { SandboxManager } from "../classes/SandboxManager";
import useLocalStorage from "./use-local-storage";
import { useDebounce } from "./use-debounce";
import { Arg, LogArgument, sanitizeArg } from "../utils/log-parser.util";

export interface LogData {
  line: number;
  args: LogArgument[];
}

interface LogEventData extends LogData {
  event: "log";
}

export interface ErrorData {
  line: number;
  message: string;
  stack: string;
}

interface ErrorEventData extends ErrorData {
  event: "error";
}

export type EventData = LogEventData | ErrorEventData;

export const useApp = () => {
  const [logs, setLogs] = useState<LogData[]>([]);
  const [code, setCode] = useLocalStorage("__CODE", "");
  const debouncedCode = useDebounce(code, 1000);
  const [error, setError] = useState("");
  const sandbox = useRef<SandboxManager>();

  const runCode = () => {
    setLogs([]);
    setError("");
    
    sandbox.current?.executeScript(code);
  };

  useEffect(() => {
    sandbox.current = new SandboxManager({
      console: {
        log: function (...args: Arg[]) {
          const [dataLog] = args;

          if (typeof dataLog !== "object") {
            console.log(...args);
            return;
          }

          const { line, args: consoleArgs = [] } = dataLog;

          const data: LogEventData = {
            event: "log",
            line: Number(line),
            args: (consoleArgs ?? []).map((arg: Arg) => sanitizeArg(arg)),
          };

          setLogs((prev) => [...prev, data]);
        },
        error: function (...args: Arg[]) {
          const [dataLog] = args;

          if (typeof dataLog !== "object") {
            console.error(...args);
            return;
          }

          const data: ErrorEventData = {
            event: "error",
            line: Number(dataLog.line),
            stack: dataLog.stack,
            message: dataLog.message,
          };

          setError(data.message);
        },
      },
    });

    return () => {
      sandbox.current?.destroy();
    };
  }, []);

  useEffect(() => {
    runCode();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedCode]);

  return {
    code,
    setCode,
    runCode,
    logs,
    error,
  };
};
