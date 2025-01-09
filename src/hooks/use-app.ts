import { useRef, useState, useEffect } from "react";
import { SandboxManager } from "../classes/SandboxManager";
import useLocalStorage from "./use-local-storage";
import { useDebounce } from "./use-debounce";

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
  const debouncedCode = useDebounce(code, 1000);
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

          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const sanitizeArg = (item: any, seen?: Set<any>): string | number => {
            seen ||= new Set();

            if (item === null) return "null";
            if (item === undefined) return "undefined";
            if (item.constructor.name === "Number") return item;
            if (item.constructor.name === "String") return `"${item}"`;
            if (item.constructor.name === "Array") {
              // Verificamos si el array contiene elementos circulares
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              return `[${item.map((i: any) => sanitizeArg(i, seen)).join(", ")}]`;
            }
            if (item.constructor.name === "Object") {
              // Detectar estructuras circulares
              if (seen.has(item)) return "[Circular]";
              seen.add(item); // Añadimos al conjunto de objetos visitados
              return `{ ${Object.entries(item)
                .map(([key, value]) => `${key}: ${sanitizeArg(value, seen)}`)
                .join(", ")} }`;
            }
            if (item.constructor.name === "Function") {
              // return `[Function: ${item.name || "anonymous"}]`;
              return `${item.constructor.name ?? 'anonymous'}() { [native code] }`;
            }
            return item.toString();
          };

          iframe.contentWindow?.parent.postMessage(
            { ...dataLog, args: dataLog.args.map(sanitizeArg) },
            "*"
          );
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
