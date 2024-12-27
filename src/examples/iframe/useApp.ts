import { useRef, useState, useEffect } from "react";
import { SandboxManager } from "../../utils/SandboxManager";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Arg = any;

interface EventData {
  type: "log" | "error";
  args: Arg[];
  message: string;
}

export const useApp = () => {
  const [logs, setLogs] = useState<string[]>([]);
  const [code, setCode] = useState(`import { createRouter, createWebHistory } from 'vue-router'
  import { createApp } from 'vue'

  const app = createApp({ template: 'Hello world.' })
  const router = createRouter({
    routes: [{ path: '/:pathMatch(.*)*', component: app }],
    history: createWebHistory()
  })
  app.use(router)

  app.mount('.app');`);
  const [error, setError] = useState("");
  const sandbox = useRef<SandboxManager>();

  useEffect(() => {
    const messageListener = (event: MessageEvent<EventData>) => {
      if (event.origin !== window.location.origin) {
        return;
      }

      const { data } = event;

      if (data?.type === "log") {
        const logs = (data?.args ?? []).map((arg: Arg) =>
          typeof arg === "object" ? JSON.stringify(arg, null, 1) : String(arg)
        );

        setLogs((prev) => [...prev, ...logs]);
      }

      if (data?.type === "error") {
        setError(data.message);
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
          iframe.contentWindow?.parent.postMessage(
            { type: "log", args: args },
            "*"
          );
        },
        error: function (...args: Arg[]) {
          iframe.contentWindow?.parent.postMessage(
            { type: "error", message: args.join(" ") },
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
