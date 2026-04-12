import React, { useState } from 'react';

const Login = ({ onLoginSuccess }) => {
    const [email, setEmail] = useState(''); // Pre-rellenado para el evaluador
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const response = await fetch('/api/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
                body: JSON.stringify({ email, password })
            });

            const data = await response.json();

            if (response.ok) {
                // Guardamos el token en el navegador
                localStorage.setItem('auth_token', data.access_token);
                onLoginSuccess(); // Avisamos a App.jsx de que podemos entrar
            } else {
                setError(data.message || 'Error de acceso');
            }
        } catch (err) {
            setError('Error conectando con el servidor');
        }
        setLoading(false);
    };

    return (
        <div className="row justify-content-center mt-5 pt-5">
            <div className="col-md-5">
                <div className="card shadow border-0">
                    <div className="card-body p-5">
                        <div className="text-center mb-4">
                            <h2 className="fw-bold">Studiogenesis</h2>
                            <p className="text-muted">Acceso al Backoffice</p>
                        </div>

                        {error && <div className="alert alert-danger">{error}</div>}

                        <form onSubmit={handleLogin}>
                            <div className="mb-3">
                                <label className="form-label fw-bold small">Email</label>
                                <input type="email" className="form-control" required
                                    value={email} onChange={e => setEmail(e.target.value)} />
                            </div>
                            <div className="mb-4">
                                <label className="form-label fw-bold small">Contraseña</label>
                                <input type="password" className="form-control" required
                                    value={password} onChange={e => setPassword(e.target.value)} />
                            </div>
                            <button type="submit" className="btn btn-dark w-100 py-2" disabled={loading}>
                                {loading ? 'Comprobando...' : 'Entrar'}
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Login;