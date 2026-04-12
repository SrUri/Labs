import './bootstrap';
import 'bootstrap/dist/js/bootstrap.bundle.min.js';
import React, { useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';

import CategoryManager from './components/Categories';
import ProductManager from './components/Productes';
import OrderManager from './components/Comandes';
import Login from './components/Login';

const setupFetchInterceptor = () => {
    const originalFetch = window.fetch;
    window.fetch = async function () {
        let [resource, config] = arguments;
        config = config || {};
        config.headers = config.headers || {};
        
        const token = localStorage.getItem('auth_token');
        if (token) {
            config.headers['Authorization'] = `Bearer ${token}`;
        }
        return originalFetch(resource, config);
    };
};
setupFetchInterceptor();

const App = () => {
    const [isAuthenticated, setIsAuthenticated] = useState(!!localStorage.getItem('auth_token'));
    const [activeTab, setActiveTab] = useState('orders'); // Empezamos en el calendario

    const handleLogout = async () => {
        try {
            await fetch('/api/logout', { method: 'POST', headers: { 'Accept': 'application/json' } });
        } catch(e) {}
        localStorage.removeItem('auth_token');
        setIsAuthenticated(false);
    };

    if (!isAuthenticated) {
        return <div className="container"><Login onLoginSuccess={() => setIsAuthenticated(true)} /></div>;
    }

    return (
        <div className="min-vh-100 bg-light">
            {/* Navbar tipo Supabase/Nuxt */}
            <nav className="navbar navbar-expand-lg navbar-dark bg-dark shadow-sm mb-4">
                <div className="container-fluid px-4">
                    <a className="navbar-brand fw-bold d-flex align-items-center gap-2" href="#">
                        <i className="bi bi-hexagon-fill text-success fs-4"></i>
                        Studiogenesis ERP
                    </a>
                    
                    <div className="d-flex align-items-center gap-4">
                        <div className="nav nav-pills">
                            <button 
                                className={`nav-link text-white me-2 ${activeTab === 'categories' ? 'active bg-success' : ''}`}
                                onClick={() => setActiveTab('categories')}>
                                <i className="bi bi-tags-fill me-2"></i>Categorías
                            </button>
                            <button 
                                className={`nav-link text-white me-2 ${activeTab === 'products' ? 'active bg-success' : ''}`}
                                onClick={() => setActiveTab('products')}>
                                <i className="bi bi-box-seam-fill me-2"></i>Productos
                            </button>
                            <button 
                                className={`nav-link text-white ${activeTab === 'orders' ? 'active bg-success' : ''}`}
                                onClick={() => setActiveTab('orders')}>
                                <i className="bi bi-calendar-check-fill me-2"></i>Pedidos
                            </button>
                        </div>

                        <div className="border-start border-secondary ps-4">
                            <button onClick={handleLogout} className="btn btn-outline-light btn-sm d-flex align-items-center gap-2">
                                <i className="bi bi-box-arrow-right"></i> Salir
                            </button>
                        </div>
                    </div>
                </div>
            </nav>

            {/* Contenedor Principal con animación suave */}
            <div className="container-fluid px-4 pb-5 fade-in">
                {activeTab === 'categories' && <CategoryManager />}
                {activeTab === 'products' && <ProductManager />}
                {activeTab === 'orders' && <OrderManager />}
            </div>
            
            <style>{`
                .fade-in { animation: fadeIn 0.3s ease-in-out; }
                @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
                .cursor-pointer { cursor: pointer; }
                .cursor-pointer:hover { filter: brightness(0.9); }
            `}</style>
        </div>
    );
};

const container = document.getElementById('root');
if (container) {
    const root = createRoot(container);
    root.render(<App />);
}