import { default as BaseEditor } from "@monaco-editor/react";
import { MonacoEditor } from "monaco-types";
import { editor } from "monaco-editor";
import { useRef } from "react";

interface EditorProps {
  code: string;
  setCode: (code: string) => void;
  onValidate: (markers: editor.IMarker[]) => void;
  onScrollChange?: (scrollTop: number) => void;
}

export const Editor = ({ code, setCode, onValidate, onScrollChange }: EditorProps) => {
  const monacoRef = useRef<MonacoEditor>();

  function handleEditorWillMount(monaco: MonacoEditor) {
    monacoRef.current = monaco;

    monaco.languages.typescript.typescriptDefaults.setCompilerOptions({
      module: monaco.languages.typescript.ModuleKind.ESNext, // Usar ESNext para habilitar top-level await
      target: monaco.languages.typescript.ScriptTarget.Latest, // Compatibilidad con top-level await
      allowJs: true, // Permitir JavaScript (opcional)
      noLib: true, // No incluir librerías por defecto (opcional)
      moduleResolution: monaco.languages.typescript.ModuleResolutionKind.NodeJs, // Resolución de módulos estilo Node.js
      esModuleInterop: true, // Compatibilidad con ES Modules
      allowNonTsExtensions: true,
    });

    import("./themes/Dracula.json").then(function (data) {
      monaco.editor.defineTheme("default", data as editor.IStandaloneThemeData);
      monaco.editor.setTheme("default");
    });
  }

  function handleEditorMount(editor: editor.IStandaloneCodeEditor) {
    editor.revealLine(1);

    editor.onDidScrollChange((e) => {
      onScrollChange?.(e.scrollTop);
    })
  }

  function setMonacoLibs() {
    if (!monacoRef.current) {
      return;
    }

    const libsType = Object.keys({})
      .map(
        (importItem) =>
          `declare module '${importItem}' {export default { } as any;}`
      )
      .join("\n");

    monacoRef.current.languages.typescript.typescriptDefaults.addExtraLib(
      libsType
    );
  }

  return (
    <BaseEditor
      height="100%"
      defaultLanguage="typescript"
      defaultValue={code}
      theme="vs-dark"
      onChange={(value = "") => setCode(value)}
      beforeMount={handleEditorWillMount}
      onMount={handleEditorMount}
      onValidate={onValidate}
      options={{ fontSize: 14, minimap: { enabled: false } }}
    />
  );
};
