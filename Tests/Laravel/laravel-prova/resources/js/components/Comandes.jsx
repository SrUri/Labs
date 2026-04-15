import React, { useState, useEffect } from 'react';

const OrderManager = () => {
    // Estats principals
    const [orders, setOrders] = useState([]);
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [rateWarning, setRateWarning] = useState('');
    
    // Estats de la UI
    const [editingId, setEditingId] = useState(null);
    const [itemToDelete, setItemToDelete] = useState(null);

    const initialForm = { order_date: '', product_id: '', units: 1, total_cost: '' };
    const [form, setForm] = useState(initialForm);
    const [currentMonth, setCurrentMonth] = useState(new Date());

    // Càrrega inicial de dades del Backend
    useEffect(() => { fetchData(); }, []);

    // Execució constant
    useEffect(() => {
        if (form.product_id && form.order_date && form.units) {
            // Busquem producte
            const selectedProduct = products.find(p => p.id.toString() === form.product_id.toString());
            if (selectedProduct && selectedProduct.rates && selectedProduct.rates.length > 0) {
                // Busquem tarifa per a la data exacta
                const applicableRate = selectedProduct.rates.find(rate => {
                    return form.order_date >= rate.date_from && form.order_date <= rate.date_to;
                });
                if (applicableRate) {
                    // Si hi ha tarifa calculem
                    const total = (parseFloat(applicableRate.price) * parseInt(form.units)).toFixed(2);
                    setForm(prev => ({ ...prev, total_cost: total }));
                    setRateWarning(''); 
                } else {
                    // Sino avisem
                    setForm(prev => ({ ...prev, total_cost: '' }));
                    setRateWarning('No hi ha tarifa per a aquesta data.');
                }
            } else if (selectedProduct) {
                // Si el producte no té cap tarifa creada
                setForm(prev => ({ ...prev, total_cost: '' }));
                setRateWarning('Aquest producte no té tarifes.');
            }
        }
    }, [form.product_id, form.order_date, form.units, products]);

    // OBtenir comandes i productes
    const fetchData = async () => {
        setLoading(true);
        try {
            const ordersRes = await fetch('/api/orders');
            if (ordersRes.ok) setOrders(await ordersRes.json());
            const productsRes = await fetch('/api/products');
            if (productsRes.ok) setProducts(await productsRes.json());
        } catch (error) { console.error(error); }
        setLoading(false);
    };

    // Clickem comanda del calendari per editar-la al formulari lateral
    const handleEdit = (order) => {
        setEditingId(order.id);
        const formattedDate = order.order_date.split(' ')[0]; 
        setForm({ order_date: formattedDate, product_id: order.product_id, units: order.units, total_cost: order.total_cost });
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    // Cancel·lem edició
    const cancelEdit = () => {
        setEditingId(null);
        setForm(initialForm);
        setRateWarning('');
    };

    // Manegador comandes
    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const url = editingId ? `/api/orders/${editingId}` : '/api/orders';
            const method = editingId ? 'PUT' : 'POST';
            await fetch(url, {
                method: method,
                headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
                body: JSON.stringify(form)
            });
            cancelEdit();
            fetchData();
        } catch (error) { console.error(error); }
    };

    // Confirmar eliminació
    const confirmDelete = async () => {
        await fetch(`/api/orders/${itemToDelete}`, { method: 'DELETE' });
        setItemToDelete(null);
        cancelEdit(); // Netejem formulario
        fetchData();
    };

    // Lògica calendari
    const daysInMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).getDate();
    // Diumenge = 0, Dilluns = 1
    const firstDayOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1).getDay();
    // Dilluns = 0, Dimarts = 1..., Diumenge = 6
    const startingDay = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1;

    const nextMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
    const prevMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));

    const renderCalendar = () => {
        const days = [];
        const monthNames = ["Gener", "Febrer", "Març", "Abril", "Maig", "Juny", "Juliol", "Agost", "Setembre", "Octubre", "Novembre", "Desembre"];
        
        // Dibuixem caselles buides
        for (let i = 0; i < startingDay; i++) {
            days.push(<div key={`empty-${i}`} className="border-end border-bottom p-2 bg-light"></div>);
        }
        
        // Dibuixem dies del mes amb les comandes
        for (let d = 1; d <= daysInMonth; d++) {
            // Format YYYY-MM-DD
            const currentDateStr = `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
            // Filtrem les comandes que corresponen al dia
            const dayOrders = orders.filter(o => o.order_date.startsWith(currentDateStr));

            days.push(
                // 'minWidth: 0' i 'overflow-hidden' forcen a respectar columnes (degut a noms de comandes llargues)
                <div key={d} className="border-end border-bottom p-2 bg-white d-flex flex-column overflow-hidden" style={{ minWidth: 0 }}>
                    <div className={`fw-bold text-end mb-2 ${d === new Date().getDate() && currentMonth.getMonth() === new Date().getMonth() ? 'text-primary' : 'text-secondary'}`}>
                        {d}
                    </div>
                    <div className="flex-grow-1" style={{ minWidth: 0 }}>
                        {dayOrders.map(order => (
                            <div key={order.id} 
                                 className={`badge w-100 text-start text-truncate mb-1 cursor-pointer shadow-sm py-2 ${editingId === order.id ? 'bg-warning text-dark' : 'bg-success'}`}
                                 title={`${order.units}x ${order.product?.name || 'Borrado'}`}
                                 onClick={() => handleEdit(order)}>
                                <i className="bi bi-pencil-square me-1"></i> {order.units}x {order.product?.name || 'Borrat'}
                            </div>
                        ))}
                    </div>
                </div>
            );
        }

        // Omplim les caselles buides
        const totalCells = days.length;
        const remainder = totalCells % 7;
        if (remainder !== 0) {
            for (let i = 0; i < (7 - remainder); i++) {
                days.push(<div key={`empty-end-${i}`} className="border-end border-bottom p-2 bg-light"></div>);
            }
        }

        return (
            <div className="card shadow-sm border-0">
                <div className="card-header bg-dark text-white d-flex justify-content-between align-items-center">
                    <button className="btn btn-sm btn-outline-light" onClick={prevMonth}>&laquo; Anterior</button>
                    <h5 className="mb-0 fw-bold text-uppercase">{monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}</h5>
                    <button className="btn btn-sm btn-outline-light" onClick={nextMonth}>Següent &raquo;</button>
                </div>
                <div className="card-body p-0">
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)' }} className="text-center bg-light fw-bold border-bottom">
                        <div className="p-2 border-end text-muted">Dill</div><div className="p-2 border-end text-muted">Dim</div>
                        <div className="p-2 border-end text-muted">Dimc</div><div className="p-2 border-end text-muted">Dij</div>
                        <div className="p-2 border-end text-muted">Div</div><div className="p-2 border-end text-muted">Dis</div>
                        <div className="p-2 text-muted text-danger">Diu</div>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gridAutoRows: 'minmax(120px, auto)' }}>{days}</div>
                </div>
            </div>
        );
    };

    return (
        <div className="row">
            {/* MODAL DE CONFIRMACIÓ DE DESTRUCCIÓ */}
            {itemToDelete && (
                <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1050 }}>
                    <div className="modal-dialog modal-dialog-centered">
                        <div className="modal-content border-0 shadow">
                            <div className="modal-header bg-danger text-white border-0">
                                <h5 className="modal-title fw-bold">Confirmar Eliminació</h5>
                                <button type="button" className="btn-close btn-close-white" onClick={() => setItemToDelete(null)}></button>
                            </div>
                            <div className="modal-body p-4 text-center">
                                <p className="mb-0 fs-5">Vols eliminar definitivament aquesta comanda del calendari?</p>
                            </div>
                            <div className="modal-footer bg-light border-0 justify-content-center">
                                <button type="button" className="btn btn-secondary px-4" onClick={() => setItemToDelete(null)}>Cancel·lar</button>
                                <button type="button" className="btn btn-danger px-4 fw-bold" onClick={confirmDelete}>Si, eliminar</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
            
            {/* FORMULARI LATERAL D'INSERCIÓ */}
            <div className="col-lg-3 mb-4">
                <div className={`card shadow-sm border-0 ${editingId ? 'border border-warning' : ''}`}>
                    <div className={`card-header text-dark fw-bold ${editingId ? 'bg-warning' : 'bg-light border-bottom'}`}>
                        {editingId ? 'Editar Comanda' : 'Afegir Comanda'}
                    </div>
                    <div className="card-body">
                        <form onSubmit={handleSubmit}>
                            <div className="mb-3">
                                <label className="form-label small fw-bold">Data</label>
                                <input type="date" className="form-control" required
                                    value={form.order_date} onChange={e => setForm({...form, order_date: e.target.value})} />
                            </div>
                            <div className="mb-3">
                                <label className="form-label small fw-bold">Producte</label>
                                <select className="form-select" required
                                    value={form.product_id} onChange={e => setForm({...form, product_id: e.target.value})}>
                                    <option value="">Selecciona...</option>
                                    {products.map(p => (
                                        <option key={p.id} value={p.id}>{p.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="mb-3">
                                <label className="form-label small fw-bold">Unitats</label>
                                <input type="number" min="1" className="form-control" required
                                    value={form.units} onChange={e => setForm({...form, units: e.target.value})} />
                            </div>
                            <div className="mb-3">
                                <label className="form-label small fw-bold">Cost Total (€)</label>
                                <input type="number" step="0.01" className={`form-control ${rateWarning ? 'is-invalid' : ''}`} required readOnly
                                    value={form.total_cost} placeholder="..." />
                                {rateWarning && <div className="invalid-feedback">{rateWarning}</div>}
                            </div>
                            
                            <button type="submit" className={`btn w-100 fw-bold mb-2 ${editingId ? 'btn-warning' : 'btn-dark'}`} disabled={!!rateWarning || !form.total_cost}>
                                {editingId ? 'Guardar Canvis' : 'Registrar Comanda'}
                            </button>

                            {editingId && (
                                <div className="d-flex gap-2">
                                    <button type="button" className="btn btn-outline-secondary w-50" onClick={cancelEdit}>Cancel·lar</button>
                                    <button type="button" className="btn btn-outline-danger w-50" onClick={() => setItemToDelete(editingId)}>Eliminar</button>
                                </div>
                            )}
                        </form>
                    </div>
                </div>
            </div>

            {/* RENDERITZACIÓ DEL CALENDARI */}
            <div className="col-lg-9">
                {loading ? <div className="p-4 text-center">Carregant calendari...</div> : renderCalendar()}
            </div>
        </div>
    );
};
export default OrderManager;