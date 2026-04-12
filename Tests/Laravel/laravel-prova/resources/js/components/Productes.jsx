import React, { useState, useEffect } from 'react';

const ProductManager = () => {
    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    
    // Estado inicial del formulario (incluye un array para tarifas dinámicas)
    const [form, setForm] = useState({
        code: '', name: '', description: '', categories: [], rates: []
    });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            // Cargamos productos y categorías a la vez
            const [prodRes, catRes] = await Promise.all([
                fetch('/api/products'),
                fetch('/api/categories')
            ]);
            setProducts(await prodRes.json());
            setCategories(await catRes.json());
        } catch (error) {
            console.error("Error:", error);
        }
        setLoading(false);
    };

    // Funciones para gestionar las Tarifas dinámicas
    const addRateRow = () => {
        setForm({ ...form, rates: [...form.rates, { price: '', date_from: '', date_to: '' }] });
    };

    const updateRate = (index, field, value) => {
        const newRates = [...form.rates];
        newRates[index][field] = value;
        setForm({ ...form, rates: newRates });
    };

    const removeRateRow = (index) => {
        const newRates = form.rates.filter((_, i) => i !== index);
        setForm({ ...form, rates: newRates });
    };

    // Funciones para gestionar Categorías múltiples
    const handleCategoryToggle = (id) => {
        const currentCats = form.categories;
        const newCats = currentCats.includes(id) 
            ? currentCats.filter(catId => catId !== id) 
            : [...currentCats, id];
        setForm({ ...form, categories: newCats });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await fetch('/api/products', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
                body: JSON.stringify(form)
            });
            // Resetear formulario
            setForm({ code: '', name: '', description: '', categories: [], rates: [] });
            fetchData();
        } catch (error) {
            console.error("Error guardando:", error);
        }
    };

    const handleDelete = async (id) => {
        if (confirm('¿Borrar producto y todas sus tarifas?')) {
            await fetch(`/api/products/${id}`, { method: 'DELETE' });
            fetchData();
        }
    };

    return (
        <div className="row">
            {/* Formulario (Columna Izquierda) */}
            <div className="col-lg-5 mb-4">
                <div className="card shadow-sm border-0">
                    <div className="card-header bg-primary text-white">
                        <h5 className="mb-0">Nuevo Producto</h5>
                    </div>
                    <div className="card-body">
                        <form onSubmit={handleSubmit}>
                            <div className="row mb-3">
                                <div className="col-6">
                                    <label className="form-label text-muted small fw-bold">CÓDIGO</label>
                                    <input type="text" className="form-control" required 
                                        value={form.code} onChange={e => setForm({...form, code: e.target.value})} />
                                </div>
                                <div className="col-6">
                                    <label className="form-label text-muted small fw-bold">NOMBRE</label>
                                    <input type="text" className="form-control" required 
                                        value={form.name} onChange={e => setForm({...form, name: e.target.value})} />
                                </div>
                            </div>

                            {/* Selección de Categorías (Checkboxes) */}
                            <div className="mb-3">
                                <label className="form-label text-muted small fw-bold">CATEGORÍAS</label>
                                <div className="border rounded p-2" style={{maxHeight: '150px', overflowY: 'auto'}}>
                                    {categories.map(cat => (
                                        <div className="form-check" key={cat.id}>
                                            <input className="form-check-input" type="checkbox" 
                                                checked={form.categories.includes(cat.id)}
                                                onChange={() => handleCategoryToggle(cat.id)} />
                                            <label className="form-check-label">{cat.name}</label>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Tarifas Dinámicas */}
                            <div className="mb-3">
                                <div className="d-flex justify-content-between align-items-center mb-2">
                                    <label className="form-label text-muted small fw-bold mb-0">TARIFAS (Precios por fecha)</label>
                                    <button type="button" className="btn btn-sm btn-outline-success" onClick={addRateRow}>
                                        + Añadir Tarifa
                                    </button>
                                </div>
                                {form.rates.map((rate, index) => (
                                    <div className="row g-2 mb-2 align-items-end" key={index}>
                                        <div className="col-3">
                                            <small className="text-muted">Precio (€)</small>
                                            <input type="number" step="0.01" className="form-control form-control-sm" required
                                                value={rate.price} onChange={e => updateRate(index, 'price', e.target.value)} />
                                        </div>
                                        <div className="col-4">
                                            <small className="text-muted">Desde</small>
                                            <input type="date" className="form-control form-control-sm" required
                                                value={rate.date_from} onChange={e => updateRate(index, 'date_from', e.target.value)} />
                                        </div>
                                        <div className="col-4">
                                            <small className="text-muted">Hasta</small>
                                            <input type="date" className="form-control form-control-sm" required
                                                value={rate.date_to} onChange={e => updateRate(index, 'date_to', e.target.value)} />
                                        </div>
                                        <div className="col-1">
                                            <button type="button" className="btn btn-sm btn-danger w-100" onClick={() => removeRateRow(index)}>X</button>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <button type="submit" className="btn btn-primary w-100 mt-3">Guardar Producto Completo</button>
                        </form>
                    </div>
                </div>
            </div>

            {/* Tabla de Resultados (Columna Derecha) */}
            <div className="col-lg-7">
                <div className="card shadow-sm border-0">
                    <div className="card-body p-0 table-responsive">
                        {loading ? <div className="p-5 text-center">Cargando...</div> : (
                            <table className="table table-hover mb-0">
                                <thead className="table-light">
                                    <tr>
                                        <th>Producto</th>
                                        <th>Categorías</th>
                                        <th>Tarifas Activas</th>
                                        <th className="text-end">Acciones</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {products.map(prod => (
                                        <tr key={prod.id}>
                                            <td>
                                                <div className="fw-bold">{prod.name}</div>
                                                <small className="text-muted">{prod.code}</small>
                                            </td>
                                            <td>
                                                {prod.categories.map(c => (
                                                    <span key={c.id} className="badge bg-info text-dark me-1">{c.name}</span>
                                                ))}
                                            </td>
                                            <td>
                                                {prod.rates.length > 0 ? (
                                                    <span className="badge bg-success">{prod.rates.length} tramos</span>
                                                ) : <span className="text-muted small">Sin tarifas</span>}
                                            </td>
                                            <td className="text-end">
                                                <button onClick={() => handleDelete(prod.id)} className="btn btn-sm btn-danger">Eliminar</button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProductManager;