import * as esbuild from "esbuild-wasm";
import { NodeResolvePlugin } from "@esbuild-plugins/node-resolve";


export async function initializeEsbuild() {
  await esbuild.initialize({
    wasmURL: "https://unpkg.com/esbuild-wasm@0.17.19/esbuild.wasm",
    worker: true, // Usa workers para mejorar la performance
  });
  console.log("esbuild inicializado");
}

export async function bundleCode(code: string, dependencies: string[]) {
  const result = await esbuild.build({
    stdin: {
      contents: code,
      resolveDir: "/", // Directorio base para resolver módulos
      loader: "tsx",
    },
    bundle: true,
    write: false,
    // plugins: [NodeResolvePlugin({ extensions: dependencies })],
  });

  return result.outputFiles[0].text; // Devuelve el código empaquetado
}
