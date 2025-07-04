import type { WSMessage, NotificationMessage } from '@/types'

export class WebSocketService {
  private ws: WebSocket | null = null
  private reconnectAttempts = 0
  private maxReconnectAttempts = 5
  private reconnectInterval = 5000
  private reconnectTimer: number | null = null
  private isManualClose = false
  private notificationStore: any = null
  private orderStore: any = null

  setStores(notificationStore: any, orderStore: any) {
    this.notificationStore = notificationStore
    this.orderStore = orderStore
  }

  connect(token: string): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      return
    }

    const wsUrl = import.meta.env.VITE_WS_URL || 'ws://localhost:8000/ws'
    const url = `${wsUrl}/orders?token=${token}`

    console.log('🔌 Подключение к WebSocket:', url)

    this.ws = new WebSocket(url)

    this.ws.onopen = () => {
      console.log('✅ WebSocket подключен')
      this.reconnectAttempts = 0
      this.clearReconnectTimer()
    }

    this.ws.onmessage = (event) => {
      try {
        const message: WSMessage = JSON.parse(event.data)
        console.log('📨 WebSocket сообщение:', message)
        this.handleMessage(message)
      } catch (error) {
        console.error('❌ Ошибка парсинга WebSocket сообщения:', error)
      }
    }

    this.ws.onclose = (event) => {
      console.log('🔌 WebSocket отключен:', event.code, event.reason)
      this.ws = null

      if (!this.isManualClose && this.reconnectAttempts < this.maxReconnectAttempts) {
        this.reconnect(token)
      }
    }

    this.ws.onerror = (error) => {
      console.error('❌ WebSocket ошибка:', error)
    }
  }

  private reconnect(token: string): void {
    this.reconnectAttempts++
    console.log(`🔄 Попытка переподключения ${this.reconnectAttempts}/${this.maxReconnectAttempts}`)

    this.reconnectTimer = setTimeout(() => {
      this.connect(token)
    }, this.reconnectInterval)
  }

  private clearReconnectTimer(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer)
      this.reconnectTimer = null
    }
  }

  private handleMessage(message: WSMessage): void {
    if (!this.notificationStore || !this.orderStore) return

    switch (message.type) {
      case 'order_created':
        this.handleOrderCreated(message)
        break

      case 'order_status_changed':
        this.handleOrderStatusChanged(message)
        this.orderStore.updateOrderStatusLocal(message.order_id, message.data.new_status)
        break

      case 'item_status_changed':
        this.handleItemStatusChanged(message)
        if (message.item_id) {
          this.orderStore.updateOrderItemStatus(message.order_id, message.item_id, message.data.status)
        }
        break

      default:
        console.warn('⚠️ Неизвестный тип WebSocket сообщения:', message.type)
    }
  }

  private handleOrderCreated(message: WSMessage): void {
    if (!this.notificationStore) return
    
    const notification: NotificationMessage = {
      id: `order_created_${message.order_id}_${Date.now()}`,
      type: 'info',
      title: 'Новый заказ',
      message: `Создан заказ №${message.order_id}`,
      timestamp: new Date().toISOString(),
      read: false,
      sound: false
    }

    this.notificationStore.addNotification(notification)
  }

  private handleOrderStatusChanged(message: WSMessage): void {
    if (!this.notificationStore) return
    
    const { old_status, new_status, message: statusMessage } = message.data

    let notificationType: 'info' | 'success' | 'warning' | 'error' = 'info'
    let shouldPlaySound = false

    // Определяем тип уведомления и нужность звука
    switch (new_status) {
      case 'ready':
        notificationType = 'success'
        shouldPlaySound = true
        break
      case 'cancelled':
        notificationType = 'warning'
        break
      case 'confirmed':
        notificationType = 'info'
        break
      default:
        notificationType = 'info'
    }

    const notification: NotificationMessage = {
      id: `order_status_${message.order_id}_${Date.now()}`,
      type: notificationType,
      title: 'Изменение статуса заказа',
      message: statusMessage || `Заказ №${message.order_id}: ${this.getStatusDisplayName(new_status)}`,
      timestamp: new Date().toISOString(),
      read: false,
      sound: shouldPlaySound
    }

    this.notificationStore.addNotification(notification)

    // Воспроизводим звук если нужно
    if (shouldPlaySound) {
      this.playNotificationSound('ready')
    }
  }

  private handleItemStatusChanged(message: WSMessage): void {
    if (!this.notificationStore) return
    
    const { status, dish_name } = message.data

    if (status === 'ready') {
      const notification: NotificationMessage = {
        id: `item_ready_${message.order_id}_${message.item_id}_${Date.now()}`,
        type: 'success',
        title: 'Блюдо готово',
        message: `${dish_name} (Заказ №${message.order_id})`,
        timestamp: new Date().toISOString(),
        read: false,
        sound: true
      }

      this.notificationStore.addNotification(notification)
      this.playNotificationSound('ready')
    }
  }

  private getStatusDisplayName(status: string): string {
    const statusNames: Record<string, string> = {
      pending: 'Ожидает подтверждения',
      confirmed: 'Подтвержден кухней',
      in_progress: 'Готовится',
      ready: 'Готов к подаче',
      served: 'Подан клиенту',
      cancelled: 'Отменен'
    }
    return statusNames[status] || status
  }

  private playNotificationSound(type: 'ready' | 'message' | 'error'): void {
    try {
      const soundFile = {
        ready: '/sounds/notification.mp3',
        message: '/sounds/message.mp3',
        error: '/sounds/error.mp3'
      }[type]

      const audio = new Audio(soundFile)
      audio.volume = 0.7
      audio.play().catch(error => {
        console.warn('⚠️ Не удалось воспроизвести звук:', error)
      })
    } catch (error) {
      console.warn('⚠️ Ошибка воспроизведения звука:', error)
    }
  }

  disconnect(): void {
    this.isManualClose = true
    this.clearReconnectTimer()
    
    if (this.ws) {
      this.ws.close()
      this.ws = null
    }
    
    this.reconnectAttempts = 0
    console.log('🔌 WebSocket отключен вручную')
  }

  isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN
  }

  getConnectionState(): string {
    if (!this.ws) return 'disconnected'
    
    switch (this.ws.readyState) {
      case WebSocket.CONNECTING:
        return 'connecting'
      case WebSocket.OPEN:
        return 'connected'
      case WebSocket.CLOSING:
        return 'closing'
      case WebSocket.CLOSED:
        return 'disconnected'
      default:
        return 'unknown'
    }
  }
}

// Создаем единственный экземпляр
export const webSocketService = new WebSocketService()
export default webSocketService
