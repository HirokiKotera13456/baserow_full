import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/router'
import api, { tokenStorage } from '../lib/api'
import { LoginResponse, Role, User } from '../types'

interface AuthState {
  user: User | null
  roleByWorkspace: Record<number, Role>
  login: (username: string, password: string) => Promise<void>
  logout: () => void
  isAuthenticated: boolean
}

const AuthContext = createContext<AuthState | undefined>(undefined)

async function fetchMe(): Promise<User | null> {
  try {
    const response = await api.get<User>('/auth/me')
    return response.data
  } catch (error) {
    return null
  }
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [roleByWorkspace, setRoleByWorkspace] = useState<Record<number, Role>>({})
  const router = useRouter()

  useEffect(() => {
    if (tokenStorage.access) {
      void fetchMe().then((me) => {
        if (me) {
          setUser(me)
          void api
            .get('/role-assignments')
            .then((res) => {
              const data = Array.isArray(res.data) ? res.data : res.data.results ?? []
              const mapping: Record<number, Role> = {}
              data.forEach((assignment: any) => {
                mapping[assignment.workspace] = assignment.role
              })
              setRoleByWorkspace(mapping)
            })
            .catch(() => null)
        }
      })
    }
  }, [])

  const login = async (username: string, password: string) => {
    const response = await api.post<LoginResponse>('/auth/jwt/create', { username, password })
    tokenStorage.access = response.data.access
    tokenStorage.refresh = response.data.refresh
    const me = await fetchMe()
    setUser(me)
    if (me) {
      const assignments = await api.get('/role-assignments')
      const data = Array.isArray(assignments.data) ? assignments.data : assignments.data.results ?? []
      const mapping: Record<number, Role> = {}
      data.forEach((assignment: any) => {
        mapping[assignment.workspace] = assignment.role
      })
      setRoleByWorkspace(mapping)
    }
    await router.push('/workspaces')
  }

  const logout = () => {
    tokenStorage.access = null
    tokenStorage.refresh = null
    setUser(null)
    setRoleByWorkspace({})
    void router.push('/login')
  }

  const value = useMemo(
    () => ({
      user,
      roleByWorkspace,
      login,
      logout,
      isAuthenticated: Boolean(user),
    }),
    [user, roleByWorkspace]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = (): AuthState => {
  const ctx = useContext(AuthContext)
  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return ctx
}
