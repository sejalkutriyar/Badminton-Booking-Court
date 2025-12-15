import React from 'react';
import { Link, Outlet } from 'react-router-dom';
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
                    <Link to="/admin/equipment">Manage Equipment</Link>
                    <Link to="/admin/pricing">Manage Pricing</Link>
                </nav>
            </aside>
            <main className="admin-content">
                <Outlet />
            </main>
        </div>
    );
};

export default AdminLayout;
