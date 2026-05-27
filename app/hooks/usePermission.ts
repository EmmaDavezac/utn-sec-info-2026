import { useSessionStore } from '@/app/store/session'
import { PERMISSION, PERMISSIONS_BY_ROLE } from '@/domain/identity/permissions'

export const usePermission = () => {
  const { user } = useSessionStore()
  
  const hasPermission = (permission: PERMISSION): boolean => {
    return !!user?.role ? PERMISSIONS_BY_ROLE
      .filter(x => x.role === user!.role)
      ?.map(x => x.permission)
      ?.includes(permission) : false
  }

  return { hasPermission }
}