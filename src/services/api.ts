import axios, { type AxiosInstance, type AxiosResponse } from 'axios'
import type {
  AuthResponse,
  User,
  Table,
  Order,
  CreateOrderRequest,
  Dish,
  Category,
  DishVariation,
  PaymentMethod,
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
  UpdatePaymentMethodRequest
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

  async getTables(): Promise<Table[]> {
    const response = await this.api.get<Table[]>('/tables/')
    return response.data
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
  async getDishVariations(dishId: number): Promise<DishVariation[]> {
    const response = await this.api.get<DishVariation[]>(`/dishes/${dishId}/variations/`)
    return response.data
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

  async createOrder(orderData: CreateOrderRequest): Promise<Order> {
    const response = await this.api.post<Order>('/orders/', orderData)
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

  async updateOrderItem(orderId: number, itemId: number, data: {
    quantity?: number
    comment?: string
  }): Promise<void> {
    await this.api.patch(`/orders/${orderId}/items/${itemId}`, data)
  }

  async updateOrderItemStatus(orderId: number, itemId: number, status: string): Promise<void> {
    await this.api.patch(`/orders/${orderId}/items/${itemId}/status`, { status })
  }

  async deleteOrderItem(orderId: number, itemId: number): Promise<void> {
    await this.api.delete(`/orders/${orderId}/items/${itemId}`)
  }

  async getOrderStats(): Promise<OrderStats> {
    const response = await this.api.get<OrderStats>('/orders/stats/summary')
    return response.data
  }

  async cancelOrder(orderId: number): Promise<void> {
    await this.api.delete(`/orders/${orderId}`)
  }

  // ===================
  // СПОСОБЫ ОПЛАТЫ
  // ===================

  async getPaymentMethods(): Promise<PaymentMethod[]> {
    const response = await this.api.get<PaymentMethod[]>('/payment-methods/')
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

  async getLocations(): Promise<Location[]> {
    const response = await this.api.get<Location[]>('/locations/')
    return response.data
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

  async getCategories(): Promise<Category[]> {
    const response = await this.api.get<Category[]>('/categories/')
    return response.data
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

  async getCategoryDishes(categoryId: number): Promise<Dish[]> {
    const response = await this.api.get<Dish[]>(`/categories/${categoryId}/dishes`)
    return response.data
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
}

// Создаем единственный экземпляр
export const apiService = new ApiService()
export default apiService
