import React, { useState, useEffect } from 'react';

const CategoryManager = () => {
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [form, setForm] = useState({ code: '', name: '', parent_id: '' });

    // Cargar las categorías al iniciar
    const fetchCategories = async () => {
        setLoading(true);
        try {
            const response = await fetch('/api/categories');
            const data = await response.json();
            setCategories(data);
        } catch (error) {
            console.error("Error cargando categorías:", error);
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchCategories();
    }, []);

    // Manejar el formulario
    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await fetch('/api/categories', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify(form)
            });
            setForm({ code: '', name: '', parent_id: '' }); // Limpiar formulario
            fetchCategories(); // Recargar tabla
        } catch (error) {
            console.error("Error guardando categoría:", error);
        }
    };

    // Borrar categoría
    const handleDelete = async (id) => {
        if (confirm('¿Estás seguro de borrar esta categoría?')) {
            try {
                await fetch(`/api/categories/${id}`, { method: 'DELETE' });
                fetchCategories();
            } catch (error) {
                console.error("Error borrando:", error);
            }
        }
    };

    return (
        <div className="row">
            {/* Formulario lateral */}
            <div className="col-md-4 mb-4">
                <div className="card shadow-sm">
                    <div className="card-header bg-dark text-white">
                        <h5 className="card-title mb-0">Nueva Categoría</h5>
                    </div>
                    <div className="card-body">
                        <form onSubmit={handleSubmit}>
                            <div className="mb-3">
                                <label className="form-label">Código</label>
                                <input type="text" className="form-control" required 
                                    value={form.code} onChange={e => setForm({...form, code: e.target.value})} />
                            </div>
                            <div className="mb-3">
                                <label className="form-label">Nombre</label>
                                <input type="text" className="form-control" required 
                                    value={form.name} onChange={e => setForm({...form, name: e.target.value})} />
                            </div>
                            <div className="mb-3">
                                <label className="form-label">Categoría Padre (Opcional)</label>
                                <select className="form-select" 
                                    value={form.parent_id} onChange={e => setForm({...form, parent_id: e.target.value})}>
                                    <option value="">Ninguna (Categoría principal)</option>
                                    {categories.map(cat => (
                                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                                    ))}
                                </select>
                            </div>
                            <button type="submit" className="btn btn-primary w-100">Guardar</button>
                        </form>
                    </div>
                </div>
            </div>

            {/* Tabla principal */}
            <div className="col-md-8">
                <div className="card shadow-sm">
                    <div className="card-body p-0">
                        {loading ? (
                            <div className="text-center p-5">
                                <div className="spinner-border text-primary" role="status"></div>
                            </div>
                        ) : (
                            <table className="table table-hover table-striped mb-0">
                                <thead className="table-light">
                                    <tr>
                                        <th>Código</th>
                                        <th>Nombre</th>
                                        <th>Padre</th>
                                        <th className="text-end">Acciones</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {categories.map(cat => (
                                        <tr key={cat.id}>
                                            <td><span className="badge bg-secondary">{cat.code}</span></td>
                                            <td className="fw-bold">{cat.name}</td>
                                            <td>{cat.parent ? cat.parent.name : '-'}</td>
                                            <td className="text-end">
                                                <button onClick={() => handleDelete(cat.id)} className="btn btn-sm btn-danger">
                                                    Eliminar
                                                </button>
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