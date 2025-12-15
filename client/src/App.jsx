import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import BookingPage from './pages/BookingPage';
import HistoryPage from './pages/HistoryPage';
import './App.css';

function App() {
  return (
    <Router>
      <div className="app-container">
        <nav className="navbar">
          <div className="logo">🏸 Badminton Booking</div>
          <div className="nav-links">
            <Link to="/">Book Court</Link>
            <Link to="/history">History</Link>
          </div>
        </nav>
        <main>
          <Routes>
            <Route path="/" element={<BookingPage />} />
            <Route path="/history" element={<HistoryPage />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
