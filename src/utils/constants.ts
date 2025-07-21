import type { ColorScheme, TableStatus, OrderStatus, PaymentStatus } from '@/types'

// Цветовая схема согласно ТЗ
export const colors: ColorScheme = {
  primary: '#3498db',      // синий
  success: '#27ae60',      // зеленый
  warning: '#f39c12',      // оранжевый
  danger: '#e74c3c',       // красный
  background: '#ecf0f1',   // светло-серый
  free: '#95a5a6',         // серый
  occupied: '#3498db',     // синий
  ready: '#27ae60',        // зеленый
  attention: '#f39c12',    // оранжевый
  inactive: '#bdc3c7'      // светло-серый
}

// Маппинг статусов столиков к цветам
export const tableStatusColors: Record<TableStatus, string> = {
  free: colors.free,
  occupied: colors.occupied,
  ready: colors.ready,
  attention: colors.attention,
  inactive: colors.inactive
}

// Названия статусов заказов
export const orderStatusNames: Record<OrderStatus, string> = {
  PENDING: 'Ожидает подтверждения',
  IN_PROGRESS: 'Готовится',
  READY: 'Готов к подаче',
  SERVED: 'Подан клиенту',
  DINING: 'Доедают',
  COMPLETED: 'Завершен',
  CANCELLED: 'Отменен'
}

// Названия статусов оплаты
export const paymentStatusNames: Record<PaymentStatus, string> = {
  UNPAID: 'Не оплачен',
  PAID: 'Оплачен',
  REFUNDED: 'Возвращен'
}

// Цвета для статусов заказов
export const orderStatusColors: Record<OrderStatus, string> = {
  PENDING: colors.warning,
  IN_PROGRESS: colors.primary,
  READY: colors.success,
  SERVED: colors.free,
  DINING: colors.background,
  COMPLETED: colors.free,
  CANCELLED: colors.danger
}

// Цвета для статусов оплаты
export const paymentStatusColors: Record<PaymentStatus, string> = {
  UNPAID: colors.danger,
  PAID: colors.success,
  REFUNDED: colors.warning
}

// Breakpoints для адаптивности
export const breakpoints = {
  xs: 0,
  sm: 576,
  md: 768,
  lg: 992,
  xl: 1200,
  xxl: 1400
} as const

// Настройки приложения
export const appConfig = {
  name: 'QRes Waiter Terminal',
  version: '1.0.0',
  apiTimeout: 10000,
  wsReconnectAttempts: 5,
  wsReconnectInterval: 5000,
  notificationDuration: 5000,
  autoRefreshInterval: 30000,
  pinCodeLength: {
    min: 4,
    max: 6
  }
} as const

// Звуковые файлы
export const soundFiles = {
  notification: '/sounds/notification.mp3',
  message: '/sounds/message.mp3',
  error: '/sounds/error.mp3'
} as const

// Иконки Bootstrap Icons
export const icons = {
  // Общие
  loading: 'bi-arrow-repeat',
  success: 'bi-check-circle-fill',
  error: 'bi-exclamation-triangle-fill',
  warning: 'bi-exclamation-circle-fill',
  info: 'bi-info-circle-fill',

  // Навигация
  home: 'bi-house-fill',
  back: 'bi-arrow-left',
  close: 'bi-x-lg',
  menu: 'bi-list',

  // Пользователь
  user: 'bi-person-fill',
  logout: 'bi-box-arrow-right',
  login: 'bi-box-arrow-in-right',

  // Столики
  table: 'bi-table',
  qrCode: 'bi-qr-code',

  // Заказы
  order: 'bi-receipt',
  cart: 'bi-cart-fill',
  plus: 'bi-plus-lg',
  minus: 'bi-dash-lg',

  // Еда
  dish: 'bi-egg-fried',
  category: 'bi-collection-fill',

  // Оплата
  payment: 'bi-credit-card-fill',
  cash: 'bi-currency-dollar',

  // Статусы
  pending: 'bi-clock-fill',
  confirmed: 'bi-check-lg',
  inProgress: 'bi-gear-fill',
  ready: 'bi-bell-fill',
  served: 'bi-check2-all',
  cancelled: 'bi-x-circle-fill',

  // Уведомления
  notification: 'bi-bell-fill',
  sound: 'bi-volume-up-fill',

  // Редактирование
  edit: 'bi-pencil-fill',
  delete: 'bi-trash-fill',
  save: 'bi-check-lg',

  // Прочее
  search: 'bi-search',
  filter: 'bi-filter',
  calendar: 'bi-calendar-fill',
  time: 'bi-clock-fill',
  weight: 'bi-speedometer2',
  calories: 'bi-fire'
} as const

// Константы для localStorage
export const storageKeys = {
  token: 'qres_token',
  user: 'qres_user',
  theme: 'qres_theme',
  settings: 'qres_settings'
} as const

// Время в миллисекундах
export const timeConstants = {
  second: 1000,
  minute: 60 * 1000,
  hour: 60 * 60 * 1000,
  day: 24 * 60 * 60 * 1000
} as const
