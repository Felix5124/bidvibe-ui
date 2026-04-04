import { useState, useCallback } from 'react'

export const useConfirmModal = () => {
  const [isOpen, setIsOpen] = useState(false)
  const [config, setConfig] = useState({
    title: '',
    message: '',
    confirmText: 'Xác nhận',
    cancelText: 'Hủy',
    confirmVariant: 'primary',
    onConfirm: null,
    onCancel: null
  })

  const showConfirm = useCallback((options) => {
    return new Promise((resolve) => {
      setConfig({
        title: options.title || 'Xác nhận',
        message: options.message || 'Bạn có chắc chắn muốn thực hiện hành động này?',
        confirmText: options.confirmText || 'Xác nhận',
        cancelText: options.cancelText || 'Hủy',
        confirmVariant: options.confirmVariant || 'primary',
        onConfirm: () => {
          setIsOpen(false)
          resolve(true)
        },
        onCancel: () => {
          setIsOpen(false)
          resolve(false)
        }
      })
      setIsOpen(true)
    })
  }, [])

  const closeConfirm = useCallback(() => {
    setIsOpen(false)
    if (config.onCancel) {
      config.onCancel()
    }
  }, [config])

  return {
    isOpen,
    config,
    showConfirm,
    closeConfirm
  }
}

export default useConfirmModal