import { default as BaseEditor } from "@monaco-editor/react";
import { MonacoEditor } from "monaco-types";
import { editor } from "monaco-editor";
import { useRef } from "react";

interface EditorProps {
  code: string;
  setCode: (code: string) => void;
  onValidate?: (markers: editor.IMarker[]) => void;
  onScrollChange?: (scrollTop: number) => void;
  onChangeLinesCount?: (linesCount: number) => void;
}

export const Editor = ({
  code,
  setCode,
  onValidate,
  onScrollChange,
  onChangeLinesCount,
}: EditorProps) => {
  const monacoRef = useRef<MonacoEditor>();
  const editorRef = useRef<editor.IStandaloneCodeEditor>();

  function handleEditorWillMount(monaco: MonacoEditor) {
    monacoRef.current = monaco;

    monaco.languages.typescript.typescriptDefaults.setCompilerOptions({
      module: monaco.languages.typescript.ModuleKind.ESNext, // Usar ESNext para habilitar top-level await
      target: monaco.languages.typescript.ScriptTarget.Latest, // Compatibilidad con top-level await
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
    });

    onChangeLinesCount?.(editor.getModel()?.getLineCount() ?? 0);

    editorRef.current = editor;
  }

  function handleOnChange(value = ""): void {
    setCode(value);

    onChangeLinesCount?.(editorRef.current?.getModel()?.getLineCount() ?? 0);
  }

  // function setMonacoLibs() {
  //   if (!monacoRef.current) {
  //     return;
  //   }

  //   const libsType = Object.keys({})
  //     .map(
  //       (importItem) =>
  //         `declare module '${importItem}' {export default { } as any;}`
  //     )
  //     .join("\n");

  //   monacoRef.current.languages.typescript.typescriptDefaults.addExtraLib(
  //     libsType
  //   );
  // }

  return (
    <BaseEditor
      height="100%"
      defaultLanguage="typescript"
      defaultValue={code}
      theme="vs-dark"
      onChange={handleOnChange}
      beforeMount={handleEditorWillMount}
      onMount={handleEditorMount}
      onValidate={onValidate}
      options={{ fontSize: 14, minimap: { enabled: false } }}
    />
  );
};
