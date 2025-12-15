import React from 'react';
import { Link, NavLink, Outlet } from 'react-router-dom';
import './AdminLayout.css';

const AdminLayout = () => {
    const [isSidebarOpen, setIsSidebarOpen] = React.useState(false);

    const toggleSidebar = () => {
        setIsSidebarOpen(!isSidebarOpen);
    };

    const closeSidebar = () => {
        setIsSidebarOpen(false);
    };

    return (
        <div className="admin-container">
            <button className="sidebar-toggle" onClick={toggleSidebar}>
                ☰
            </button>

            <div className={`sidebar-overlay ${isSidebarOpen ? 'active' : ''}`} onClick={closeSidebar}></div>

            <aside className={`admin-sidebar ${isSidebarOpen ? 'active' : ''}`}>
                <div className="sidebar-header">
                    <h3>Admin Panel</h3>
                    <button className="close-sidebar" onClick={closeSidebar}>×</button>
                </div>
                <nav onClick={closeSidebar}>
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
