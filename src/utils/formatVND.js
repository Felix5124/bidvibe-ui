export const formatVND = (amount) => {
  if (amount === null || amount === undefined) return '0₫'
  
  const num = typeof amount === 'string' ? parseFloat(amount) : amount
  
  if (isNaN(num)) return '0₫'
  
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    minimumFractionDigits:0,
    maximumFractionDigits: 0
  }).format(num)
}

export const formatVNDShort = (amount) => {
  if (amount === null || amount === undefined) return '0₫'
  
  const num = typeof amount === 'string' ? parseFloat(amount) : amount
  
  if (isNaN(num)) return '0₫'
  
  const formatted = new Intl.NumberFormat('vi-VN').format(num)
  return `${formatted}₫`
}

export const formatNumber = (num) => {
  if (num === null || num === undefined) return '0'
  
  const number = typeof num === 'string' ? parseFloat(num) : num
  
  if (isNaN(number)) return '0'
  
  return new Intl.NumberFormat('vi-VN').format(number)
}

export const parseVND = (formatted) => {
  if (!formatted) return 0
  
  return parseFloat(formatted.replace(/[^\d,-]/g, '').replace(',', '.')) || 0
}