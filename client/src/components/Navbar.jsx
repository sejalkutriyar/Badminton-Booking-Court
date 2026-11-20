import { Link, NavLink } from 'react-router-dom';

const navClass = ({ isActive }) => `nav-link${isActive ? ' active' : ''}`;
const adminClass = ({ isActive }) => `nav-link admin${isActive ? ' active' : ''}`;

const Navbar = () => (
    <nav className="navbar" aria-label="Main navigation">
        <Link to="/" className="logo">
            <span className="logo-mark" aria-hidden="true">🏸</span>
            <span className="logo-text">Badminton Booking</span>
        </Link>
        <div className="nav-links">
            <NavLink to="/" end className={navClass}>Book Court</NavLink>
            <NavLink to="/history" className={navClass}>History</NavLink>
            <NavLink to="/admin" className={adminClass}>Admin Panel</NavLink>
        </div>
    </nav>
);

export default Navbar;
