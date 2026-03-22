import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from './api';

export default function Users() {
    const [usersList, setUsersList] = useState([]);
    const navigate = useNavigate();
    const role = localStorage.getItem('userRole');

    // Если сюда случайно попал не админ - выкидываем его
    useEffect(() => {
        if (role !== 'admin') {
            navigate('/products');
        }
    }, [role, navigate]);

    const fetchUsers = async () => {
        try {
            const res = await api.get('/users');
            setUsersList(res.data);
        } catch (error) {
            console.error('Ошибка загрузки пользователей', error);
        }
    };

    useEffect(() => { fetchUsers(); }, []);

    const handleBlock = async (id) => {
        if (!window.confirm('Вы уверены, что хотите заблокировать пользователя?')) return;
        try {
            await api.delete(`/users/${id}`);
            fetchUsers(); // Обновляем список
        } catch (error) {
            alert('Ошибка при блокировке');
        }
    };

    return (
        <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto', fontFamily: 'sans-serif' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h2>Управление пользователями (Админ-панель)</h2>
                <button onClick={() => navigate('/products')} style={{ padding: '8px 16px', cursor: 'pointer' }}>Назад к товарам</button>
            </div>

            <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '20px' }}>
                <thead>
                    <tr style={{ background: '#f0f0f0', textAlign: 'left' }}>
                        <th style={{ padding: '10px', borderBottom: '1px solid #ccc' }}>Имя</th>
                        <th style={{ padding: '10px', borderBottom: '1px solid #ccc' }}>Email</th>
                        <th style={{ padding: '10px', borderBottom: '1px solid #ccc' }}>Роль</th>
                        <th style={{ padding: '10px', borderBottom: '1px solid #ccc' }}>Статус</th>
                        <th style={{ padding: '10px', borderBottom: '1px solid #ccc' }}>Действия</th>
                    </tr>
                </thead>
                <tbody>
                    {usersList.map(u => (
                        <tr key={u.id}>
                            <td style={{ padding: '10px', borderBottom: '1px solid #eee' }}>{u.first_name} {u.last_name}</td>
                            <td style={{ padding: '10px', borderBottom: '1px solid #eee' }}>{u.email}</td>
                            <td style={{ padding: '10px', borderBottom: '1px solid #eee' }}>{u.role}</td>
                            <td style={{ padding: '10px', borderBottom: '1px solid #eee', color: u.isBlocked ? 'red' : 'green' }}>
                                {u.isBlocked ? 'Заблокирован' : 'Активен'}
                            </td>
                            <td style={{ padding: '10px', borderBottom: '1px solid #eee' }}>
                                {!u.isBlocked && u.role !== 'admin' && (
                                    <button onClick={() => handleBlock(u.id)} style={{ background: '#dc3545', color: 'white', border: 'none', padding: '5px 10px', borderRadius: '4px', cursor: 'pointer' }}>
                                        Заблокировать
                                    </button>
                                )}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}