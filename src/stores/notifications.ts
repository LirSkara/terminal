import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { NotificationMessage } from '@/types'
import { generateId } from '@/utils/format'

export const useNotificationStore = defineStore('notifications', () => {
  // Состояние
  const notifications = ref<NotificationMessage[]>([])
  const soundEnabled = ref(true)

  // Геттеры
  const unreadCount = computed(() => 
    notifications.value.filter(n => !n.read).length
  )

  const recentNotifications = computed(() => 
    notifications.value
      .slice()
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 10)
  )

  const hasUnread = computed(() => unreadCount.value > 0)

  // Добавление уведомления
  const addNotification = (notification: Omit<NotificationMessage, 'id' | 'timestamp'>) => {
    const newNotification: NotificationMessage = {
      ...notification,
      id: generateId(),
      timestamp: new Date().toISOString()
    }

    notifications.value.unshift(newNotification)

    // Ограничиваем количество уведомлений
    if (notifications.value.length > 100) {
      notifications.value = notifications.value.slice(0, 100)
    }

    // Воспроизводим звук если включен
    if (soundEnabled.value && newNotification.sound) {
      playNotificationSound(newNotification.type)
    }

    // Автоматически удаляем через 10 секунд для неважных уведомлений
    if (newNotification.type === 'info') {
      setTimeout(() => {
        removeNotification(newNotification.id)
      }, 10000)
    }
  }

  // Отметка как прочитанное
  const markAsRead = (notificationId: string) => {
    const notification = notifications.value.find(n => n.id === notificationId)
    if (notification) {
      notification.read = true
    }
  }

  // Отметка всех как прочитанные
  const markAllAsRead = () => {
    notifications.value.forEach(notification => {
      notification.read = true
    })
  }

  // Удаление уведомления
  const removeNotification = (notificationId: string) => {
    const index = notifications.value.findIndex(n => n.id === notificationId)
    if (index >= 0) {
      notifications.value.splice(index, 1)
    }
  }

  // Очистка всех уведомлений
  const clearAll = () => {
    notifications.value = []
  }

  // Очистка прочитанных уведомлений
  const clearRead = () => {
    notifications.value = notifications.value.filter(n => !n.read)
  }

  // Включение/выключение звука
  const toggleSound = () => {
    soundEnabled.value = !soundEnabled.value
    localStorage.setItem('qres_sound_enabled', String(soundEnabled.value))
  }

  // Инициализация настроек звука
  const initializeSoundSettings = () => {
    const saved = localStorage.getItem('qres_sound_enabled')
    if (saved !== null) {
      soundEnabled.value = saved === 'true'
    }
  }

  // Воспроизведение звука уведомления
  const playNotificationSound = (type: NotificationMessage['type']) => {
    if (!soundEnabled.value) return

    try {
      const soundFile = getSoundFile(type)
      const audio = new Audio(soundFile)
      audio.volume = 0.7
      audio.play().catch(error => {
        console.warn('⚠️ Не удалось воспроизвести звук:', error)
      })
    } catch (error) {
      console.warn('⚠️ Ошибка воспроизведения звука:', error)
    }
  }

  // Получение файла звука по типу
  const getSoundFile = (type: NotificationMessage['type']): string => {
    switch (type) {
      case 'success':
        return '/sounds/notification.mp3'
      case 'error':
        return '/sounds/error.mp3'
      case 'warning':
      case 'info':
      default:
        return '/sounds/message.mp3'
    }
  }

  // Добавление быстрых уведомлений
  const showSuccess = (title: string, message: string, sound = false) => {
    addNotification({
      type: 'success',
      title,
      message,
      read: false,
      sound
    })
  }

  const showError = (title: string, message: string, sound = true) => {
    addNotification({
      type: 'error',
      title,
      message,
      read: false,
      sound
    })
  }

  const showWarning = (title: string, message: string, sound = false) => {
    addNotification({
      type: 'warning',
      title,
      message,
      read: false,
      sound
    })
  }

  const showInfo = (title: string, message: string, sound = false) => {
    addNotification({
      type: 'info',
      title,
      message,
      read: false,
      sound
    })
  }

  return {
    // Состояние
    notifications,
    soundEnabled,

    // Геттеры
    unreadCount,
    recentNotifications,
    hasUnread,

    // Действия
    addNotification,
    markAsRead,
    markAllAsRead,
    removeNotification,
    clearAll,
    clearRead,
    toggleSound,
    initializeSoundSettings,
    playNotificationSound,

    // Быстрые методы
    showSuccess,
    showError,
    showWarning,
    showInfo
  }
})
