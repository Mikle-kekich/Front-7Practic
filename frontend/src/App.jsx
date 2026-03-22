import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './Login';
import Register from './Register';
import Products from './Products';
import Users from './Users'; 

function ProtectedRoute({ children }) {
    const token = localStorage.getItem('accessToken');
    if (!token) {
        return <Navigate to="/login" replace />;
    }
    return children;
}

export default function App() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<Navigate to="/products" />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} /> 
                <Route path="/products" element={<ProtectedRoute><Products /></ProtectedRoute>} />
                
                {/* НОВОЕ: Защищенный маршрут для админки */}
                <Route path="/users" element={<ProtectedRoute><Users /></ProtectedRoute>} />
            </Routes>
        </BrowserRouter>
    );
}