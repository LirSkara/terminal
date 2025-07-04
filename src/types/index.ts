// Типы для API QRes OS 4
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

export interface AuthResponse {
  access_token: string
  token_type: string
  expires_in: number
}

export interface Zone {
  id: number
  name: string
  description: string
  color: string
  is_active: boolean
}

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

export interface PaymentMethod {
  id: number
  name: string
  is_active: boolean
}

export interface WSMessage {
  type: 'order_created' | 'order_status_changed' | 'item_status_changed'
  order_id: number
  item_id?: number
  data: any
}

export interface CreateOrderRequest {
  table_id: number
  order_type: OrderType
  items: {
    dish_id: number
    dish_variation_id: number
    quantity: number
    comment?: string
  }[]
  notes?: string
}

export interface NotificationMessage {
  id: string
  type: 'info' | 'success' | 'warning' | 'error'
  title: string
  message: string
  timestamp: string
  read: boolean
  sound?: boolean
}

// Утилитарные типы
export interface ApiResponse<T> {
  data: T
  message?: string
}

export interface ApiError {
  message: string
  details?: any
}

export interface PaginatedResponse<T> {
  items: T[]
  total: number
  page: number
  size: number
  pages: number
}

// Цветовая схема
export interface ColorScheme {
  primary: string      // #3498db
  success: string      // #27ae60
  warning: string      // #f39c12
  danger: string       // #e74c3c
  background: string   // #ecf0f1
  free: string         // #95a5a6
  occupied: string     // #3498db
  ready: string        // #27ae60
  attention: string    // #f39c12
  inactive: string     // #bdc3c7
}

// Статусы столиков
export type TableStatus = 'free' | 'occupied' | 'ready' | 'attention' | 'inactive'
