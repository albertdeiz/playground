import { useRef, useState, useEffect } from "react";
import { SandboxManager } from "../classes/SandboxManager";
import useLocalStorage from "./use-local-storage";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Arg = any;

export interface EventData {
  type: "log" | "error";
  args: Arg[];
  message: string;
  line: number;
  stack: string;
}

export const useApp = () => {
  const [logs, setLogs] = useState<EventData[]>([]);
  const [code, setCode] = useLocalStorage("__CODE", "");
  const [error, setError] = useState("");
  const sandbox = useRef<SandboxManager>();

  useEffect(() => {
    const messageListener = (event: MessageEvent<EventData>) => {
      if (event.origin !== window.location.origin) {
        return;
      }
      const { data } = event;
      data.line = Number(data.line);

      const { type, message } = data;

      if (type === "log") {
        setLogs((prev) => [...prev, data]);
      }

      if (type === "error") {
        setError(message);
      }
    };

    window.addEventListener("message", messageListener);

    return () => {
      window.removeEventListener("message", messageListener);
    };
  }, []);

  const runCode = () => {
    setLogs([]);
    setError("");

    sandbox.current?.executeScript(code);
  };

  useEffect(() => {
    sandbox.current = new SandboxManager((iframe) => ({
      console: {
        log: function (...args: Arg[]) {
          const [dataLog] = args;

          if (typeof dataLog !== "object") {
            return;
          }

          iframe.contentWindow?.parent.postMessage({ ...dataLog }, "*");
        },
        error: function (...args: Arg[]) {
          const [dataLog] = args;

          if (typeof dataLog !== "object") {
            return;
          }

          iframe.contentWindow?.parent.postMessage(
            {
              type: "error",
              ...dataLog,
              ...{
                stack: dataLog.stack,
                message: dataLog.message,
              },
            },
            "*"
          );
        },
      },
    }));

    return () => {
      sandbox.current?.destroy();
    };
  }, []);

  return {
    code,
    setCode,
    runCode,
    logs,
    error,
  };
};
