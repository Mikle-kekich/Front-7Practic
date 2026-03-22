import axios from 'axios';

const api = axios.create({
    baseURL: 'http://localhost:3000/api', // Адрес нашего бэкенда
});

// 1. Добавляем accessToken ко всем запросам
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// 2. Ловим ошибки. Если пришла ошибка 403 (токен протух), пробуем обновить
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;
        
        // Если ошибка 403 и мы еще не пробовали повторить запрос
        if (error.response.status === 403 && !originalRequest._isRetry) {
            originalRequest._isRetry = true;
            try {
                const refreshToken = localStorage.getItem('refreshToken');
                // Запрашиваем новые токены
                const response = await axios.post('http://localhost:3000/api/auth/refresh', null, {
                    headers: { 'x-refresh-token': refreshToken }
                });
                
                // Сохраняем новые токены
                localStorage.setItem('accessToken', response.data.accessToken);
                localStorage.setItem('refreshToken', response.data.refreshToken);
                
                // Повторяем изначальный запрос с новым токеном
                return api.request(originalRequest);
            } catch (e) {
                // Если рефреш не удался (например, он тоже протух)
                localStorage.removeItem('accessToken');
                localStorage.removeItem('refreshToken');
                window.location.href = '/login'; // Выкидываем на страницу входа
            }
        }
        throw error;
    }
);

export default api;