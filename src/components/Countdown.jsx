import { useState, useEffect } from 'react'

const Countdown = ({ endTime, className = '' }) => {
  const [timeLeft, setTimeLeft] = useState(() => {
    if (!endTime) return null
    const now = new Date()
    const end = new Date(endTime)
    const diff = end - now
    if (diff <= 0) return null
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
    const seconds = Math.floor((diff % (1000 * 60)) / 1000)
    return { days, hours, minutes, seconds, total: diff }
  })

  useEffect(() => {
    if (!endTime) return

    const timer = setInterval(() => {
      const now = new Date()
      const end = new Date(endTime)
      const diff = end - now

      if (diff <= 0) {
        setTimeLeft(null)
        clearInterval(timer)
        return
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24))
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
      const seconds = Math.floor((diff % (1000 * 60)) / 1000)

      setTimeLeft({ days, hours, minutes, seconds, total: diff })
    }, 1000)

    return () => clearInterval(timer)
  }, [endTime])

  if (!endTime || !timeLeft) {
    return <span className={className}>Đã kết thúc</span>
  }

  const { days, hours, minutes, seconds, total } = timeLeft
  const isUrgent = total < 60000
  const isCritical = total < 10000

  const formatTime = () => {
    if (days > 0) {
      return `${days} ngày ${hours}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
    }
    if (hours > 0) {
      return `${hours}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
    }
    return `${minutes}:${String(seconds).padStart(2, '0')}`
  }

  return (
    <span
      className={`${className} ${isCritical ? 'animate-pulse-urgent text-red-600 font-bold' : isUrgent ? 'text-red-500 font-semibold' : ''}`}
    >
      {formatTime()}
    </span>
  )
}

export default Countdown