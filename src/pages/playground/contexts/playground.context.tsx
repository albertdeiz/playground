import { createContext } from "react";
import { LogData } from "../hooks/use-playground";

export interface PlaygroundContextValues {
  code: string;
  error: string;
  logs: LogData[];
  lineCount: number;
  scrollTop: number;
  setCode(code: string): void;
  setLinesCount(lineCount: number): void;
  setScrollTop(scrollTop: number): void;
}

export const playgroundContext = createContext<PlaygroundContextValues>({
  code: "",
  error: "",
  logs: [],
  lineCount: 0,
  scrollTop: 0,
  setCode: () => {
    return;
  },
  setLinesCount: () => {
    return;
  },
  setScrollTop: () => {
    return;
  },
});
