import axios from 'axios'

const apiBase = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:8000/api'

const api = axios.create({
  baseURL: apiBase,
})

const ACCESS_TOKEN_KEY = 'generic-db-access'
const REFRESH_TOKEN_KEY = 'generic-db-refresh'

export const tokenStorage = {
  get access() {
    if (typeof window === 'undefined') return null
    return localStorage.getItem(ACCESS_TOKEN_KEY)
  },
  set access(value: string | null) {
    if (typeof window === 'undefined') return
    if (value) {
      localStorage.setItem(ACCESS_TOKEN_KEY, value)
    } else {
      localStorage.removeItem(ACCESS_TOKEN_KEY)
    }
  },
  get refresh() {
    if (typeof window === 'undefined') return null
    return localStorage.getItem(REFRESH_TOKEN_KEY)
  },
  set refresh(value: string | null) {
    if (typeof window === 'undefined') return
    if (value) {
      localStorage.setItem(REFRESH_TOKEN_KEY, value)
    } else {
      localStorage.removeItem(REFRESH_TOKEN_KEY)
    }
  },
}

api.interceptors.request.use((config) => {
  const token = tokenStorage.access
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      const refresh = tokenStorage.refresh
      if (refresh) {
        try {
          const tokenResponse = await axios.post(`${apiBase}/auth/jwt/refresh`, { refresh })
          tokenStorage.access = tokenResponse.data.access
          error.config.headers.Authorization = `Bearer ${tokenResponse.data.access}`
          return api.request(error.config)
        } catch (refreshError) {
          tokenStorage.access = null
          tokenStorage.refresh = null
        }
      }
    }
    return Promise.reject(error)
  }
)

export default api
