const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

const app = express();
app.use(express.json());

const users = [];
const products = [];
const JWT_SECRET = 'super-secret-key';

// ==========================================
// НОВОЕ: Middleware для проверки токена
// ==========================================
// Эта функция перехватывает запрос, ищет токен в заголовках и проверяет его.
const authenticateToken = (req, res, next) => {
    // Получаем заголовок Authorization (обычно в формате "Bearer <токен>")
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ message: 'Доступ запрещен. Токен не предоставлен.' });
    }

    // Проверяем токен
    jwt.verify(token, JWT_SECRET, (err, decodedUser) => {
        if (err) {
            return res.status(403).json({ message: 'Недействительный или просроченный токен.' });
        }
        // Если всё ок, сохраняем данные пользователя в объект запроса и идем дальше (next)
        req.user = decodedUser;
        next();
    });
};

// ==========================================
// МАРШРУТЫ АВТОРИЗАЦИИ (/api/auth)
// ==========================================

app.post('/api/auth/register', async (req, res) => {
    try {
        const { email, first_name, last_name, password } = req.body;
        const existingUser = users.find(u => u.email === email);
        if (existingUser) return res.status(400).json({ message: 'Email уже используется' });

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const newUser = { id: crypto.randomUUID(), email, first_name, last_name, password: hashedPassword };
        users.push(newUser);

        res.status(201).json({ message: 'Зарегистрирован', user: { id: newUser.id, email, first_name, last_name } });
    } catch (error) {
        res.status(500).json({ message: 'Ошибка сервера' });
    }
});

app.post('/api/auth/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = users.find(u => u.email === email);
        if (!user) return res.status(404).json({ message: 'Пользователь не найден' });

        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) return res.status(401).json({ message: 'Неверный пароль' });

        // Выдача токена (уже была реализована)
        const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '1h' });
        res.json({ message: 'Успешный вход', token });
    } catch (error) {
        res.status(500).json({ message: 'Ошибка сервера' });
    }
});

// НОВОЕ: Защищенный маршрут получения текущего пользователя
app.get('/api/auth/me', authenticateToken, (req, res) => {
    // req.user берется из middleware authenticateToken
    const user = users.find(u => u.id === req.user.id);
    
    if (!user) {
        return res.status(404).json({ message: 'Пользователь не найден' });
    }

    // Возвращаем данные пользователя, ИСКЛЮЧАЯ пароль (в целях безопасности)
    const { password, ...userWithoutPassword } = user;
    res.json(userWithoutPassword);
});

// ==========================================
// МАРШРУТЫ ТОВАРОВ (/api/products)
// ==========================================

// Создать товар (без защиты по заданию)
app.post('/api/products', (req, res) => {
    const { title, category, description, price } = req.body;
    const newProduct = { id: crypto.randomUUID(), title, category, description, price };
    products.push(newProduct);
    res.status(201).json(newProduct);
});

// Получить список товаров (без защиты по заданию)
app.get('/api/products', (req, res) => {
    res.json(products);
});

// НОВОЕ: Защищенный маршрут (добавлен authenticateToken)
app.get('/api/products/:id', authenticateToken, (req, res) => {
    const product = products.find(p => p.id === req.params.id);
    if (!product) return res.status(404).json({ message: 'Товар не найден' });
    res.json(product);
});

// НОВОЕ: Защищенный маршрут (добавлен authenticateToken)
app.put('/api/products/:id', authenticateToken, (req, res) => {
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

// НОВОЕ: Защищенный маршрут (добавлен authenticateToken)
app.delete('/api/products/:id', authenticateToken, (req, res) => {
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