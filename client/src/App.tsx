import { AppShell } from './components/AppShell';
import { FormatProvider } from './context/FormatContext';
import { GenerationProvider } from './context/GenerationContext';

function App() {
  return (
    <FormatProvider>
      <GenerationProvider>
        <AppShell />
      </GenerationProvider>
    </FormatProvider>
  );
}

export default App;
