import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from './api';

export default function Products() {
    const [products, setProducts] = useState([]);
    const [title, setTitle] = useState('');
    const [price, setPrice] = useState('');
    const [category, setCategory] = useState('');
    const [description, setDescription] = useState('');
    const navigate = useNavigate();

    // Достаем роль текущего пользователя
    const role = localStorage.getItem('userRole'); 

    const fetchProducts = async () => {
        try {
            const res = await api.get('/products');
            setProducts(res.data);
        } catch (error) {
            console.error('Ошибка загрузки товаров', error);
        }
    };

    useEffect(() => { fetchProducts(); }, []);

    const handleCreate = async (e) => {
        e.preventDefault();
        try {
            await api.post('/products', { title, price: Number(price), category, description });
            setTitle(''); setPrice(''); setCategory(''); setDescription('');
            fetchProducts(); 
        } catch (error) { alert('Ошибка создания товара'); }
    };

    const handleDelete = async (id) => {
        try {
            await api.delete(`/products/${id}`);
            fetchProducts();
        } catch (error) { alert('Ошибка при удалении'); }
    };

    const logout = () => {
        localStorage.clear();
        navigate('/login');
    };

    return (
        <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto', fontFamily: 'sans-serif' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h2>Список товаров</h2>
                <div>
                    {/* Кнопка админ-панели видна только Админу */}
                    {role === 'admin' && (
                        <button onClick={() => navigate('/users')} style={{ marginRight: '10px', padding: '8px 16px', background: '#ff9800', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
                            Панель управления
                        </button>
                    )}
                    <button onClick={logout} style={{ padding: '8px 16px', cursor: 'pointer' }}>Выйти</button>
                </div>
            </div>

            {/* Форма добавления видна только Seller и Admin */}
            {['seller', 'admin'].includes(role) && (
                <form onSubmit={handleCreate} style={{ display: 'flex', gap: '10px', marginBottom: '20px', flexWrap: 'wrap', padding: '15px', background: '#f5f5f5', borderRadius: '8px' }}>
                    <input placeholder="Название" value={title} onChange={e => setTitle(e.target.value)} required />
                    <input placeholder="Цена" type="number" value={price} onChange={e => setPrice(e.target.value)} required />
                    <input placeholder="Категория" value={category} onChange={e => setCategory(e.target.value)} required />
                    <input placeholder="Описание" value={description} onChange={e => setDescription(e.target.value)} required />
                    <button type="submit" style={{ padding: '8px 16px', background: '#28a745', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Добавить товар</button>
                </form>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {products.length === 0 ? <p>Товаров пока нет.</p> : null}
                {products.map(p => (
                    <div key={p.id} style={{ border: '1px solid #ccc', padding: '15px', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                            <h3 style={{ margin: '0 0 5px 0' }}>{p.title} <span style={{ color: 'green' }}>— {p.price} руб.</span></h3>
                            <p style={{ margin: 0, fontSize: '14px', color: '#666' }}>Категория: {p.category} | {p.description}</p>
                        </div>
                        
                        {/* Кнопка удаления видна ТОЛЬКО Admin */}
                        {role === 'admin' && (
                            <button onClick={() => handleDelete(p.id)} style={{ background: '#dc3545', color: 'white', border: 'none', padding: '8px 12px', borderRadius: '4px', cursor: 'pointer' }}>
                                Удалить
                            </button>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}