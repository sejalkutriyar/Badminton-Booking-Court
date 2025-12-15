import React from 'react';
import { Link, NavLink, Outlet } from 'react-router-dom';
import './AdminLayout.css';

const AdminLayout = () => {
    return (
        <div className="admin-container">
            <aside className="admin-sidebar">
                <h3>Admin Panel</h3>
                <nav>
                    <Link to="/admin">Dashboard</Link>
                    <Link to="/admin/courts">Manage Courts</Link>
                    <Link to="/admin/coaches">Manage Coaches</Link>
                    <NavLink to="/admin/equipment" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>Equipment</NavLink>
                    <NavLink to="/admin/pricing" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>Pricing</NavLink>
                    <NavLink to="/admin/waitlist" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>Waitlist</NavLink>
                </nav>
            </aside>
            <main className="admin-content">
                <Outlet />
            </main>
        </div>
    );
};

export default AdminLayout;
