
import {
  createContext,
  useContext,
  useEffect,
  useState,
} from 'react'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [authLoading, setAuthLoading] = useState(true)

  // Restore the existing login session after a page reload.
  useEffect(() => {
    const token = localStorage.getItem('token')
    const storedUser = localStorage.getItem('user')

    if (token && storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser)

        setUser(parsedUser)
        setIsLoggedIn(true)
      } catch (error) {
        console.error('Unable to restore user session:', error)
        localStorage.removeItem('token')
        localStorage.removeItem('user')
      }
    }

    setAuthLoading(false)
  }, [])

  const login = (userData) => {
    setUser(userData)
    setIsLoggedIn(true)
  }

  const logout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')

    setUser(null)
    setIsLoggedIn(false)
  }

  const value = {
    user,
    setUser,
    isLoggedIn,
    authLoading,
    login,
    logout,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)

  if (context === null) {
    throw new Error('useAuth must be used inside AuthProvider')
  }

  return context
}
