import { PlaygroundContainer } from "./pages/playground/containers/playground.container";
import { PlaygroundProvider } from "./pages/playground/providers/playground.provider";

function App() {
  return (
    <PlaygroundProvider>
      <PlaygroundContainer />
    </PlaygroundProvider>
  );
}

export default App;