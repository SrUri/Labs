import React, { useState, useEffect } from 'react';

const ProductManager = () => {
    // Estats principals
    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [editingId, setEditingId] = useState(null);
    const [itemToDelete, setItemToDelete] = useState(null);

    // Arrays per suportar relacions multiples (Categories i Tarifes dinàmiques)
    const initialForm = { code: '', name: '', description: '', categories: [], rates: [], photo: '' };
    const [form, setForm] = useState(initialForm);

    // Carreguem Productes i Categories
    const fetchData = async () => {
        setLoading(true);
        try {
            // Utilitzem Promise.all per a que es faci alhora
            const [prodRes, catRes] = await Promise.all([ fetch('/api/products'), fetch('/api/categories') ]);
            if (prodRes.ok && catRes.ok) {
                setProducts(await prodRes.json());
                setCategories(await catRes.json());
            } else {
                setProducts([]); setCategories([]);
            }
        } catch (error) { setProducts([]); setCategories([]); }
        setLoading(false);
    };

    useEffect(() => { fetchData(); }, []);

    // Afegim fila buida 
    const addRateRow = () => setForm({ ...form, rates: [...form.rates, { price: '', date_from: '', date_to: '' }] });

    // Actualitzem un camp d'una fila específica de tarifes
    const updateRate = (index, field, value) => {
        const newRates = [...form.rates];
        newRates[index][field] = value;
        setForm({ ...form, rates: newRates });
    };

    // Eliminem una fila per index
    const removeRateRow = (index) => setForm({ ...form, rates: form.rates.filter((_, i) => i !== index) });

    // Si la categoria està seleccionada, la posem al formulari. Si no, l'afegim a l'array.
    const handleCategoryToggle = (id) => {
        const currentCats = form.categories;
        const newCats = currentCats.includes(id) ? currentCats.filter(catId => catId !== id) : [...currentCats, id];
        setForm({ ...form, categories: newCats });
    };

    // Preparació edició
    const handleEdit = (prod) => {
        setEditingId(prod.id);
        setForm({
            code: prod.code,
            name: prod.name,
            description: prod.description || '',
            categories: prod.categories.map(c => c.id),
            rates: prod.rates.map(r => ({ price: r.price, date_from: r.date_from, date_to: r.date_to })),
            photo: prod.photos || ''
        });
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    // Cancel·lar edició
    const cancelEdit = () => {
        setEditingId(null);
        setForm(initialForm);
    };

    // Guardem i validem dades
    const handleSubmit = async (e) => {
        e.preventDefault();

        // Validem les dates 
        const rates = form.rates;
        for (let i = 0; i < rates.length; i++) {
            if (rates[i].date_from > rates[i].date_to) {
                alert("Error: La data d'inici d'una tarifa no pot ser posterior a la data de fi.");
                return;
            }
            
            for (let j = i + 1; j < rates.length; j++) {
                if (rates[i].date_from <= rates[j].date_to && rates[j].date_from <= rates[i].date_to) {
                    alert("Error: Has introduït tarifes amb dates que coincideixen o es superposen en els mateixos dies.");
                    return;
                }
            }
        }

        const url = editingId ? `/api/products/${editingId}` : '/api/products';
        const method = editingId ? 'PUT' : 'POST';

        try {
            const response = await fetch(url, {
                method: method, 
                headers: { 'Content-Type': 'application/json', 'Accept': 'application/json', 'Authorization': `Bearer ${sessionStorage.getItem('auth_token')}` }, 
                body: JSON.stringify(form)
            });

            if (!response.ok) {
                const err = await response.json();
                alert("Error al guardar: " + (err.message || err.error));
                return;
            }
            cancelEdit();
            fetchData();
        } catch (error) { console.error(error); }
    };

    // Confirmar eliminació
    const confirmDelete = async () => {
        await fetch(`/api/products/${itemToDelete}`, { method: 'DELETE' });
        setItemToDelete(null);
        fetchData();
    };

    // Descarregar excel. Utilitzem blob perque la ruta d'exportació requereix Token
    const downloadExcel = async () => {
        try {
            const token = sessionStorage.getItem('auth_token');
            
            const res = await fetch('/api/products/export/excel', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            
            if (!res.ok) {
                alert("Error al exportar. Codi: " + res.status);
                return;
            }

            // Convertim la resposta binària a blob i creem una URL temporal per descarregar
            const blob = await res.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a'); 
            a.href = url; 
            a.download = 'productos.xls';
            document.body.appendChild(a);
            a.click();
            a.remove(); // Netegem DOM
        } catch (error) { console.error("Error exportant Excel:", error); }
    };

    // Descarrega PDF. Utilitzem blob perque la ruta d'exportació requereix Token
    const downloadPdf = async (id) => {
        try {
            const token = sessionStorage.getItem('auth_token');
            
            const res = await fetch(`/api/products/${id}/export/pdf`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            
            if (!res.ok) {
                alert("Error al exportar el PDF. Código: " + res.status);
                return;
            }

            const blob = await res.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a'); 
            a.href = url; 
            a.download = `producto_${id}.pdf`; 
            document.body.appendChild(a);
            a.click();
            a.remove();
        } catch (error) { console.error("Error exportando PDF:", error); }
    };

    return (
        <div className="row">
            {/* Modal d'eliminació en cascada */}
            {itemToDelete && (
                <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1050 }}>
                    <div className="modal-dialog modal-dialog-centered">
                        <div className="modal-content border-0 shadow">
                            <div className="modal-header bg-danger text-white border-0">
                                <h5 className="modal-title fw-bold">Confirmar Eliminació</h5>
                                <button type="button" className="btn-close btn-close-white" onClick={() => setItemToDelete(null)}></button>
                            </div>
                            <div className="modal-body p-4 text-center">
                                <p className="mb-0 fs-5">S'eliminarà el producte i <b>totes les seves tarifes</b>.</p>
                            </div>
                            <div className="modal-footer bg-light border-0 justify-content-center">
                                <button type="button" className="btn btn-secondary px-4" onClick={() => setItemToDelete(null)}>Cancel·lar</button>
                                <button type="button" className="btn btn-danger px-4 fw-bold" onClick={confirmDelete}>Si, eliminar</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* FORMULARI LATERAL */}
            <div className="col-lg-5 mb-4">
                <div className="card shadow-sm border-0">
                    <div className={`card-header text-white fw-bold ${editingId ? 'bg-info' : 'bg-primary'}`}>
                        {editingId ? 'Editar Producte' : 'Nou Producte'}
                    </div>
                    <div className="card-body">
                        <form onSubmit={handleSubmit}>
                            <div className="row mb-3">
                                <div className="col-6">
                                    <label className="form-label small fw-bold">CODI</label>
                                    <input type="text" className="form-control" required value={form.code} onChange={e => setForm({...form, code: e.target.value})} />
                                </div>
                                <div className="col-6">
                                    <label className="form-label small fw-bold">NOM</label>
                                    <input type="text" className="form-control" required value={form.name} onChange={e => setForm({...form, name: e.target.value})} />
                                </div>
                            </div>
                            
                            <div className="mb-3">
                                <label className="form-label small fw-bold">DESCRIPCIÓ</label>
                                <textarea className="form-control" rows="2" value={form.description} onChange={e => setForm({...form, description: e.target.value})}></textarea>
                            </div>

                            {/* CAMBIADO A URL DE IMAGEN */}
                            <div className="mb-3">
                                <label className="form-label small fw-bold">URL DE LA FOTO</label>
                                <input type="url" className="form-control" placeholder="https://ejemplo.com/foto.jpg" value={form.photo} onChange={e => setForm({...form, photo: e.target.value})} />
                            </div>

                            <div className="mb-3">
                                <label className="form-label small fw-bold">CATEGORIES</label>
                                <div className="border rounded p-2 bg-light" style={{maxHeight: '150px', overflowY: 'auto'}}>
                                    {categories.map(cat => (
                                        <div className="form-check" key={cat.id}>
                                            <input className="form-check-input cursor-pointer" type="checkbox" checked={form.categories.includes(cat.id)} onChange={() => handleCategoryToggle(cat.id)} id={`cat-${cat.id}`}/>
                                            <label className="form-check-label cursor-pointer w-100" htmlFor={`cat-${cat.id}`}>{cat.name}</label>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="mb-3">
                                <div className="d-flex justify-content-between align-items-center mb-2">
                                    <label className="form-label small fw-bold mb-0">TARIFES</label>
                                    <button type="button" className="btn btn-sm btn-success" onClick={addRateRow}>+ Afegir</button>
                                </div>
                                {form.rates.map((rate, index) => (
                                    <div className="row g-2 mb-2 align-items-end bg-light p-2 rounded border" key={index}>
                                        <div className="col-3">
                                            <small className="text-muted d-block">Preu(€)</small>
                                            <input type="number" step="0.01" className="form-control form-control-sm" required value={rate.price} onChange={e => updateRate(index, 'price', e.target.value)} />
                                        </div>
                                        <div className="col-4">
                                            <small className="text-muted d-block">Des del</small>
                                            <input type="date" className="form-control form-control-sm" required value={rate.date_from} onChange={e => updateRate(index, 'date_from', e.target.value)} />
                                        </div>
                                        <div className="col-4">
                                            <small className="text-muted d-block">Fins al</small>
                                            <input type="date" className="form-control form-control-sm" required value={rate.date_to} onChange={e => updateRate(index, 'date_to', e.target.value)} />
                                        </div>
                                        <div className="col-1 text-end">
                                            <button type="button" className="btn btn-sm btn-outline-danger" onClick={() => removeRateRow(index)}><i className="bi bi-trash"></i></button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <button type="submit" className={`btn w-100 fw-bold ${editingId ? 'btn-info text-white' : 'btn-primary'}`}>
                                {editingId ? 'Guardar Canvis' : 'Crear Producte'}
                            </button>
                            {editingId && <button type="button" className="btn btn-light w-100 mt-2" onClick={cancelEdit}>Cancel·lar Edició</button>}
                        </form>
                    </div>
                </div>
            </div>
                                
            {/* TAULA CENTRAL DE DADES I ACCIONS */}
            <div className="col-lg-7">
                <div className="d-flex justify-content-end mb-3">
                    <button onClick={downloadExcel} className="btn btn-success fw-bold shadow-sm">
                        <i className="bi bi-file-earmark-excel-fill me-2"></i>Exportar Excel
                    </button>
                </div>

                <div className="card shadow-sm border-0">
                    <div className="card-body p-0 table-responsive">
                        {loading ? <div className="p-5 text-center">Carregant...</div> : (
                            <table className="table table-hover align-middle mb-0">
                                <thead className="table-light">
                                    <tr>
                                        <th>Producte</th>
                                        <th>Categories</th>
                                        <th>Tarifes</th>
                                        <th className="text-end">Accions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {products.map(prod => (
                                        <tr key={prod.id}>
                                            <td>
                                                <div className="d-flex align-items-center gap-2">
                                                    {prod.photos && (
                                                        <img src={prod.photos} alt={prod.name} style={{width: '40px', height: '40px', objectFit: 'cover', borderRadius: '4px'}} />
                                                    )}
                                                    <div>
                                                        <div className="fw-bold">{prod.name}</div>
                                                        <small className="text-muted">{prod.code}</small>
                                                    </div>
                                                </div>
                                            </td>
                                            <td>
                                                {prod.categories.map(c => <span key={c.id} className="badge bg-info text-dark me-1">{c.name}</span>)}
                                            </td>
                                            <td>
                                                {prod.rates.length > 0 ? <span className="badge bg-success">{prod.rates.length} trams</span> : <span className="text-muted small">Sense tarifes</span>}
                                            </td>
                                            <td className="text-end text-nowrap">
                                                <button onClick={() => downloadPdf(prod.id)} className="btn btn-sm btn-outline-danger me-2" title="Descargar PDF">
                                                    <i className="bi bi-file-earmark-pdf-fill"></i>
                                                </button>
                                                <button onClick={() => handleEdit(prod)} className="btn btn-sm btn-outline-info me-2"><i className="bi bi-pencil-square"></i></button>
                                                <button onClick={() => setItemToDelete(prod.id)} className="btn btn-sm btn-outline-dark"><i className="bi bi-trash"></i></button>
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