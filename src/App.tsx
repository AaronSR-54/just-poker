import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Menu from './screens/Menu';
import Onboarding from './screens/Onboarding';
import Local from './screens/Local';
import Online from './screens/Online';
import Lobby from './screens/Lobby';
import Game from './screens/Game';
import Profile from './screens/Profile';
import { useUserStore } from './store/userStore';

function App() {
  const onboardingCompleted = useUserStore(s => s.onboardingCompleted);

  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/"
          element={onboardingCompleted ? <Menu /> : <Navigate to="/onboarding" replace />}
        />
        <Route path="/onboarding" element={<Onboarding />} />
        <Route path="/local" element={<Local />} />
        <Route path="/online" element={<Online />} />
        <Route path="/lobby/:roomId" element={<Lobby />} />
        <Route path="/game/:gameId" element={<Game />} />
        <Route path="/profile" element={<Profile />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
