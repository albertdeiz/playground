import { ReactNode, useMemo, useState } from "react";
import { usePlayground } from "../hooks/use-playground";
import { playgroundContext } from "../contexts/playground.context";

export const PlaygroundProvider = ({ children }: { children: ReactNode }) => {
  const { code, error, logs, setCode } = usePlayground();
  const [lineCount, setLinesCount] = useState(0);
  const [scrollTop, setScrollTop] = useState(0);

  const value = useMemo(
    () => ({
      code,
      error,
      logs,
      lineCount,
      scrollTop,
      setCode,
      setLinesCount,
      setScrollTop,
    }),
    [
      code,
      error,
      logs,
      lineCount,
      scrollTop,
      setCode,
      setLinesCount,
      setScrollTop,
    ]
  );

  return (
    <playgroundContext.Provider value={value}>
      {children}
    </playgroundContext.Provider>
  );
};