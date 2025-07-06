// Централизованный экспорт всех типов
// Основные типы API импортируются из api.ts
export * from './api'

// Дополнительные утилитарные типы специфичные для UI
export interface PaginatedResponse<T> {
  items: T[]
  total: number
  page: number
  size: number
  pages: number
}

// Цветовая схема для UI
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

// Статусы столиков для UI
export type TableStatus = 'free' | 'occupied' | 'ready' | 'attention' | 'inactive'
