import { useContext } from "react";
import {
  playgroundContext,
  PlaygroundContextValues,
} from "../contexts/playground.context";

export const usePlayGroundContext = (): PlaygroundContextValues => {
  return useContext(playgroundContext);
};
