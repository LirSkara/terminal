import axios, { type AxiosInstance, type AxiosResponse } from 'axios'
import { cacheService, CACHE_KEYS, CACHE_TTL } from './cache'
import type {
  AuthResponse,
  User,
  Table,
  Order,
  OrderWithDetails,
  CreateOrderRequest,
  Dish,
  Category,
  DishVariation,
  PaymentMethod,
  PaymentMethodsResponse,
  Location,
  Ingredient,
  AllergenInfo,
  OrderStats,
  SystemHealth,
  CreateUserRequest,
  UpdateUserRequest,
  ChangePasswordRequest,
  CreateTableRequest,
  UpdateTableRequest,
  CreateLocationRequest,
  UpdateLocationRequest,
  CreateCategoryRequest,
  UpdateCategoryRequest,
  CreateDishRequest,
  UpdateDishRequest,
  CreateDishVariationRequest,
  UpdateDishVariationRequest,
  CreateIngredientRequest,
  UpdateIngredientRequest,
  CreatePaymentMethodRequest,
  UpdatePaymentMethodRequest,
  CategoriesResponse,
  DishesResponse,
  DishVariationsResponse,
  EditableOrderResponse,
  AddOrderItemsRequest,
  UpdateOrderItemRequest,
  CreateOrderItemRequest
} from '@/types/api'

class ApiService {
  private api: AxiosInstance
  private readonly baseURL: string

  constructor() {
    this.baseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'

    this.api = axios.create({
      baseURL: this.baseURL,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    })

    // Интерсептор для добавления токена
    this.api.interceptors.request.use(
      (config) => {
        const token = this.getToken()
        if (token) {
          config.headers.Authorization = `Bearer ${token}`
        }
        return config
      },
      (error) => {
        return Promise.reject(error)
      }
    )

    // Интерсептор для обработки ответов
    this.api.interceptors.response.use(
      (response: AxiosResponse) => {
        return response
      },
      (error) => {
        // Логируем ошибку для отладки
        console.error('API Error:', {
          url: error.config?.url,
          method: error.config?.method?.toUpperCase(),
          status: error.response?.status,
          message: error.response?.data?.detail || error.message
        })

        if (error.response?.status === 401) {
          this.clearToken()
          // Очищаем данные пользователя при разлогинивании
          localStorage.removeItem('qres_user')
          window.location.href = '/login'
        }
        return Promise.reject(error)
      }
    )
  }

  private getToken(): string | null {
    return localStorage.getItem('qres_token')
  }

  private setToken(token: string): void {
    localStorage.setItem('qres_token', token)
  }

  private clearToken(): void {
    localStorage.removeItem('qres_token')
  }

  private getCurrentUserFromStorage(): User | null {
    const userStr = localStorage.getItem('qres_user')
    if (!userStr) return null

    try {
      return JSON.parse(userStr) as User
    } catch (error) {
      console.error('Ошибка при парсинге пользователя из localStorage:', error)
      return null
    }
  }

  // ===================
  // АУТЕНТИФИКАЦИЯ
  // ===================

  async loginWithPin(username: string, pinCode: string): Promise<AuthResponse> {
    const response = await this.api.post<AuthResponse>('/auth/login/pin', {
      username,
      pin_code: pinCode
    })
    this.setToken(response.data.access_token)
    return response.data
  }

  async loginWithPassword(username: string, password: string): Promise<AuthResponse> {
    const response = await this.api.post<AuthResponse>('/auth/login', {
      username,
      password
    })
    this.setToken(response.data.access_token)
    return response.data
  }

  async getCurrentUser(): Promise<User> {
    const response = await this.api.get<User>('/auth/me')
    return response.data
  }

  async logout(): Promise<void> {
    try {
      await this.api.post('/auth/logout')
    } finally {
      this.clearToken()
    }
  }

  // ===================
  // ПОЛЬЗОВАТЕЛИ
  // ===================

  async getWaiters(): Promise<User[]> {
    const response = await this.api.get<User[]>('/users/waiters')
    return response.data
  }

  async getUsers(): Promise<User[]> {
    const response = await this.api.get<User[]>('/users/')
    return response.data
  }

  async createUser(userData: CreateUserRequest): Promise<User> {
    const response = await this.api.post<User>('/users/', userData)
    return response.data
  }

  async getUser(userId: number): Promise<User> {
    const response = await this.api.get<User>(`/users/${userId}`)
    return response.data
  }

  async updateUser(userId: number, userData: UpdateUserRequest): Promise<User> {
    const response = await this.api.patch<User>(`/users/${userId}`, userData)
    return response.data
  }

  async changeUserPassword(userId: number, passwordData: ChangePasswordRequest): Promise<void> {
    await this.api.patch(`/users/${userId}/password`, passwordData)
  }

  async deactivateUser(userId: number): Promise<void> {
    await this.api.delete(`/users/${userId}`)
  }

  // ===================
  // СТОЛИКИ
  // ===================

  async getTables(options: { force?: boolean } = {}): Promise<Table[]> {
    return cacheService.getOrFetch(
      CACHE_KEYS.TABLES,
      async () => {
        const response = await this.api.get<Table[]>('/tables/')
        return response.data
      },
      { ttl: CACHE_TTL.MEDIUM, force: options.force }
    )
  }

  async createTable(tableData: CreateTableRequest): Promise<Table> {
    const response = await this.api.post<Table>('/tables/', tableData)
    return response.data
  }

  async getTable(tableId: number): Promise<Table> {
    const response = await this.api.get<Table>(`/tables/${tableId}`)
    return response.data
  }

  async updateTable(tableId: number, tableData: UpdateTableRequest): Promise<Table> {
    const response = await this.api.patch<Table>(`/tables/${tableId}`, tableData)
    return response.data
  }

  async updateTableStatus(tableId: number, isOccupied: boolean): Promise<Table> {
    const response = await this.api.patch<Table>(`/tables/${tableId}/status`, {
      is_occupied: isOccupied
    })
    return response.data
  }

  async getTableQR(tableId: number): Promise<{ qr_code: string }> {
    const response = await this.api.get<{ qr_code: string }>(`/tables/${tableId}/qr`)
    return response.data
  }

  async deactivateTable(tableId: number): Promise<void> {
    await this.api.delete(`/tables/${tableId}`)
  }

  // ===================
  // МЕНЮ (БЛЮДА)
  // ===================

  async getMenu(): Promise<{
    categories: Category[]
    dishes: Dish[]
    variations: Record<number, DishVariation[]>
  }> {
    const response = await this.api.get('/dishes/menu')
    return response.data
  }

  async getDishes(categoryId?: number): Promise<Dish[]> {
    const params = categoryId ? { category_id: categoryId } : {}
    const response = await this.api.get<Dish[]>('/dishes/', { params })
    return response.data
  }

  async createDish(dishData: CreateDishRequest): Promise<Dish> {
    const response = await this.api.post<Dish>('/dishes/', dishData)
    return response.data
  }

  async getDish(dishId: number): Promise<Dish> {
    const response = await this.api.get<Dish>(`/dishes/${dishId}`)
    return response.data
  }

  async updateDish(dishId: number, dishData: UpdateDishRequest): Promise<Dish> {
    const response = await this.api.patch<Dish>(`/dishes/${dishId}`, dishData)
    return response.data
  }

  async updateDishAvailability(dishId: number, isAvailable: boolean): Promise<Dish> {
    const response = await this.api.patch<Dish>(`/dishes/${dishId}/availability`, {
      is_available: isAvailable
    })
    return response.data
  }

  async deactivateDish(dishId: number): Promise<void> {
    await this.api.delete(`/dishes/${dishId}`)
  }

  // Вариации блюд
  async getDishVariations(dishId: number, options: { force?: boolean } = {}): Promise<DishVariationsResponse> {
    return cacheService.getOrFetch(
      CACHE_KEYS.DISH_VARIATIONS(dishId),
      async () => {
        const response = await this.api.get<DishVariationsResponse>(`/dishes/${dishId}/variations/`)
        return response.data
      },
      { ttl: CACHE_TTL.MEDIUM, force: options.force }
    )
  }

  async createDishVariation(dishId: number, variationData: CreateDishVariationRequest): Promise<DishVariation> {
    const response = await this.api.post<DishVariation>(`/dishes/${dishId}/variations/`, variationData)
    return response.data
  }

  async getDishVariation(dishId: number, variationId: number): Promise<DishVariation> {
    const response = await this.api.get<DishVariation>(`/dishes/${dishId}/variations/${variationId}`)
    return response.data
  }

  async updateDishVariation(dishId: number, variationId: number, variationData: UpdateDishVariationRequest): Promise<DishVariation> {
    const response = await this.api.patch<DishVariation>(`/dishes/${dishId}/variations/${variationId}`, variationData)
    return response.data
  }

  async updateDishVariationAvailability(dishId: number, variationId: number, isAvailable: boolean): Promise<DishVariation> {
    const response = await this.api.patch<DishVariation>(`/dishes/${dishId}/variations/${variationId}/availability`, {
      is_available: isAvailable
    })
    return response.data
  }

  async deleteDishVariation(dishId: number, variationId: number): Promise<void> {
    await this.api.delete(`/dishes/${dishId}/variations/${variationId}`)
  }

  // ===================
  // ЗАКАЗЫ
  // ===================

  async getOrders(): Promise<Order[]> {
    const response = await this.api.get<Order[]>('/orders/')
    return response.data
  }

  async createOrder(orderData: CreateOrderRequest): Promise<OrderWithDetails> {
    const response = await this.api.post<OrderWithDetails>('/orders/', orderData)
    return response.data
  }

  async getOrder(orderId: number): Promise<Order> {
    const response = await this.api.get<Order>(`/orders/${orderId}`)
    return response.data
  }

  async updateOrderStatus(orderId: number, status: string): Promise<Order> {
    const response = await this.api.patch<Order>(`/orders/${orderId}/status`, {
      status
    })
    return response.data
  }

  async updateOrderPayment(orderId: number, paymentStatus: string): Promise<Order> {
    const response = await this.api.patch<Order>(`/orders/${orderId}/payment`, {
      payment_status: paymentStatus
    })
    return response.data
  }

  async addOrderItem(orderId: number, item: {
    dish_id: number
    dish_variation_id: number
    quantity: number
    comment?: string
  }): Promise<void> {
    await this.api.post(`/orders/${orderId}/items/`, item)
  }

  async updateOrderItem(orderId: number, itemId: number, data: UpdateOrderItemRequest): Promise<void> {
    await this.api.patch(`/orders/${orderId}/items/${itemId}`, data)
  }

  async updateOrderItemStatus(orderId: number, itemId: number, status: string): Promise<void> {
    await this.api.patch(`/kitchen/items/${itemId}/status`, { status })
  }

  async deleteOrderItem(orderId: number, itemId: number): Promise<void> {
    await this.api.delete(`/orders/${orderId}/items/${itemId}`)
  }

  // === РЕДАКТИРОВАНИЕ ЗАКАЗОВ (новая система) ===

  async getOrderForEdit(orderId: number): Promise<EditableOrderResponse> {
    const response = await this.api.get<EditableOrderResponse>(`/orders/${orderId}/edit`)
    return response.data
  }

  async getActiveOrderByTable(tableId: number): Promise<Order | null> {
    console.log(`🔍 Ищем активные заказы для столика ${tableId}...`)

    try {
      // Пробуем специальный endpoint для активных заказов по столику
      console.log(`📡 Пробуем специальный endpoint: /orders/active/table/${tableId}`)
      const response = await this.api.get<Order[]>(`/orders/active/table/${tableId}`)
      console.log(`✅ Специальный endpoint вернул данные:`, response.data)
      return response.data.length > 0 ? response.data[0] : null
    } catch (error) {
      console.log(`❌ Специальный endpoint не сработал, пробуем резервный метод`)

      // Если специальный endpoint не работает, используем общий список заказов
      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as { response: { status: number } }
        if (axiosError.response.status === 404) {
          // Пробуем найти активный заказ через общий API
          try {
            console.log(`📡 Загружаем все заказы через /orders/`)
            const allOrders = await this.getOrders()
            console.log(`📋 Получено ${allOrders.length} заказов, ищем для столика ${tableId}`)

            const activeOrder = allOrders.find(order => {
              const matches = order.table_id === tableId &&
                            (order.status === 'PENDING' ||
                             order.status === 'IN_PROGRESS' ||
                             order.status === 'READY' ||
                             order.status === 'DINING')
              if (order.table_id === tableId) {
                console.log(`🔍 Заказ #${order.id} для столика ${tableId}: статус "${order.status}" (активный: ${matches})`)
              }
              return matches
            })

            if (activeOrder) {
              console.log(`✅ Найден активный заказ через резервный метод:`, activeOrder)
            } else {
              console.log(`❌ Активных заказов для столика ${tableId} не найдено через резервный метод`)
            }

            return activeOrder || null
          } catch (fallbackError) {
            console.warn('❌ Не удалось получить список всех заказов:', fallbackError)
            return null
          }
        }
      }
      throw error
    }
  }

  async addItemsToOrder(orderId: number, items: CreateOrderItemRequest[]): Promise<void> {
    const requestData: AddOrderItemsRequest = { items }
    await this.api.post(`/kitchen/orders/${orderId}/items`, requestData)
  }

  async getOrderStats(): Promise<OrderStats> {
    const response = await this.api.get<OrderStats>('/orders/stats/summary')
    return response.data
  }

  // Закрытие заказа (изменение статуса на served + paid)
  async closeOrder(orderId: number, closeData: {
    payment_method: string
    split_type?: 'none' | 'equal'
    split_persons?: number
    final_amount?: number
    discount_percent?: number
    print_receipt?: boolean
    comment?: string
  }): Promise<Order> {
    try {
      // Получаем информацию о заказе
      console.log(`Закрытие заказа ${orderId}...`)
      const orderInfo = await this.getOrder(orderId)
      console.log('Текущее состояние заказа:', {
        id: orderInfo.id,
        status: orderInfo.status,
        payment_status: orderInfo.payment_status,
        table_id: orderInfo.table_id,
        total_price: orderInfo.total_price
      })

      // Проверяем, можно ли закрыть заказ
      if (orderInfo.status === 'CANCELLED') {
        throw new Error('Нельзя закрыть отмененный заказ')
      }

      // Переводим заказ в статус "подан", если еще не подан
      if (orderInfo.status !== 'SERVED') {
        console.log(`Изменяем статус заказа ${orderId} на 'SERVED'...`)
        await this.updateOrderStatus(orderId, 'SERVED')
        console.log('✅ Статус заказа изменен на SERVED')
      }

      // Устанавливаем статус оплаты "оплачен", если еще не оплачен
      let finalOrder = orderInfo
      if (orderInfo.payment_status !== 'PAID') {
        console.log(`Изменяем статус оплаты заказа ${orderId} на 'PAID'...`)
        finalOrder = await this.updateOrderPayment(orderId, 'PAID')
        console.log('✅ Статус оплаты изменен на PAID')
      }

      // Освобождаем столик
      console.log(`Освобождаем столик ${orderInfo.table_id}...`)
      await this.updateTableStatus(orderInfo.table_id, false)
      console.log('✅ Столик освобожден')

      console.log(`🎉 Заказ ${orderId} успешно закрыт! Столик ${orderInfo.table_id} свободен. Способ оплаты: ${closeData.payment_method}`)

      return finalOrder

    } catch (error) {
      console.error(`❌ Ошибка закрытия заказа ${orderId}:`, error)
      throw error
    }
  }

  async cancelOrder(orderId: number): Promise<void> {
    await this.api.delete(`/orders/${orderId}`)
  }

  // ===================
  // СПОСОБЫ ОПЛАТЫ
  // ===================

  async getPaymentMethods(): Promise<PaymentMethodsResponse> {
    const response = await this.api.get<PaymentMethodsResponse>('/payment-methods/')
    return response.data
  }

  async getActivePaymentMethods(): Promise<PaymentMethod[]> {
    const response = await this.api.get<PaymentMethod[]>('/payment-methods/active')
    return response.data
  }

  async createPaymentMethod(paymentMethodData: CreatePaymentMethodRequest): Promise<PaymentMethod> {
    const response = await this.api.post<PaymentMethod>('/payment-methods/', paymentMethodData)
    return response.data
  }

  async getPaymentMethod(paymentMethodId: number): Promise<PaymentMethod> {
    const response = await this.api.get<PaymentMethod>(`/payment-methods/${paymentMethodId}`)
    return response.data
  }

  async updatePaymentMethod(paymentMethodId: number, paymentMethodData: UpdatePaymentMethodRequest): Promise<PaymentMethod> {
    const response = await this.api.patch<PaymentMethod>(`/payment-methods/${paymentMethodId}`, paymentMethodData)
    return response.data
  }

  async deactivatePaymentMethod(paymentMethodId: number): Promise<void> {
    await this.api.delete(`/payment-methods/${paymentMethodId}`)
  }

  // ===================
  // СИСТЕМА
  // ===================

  async getSystemHealth(): Promise<SystemHealth> {
    const response = await this.api.get<SystemHealth>('/health')
    return response.data
  }

  async getRoot(): Promise<{ message: string; version: string }> {
    const response = await this.api.get<{ message: string; version: string }>('/')
    return response.data
  }

  // ===================
  // УТИЛИТЫ
  // ===================

  isAuthenticated(): boolean {
    return !!this.getToken()
  }

  getApiUrl(): string {
    return this.baseURL
  }

  getWebSocketUrl(): string {
    return import.meta.env.VITE_WS_URL || 'ws://localhost:8000/ws'
  }

  // ===================
  // ВСПОМОГАТЕЛЬНЫЕ МЕТОДЫ
  // ===================

  // Метод для построения WebSocket URL для заказов
  getOrdersWebSocketUrl(): string {
    const wsUrl = this.getWebSocketUrl()
    return `${wsUrl}/orders`
  }

  // Метод для получения полного URL к изображению
  getImageUrl(relativePath: string): string {
    if (!relativePath) return ''
    if (relativePath.startsWith('http')) return relativePath
    return `${this.baseURL}${relativePath.startsWith('/') ? '' : '/'}${relativePath}`
  }

  // Метод для проверки прав доступа
  checkRole(requiredRoles: string[]): boolean {
    const user = this.getCurrentUserFromStorage()
    if (!user) return false

    return requiredRoles.includes(user.role)
  }

  // Метод для получения текущего пользователя из localStorage
  getCurrentUserData(): User | null {
    return this.getCurrentUserFromStorage()
  }

  // ===================
  // ЛОКАЦИИ (ЗОНЫ)
  // ===================

  async getLocations(options: { force?: boolean } = {}): Promise<Location[]> {
    return cacheService.getOrFetch(
      CACHE_KEYS.LOCATIONS,
      async () => {
        const response = await this.api.get<Location[]>('/locations/')
        return response.data
      },
      { ttl: CACHE_TTL.LONG, force: options.force }
    )
  }

  async createLocation(locationData: CreateLocationRequest): Promise<Location> {
    const response = await this.api.post<Location>('/locations/', locationData)
    return response.data
  }

  async getLocation(locationId: number): Promise<Location> {
    const response = await this.api.get<Location>(`/locations/${locationId}`)
    return response.data
  }

  async updateLocation(locationId: number, locationData: UpdateLocationRequest): Promise<Location> {
    const response = await this.api.patch<Location>(`/locations/${locationId}`, locationData)
    return response.data
  }

  async getLocationTables(locationId: number): Promise<Table[]> {
    const response = await this.api.get<Table[]>(`/locations/${locationId}/tables`)
    return response.data
  }

  async deactivateLocation(locationId: number): Promise<void> {
    await this.api.delete(`/locations/${locationId}`)
  }

  // ===================
  // КАТЕГОРИИ
  // ===================

  async getCategories(options: { force?: boolean } = {}): Promise<CategoriesResponse> {
    return cacheService.getOrFetch(
      CACHE_KEYS.CATEGORIES,
      async () => {
        const response = await this.api.get<CategoriesResponse>('/categories/')
        return response.data
      },
      { ttl: CACHE_TTL.LONG, force: options.force }
    )
  }

  async createCategory(categoryData: CreateCategoryRequest): Promise<Category> {
    const response = await this.api.post<Category>('/categories/', categoryData)
    return response.data
  }

  async getCategory(categoryId: number): Promise<Category> {
    const response = await this.api.get<Category>(`/categories/${categoryId}`)
    return response.data
  }

  async updateCategory(categoryId: number, categoryData: UpdateCategoryRequest): Promise<Category> {
    const response = await this.api.patch<Category>(`/categories/${categoryId}`, categoryData)
    return response.data
  }

  async getCategoryDishes(categoryId: number, options: { force?: boolean } = {}): Promise<DishesResponse> {
    return cacheService.getOrFetch(
      CACHE_KEYS.DISHES(categoryId),
      async () => {
        const response = await this.api.get<DishesResponse>(`/categories/${categoryId}/dishes`)
        return response.data
      },
      { ttl: CACHE_TTL.MEDIUM, force: options.force }
    )
  }

  async deactivateCategory(categoryId: number): Promise<void> {
    await this.api.delete(`/categories/${categoryId}`)
  }

  // ===================
  // ИНГРЕДИЕНТЫ
  // ===================

  async getIngredients(): Promise<Ingredient[]> {
    const response = await this.api.get<Ingredient[]>('/ingredients/')
    return response.data
  }

  async createIngredient(ingredientData: CreateIngredientRequest): Promise<Ingredient> {
    const response = await this.api.post<Ingredient>('/ingredients/', ingredientData)
    return response.data
  }

  async getIngredient(ingredientId: number): Promise<Ingredient> {
    const response = await this.api.get<Ingredient>(`/ingredients/${ingredientId}`)
    return response.data
  }

  async updateIngredient(ingredientId: number, ingredientData: UpdateIngredientRequest): Promise<Ingredient> {
    const response = await this.api.patch<Ingredient>(`/ingredients/${ingredientId}`, ingredientData)
    return response.data
  }

  async getAllergens(): Promise<AllergenInfo[]> {
    const response = await this.api.get<AllergenInfo[]>('/ingredients/allergens/list')
    return response.data
  }

  async deleteIngredient(ingredientId: number): Promise<void> {
    await this.api.delete(`/ingredients/${ingredientId}`)
  }

  // ===================
  // КЭШИРОВАНИЕ
  // ===================

  /**
   * Очистить весь кэш
   */
  clearCache(): void {
    cacheService.clear()
  }

  /**
   * Очистить устаревшие записи кэша
   */
  cleanupCache(): void {
    cacheService.cleanup()
  }

  /**
   * Получить информацию о кэше
   */
  getCacheInfo(): { keys: string[], totalSize: number } {
    return cacheService.getInfo()
  }

  /**
   * Принудительно обновить все основные данные
   */
  async refreshAllData(): Promise<void> {
    const forceOptions = { force: true }

    await Promise.all([
      this.getCategories(forceOptions),
      this.getLocations(forceOptions),
      this.getTables(forceOptions)
    ])
  }

  /**
   * Предзагрузить данные для быстрого старта приложения
   */
  async preloadData(): Promise<void> {
    try {
      // Загружаем основные данные
      const [categories, locations, tables] = await Promise.all([
        this.getCategories(),
        this.getLocations(),
        this.getTables()
      ])

      console.log('Предзагружены основные данные:', {
        categories: categories.categories.length,
        locations: locations.length,
        tables: tables.length
      })

      // Предзагружаем блюда для всех категорий с задержкой
      const activeCategories = categories.categories.filter(cat => cat.is_active)

      for (let i = 0; i < activeCategories.length; i++) {
        const category = activeCategories[i]

        // Добавляем задержку между запросами
        if (i > 0) {
          await new Promise(resolve => setTimeout(resolve, 300))
        }

        try {
          const dishes = await this.getCategoryDishes(category.id)
          console.log(`Предзагружены блюда для категории "${category.name}": ${dishes.dishes.length} блюд`)

          // Предзагружаем вариации для первых нескольких блюд каждой категории
          const firstDishes = dishes.dishes.slice(0, 3) // Только первые 3 блюда

          for (let j = 0; j < firstDishes.length; j++) {
            const dish = firstDishes[j]

            if (j > 0) {
              await new Promise(resolve => setTimeout(resolve, 100))
            }

            try {
              await this.getDishVariations(dish.id)
            } catch (error) {
              console.warn(`Ошибка предзагрузки вариаций для блюда ${dish.id}:`, error)
            }
          }
        } catch (error) {
          console.warn(`Ошибка предзагрузки блюд для категории ${category.id}:`, error)
        }
      }

      console.log('Предзагрузка данных завершена')
    } catch (error) {
      console.error('Ошибка предзагрузки данных:', error)
    }
  }
}

// Создаем единственный экземпляр
export const apiService = new ApiService()
export default apiService
