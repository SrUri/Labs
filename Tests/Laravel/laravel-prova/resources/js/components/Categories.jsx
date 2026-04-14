import React, { useState, useEffect } from 'react';

const CategoryManager = () => {
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [form, setForm] = useState({ code: '', name: '', description: '', parent_id: '' });
    
    // Nuevos estados para Edición y Modal
    const [editingId, setEditingId] = useState(null);
    const [itemToDelete, setItemToDelete] = useState(null);

    const fetchCategories = async () => {
        setLoading(true);
        try {
            const response = await fetch('/api/categories');
            
            // ESCUDO: Solo guardamos los datos si la respuesta es correcta (Status 200)
            if (response.ok) {
                setCategories(await response.json());
            } else {
                console.error("Error del servidor al cargar categorías:", response.status);
                setCategories([]); // Forzamos un array vacío para que el .map() no explote
            }
        } catch (error) { 
            console.error("Error grave de red:", error); 
            setCategories([]); 
        }
        setLoading(false);
    };

    useEffect(() => { fetchCategories(); }, []);

    // Preparar el formulario para editar
    const handleEdit = (cat) => {
        setEditingId(cat.id);
        setForm({ 
            code: cat.code, 
            name: cat.name, 
            description: cat.description || '',
            parent_id: cat.parent_id || '' 
        });
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const cancelEdit = () => {
        setEditingId(null);
        setForm({ code: '', name: '', description: '', parent_id: '' });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const url = editingId ? `/api/categories/${editingId}` : '/api/categories';
            const method = editingId ? 'PUT' : 'POST';
            
            await fetch(url, {
                method: method,
                headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
                body: JSON.stringify(form)
            });
            cancelEdit();
            fetchCategories();
        } catch (error) { console.error(error); }
    };

    const confirmDelete = async () => {
        try {
            await fetch(`/api/categories/${itemToDelete}`, { method: 'DELETE' });
            setItemToDelete(null);
            fetchCategories();
        } catch (error) { console.error(error); }
    };

    return (
        <div className="row">
            {/* MODAL PROPIO DE CONFIRMACIÓN */}
            {itemToDelete && (
                <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1050 }}>
                    <div className="modal-dialog modal-dialog-centered">
                        <div className="modal-content border-0 shadow">
                            <div className="modal-header bg-danger text-white border-0">
                                <h5 className="modal-title fw-bold"><i className="bi bi-exclamation-triangle-fill me-2"></i>Confirmar Eliminación</h5>
                                <button type="button" className="btn-close btn-close-white" onClick={() => setItemToDelete(null)}></button>
                            </div>
                            <div className="modal-body p-4 text-center">
                                <p className="mb-0 fs-5">¿Estás seguro de que deseas eliminar esta categoría?</p>
                                <small className="text-muted">Esta acción no se puede deshacer.</small>
                            </div>
                            <div className="modal-footer bg-light border-0 justify-content-center">
                                <button type="button" className="btn btn-secondary px-4" onClick={() => setItemToDelete(null)}>Cancelar</button>
                                <button type="button" className="btn btn-danger px-4 fw-bold" onClick={confirmDelete}>Sí, eliminar</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <div className="col-md-4 mb-4">
                <div className="card shadow-sm border-0">
                    <div className={`card-header text-white fw-bold ${editingId ? 'bg-info' : 'bg-dark'}`}>
                        {editingId ? '✏️ Editar Categoría' : '✨ Nueva Categoría'}
                    </div>
                    <div className="card-body">
                        <form onSubmit={handleSubmit}>
                            <div className="mb-3">
                                <label className="form-label small fw-bold">Código</label>
                                <input type="text" className="form-control" required 
                                    value={form.code} onChange={e => setForm({...form, code: e.target.value})} />
                            </div>
                            <div className="mb-3">
                                <label className="form-label small fw-bold">Nombre</label>
                                <input type="text" className="form-control" required 
                                    value={form.name} onChange={e => setForm({...form, name: e.target.value})} />
                            </div>
                            <div className="mb-3">
                                <label className="form-label small fw-bold">Descripción</label>
                                <textarea className="form-control" rows="2" 
                                    value={form.description} onChange={e => setForm({...form, description: e.target.value})}></textarea>
                            </div>
                            <div className="mb-3">
                                <label className="form-label small fw-bold">Categoría Padre</label>
                                <select className="form-select" 
                                    value={form.parent_id} onChange={e => setForm({...form, parent_id: e.target.value})}>
                                    <option value="">Ninguna</option>
                                    {categories.map(cat => (
                                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                                    ))}
                                </select>
                            </div>
                            <button type="submit" className={`btn w-100 fw-bold ${editingId ? 'btn-info text-white' : 'btn-primary'}`}>
                                {editingId ? 'Actualizar Categoría' : 'Guardar Categoría'}
                            </button>
                            {editingId && (
                                <button type="button" className="btn btn-light w-100 mt-2" onClick={cancelEdit}>Cancelar Edición</button>
                            )}
                        </form>
                    </div>
                </div>
            </div>

            <div className="col-md-8">
                <div className="card shadow-sm border-0">
                    <div className="card-body p-0 table-responsive">
                        {loading ? <div className="text-center p-5">Cargando...</div> : (
                            <table className="table table-hover align-middle mb-0">
                                <thead className="table-light">
                                    <tr>
                                        <th>Código</th>
                                        <th>Nombre</th>
                                        <th>Descripción</th>
                                        <th>Padre</th>
                                        <th className="text-end">Acciones</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {categories.map(cat => (
                                        <tr key={cat.id}>
                                            <td><span className="badge bg-secondary">{cat.code}</span></td>
                                            <td className="fw-bold">{cat.name}</td>
                                            <td>
                                                {cat.description ? (
                                                    <span className="text-muted small">{cat.description}</span>
                                                ) : (
                                                    <span className="text-black-50 small fst-italic">Sin descripción</span>
                                                )}
                                            </td>
                                            <td>{cat.parent ? cat.parent.name : '-'}</td>
                                            <td className="text-end text-nowrap">
                                                <button onClick={() => handleEdit(cat)} className="btn btn-sm btn-outline-info me-2">Editar</button>
                                                <button onClick={() => setItemToDelete(cat.id)} className="btn btn-sm btn-outline-danger">Eliminar</button>
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
export default CategoryManager;