const express = require('express');
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

const app = express();
app.use(cors());
app.use(express.json());

let users = [];
let products = [];
let refreshTokens = []; 

const ACCESS_TOKEN_SECRET = 'super-secret-access-key';
const REFRESH_TOKEN_SECRET = 'super-secret-refresh-key';

// Функция генерации токенов (теперь включает роль!)
function generateTokens(user) {
    const payload = { id: user.id, email: user.email, role: user.role };
    const accessToken = jwt.sign(payload, ACCESS_TOKEN_SECRET, { expiresIn: '15m' });
    const refreshToken = jwt.sign(payload, REFRESH_TOKEN_SECRET, { expiresIn: '7d' });
    return { accessToken, refreshToken };
}

// ==========================================
// MIDDLEWARES (ПРОВЕРКА ПРАВ)
// ==========================================

// 1. Проверка авторизации (кто это?)
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) return res.status(401).json({ message: 'Доступ запрещен. Токен не предоставлен.' });

    jwt.verify(token, ACCESS_TOKEN_SECRET, (err, decodedUser) => {
        if (err) return res.status(403).json({ message: 'Недействительный или просроченный токен.' });
        req.user = decodedUser;
        next();
    });
};

// 2. Проверка ролей (можно ли ему сюда?)
const checkRole = (allowedRoles) => {
    return (req, res, next) => {
        if (!req.user || !allowedRoles.includes(req.user.role)) {
            return res.status(403).json({ message: 'Доступ запрещен. Недостаточно прав.' });
        }
        next();
    };
};

// ==========================================
// МАРШРУТЫ АВТОРИЗАЦИИ (/api/auth) - Для всех (Гость)
// ==========================================

app.post('/api/auth/register', async (req, res) => {
    try {
        const { email, first_name, last_name, password } = req.body;
        if (users.find(u => u.email === email)) return res.status(400).json({ message: 'Email уже используется' });

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // ХИТРОСТЬ ДЛЯ ТЕСТИРОВАНИЯ РОЛЕЙ:
        let role = 'user';
        if (email === 'admin@mail.com') role = 'admin';
        if (email === 'seller@mail.com') role = 'seller';

        const newUser = { 
            id: crypto.randomUUID(), email, first_name, last_name, 
            password: hashedPassword, role, isBlocked: false 
        };
        users.push(newUser);

        res.status(201).json({ message: 'Зарегистрирован', user: { id: newUser.id, email, role } });
    } catch (error) {
        res.status(500).json({ message: 'Ошибка сервера' });
    }
});

app.post('/api/auth/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = users.find(u => u.email === email);
        
        if (!user) return res.status(404).json({ message: 'Пользователь не найден' });
        if (user.isBlocked) return res.status(403).json({ message: 'Ваш аккаунт заблокирован!' });

        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) return res.status(401).json({ message: 'Неверный пароль' });

        const tokens = generateTokens(user);
        refreshTokens.push(tokens.refreshToken);

        res.json(tokens);
    } catch (error) {
        res.status(500).json({ message: 'Ошибка сервера' });
    }
});

app.post('/api/auth/refresh', (req, res) => {
    const refreshToken = req.headers['x-refresh-token'];
    if (!refreshToken) return res.status(401).json({ message: 'Refresh токен не предоставлен' });
    if (!refreshTokens.includes(refreshToken)) return res.status(403).json({ message: 'Недействительный refresh токен' });

    jwt.verify(refreshToken, REFRESH_TOKEN_SECRET, (err, user) => {
        if (err) return res.status(403).json({ message: 'Токен просрочен' });
        
        // Проверяем, не заблокировали ли юзера, пока он спал
        const realUser = users.find(u => u.id === user.id);
        if (!realUser || realUser.isBlocked) return res.status(403).json({ message: 'Аккаунт заблокирован' });

        refreshTokens = refreshTokens.filter(token => token !== refreshToken);
        const newTokens = generateTokens(realUser); // Берем актуальную роль из базы
        refreshTokens.push(newTokens.refreshToken);

        res.json(newTokens);
    });
});

app.get('/api/auth/me', authenticateToken, (req, res) => {
    const user = users.find(u => u.id === req.user.id);
    if (!user) return res.status(404).json({ message: 'Пользователь не найден' });
    const { password, ...userWithoutPassword } = user;
    res.json(userWithoutPassword);
});

// ==========================================
// МАРШРУТЫ ПОЛЬЗОВАТЕЛЕЙ (/api/users) - ТОЛЬКО АДМИН
// ==========================================

// Получить всех пользователей (Только админ)
app.get('/api/users', authenticateToken, checkRole(['admin']), (req, res) => {
    // Не отдаем пароли на фронт
    const safeUsers = users.map(({ password, ...rest }) => rest);
    res.json(safeUsers);
});

// Получить юзера по ID (Только админ)
app.get('/api/users/:id', authenticateToken, checkRole(['admin']), (req, res) => {
    const user = users.find(u => u.id === req.params.id);
    if (!user) return res.status(404).json({ message: 'Не найден' });
    const { password, ...safeUser } = user;
    res.json(safeUser);
});

// Обновить роль или данные пользователя (Только админ)
app.put('/api/users/:id', authenticateToken, checkRole(['admin']), (req, res) => {
    const { first_name, last_name, role, isBlocked } = req.body;
    const userIndex = users.findIndex(u => u.id === req.params.id);
    
    if (userIndex === -1) return res.status(404).json({ message: 'Не найден' });

    users[userIndex] = {
        ...users[userIndex],
        first_name: first_name || users[userIndex].first_name,
        last_name: last_name || users[userIndex].last_name,
        role: role || users[userIndex].role,
        isBlocked: isBlocked !== undefined ? isBlocked : users[userIndex].isBlocked
    };
    
    const { password, ...safeUser } = users[userIndex];
    res.json(safeUser);
});

// Заблокировать пользователя (Только админ)
app.delete('/api/users/:id', authenticateToken, checkRole(['admin']), (req, res) => {
    const userIndex = users.findIndex(u => u.id === req.params.id);
    if (userIndex === -1) return res.status(404).json({ message: 'Не найден' });

    // По заданию - это блокировка
    users[userIndex].isBlocked = true;
    res.json({ message: 'Пользователь заблокирован' });
});

// ==========================================
// МАРШРУТЫ ТОВАРОВ (/api/products)
// ==========================================

// Просмотр доступен всем авторизованным: user, seller, admin
app.get('/api/products', authenticateToken, checkRole(['user', 'seller', 'admin']), (req, res) => {
    res.json(products);
});

app.get('/api/products/:id', authenticateToken, checkRole(['user', 'seller', 'admin']), (req, res) => {
    const product = products.find(p => p.id === req.params.id);
    if (!product) return res.status(404).json({ message: 'Товар не найден' });
    res.json(product);
});

// Создание - только seller и admin
app.post('/api/products', authenticateToken, checkRole(['seller', 'admin']), (req, res) => {
    const { title, category, description, price } = req.body;
    const newProduct = { id: crypto.randomUUID(), title, category, description, price };
    products.push(newProduct);
    res.status(201).json(newProduct);
});

// Обновление - только seller и admin
app.put('/api/products/:id', authenticateToken, checkRole(['seller', 'admin']), (req, res) => {
    const { id } = req.params;
    const { title, category, description, price } = req.body;
    const productIndex = products.findIndex(p => p.id === id);

    if (productIndex === -1) return res.status(404).json({ message: 'Товар не найден' });

    products[productIndex] = {
        ...products[productIndex],
        title: title || products[productIndex].title,
        category: category || products[productIndex].category,
        description: description || products[productIndex].description,
        price: price || products[productIndex].price
    };
    res.json(products[productIndex]);
});

// Удаление - ТОЛЬКО admin
app.delete('/api/products/:id', authenticateToken, checkRole(['admin']), (req, res) => {
    const productIndex = products.findIndex(p => p.id === req.params.id);
    if (productIndex === -1) return res.status(404).json({ message: 'Товар не найден' });

    products.splice(productIndex, 1);
    res.json({ message: 'Товар успешно удален' });
});

// ==========================================
// ЗАПУСК СЕРВЕРА
// ==========================================
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Сервер запущен на порту ${PORT}`);
});