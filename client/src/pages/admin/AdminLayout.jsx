import React, { useState } from 'react';
import { NavLink, Outlet, Link } from 'react-router-dom';
import './AdminLayout.css';

const linkClass = ({ isActive }) => `admin-link${isActive ? ' active' : ''}`;

const AdminLayout = () => {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    const closeSidebar = () => setIsSidebarOpen(false);

    return (
        <div className="admin-container">
            <div
                className={`sidebar-overlay ${isSidebarOpen ? 'active' : ''}`}
                onClick={closeSidebar}
                aria-hidden="true"
            />

            <aside id="admin-navigation" className={`admin-sidebar ${isSidebarOpen ? 'active' : ''}`} aria-label="Admin navigation">
                <div className="sidebar-header">
                    <div className="sidebar-brand">
                        <span className="admin-mark" aria-hidden="true">A</span>
                        <div>
                            <strong>Admin</strong>
                            <small>Control panel</small>
                        </div>
                    </div>
                    <button type="button" className="close-sidebar" onClick={closeSidebar} aria-label="Close menu">
                        ×
                    </button>
                </div>

                <nav className="admin-nav" onClick={closeSidebar}>
                    <NavLink to="/admin" end className={linkClass}>Dashboard</NavLink>
                    <NavLink to="/admin/courts" className={linkClass}>Courts</NavLink>
                    <NavLink to="/admin/coaches" className={linkClass}>Coaches</NavLink>
                    <NavLink to="/admin/equipment" className={linkClass}>Equipment</NavLink>
                    <NavLink to="/admin/pricing" className={linkClass}>Pricing</NavLink>
                    <NavLink to="/admin/waitlist" className={linkClass}>Waitlist</NavLink>
                </nav>

                <Link to="/" className="admin-link admin-back">← Back to booking</Link>
            </aside>

            <main className="admin-content">
                <button
                    type="button"
                    className="sidebar-toggle"
                    onClick={() => setIsSidebarOpen((open) => !open)}
                    aria-expanded={isSidebarOpen}
                    aria-controls="admin-navigation"
                >
                    ☰ Menu
                </button>
                <Outlet />
            </main>
        </div>
    );
};

export default AdminLayout;
