import { Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Room from './pages/Room';
import Game from './pages/Game';
import Local from './pages/Local';
import LocalGame from './pages/LocalGame';
import Footer from './components/Footer';

function App() {
  return (
    <div className="min-h-screen bg-space-dark flex flex-col">
      <main className="flex-1 pb-24">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/local" element={<Local />} />
          <Route path="/local/game" element={<LocalGame />} />
          <Route path="/room/:code" element={<Room />} />
          <Route path="/game/:code" element={<Game />} />
        </Routes>
      </main>
      <Footer />
    </div>
  );
}

export default App;
