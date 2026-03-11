import type { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'

import { useAuth } from '@/context/AuthContext'

export function PrivateRoute({ children }: { children: ReactNode }) {
  const { isLoading, session } = useAuth()
  const location = useLocation()

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    )
  }

  if (!session) {
    return <Navigate to="/auth/login" state={{ from: location }} replace />
  }

  return <>{children}</>
}
