import { ReactNode } from 'react'
import { useAuth } from '../context/AuthContext'
import { Role } from '../types'

interface Props {
  workspaceId: number
  allow: Role[]
  children: ReactNode
}

export const RoleGuard: React.FC<Props> = ({ workspaceId, allow, children }) => {
  const { roleByWorkspace } = useAuth()
  const role = roleByWorkspace[workspaceId]
  if (!role || !allow.includes(role)) {
    return null
  }
  return <>{children}</>
}
