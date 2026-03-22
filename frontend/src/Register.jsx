import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from './api';

export default function Register() {
    const [email, setEmail] = useState('');
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [password, setPassword] = useState('');
    const navigate = useNavigate();

    const handleRegister = async (e) => {
        e.preventDefault();
        try {
            // Отправляем данные на наш бэкенд
            await api.post('/auth/register', { 
                email, 
                first_name: firstName, 
                last_name: lastName, 
                password 
            });
            alert('Регистрация прошла успешно! Теперь войдите в систему.');
            navigate('/login'); // Перекидываем на логин
        } catch (error) {
            alert('Ошибка регистрации: ' + (error.response?.data?.message || 'Сбой сети'));
        }
    };

    return (
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: '50px', fontFamily: 'sans-serif' }}>
            <div style={{ padding: '30px', border: '1px solid #ccc', borderRadius: '8px', width: '320px' }}>
                <h2 style={{ textAlign: 'center', marginTop: 0 }}>Регистрация</h2>
                <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                    <input 
                        type="email" placeholder="Email" value={email} 
                        onChange={e => setEmail(e.target.value)} required 
                        style={{ padding: '8px' }}
                    />
                    <input 
                        type="text" placeholder="Имя" value={firstName} 
                        onChange={e => setFirstName(e.target.value)} required 
                        style={{ padding: '8px' }}
                    />
                    <input 
                        type="text" placeholder="Фамилия" value={lastName} 
                        onChange={e => setLastName(e.target.value)} required 
                        style={{ padding: '8px' }}
                    />
                    <input 
                        type="password" placeholder="Пароль" value={password} 
                        onChange={e => setPassword(e.target.value)} required 
                        style={{ padding: '8px' }}
                    />
                    <button type="submit" style={{ padding: '10px', background: '#007bff', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
                        Зарегистрироваться
                    </button>
                </form>
                <div style={{ marginTop: '15px', textAlign: 'center', fontSize: '14px' }}>
                    Уже есть аккаунт? <Link to="/login">Войти</Link>
                </div>
            </div>
        </div>
    );
}