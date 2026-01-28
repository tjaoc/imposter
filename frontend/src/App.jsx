import { Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Room from './pages/Room';
import Game from './pages/Game';

function App() {
  return (
    <div className="min-h-screen bg-space-dark">
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/room/:code" element={<Room />} />
        <Route path="/game/:code" element={<Game />} />
      </Routes>
    </div>
  );
}

export default App;
