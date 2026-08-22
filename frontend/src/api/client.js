import axios from 'axios'

// Development: VITE_API_URL trống → dùng Vite proxy '/api' → localhost:3001
// Production:  VITE_API_URL = 'https://your-backend.onrender.com' → gọi thẳng Render
const baseURL = import.meta.env.VITE_API_URL
  ? `${import.meta.env.VITE_API_URL}/api`
  : '/api'

const api = axios.create({ baseURL })

api.interceptors.request.use(config => {
  const token = localStorage.getItem('token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

api.interceptors.response.use(
  r => r,
  err => {
    // Không tự động đá ra ngoài nếu lỗi 401 đến từ trang đăng nhập / đăng ký
    const isAuthRoute = err.config.url.includes('/auth/login') || err.config.url.includes('/auth/register');
    if (err.response?.status === 401 && !isAuthRoute) {
      localStorage.removeItem('token')
      window.location.href = '/login'
    }
    return Promise.reject(err)
  }
)

export default api
