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
  image_url?: string | null
  icon?: string | null // Иконка категории (например, 'bi-egg-fried')
  color?: string | null // Цвет категории (hex, rgb или имя цвета)
  sort_order: number
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface Dish {
  id: number
  name: string
  description: string
  category_id: number
  main_image_url?: string | null
  cooking_time?: number | null
  weight?: number | null
  calories?: number | null
  ingredients?: string[] | null
  sort_order: number
  is_available: boolean
  is_popular: boolean
  code?: string | null
  created_at: string
  updated_at: string
}

export interface DishVariation {
  id: number
  dish_id: number
  name: string
  description?: string | null
  price: string | number // Цена приходит как строка, но лучше поддерживать оба типа
  weight?: number | null
  calories?: number | null
  image_url?: string | null
  sku: string
  is_available: boolean
  is_default: boolean
  sort_order: number
  created_at: string
  updated_at: string
}

// Полное меню с вложенными данными
export interface MenuResponse {
  categories: Category[]
  dishes: Dish[]
  variations: Record<number, DishVariation[]> // dish_id -> variations
}

// Ответы API с пагинацией
export interface CategoriesResponse {
  categories: Category[]
  total: number
}

export interface DishesResponse {
  dishes: Dish[]
  total: number
  category?: Category
}

export interface DishVariationsResponse {
  variations: DishVariation[]
  total: number
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
  // Новые поля для кухонной системы
  department?: KitchenDepartment
  preparation_started_at?: string
  ready_at?: string
  served_at?: string
  estimated_preparation_time?: number
  actual_preparation_time?: number
  can_be_modified?: boolean
  can_be_cancelled?: boolean
}

// === КУХОННЫЕ ЦЕХИ ===

export type KitchenDepartment =
  | 'bar'           // Бар (напитки)
  | 'cold_kitchen'  // Холодный цех (салаты, закуски)
  | 'hot_kitchen'   // Горячий цех (основные блюда)
  | 'dessert'       // Кондитерский цех
  | 'grill'         // Гриль
  | 'bakery'        // Выпечка

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
  | 'pending'      // Ожидает
  | 'in_progress'  // В процессе
  | 'ready'        // Готов
  | 'served'       // Подан
  | 'cancelled'    // Отменен

export type PaymentStatus =
  | 'unpaid'       // Не оплачен
  | 'paid'         // Оплачен
  | 'refunded'     // Возвращен

export type OrderType =
  | 'dine_in'      // В зале
  | 'takeaway'     // На вынос
  | 'delivery'     // Доставка

export type OrderItemStatus =
  | 'in_preparation'    // Готовится (статус по умолчанию при создании, сразу видно на кухне)
  | 'ready'             // Готова к подаче (повар подтверждает готовность)
  | 'served'            // Подана клиенту (официант подтверждает выдачу)
  | 'cancelled'         // Отменена

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

export interface PaymentMethodsResponse {
  payment_methods: PaymentMethod[]
  total: number
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
  notes?: string
  kitchen_notes?: string
  items: CreateOrderItemRequest[]
}

export interface CreateOrderItemRequest {
  dish_id: number
  dish_variation_id?: number  // Сделаем опциональным согласно документации
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

// === РЕДАКТИРОВАНИЕ ЗАКАЗОВ ===

export interface AddOrderItemsRequest {
  items: CreateOrderItemRequest[]
}

export interface EditableOrderResponse {
  order: Order & {
    can_be_modified: boolean
    items: (OrderItem & {
      can_be_modified: boolean
      can_be_cancelled: boolean
    })[]
  }
}

export interface UpdateOrderItemRequest {
  quantity?: number
  comment?: string
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
  pending: 'Ожидает',
  in_progress: 'В процессе',
  ready: 'Готов',
  served: 'Подан',
  cancelled: 'Отменен'
}

export const PAYMENT_STATUSES: Record<PaymentStatus, string> = {
  unpaid: 'Не оплачен',
  paid: 'Оплачен',
  refunded: 'Возвращен'
}

export const ORDER_TYPES: Record<OrderType, string> = {
  dine_in: 'В зале',
  takeaway: 'На вынос',
  delivery: 'Доставка'
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
  description?: string | null
  price: string | number // Поддерживаем оба типа
  weight?: number | null
  calories?: number | null
  image_url?: string | null
  sku: string
  is_default?: boolean
  sort_order: number
}

export interface UpdateDishVariationRequest {
  name?: string
  description?: string | null
  price?: string | number
  weight?: number | null
  calories?: number | null
  image_url?: string | null
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

// Подробная информация о заказе с позициями из API
export interface OrderWithDetails {
  // Основная информация заказа
  id: number
  table_id: number
  waiter_id: number
  order_type: OrderType
  notes?: string
  kitchen_notes?: string

  // Статусы и цены
  status: OrderStatus
  payment_status: PaymentStatus
  total_price: string        // Decimal в виде строки

  // Временные метки
  created_at: string         // ISO datetime
  updated_at: string         // ISO datetime
  served_at?: string         // ISO datetime (если заказ подан)
  cancelled_at?: string      // ISO datetime (если отменен)
  time_to_serve?: number     // Время подачи в минутах

  // Дополнительная информация
  table_number: number       // Номер столика
  waiter_name: string        // Полное имя официанта

  // Позиции заказа с деталями
  items: OrderItemWithDish[]
}

// Позиция заказа с информацией о блюде
export interface OrderItemWithDish {
  // Основная информация позиции
  id: number
  order_id: number
  dish_id: number
  dish_variation_id?: number
  quantity: number
  price: string              // Цена за единицу (Decimal)
  total: string              // Общая стоимость (Decimal)
  comment?: string
  status: OrderItemStatus
  created_at: string         // ISO datetime
  updated_at: string         // ISO datetime

  // Информация о блюде
  dish_name: string          // Название блюда
  dish_image_url?: string    // URL изображения блюда
  dish_cooking_time?: number // Время приготовления в минутах
}
