import { Editor } from "../components/editor";
import { usePlayGroundContext } from "../hooks/use-playground-context"

export const EditorContainer = () => {
  const {code, setCode, setScrollTop, setLinesCount} = usePlayGroundContext();

  return (
    <Editor
      code={code}
      setCode={setCode}
      onScrollChange={setScrollTop}
      onChangeLinesCount={setLinesCount}
    />
  )
}