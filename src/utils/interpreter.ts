import Interpreter from "js-interpreter";

export function getInterpreterInstance(code, logCallback) {
  return new Interpreter(code, (interpreter, globalObject) => {
    // Define a custom `console.log` function
    interpreter.setProperty(
      globalObject,
      "console",
      interpreter.createObject(interpreter.OBJECT)
    );

    interpreter.setProperty(
      interpreter.getProperty(globalObject, "console"),
      "log",
      interpreter.createNativeFunction(logCallback)
    );

    // Enlace nativo para que las Promesas funcionen correctamente
    interpreter.NativePromise = Promise;

    // Agrega soporte básico para `Promise`
    const PromiseWrapper = interpreter.createNativeFunction(function (
      executor
    ) {
      const nativeExecutor = interpreter.pseudoToNative(executor);

      return new interpreter.NativePromise((resolve, reject) => {
        nativeExecutor(
          (value) => resolve(interpreter.nativeToPseudo(value)),
          (reason) => reject(interpreter.nativeToPseudo(reason))
        );
      });
    });

    interpreter.setProperty(globalObject, "Promise", PromiseWrapper);
  });
}
