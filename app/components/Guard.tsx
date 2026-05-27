'use client'

import { ReactNode } from 'react'
import { usePermission } from '@/app/hooks/usePermission'
import { PERMISSION } from '@/domain/identity/permissions'

interface GuardProps {
  permission: PERMISSION;
  children: ReactNode;
  fallback?: ReactNode;
}

export const Guard = ({ permission, children, fallback = null }: GuardProps) => {
  const { hasPermission } = usePermission()

  if (!hasPermission(permission)) {
    return <>{fallback}</>
  }

  return <>{children}</>
}