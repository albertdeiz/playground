import { useRef, useState, useEffect } from "react";
import { Imports, SandboxManager } from "../../utils/SandboxManager";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Arg = any;

interface EventData {
  type: "log" | "error";
  args: Arg[];
  message: string;
}

export const useApp = (imports: Imports) => {
  const [logs, setLogs] = useState<string[]>([]);
  // const [code, setCode] =
  //   useState(`import { createRouter, createWebHistory } from 'vue-router'
  // import { createApp } from 'vue'

  // const app = createApp({ template: 'Hello world.' })
  // const router = createRouter({
  //   routes: [{ path: '/:pathMatch(.*)*', component: app }],
  //   history: createWebHistory()
  // })
  // app.use(router)

  // app.mount('#app');`);
  const [code, setCode] =
    useState(`import React from 'react';
import ReactDOM from 'react-dom';

ReactDOM.render(
  React.createElement('h1', null, '¡Hola desde JSPM!'),
  document.getElementById('app')
);`);
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

    try {
      sandbox.current?.executeScript(code);
    } catch (e) {
      console.log(e);
    }
  };

  useEffect(() => {
    sandbox.current = new SandboxManager(
      (iframe) => ({
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
      }),
      imports
    );

    return () => {
      sandbox.current?.destroy();
    };
  }, [imports]);

  return {
    code,
    setCode,
    runCode,
    logs,
    error,
  };
};
