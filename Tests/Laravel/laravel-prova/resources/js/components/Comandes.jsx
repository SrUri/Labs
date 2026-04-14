import React, { useState, useEffect } from 'react';

const OrderManager = () => {
    const [orders, setOrders] = useState([]);
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [rateWarning, setRateWarning] = useState('');
    
    const [editingId, setEditingId] = useState(null);
    const [itemToDelete, setItemToDelete] = useState(null);

    const initialForm = { order_date: '', product_id: '', units: 1, total_cost: '' };
    const [form, setForm] = useState(initialForm);
    const [currentMonth, setCurrentMonth] = useState(new Date());

    useEffect(() => { fetchData(); }, []);

    useEffect(() => {
        if (form.product_id && form.order_date && form.units) {
            const selectedProduct = products.find(p => p.id.toString() === form.product_id.toString());
            if (selectedProduct && selectedProduct.rates && selectedProduct.rates.length > 0) {
                const applicableRate = selectedProduct.rates.find(rate => {
                    return form.order_date >= rate.date_from && form.order_date <= rate.date_to;
                });
                if (applicableRate) {
                    const total = (parseFloat(applicableRate.price) * parseInt(form.units)).toFixed(2);
                    setForm(prev => ({ ...prev, total_cost: total }));
                    setRateWarning(''); 
                } else {
                    setForm(prev => ({ ...prev, total_cost: '' }));
                    setRateWarning('No hay tarifa para esta fecha.');
                }
            } else if (selectedProduct) {
                setForm(prev => ({ ...prev, total_cost: '' }));
                setRateWarning('Este producto no tiene tarifas.');
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
        } catch (error) { console.error(error); }
        setLoading(false);
    };

    // Hacer clic en la comanda en el calendario para editar
    const handleEdit = (order) => {
        setEditingId(order.id);
        // Formatear fecha para el input type="date"
        const formattedDate = order.order_date.split(' ')[0]; 
        setForm({ order_date: formattedDate, product_id: order.product_id, units: order.units, total_cost: order.total_cost });
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const cancelEdit = () => {
        setEditingId(null);
        setForm(initialForm);
        setRateWarning('');
    };

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

    const confirmDelete = async () => {
        await fetch(`/api/orders/${itemToDelete}`, { method: 'DELETE' });
        setItemToDelete(null);
        cancelEdit(); // Limpiamos formulario si estábamos editando esa comanda
        fetchData();
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
                // TRUCO CSS: Añadimos minWidth: 0 y overflow: hidden para que Grid no se estire
                <div key={d} className="border-end border-bottom p-2 bg-white d-flex flex-column overflow-hidden" style={{ minWidth: 0 }}>
                    <div className={`fw-bold text-end mb-2 ${d === new Date().getDate() && currentMonth.getMonth() === new Date().getMonth() ? 'text-primary' : 'text-secondary'}`}>
                        {d}
                    </div>
                    {/* TRUCO CSS: Limitamos también el contenedor interior */}
                    <div className="flex-grow-1" style={{ minWidth: 0 }}>
                        {dayOrders.map(order => (
                            <div key={order.id} 
                                 className={`badge w-100 text-start text-truncate mb-1 cursor-pointer shadow-sm py-2 ${editingId === order.id ? 'bg-warning text-dark' : 'bg-success'}`}
                                 title={`${order.units}x ${order.product?.name || 'Borrado'}`} /* Mostramos el nombre entero al poner el ratón encima */
                                 onClick={() => handleEdit(order)}>
                                <i className="bi bi-pencil-square me-1"></i> {order.units}x {order.product?.name || 'Borrado'}
                            </div>
                        ))}
                    </div>
                </div>
            );
        }

        // Rellenar las celdas vacías del final para la cuadrícula
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
                    <button className="btn btn-sm btn-outline-light" onClick={nextMonth}>Siguiente &raquo;</button>
                </div>
                <div className="card-body p-0">
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)' }} className="text-center bg-light fw-bold border-bottom">
                        <div className="p-2 border-end text-muted">Lun</div><div className="p-2 border-end text-muted">Mar</div>
                        <div className="p-2 border-end text-muted">Mié</div><div className="p-2 border-end text-muted">Jue</div>
                        <div className="p-2 border-end text-muted">Vie</div><div className="p-2 border-end text-muted">Sáb</div>
                        <div className="p-2 text-muted text-danger">Dom</div>
                    </div>
                    {/* El calendario ahora mantendrá sus columnas estrictas */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gridAutoRows: 'minmax(120px, auto)' }}>{days}</div>
                </div>
            </div>
        );
    };

    return (
        <div className="row">
            {/* MODAL DE CONFIRMACIÓN */}
            {itemToDelete && (
                <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1050 }}>
                    <div className="modal-dialog modal-dialog-centered">
                        <div className="modal-content border-0 shadow">
                            <div className="modal-header bg-danger text-white border-0">
                                <h5 className="modal-title fw-bold">Confirmar Eliminación</h5>
                                <button type="button" className="btn-close btn-close-white" onClick={() => setItemToDelete(null)}></button>
                            </div>
                            <div className="modal-body p-4 text-center">
                                <p className="mb-0 fs-5">¿Deseas eliminar definitivamente este pedido del calendario?</p>
                            </div>
                            <div className="modal-footer bg-light border-0 justify-content-center">
                                <button type="button" className="btn btn-secondary px-4" onClick={() => setItemToDelete(null)}>Cancelar</button>
                                <button type="button" className="btn btn-danger px-4 fw-bold" onClick={confirmDelete}>Sí, eliminar</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <div className="col-lg-3 mb-4">
                <div className={`card shadow-sm border-0 ${editingId ? 'border border-warning' : ''}`}>
                    <div className={`card-header text-dark fw-bold ${editingId ? 'bg-warning' : 'bg-light border-bottom'}`}>
                        {editingId ? '✏️ Editando Comanda' : '🛒 Añadir Comanda'}
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
                                <input type="number" step="0.01" className={`form-control ${rateWarning ? 'is-invalid' : ''}`} required readOnly
                                    value={form.total_cost} placeholder="..." />
                                {rateWarning && <div className="invalid-feedback">{rateWarning}</div>}
                            </div>
                            
                            <button type="submit" className={`btn w-100 fw-bold mb-2 ${editingId ? 'btn-warning' : 'btn-dark'}`} disabled={!!rateWarning || !form.total_cost}>
                                {editingId ? 'Guardar Cambios' : 'Registrar Comanda'}
                            </button>

                            {editingId && (
                                <div className="d-flex gap-2">
                                    <button type="button" className="btn btn-outline-secondary w-50" onClick={cancelEdit}>Cancelar</button>
                                    <button type="button" className="btn btn-outline-danger w-50" onClick={() => setItemToDelete(editingId)}>Eliminar</button>
                                </div>
                            )}
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