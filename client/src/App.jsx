import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import Navbar from './components/Navbar';
import BookingPage from './pages/BookingPage';
import HistoryPage from './pages/HistoryPage';
import AdminLayout from './pages/admin/AdminLayout';
import AdminDashboard from './pages/admin/AdminDashboard';
import ManageCourts from './pages/admin/ManageCourts';
import ManageCoaches from './pages/admin/ManageCoaches';
import ManageEquipment from './pages/admin/ManageEquipment';
import ManagePricing from './pages/admin/ManagePricing';
import ManageWaitlist from './pages/admin/ManageWaitlist';

import './App.css';

const NotFound = () => (
  <div className="not-found">
    <div className="not-found-card">
      <span className="not-found-code">404</span>
      <h2>Page not found</h2>
      <p>The page you are looking for does not exist or has moved.</p>
      <Link to="/" className="btn-primary">Back to booking</Link>
    </div>
  </div>
);

function App() {
  return (
    <Router>
      <div className="app-container">
        <Navbar />
        <main>
          <Routes>
            <Route path="/" element={<BookingPage />} />
            <Route path="/history" element={<HistoryPage />} />

            <Route path="/admin" element={<AdminLayout />}>
              <Route index element={<AdminDashboard />} />
              <Route path="courts" element={<ManageCourts />} />
              <Route path="coaches" element={<ManageCoaches />} />
              <Route path="equipment" element={<ManageEquipment />} />
              <Route path="pricing" element={<ManagePricing />} />
              <Route path="waitlist" element={<ManageWaitlist />} />
            </Route>

            <Route path="*" element={<NotFound />} />
          </Routes>
        </main>
        <footer className="app-footer">
          <span>Badminton Court Booking</span>
          <span>Open daily · 6:00 AM – 9:00 PM</span>
        </footer>
      </div>
    </Router>
  );
}

export default App;
