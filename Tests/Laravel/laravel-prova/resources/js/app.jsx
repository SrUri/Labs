import './bootstrap';
import 'bootstrap/dist/js/bootstrap.bundle.min.js';
import React, { useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';

import CategoryManager from './components/Categories';
import ProductManager from './components/Productes';
import OrderManager from './components/Comandes';
import Login from './components/Login';
import DashboardPro from './components/Dashboard';

// Aquesta funció intercepta totes les peticions 'fetch' que fa React, autentifiquem usuari
const setupFetchInterceptor = () => {
    const originalFetch = window.fetch;
    window.fetch = async function (resource, config = {}) {
        const headers = new Headers(config.headers || {});
        headers.set('Accept', 'application/json');
        
        if (config.body && !(config.body instanceof FormData)) {
            headers.set('Content-Type', 'application/json');
        }
        
        const token = sessionStorage.getItem('auth_token');
        if (token) {
            headers.set('Authorization', `Bearer ${token}`);
        }
        
        config.headers = headers;
        
        const response = await originalFetch(resource, config);
        
        if (response.status === 401 && !resource.toString().includes('/login')) {
            sessionStorage.removeItem('auth_token');
            window.location.reload();
        }
        
        return response;
    };
};
setupFetchInterceptor();

// Component principal dashboard
const App = () => {
    // Estat autentificació del token
    const [isAuthenticated, setIsAuthenticated] = useState(!!sessionStorage.getItem('auth_token'));
    // Sistema d'enrutament intern (Single Page Application)
    const [activeTab, setActiveTab] = useState('dashboard');

    // Tanquem sessió borrant el token
    const handleLogout = async () => {
        try {
            await fetch('/api/logout', { method: 'POST', headers: { 'Accept': 'application/json' } });
        } catch(e) {}
        // Esborrem el token local i canviem l'estat
        sessionStorage.removeItem('auth_token');
        setIsAuthenticated(false);
    };
    
    // Si no està loggejat mostrem Login
    if (!isAuthenticated) {
        return <div className="container"><Login onLoginSuccess={() => setIsAuthenticated(true)} /></div>;
    }

    return (
        <div className="min-vh-100 bg-light">
            {/* NAVEGACIÓ PRINCIPAL */}
            <nav className="navbar navbar-expand-lg navbar-dark bg-dark shadow-sm mb-4">
                <div className="container-fluid px-4">
                    <a className="navbar-brand fw-bold d-flex align-items-center gap-2 cursor-pointer" 
                       onClick={() => setActiveTab('dashboard')}>
                        <i className="bi bi-hexagon-fill text-success fs-4"></i>
                        Studiogenesis ERP
                    </a>
                    
                    <div className="d-flex align-items-center gap-4">
                        <div className="nav nav-pills">
                            <button 
                                className={`nav-link text-white me-2 ${activeTab === 'dashboard' ? 'active bg-success' : ''}`}
                                onClick={() => setActiveTab('dashboard')}>
                                <i className="bi bi-speedometer2 me-2"></i>Panell
                            </button>
                            <button 
                                className={`nav-link text-white me-2 ${activeTab === 'categories' ? 'active bg-success' : ''}`}
                                onClick={() => setActiveTab('categories')}>
                                <i className="bi bi-tags-fill me-2"></i>Categories
                            </button>
                            <button 
                                className={`nav-link text-white me-2 ${activeTab === 'products' ? 'active bg-success' : ''}`}
                                onClick={() => setActiveTab('products')}>
                                <i className="bi bi-box-seam-fill me-2"></i>Productes
                            </button>
                            <button 
                                className={`nav-link text-white ${activeTab === 'orders' ? 'active bg-success' : ''}`}
                                onClick={() => setActiveTab('orders')}>
                                <i className="bi bi-calendar-check-fill me-2"></i>Comandes
                            </button>
                        </div>

                        <div className="border-start border-secondary ps-4">
                            <button onClick={handleLogout} className="btn btn-outline-light btn-sm d-flex align-items-center gap-2">
                                <i className="bi bi-box-arrow-right"></i> LogOut
                            </button>
                        </div>
                    </div>
                </div>
            </nav>

            {/* RENDERITZACIÓ CONDICIONAL */}
            <div className="container-fluid px-4 pb-5 fade-in">
                {activeTab === 'dashboard' && <DashboardPro setActiveTab={setActiveTab} />}
                {activeTab === 'categories' && <CategoryManager />}
                {activeTab === 'products' && <ProductManager />}
                {activeTab === 'orders' && <OrderManager />}
            </div>
            
            {/* Estils globals per a animacions de transició */}
            <style>{`
                .fade-in { animation: fadeIn 0.3s ease-in-out; }
                @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
                .cursor-pointer { cursor: pointer; }
                .cursor-pointer:hover { filter: brightness(0.9); }
            `}</style>
        </div>
    );
};

// Muntatge de l'aplicació React dins del DOM de HTML
const container = document.getElementById('app') || document.getElementById('root');

if (container) {
    const root = createRoot(container);
    root.render(<App />);
} else {
    console.error("No s'ha trobat el contenidor");
}