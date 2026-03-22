import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from './api';

export default function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();
        try {
            // 1. Получаем токены
            const res = await api.post('/auth/login', { email, password });
            localStorage.setItem('accessToken', res.data.accessToken);
            localStorage.setItem('refreshToken', res.data.refreshToken);
            
            // 2. СРАЗУ запрашиваем данные пользователя, чтобы узнать его роль
            const userRes = await api.get('/auth/me');
            localStorage.setItem('userRole', userRes.data.role); // Сохраняем роль!

            navigate('/products');
        } catch (error) {
            alert('Ошибка входа: ' + (error.response?.data?.message || 'Сбой сети'));
        }
    };

    return (
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: '50px', fontFamily: 'sans-serif' }}>
            <div style={{ padding: '30px', border: '1px solid #ccc', borderRadius: '8px', width: '320px' }}>
                <h2 style={{ textAlign: 'center', marginTop: 0 }}>Вход в систему</h2>
                <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                    <input 
                        type="email" placeholder="Email" value={email} 
                        onChange={e => setEmail(e.target.value)} required 
                        style={{ padding: '8px' }}
                    />
                    <input 
                        type="password" placeholder="Пароль" value={password} 
                        onChange={e => setPassword(e.target.value)} required 
                        style={{ padding: '8px' }}
                    />
                    <button type="submit" style={{ padding: '10px', background: '#28a745', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
                        Войти
                    </button>
                </form>
                <div style={{ marginTop: '15px', textAlign: 'center', fontSize: '14px' }}>
                    Нет аккаунта? <Link to="/register">Зарегистрироваться</Link>
                </div>
            </div>
        </div>
    );
}