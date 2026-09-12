import { Navigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { useAuthStore } from '../store/authStore'
import { useFarmStore } from '../store/farmStore.js'
import { getMyFarms } from '../services/farmService.js'

const FarmGuard = ({ children }) => {
  const user = useAuthStore(state => state.user)
  const activeFarmId = useFarmStore(state => state.activeFarmId)

  const needsFarm = user?.role === 'admin' && !activeFarmId

  const { data: farms = [], isLoading } = useQuery({
    queryKey: ['farms', 'mine'],
    queryFn: getMyFarms,
    enabled: needsFarm,
  })

  if (!needsFarm) return children

  if (isLoading) return null

  if (farms.length >= 1) {
    return <Navigate to="/select-farm" replace />
  }

  return children
}

export default FarmGuard
