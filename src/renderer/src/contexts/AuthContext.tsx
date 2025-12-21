import { createContext, useState, ReactNode, useCallback } from 'react'
import { User } from '@renderer/models/account'

export interface AuthContextType {
  user: User | null
  loading: boolean
  login: (username: string, password: string) => Promise<void>
  logout: () => Promise<void>
  hasPermission: (permission: string) => boolean
  refreshUser: () => Promise<void>
}

// eslint-disable-next-line react-refresh/only-export-components
export const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading] = useState(false)

  const login = async (username: string, password: string) => {
    try {
      const loggedInUser = await window.electron.ipcRenderer.invoke(
        'accounts:login',
        username,
        password
      )
      setUser(loggedInUser)
    } catch (error) {
      console.error('Login failed:', error)
      throw error
    }
  }

  const logout = async () => {
    setUser(null)
  }

  const hasPermission = useCallback(
    (permission: string): boolean => {
      if (!user) return false
      if (user.isAdmin) return true
      return user.permissions[permission] === true
    },
    [user]
  )

  const refreshUser = async () => {
    if (user?.id) {
      try {
        const updatedUser = await window.electron.ipcRenderer.invoke('accounts:getById', user.id)
        if (updatedUser && updatedUser.isActive) {
          setUser(updatedUser)
        } else {
          await logout()
        }
      } catch (error) {
        console.error('Failed to refresh user:', error)
        await logout()
      }
    }
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, hasPermission, refreshUser }}>
      {children}
    </AuthContext.Provider>
  )
}
