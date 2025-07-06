// ==========================================
// QRes OS 4 - API Types and Interfaces
// ==========================================
// Все типы данных из API сервера в одном месте

// === АУТЕНТИФИКАЦИЯ ===

export interface AuthResponse {
  access_token: string
  token_type: string
  expires_in: number
}

export interface User {
  id: number
  username: string
  full_name: string
  role: 'waiter' | 'admin' | 'kitchen'
  is_active: boolean
  shift_active: boolean
  phone?: string
  pin_code?: string
}

// === ЛОКАЦИИ И СТОЛИКИ ===

export interface Location {
  id: number
  name: string
  description: string
  color: string
  is_active: boolean
}

// Для обратной совместимости
export type Zone = Location

export interface Table {
  id: number
  number: number
  seats: number
  location_id: number
  description?: string
  is_active: boolean
  is_occupied: boolean
  qr_code: string
  location: {
    name: string
    color: string
  }
}

// === МЕНЮ ===

export interface Category {
  id: number
  name: string
  description: string
  image_url?: string
  sort_order: number
  is_active: boolean
}

export interface Dish {
  id: number
  name: string
  description: string
  category_id: number
  main_image_url?: string
  cooking_time: number
  weight: number
  calories: number
  ingredients: string[]
  sort_order: number
  is_available: boolean
  is_popular: boolean
}

export interface DishVariation {
  id: number
  dish_id: number
  name: string
  description: string
  price: number
  weight: number
  calories: number
  image_url?: string
  sku: string
  is_available: boolean
  is_default: boolean
  sort_order: number
}

// Полное меню с вложенными данными
export interface MenuResponse {
  categories: Category[]
  dishes: Dish[]
  variations: Record<number, DishVariation[]> // dish_id -> variations
}

// === ЗАКАЗЫ ===

export interface OrderItem {
  id?: number
  dish_id: number
  dish_variation_id: number
  quantity: number
  unit_price: number
  total_price: number
  comment?: string
  status: OrderItemStatus
  dish_name: string
  variation_name: string
}

export interface Order {
  id: number
  table_id: number
  waiter_id: number
  status: OrderStatus
  payment_status: PaymentStatus
  order_type: OrderType
  total_price: number
  notes?: string
  kitchen_notes?: string
  created_at: string
  table_number: number
  waiter_name: string
  items: OrderItem[]
}

// === СТАТУСЫ ===

export type OrderStatus =
  | 'pending'      // Ожидает подтверждения
  | 'confirmed'    // Подтвержден кухней
  | 'in_progress'  // Готовится
  | 'ready'        // Готов к подаче
  | 'served'       // Подан клиенту
  | 'cancelled'    // Отменен

export type PaymentStatus =
  | 'unpaid'       // Не оплачен
  | 'paid'         // Оплачен
  | 'partial'      // Частично оплачен

export type OrderType =
  | 'dine_in'      // В зале
  | 'takeaway'     // На вынос

export type OrderItemStatus =
  | 'pending'
  | 'confirmed'
  | 'in_progress'
  | 'ready'
  | 'served'
  | 'cancelled'

export type TableStatus =
  | 'free'         // Свободный
  | 'occupied'     // Занят
  | 'ready'        // Заказ готов
  | 'attention'    // Требует внимания
  | 'inactive'     // Неактивный

// === СПОСОБЫ ОПЛАТЫ ===

export interface PaymentMethod {
  id: number
  name: string
  is_active: boolean
}

// === WEBSOCKET СОБЫТИЯ ===

export interface WebSocketMessage<T = unknown> {
  type: string
  order_id?: number
  item_id?: number
  data: T
}

export interface OrderCreatedEvent extends WebSocketMessage<Order> {
  type: 'order_created'
  order_id: number
  data: Order
}

export interface OrderStatusChangedEvent extends WebSocketMessage<{
  old_status: OrderStatus
  new_status: OrderStatus
  message: string
}> {
  type: 'order_status_changed'
  order_id: number
  data: {
    old_status: OrderStatus
    new_status: OrderStatus
    message: string
  }
}

export interface ItemStatusChangedEvent extends WebSocketMessage<{
  status: OrderItemStatus
  dish_name: string
}> {
  type: 'item_status_changed'
  order_id: number
  item_id: number
  data: {
    status: OrderItemStatus
    dish_name: string
  }
}

// === API ЗАПРОСЫ ===

export interface CreateOrderRequest {
  table_id: number
  order_type: OrderType
  items: CreateOrderItemRequest[]
  notes?: string
}

export interface CreateOrderItemRequest {
  dish_id: number
  dish_variation_id: number
  quantity: number
  comment?: string
}

export interface UpdateOrderStatusRequest {
  status: OrderStatus
}

export interface UpdatePaymentStatusRequest {
  payment_status: PaymentStatus
}

export interface UpdateTableStatusRequest {
  is_occupied: boolean
}

// === API ОТВЕТЫ ===

export interface ApiResponse<T> {
  data: T
  message?: string
  status: 'success' | 'error'
}

export interface PaginatedResponse<T> {
  items: T[]
  total: number
  page: number
  size: number
  pages: number
}

export interface HealthResponse {
  status: string
  version: string
  database: string
  uptime: number
}

export interface WaitersResponse {
  users: User[]
}

// === ОШИБКИ ===

export interface ApiError {
  detail: string
  status_code: number
}

export interface ValidationError {
  loc: (string | number)[]
  msg: string
  type: string
}

export interface ValidationErrorResponse {
  detail: ValidationError[]
}

// === КОНСТАНТЫ ===

export const ORDER_STATUSES: Record<OrderStatus, string> = {
  pending: 'Ожидает подтверждения',
  confirmed: 'Подтвержден кухней',
  in_progress: 'Готовится',
  ready: 'Готов к подаче',
  served: 'Подан клиенту',
  cancelled: 'Отменен'
}

export const PAYMENT_STATUSES: Record<PaymentStatus, string> = {
  unpaid: 'Не оплачен',
  paid: 'Оплачен',
  partial: 'Частично оплачен'
}

export const ORDER_TYPES: Record<OrderType, string> = {
  dine_in: 'В зале',
  takeaway: 'На вынос'
}

export const TABLE_STATUSES: Record<TableStatus, { label: string; color: string }> = {
  free: { label: 'Свободный', color: '#95a5a6' },
  occupied: { label: 'Занят', color: '#3498db' },
  ready: { label: 'Заказ готов', color: '#27ae60' },
  attention: { label: 'Требует внимания', color: '#f39c12' },
  inactive: { label: 'Неактивный', color: '#bdc3c7' }
}

// === УТИЛИТАРНЫЕ ТИПЫ ===

// Тип для создания нового заказа (без id и серверных полей)
export type CreateOrderData = Omit<Order, 'id' | 'waiter_id' | 'created_at' | 'waiter_name' | 'table_number' | 'items'> & {
  items: CreateOrderItemRequest[]
}

// Тип для обновления заказа
export type UpdateOrderData = Partial<Pick<Order, 'status' | 'payment_status' | 'notes' | 'kitchen_notes'>>

// Тип для фильтрации столиков
export type TableFilter = 'all' | 'free' | 'occupied' | 'ready' | 'attention'

// Тип для сортировки
export type SortDirection = 'asc' | 'desc'

export interface SortOptions {
  field: string
  direction: SortDirection
}

// === ФОРМЫ ===

export interface LoginForm {
  username: string
  password: string
}

export interface PinLoginForm {
  username: string
  pin_code: string
}

export interface OrderFilters {
  status?: OrderStatus
  payment_status?: PaymentStatus
  table_id?: number
  date_from?: string
  date_to?: string
}

// === НАСТРОЙКИ ПРИЛОЖЕНИЯ ===

export interface AppConfig {
  api_base_url: string
  ws_url: string
  app_name: string
  version: string
  sounds_enabled: boolean
  notification_timeout: number
}

// === УВЕДОМЛЕНИЯ ===

export interface NotificationMessage {
  id: string
  type: 'info' | 'success' | 'warning' | 'error'
  title: string
  message: string
  timestamp: string
  read: boolean
  sound?: boolean
}

export type NotificationType =
  | 'info'
  | 'success'
  | 'warning'
  | 'error'

// === ИНГРЕДИЕНТЫ ===

export interface Ingredient {
  id: number
  name: string
  description?: string
  is_allergen: boolean
  allergen_type?: string
  is_active: boolean
}

export interface AllergenInfo {
  id: number
  name: string
  description?: string
}

// === СТАТИСТИКА ===

export interface OrderStats {
  total_orders: number
  total_revenue: number
  average_order_value: number
  orders_by_status: Record<OrderStatus, number>
  orders_by_payment_status: Record<PaymentStatus, number>
  popular_dishes: Array<{
    dish_id: number
    dish_name: string
    total_quantity: number
    total_revenue: number
  }>
}

export interface SystemHealth {
  status: string
  version: string
  database: string
  uptime: number
  active_connections: number
  memory_usage: number
}

// === ДОПОЛНИТЕЛЬНЫЕ ЗАПРОСЫ ===

export interface CreateUserRequest {
  username: string
  full_name: string
  password: string
  role: 'waiter' | 'admin' | 'kitchen'
  phone?: string
  pin_code?: string
}

export interface UpdateUserRequest {
  full_name?: string
  role?: 'waiter' | 'admin' | 'kitchen'
  phone?: string
  pin_code?: string
  is_active?: boolean
  shift_active?: boolean
}

export interface ChangePasswordRequest {
  new_password: string
}

export interface CreateTableRequest {
  number: number
  seats: number
  location_id: number
  description?: string
}

export interface UpdateTableRequest {
  number?: number
  seats?: number
  location_id?: number
  description?: string
  is_active?: boolean
}

export interface CreateLocationRequest {
  name: string
  description: string
  color: string
}

export interface UpdateLocationRequest {
  name?: string
  description?: string
  color?: string
  is_active?: boolean
}

export interface CreateCategoryRequest {
  name: string
  description: string
  image_url?: string
  sort_order: number
}

export interface UpdateCategoryRequest {
  name?: string
  description?: string
  image_url?: string
  sort_order?: number
  is_active?: boolean
}

export interface CreateDishRequest {
  name: string
  description: string
  category_id: number
  main_image_url?: string
  cooking_time: number
  weight: number
  calories: number
  ingredients: number[]
  sort_order: number
  is_popular?: boolean
}

export interface UpdateDishRequest {
  name?: string
  description?: string
  category_id?: number
  main_image_url?: string
  cooking_time?: number
  weight?: number
  calories?: number
  ingredients?: number[]
  sort_order?: number
  is_popular?: boolean
  is_available?: boolean
}

export interface CreateDishVariationRequest {
  name: string
  description: string
  price: number
  weight: number
  calories: number
  image_url?: string
  sku: string
  is_default?: boolean
  sort_order: number
}

export interface UpdateDishVariationRequest {
  name?: string
  description?: string
  price?: number
  weight?: number
  calories?: number
  image_url?: string
  sku?: string
  is_default?: boolean
  sort_order?: number
  is_available?: boolean
}

export interface CreateIngredientRequest {
  name: string
  description?: string
  is_allergen: boolean
  allergen_type?: string
}

export interface UpdateIngredientRequest {
  name?: string
  description?: string
  is_allergen?: boolean
  allergen_type?: string
  is_active?: boolean
}

export interface CreatePaymentMethodRequest {
  name: string
  is_active?: boolean
}

export interface UpdatePaymentMethodRequest {
  name?: string
  is_active?: boolean
}

// === ОБНОВЛЕННЫЕ ИНТЕРФЕЙСЫ ===
