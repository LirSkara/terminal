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
  PaymentMethod
} from '@/types'

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
        if (error.response?.status === 401) {
          this.clearToken()
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

  // ===================
  // СТОЛИКИ
  // ===================

  async getTables(): Promise<Table[]> {
    const response = await this.api.get<Table[]>('/tables/')
    return response.data
  }

  async getTable(tableId: number): Promise<Table> {
    const response = await this.api.get<Table>(`/tables/${tableId}`)
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

  // ===================
  // МЕНЮ
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

  async getDishVariations(dishId: number): Promise<DishVariation[]> {
    const response = await this.api.get<DishVariation[]>(`/dishes/${dishId}/variations/`)
    return response.data
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

  async deleteOrderItem(orderId: number, itemId: number): Promise<void> {
    await this.api.delete(`/orders/${orderId}/items/${itemId}`)
  }

  // ===================
  // ОПЛАТА
  // ===================

  async getPaymentMethods(): Promise<PaymentMethod[]> {
    const response = await this.api.get<PaymentMethod[]>('/payment-methods/active')
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
}

// Создаем единственный экземпляр
export const apiService = new ApiService()
export default apiService
