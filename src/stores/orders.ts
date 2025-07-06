import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { apiService } from '@/services/api'
import type { Order, CreateOrderRequest, OrderStatus, OrderItemStatus } from '@/types/api'
import { extractErrorMessage } from '@/utils/format'

export const useOrderStore = defineStore('orders', () => {
  // Состояние
  const orders = ref<Order[]>([])
  const currentOrder = ref<Order | null>(null)
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  // Геттеры
  const activeOrders = computed(() =>
    orders.value.filter(order =>
      order.status !== 'served' && order.status !== 'cancelled'
    )
  )

  const readyOrders = computed(() =>
    orders.value.filter(order => order.status === 'ready')
  )

  const pendingOrders = computed(() =>
    orders.value.filter(order => order.status === 'pending')
  )

  const inProgressOrders = computed(() =>
    orders.value.filter(order => order.status === 'in_progress')
  )

  const todayOrders = computed(() => {
    const today = new Date().toDateString()
    return orders.value.filter(order =>
      new Date(order.created_at).toDateString() === today
    )
  })

  const ordersByTable = computed(() => {
    const byTable: Record<number, Order[]> = {}
    orders.value.forEach(order => {
      if (!byTable[order.table_id]) {
        byTable[order.table_id] = []
      }
      byTable[order.table_id].push(order)
    })
    return byTable
  })

  // Загрузка заказов
  const fetchOrders = async (): Promise<void> => {
    try {
      isLoading.value = true
      error.value = null

      const ordersData = await apiService.getOrders()
      orders.value = ordersData
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Ошибка загрузки заказов'
      error.value = errorMessage
      console.error('Ошибка загрузки заказов:', err)
    } finally {
      isLoading.value = false
    }
  }

  // Создание заказа
  const createOrder = async (orderData: CreateOrderRequest): Promise<Order | null> => {
    try {
      isLoading.value = true
      error.value = null

      const newOrder = await apiService.createOrder(orderData)
      orders.value.unshift(newOrder)

      return newOrder
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Ошибка создания заказа'
      error.value = errorMessage
      console.error('Ошибка создания заказа:', err)
      return null
    } finally {
      isLoading.value = false
    }
  }

  // Получение заказа по ID
  const fetchOrder = async (orderId: number): Promise<Order | null> => {
    try {
      const order = await apiService.getOrder(orderId)

      // Обновляем в списке
      const index = orders.value.findIndex(o => o.id === orderId)
      if (index >= 0) {
        orders.value[index] = order
      } else {
        orders.value.unshift(order)
      }

      return order
    } catch (err: unknown) {
      error.value = extractErrorMessage(err, 'Ошибка загрузки заказа')
      console.error('Ошибка загрузки заказа:', err)
      return null
    }
  }

  // Обновление статуса заказа
  const updateOrderStatus = async (orderId: number, status: OrderStatus): Promise<boolean> => {
    try {
      const updatedOrder = await apiService.updateOrderStatus(orderId, status)

      // Обновляем в списке
      const index = orders.value.findIndex(o => o.id === orderId)
      if (index >= 0) {
        orders.value[index] = updatedOrder
      }

      // Обновляем текущий заказ если это он
      if (currentOrder.value?.id === orderId) {
        currentOrder.value = updatedOrder
      }

      return true
    } catch (err: unknown) {
      error.value = extractErrorMessage(err, 'Ошибка обновления статуса заказа')
      console.error('Ошибка обновления статуса заказа:', err)
      return false
    }
  }

  // Обновление статуса заказа (локально, от WebSocket)
  const updateOrderStatusLocal = (orderId: number, status: OrderStatus): void => {
    const order = orders.value.find(o => o.id === orderId)
    if (order) {
      order.status = status
    }

    if (currentOrder.value?.id === orderId) {
      currentOrder.value.status = status
    }
  }

  // Обновление статуса позиции заказа (локально, от WebSocket)
  const updateOrderItemStatus = (orderId: number, itemId: number, status: OrderItemStatus): void => {
    const order = orders.value.find(o => o.id === orderId)
    if (order) {
      const item = order.items.find(i => i.id === itemId)
      if (item) {
        item.status = status
      }
    }

    if (currentOrder.value?.id === orderId) {
      const item = currentOrder.value.items.find(i => i.id === itemId)
      if (item) {
        item.status = status
      }
    }
  }

  // Обновление статуса оплаты
  const updateOrderPayment = async (orderId: number, paymentStatus: string): Promise<boolean> => {
    try {
      const updatedOrder = await apiService.updateOrderPayment(orderId, paymentStatus)

      // Обновляем в списке
      const index = orders.value.findIndex(o => o.id === orderId)
      if (index >= 0) {
        orders.value[index] = updatedOrder
      }

      // Обновляем текущий заказ если это он
      if (currentOrder.value?.id === orderId) {
        currentOrder.value = updatedOrder
      }

      return true
    } catch (err: unknown) {
      error.value = extractErrorMessage(err, 'Ошибка обновления статуса оплаты')
      console.error('Ошибка обновления статуса оплаты:', err)
      return false
    }
  }

  // Добавление позиции в заказ
  const addOrderItem = async (orderId: number, item: {
    dish_id: number
    dish_variation_id: number
    quantity: number
    comment?: string
  }): Promise<boolean> => {
    try {
      await apiService.addOrderItem(orderId, item)

      // Перезагружаем заказ
      await fetchOrder(orderId)

      return true
    } catch (err: unknown) {
      error.value = extractErrorMessage(err, 'Ошибка добавления позиции')
      console.error('Ошибка добавления позиции:', err)
      return false
    }
  }

  // Обновление позиции заказа
  const updateOrderItem = async (orderId: number, itemId: number, data: {
    quantity?: number
    comment?: string
  }): Promise<boolean> => {
    try {
      await apiService.updateOrderItem(orderId, itemId, data)

      // Перезагружаем заказ
      await fetchOrder(orderId)

      return true
    } catch (err: unknown) {
      error.value = extractErrorMessage(err, 'Ошибка обновления позиции')
      console.error('Ошибка обновления позиции:', err)
      return false
    }
  }

  // Удаление позиции заказа
  const removeOrderItem = async (orderId: number, itemId: number): Promise<boolean> => {
    try {
      await apiService.deleteOrderItem(orderId, itemId)

      // Перезагружаем заказ
      await fetchOrder(orderId)

      return true
    } catch (err: unknown) {
      error.value = extractErrorMessage(err, 'Ошибка удаления позиции')
      console.error('Ошибка удаления позиции:', err)
      return false
    }
  }

  // Установка текущего заказа
  const setCurrentOrder = (order: Order | null): void => {
    currentOrder.value = order
  }

  // Получение заказов для столика
  const getOrdersForTable = (tableId: number): Order[] => {
    return orders.value.filter(order => order.table_id === tableId)
  }

  // Получение активного заказа для столика
  const getActiveOrderForTable = (tableId: number): Order | null => {
    return orders.value.find(order =>
      order.table_id === tableId &&
      order.status !== 'served' &&
      order.status !== 'cancelled'
    ) || null
  }

  // Очистка ошибок
  const clearError = (): void => {
    error.value = null
  }

  // Очистка заказов
  const clearOrders = (): void => {
    orders.value = []
    currentOrder.value = null
  }

  return {
    // Состояние
    orders,
    currentOrder,
    isLoading,
    error,

    // Геттеры
    activeOrders,
    readyOrders,
    pendingOrders,
    inProgressOrders,
    todayOrders,
    ordersByTable,

    // Действия
    fetchOrders,
    createOrder,
    fetchOrder,
    updateOrderStatus,
    updateOrderStatusLocal,
    updateOrderItemStatus,
    updateOrderPayment,
    addOrderItem,
    updateOrderItem,
    removeOrderItem,
    setCurrentOrder,
    getOrdersForTable,
    getActiveOrderForTable,
    clearError,
    clearOrders
  }
})
