import React, { useState, useEffect } from 'react';

const OrderManager = () => {
    const [orders, setOrders] = useState([]);
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [rateWarning, setRateWarning] = useState('');
    
    const [form, setForm] = useState({ order_date: '', product_id: '', units: 1, total_cost: '' });
    const [currentMonth, setCurrentMonth] = useState(new Date());

    useEffect(() => {
        fetchData();
    }, []);

    useEffect(() => {
        if (form.product_id && form.order_date && form.units) {
            const selectedProduct = products.find(p => p.id.toString() === form.product_id.toString());
            
            if (selectedProduct && selectedProduct.rates && selectedProduct.rates.length > 0) {
                // Buscamos si la fecha elegida entra en algún rango de las tarifas de este producto
                const applicableRate = selectedProduct.rates.find(rate => {
                    return form.order_date >= rate.date_from && form.order_date <= rate.date_to;
                });

                if (applicableRate) {
                    // Si hay tarifa, calculamos: Precio x Unidades
                    const total = (parseFloat(applicableRate.price) * parseInt(form.units)).toFixed(2);
                    setForm(prev => ({ ...prev, total_cost: total }));
                    setRateWarning(''); // Borramos avisos
                } else {
                    setForm(prev => ({ ...prev, total_cost: '' }));
                    setRateWarning('No hay tarifa para esta fecha.');
                }
            } else if (selectedProduct) {
                setForm(prev => ({ ...prev, total_cost: '' }));
                setRateWarning('Este producto no tiene tarifas creadas.');
            }
        }
    }, [form.product_id, form.order_date, form.units, products]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const ordersRes = await fetch('/api/orders');
            if (ordersRes.ok) setOrders(await ordersRes.json());

            const productsRes = await fetch('/api/products');
            if (productsRes.ok) setProducts(await productsRes.json());
        } catch (error) {
            console.error("Error cargando datos:", error);
        }
        setLoading(false);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await fetch('/api/orders', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
                body: JSON.stringify(form)
            });
            setForm({ order_date: '', product_id: '', units: 1, total_cost: '' });
            fetchData();
        } catch (error) {
            console.error("Error guardando pedido:", error);
        }
    };

    const handleDelete = async (id) => {
        if (confirm('¿Eliminar este pedido?')) {
            await fetch(`/api/orders/${id}`, { method: 'DELETE' });
            fetchData();
        }
    };

    // --- LÓGICA DEL CALENDARIO ---
    const daysInMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).getDate();
    const firstDayOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1).getDay();
    const startingDay = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1;

    const nextMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
    const prevMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));

    const renderCalendar = () => {
        const days = [];
        const monthNames = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
        
        for (let i = 0; i < startingDay; i++) {
            days.push(<div key={`empty-${i}`} className="border-end border-bottom p-2 bg-light"></div>);
        }

        for (let d = 1; d <= daysInMonth; d++) {
            const currentDateStr = `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
            const dayOrders = orders.filter(o => o.order_date.startsWith(currentDateStr));

            days.push(
                <div key={d} className="border-end border-bottom p-2 bg-white d-flex flex-column">
                    <div className="fw-bold text-secondary text-end mb-2">{d}</div>
                    <div className="flex-grow-1">
                        {dayOrders.map(order => (
                            <div key={order.id} className="badge bg-success w-100 text-start text-truncate mb-1 cursor-pointer shadow-sm py-2" 
                                 title={`${order.product?.name} - ${order.units} uds | ${order.total_cost}€`}
                                 onClick={() => handleDelete(order.id)}>
                                <i className="bi bi-box-seam me-1"></i> {order.units}x {order.product?.name || 'Borrado'}
                            </div>
                        ))}
                    </div>
                </div>
            );
        }

        return (
            <div className="card shadow-sm border-0">
                <div className="card-header bg-dark text-white d-flex justify-content-between align-items-center">
                    <button className="btn btn-sm btn-outline-light" onClick={prevMonth}>&laquo; Anterior</button>
                    <h5 className="mb-0 fw-bold">{monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}</h5>
                    <button className="btn btn-sm btn-outline-light" onClick={nextMonth}>Siguiente &raquo;</button>
                </div>
                <div className="card-body p-0">
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)' }} className="text-center bg-light fw-bold border-bottom">
                        <div className="p-2 border-end text-muted">Lun</div>
                        <div className="p-2 border-end text-muted">Mar</div>
                        <div className="p-2 border-end text-muted">Mié</div>
                        <div className="p-2 border-end text-muted">Jue</div>
                        <div className="p-2 border-end text-muted">Vie</div>
                        <div className="p-2 border-end text-muted">Sáb</div>
                        <div className="p-2 text-muted">Dom</div>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gridAutoRows: 'minmax(120px, auto)' }}>
                        {days}
                    </div>
                    <div className="p-3 text-muted small text-center bg-light border-top">
                        <i className="bi bi-info-circle me-1"></i> Haz clic en una comanda (etiqueta verde) para eliminarla.
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="row">
            <div className="col-lg-3 mb-4">
                <div className="card shadow-sm border-0">
                    <div className="card-header bg-warning text-dark fw-bold">
                        🛒 Añadir Comanda
                    </div>
                    <div className="card-body">
                        <form onSubmit={handleSubmit}>
                            <div className="mb-3">
                                <label className="form-label small fw-bold">Fecha</label>
                                <input type="date" className="form-control" required
                                    value={form.order_date} onChange={e => setForm({...form, order_date: e.target.value})} />
                            </div>
                            <div className="mb-3">
                                <label className="form-label small fw-bold">Producto</label>
                                <select className="form-select" required
                                    value={form.product_id} onChange={e => setForm({...form, product_id: e.target.value})}>
                                    <option value="">Selecciona...</option>
                                    {products.map(p => (
                                        <option key={p.id} value={p.id}>{p.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="mb-3">
                                <label className="form-label small fw-bold">Unidades</label>
                                <input type="number" min="1" className="form-control" required
                                    value={form.units} onChange={e => setForm({...form, units: e.target.value})} />
                            </div>
                            <div className="mb-3">
                                <label className="form-label small fw-bold">Coste Total (€)</label>
                                {/* He bloqueado el input con readOnly para que el usuario no pueda falsear el precio */}
                                <input type="number" step="0.01" className={`form-control ${rateWarning ? 'is-invalid' : ''}`} required readOnly
                                    value={form.total_cost} placeholder="..." />
                                {rateWarning && <div className="invalid-feedback">{rateWarning}</div>}
                            </div>
                            <button type="submit" className="btn btn-warning w-100 fw-bold" disabled={!!rateWarning || !form.total_cost}>
                                Guardar
                            </button>
                        </form>
                    </div>
                </div>
            </div>

            <div className="col-lg-9">
                {loading ? <div className="p-4 text-center">Cargando calendario...</div> : renderCalendar()}
            </div>
        </div>
    );
};

export default OrderManager;