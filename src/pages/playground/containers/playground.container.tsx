import { ErrorDisplay } from "../components/error-display";
import { Header } from "../components/header";
import { EditorContainer } from "../containers/editor.container";
import { LogsContainer } from "../containers/logs.container";
import { usePlayGroundContext } from "../hooks/use-playground-context";

export const PlaygroundContainer = () => {
  const { code, error } = usePlayGroundContext();

  return (
    <div className="container mx-auto flex p-5 h-screen">
      <div
        className="flex flex-col flex-1 bg-slate-100 rounded-xl overflow-hidden"
        style={{ backgroundColor: "#282a36" }}
      >
        <Header title={code.slice(0, 24).replace("\n", " ")} />
        <div className="flex flex-grow overflow-hidden">
          <div className="w-2/3">
            <EditorContainer />
          </div>
          <div className="relative flex flex-col w-1/3 h-full mt-3">
            {error && <ErrorDisplay error={error} />}
            <LogsContainer />
          </div>
        </div>
      </div>
    </div>
  );
};
