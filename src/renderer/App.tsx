import { MemoryRouter as Router, Routes, Route } from 'react-router-dom';
import './App.scss';
import Home from './HomePage/Home';

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home/>} />
      </Routes>
    </Router>
  );
}
