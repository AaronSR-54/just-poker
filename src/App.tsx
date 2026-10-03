import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Menu from './screens/Menu';
import Local from './screens/Local';
import Game from './screens/Game';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Menu />} />
        <Route path="/local" element={<Local />} />
        <Route path="/game/:gameId" element={<Game />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
