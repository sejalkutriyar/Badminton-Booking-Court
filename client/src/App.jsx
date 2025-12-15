import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import BookingPage from './pages/BookingPage';
import HistoryPage from './pages/HistoryPage';
import AdminLayout from './pages/admin/AdminLayout';
import AdminDashboard from './pages/admin/AdminDashboard';
import ManageCourts from './pages/admin/ManageCourts';
import ManageCoaches from './pages/admin/ManageCoaches';
import ManageEquipment from './pages/admin/ManageEquipment';
import ManagePricing from './pages/admin/ManagePricing';

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
            <Link to="/admin" style={{ marginLeft: '20px', backgroundColor: '#e74c3c', padding: '5px 10px', borderRadius: '4px' }}>Admin Panel</Link>
          </div>
        </nav>
        <main>
          <Routes>
            <Route path="/" element={<BookingPage />} />
            <Route path="/history" element={<HistoryPage />} />

            {/* Admin Routes */}
            <Route path="/admin" element={<AdminLayout />}>
              <Route index element={<AdminDashboard />} />
              <Route path="courts" element={<ManageCourts />} />
              <Route path="coaches" element={<ManageCoaches />} />
              <Route path="equipment" element={<ManageEquipment />} />
              <Route path="pricing" element={<ManagePricing />} />
            </Route>
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
