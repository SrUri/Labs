import React, { useState, useEffect } from 'react';

const DashboardPro = ({ setActiveTab }) => {
    // Estats principals
    const [stats, setStats] = useState({ categories: 0, products: 0, orders: 0, recent_orders: [] });
    const [loading, setLoading] = useState(true);

    // Carrega de les dades del dashboard
    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                const res = await fetch('/api/dashboard-stats');
                if (res.ok) setStats(await res.json());
            } catch (error) { console.error(error); }
            setLoading(false);
        };
        fetchDashboardData();
    }, []);

    if (loading) return <div className="text-center py-5"><div className="spinner-border text-success"></div></div>;

    return (
        <div className="animate__animated animate__fadeIn">
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h2 className="fw-bold mb-0">Resumen del Negoci</h2>
                <span className="badge bg-light text-dark border p-2">Actualizat: {new Date().toLocaleDateString()}</span>
            </div>

            {/* TARGETES D'ESTAT */}
            <div className="row g-4 mb-5">
                <div className="col-md-4">
                    <div className="card border-0 shadow-sm h-100 bg-white" onClick={() => setActiveTab('categories')} style={{cursor: 'pointer'}}>
                        <div className="card-body p-4">
                            <div className="d-flex align-items-center mb-3">
                                <div className="bg-dark rounded-3 p-3 me-3"><i className="bi bi-tags-fill text-white fs-4"></i></div>
                                <div>
                                    <div className="text-muted small fw-bold text-uppercase">Categories</div>
                                    <h2 className="mb-0 fw-bold">{stats.categories}</h2>
                                </div>
                            </div>
                            <div className="progress" style={{height: '6px'}}><div className="progress-bar bg-dark" style={{width: '70%'}}></div></div>
                        </div>
                    </div>
                </div>
                <div className="col-md-4">
                    <div className="card border-0 shadow-sm h-100 bg-white" onClick={() => setActiveTab('products')} style={{cursor: 'pointer'}}>
                        <div className="card-body p-4">
                            <div className="d-flex align-items-center mb-3">
                                <div className="bg-primary rounded-3 p-3 me-3"><i className="bi bi-box-seam-fill text-white fs-4"></i></div>
                                <div>
                                    <div className="text-muted small fw-bold text-uppercase">Productes</div>
                                    <h2 className="mb-0 fw-bold">{stats.products}</h2>
                                </div>
                            </div>
                            <div className="progress" style={{height: '6px'}}><div className="progress-bar bg-primary" style={{width: '50%'}}></div></div>
                        </div>
                    </div>
                </div>
                <div className="col-md-4">
                    <div className="card border-0 shadow-sm h-100 bg-white" onClick={() => setActiveTab('orders')} style={{cursor: 'pointer'}}>
                        <div className="card-body p-4">
                            <div className="d-flex align-items-center mb-3">
                                <div className="bg-success rounded-3 p-3 me-3"><i className="bi bi-calendar-check-fill text-white fs-4"></i></div>
                                <div>
                                    <div className="text-muted small fw-bold text-uppercase">Comandes</div>
                                    <h2 className="mb-0 fw-bold">{stats.orders}</h2>
                                </div>
                            </div>
                            <div className="progress" style={{height: '6px'}}><div className="progress-bar bg-success" style={{width: '90%'}}></div></div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="row g-4">
                {/* TAULA DE COMANDES RECENTS */}
                <div className="col-lg-8">
                    <div className="card border-0 shadow-sm">
                        <div className="card-header bg-white border-0 py-3">
                            <h5 className="mb-0 fw-bold">Últimes comandes registrades</h5>
                        </div>
                        <div className="card-body p-0">
                            <table className="table table-hover align-middle mb-0">
                                <thead className="table-light">
                                    <tr>
                                        <th className="ps-4">Data</th>
                                        <th>Producte</th>
                                        <th>Unitats</th>
                                        <th className="pe-4 text-end">Total</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {stats.recent_orders.map(order => (
                                        <tr key={order.id}>
                                            <td className="ps-4 text-muted">{new Date(order.order_date).toLocaleDateString()}</td>
                                            <td className="fw-bold">{order.product?.name}</td>
                                            <td><span className="badge bg-light text-dark">{order.units} uts</span></td>
                                            <td className="pe-4 text-end fw-bold text-success">{order.total_cost}€</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                {/* ACCESSOS RÀPIDS */}
                <div className="col-lg-4">
                    <div className="card border-0 shadow-sm bg-success text-white">
                        <div className="card-body p-4">
                            <h5 className="fw-bold mb-3">Accions Ràpides</h5>
                            <button className="btn btn-light w-100 mb-2 text-start fw-bold" onClick={() => setActiveTab('orders')}>
                                <i className="bi bi-plus-circle me-2"></i> Nova Comanda
                            </button>
                            <button className="btn btn-light w-100 mb-2 text-start fw-bold" onClick={() => setActiveTab('products')}>
                                <i className="bi bi-file-earmark-pdf me-2"></i> Exportar Productes
                            </button>
                            <hr className="bg-white" />
                            <p className="small mb-0 opacity-75">Soport tècnic actiu: <br /><b>info@studiogenesis.es</b></p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DashboardPro;