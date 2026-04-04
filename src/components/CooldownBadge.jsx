import { useState, useEffect } from 'react'
import { Clock } from 'lucide-react'

const CooldownBadge = ({ cooldownUntil, className = '' }) => {
  const [timeLeft, setTimeLeft] = useState(() => {
    if (!cooldownUntil) return null
    const now = new Date()
    const endTime = new Date(cooldownUntil)
    const diff = endTime - now
    if (diff <= 0) return null
    const hours = Math.floor(diff / (1000 * 60 * 60))
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
    const seconds = Math.floor((diff % (1000 * 60)) / 1000)
    return { hours, minutes, seconds, total: diff }
  })

  useEffect(() => {
    if (!cooldownUntil) return

    const timer = setInterval(() => {
      const now = new Date()
      const endTime = new Date(cooldownUntil)
      const diff = endTime - now

      if (diff <= 0) {
        setTimeLeft(null)
        clearInterval(timer)
        return
      }

      const hours = Math.floor(diff / (1000 * 60 * 60))
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
      const seconds = Math.floor((diff % (1000 * 60)) / 1000)

      setTimeLeft({ hours, minutes, seconds, total: diff })
    }, 1000)

    return () => clearInterval(timer)
  }, [cooldownUntil])

  if (!cooldownUntil || !timeLeft) {
    return null
  }

  const formatTime = () => {
    const { hours, minutes, seconds } = timeLeft
    if (hours > 0) {
      return `${hours}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
    }
    return `${minutes}:${String(seconds).padStart(2, '0')}`
  }

  const isUrgent = timeLeft.total < 60000

  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full ${isUrgent
          ? 'bg-red-100 text-red-800'
          : 'bg-yellow-100 text-yellow-800'
        } ${className}`}
    >
      <Clock size={12} />
      <span>Khóa: {formatTime()}</span>
    </span>
  )
}

export default CooldownBadge