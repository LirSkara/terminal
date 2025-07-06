// Утилиты для форматирования данных

/**
 * Форматирует цену в рублях
 */
export function formatPrice(price: number): string {
  return new Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency: 'RUB',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  }).format(price)
}

/**
 * Форматирует дату и время
 */
export function formatDateTime(dateString: string): string {
  const date = new Date(dateString)
  return new Intl.DateTimeFormat('ru-RU', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date)
}

/**
 * Форматирует только время
 */
export function formatTime(dateString: string): string {
  const date = new Date(dateString)
  return new Intl.DateTimeFormat('ru-RU', {
    hour: '2-digit',
    minute: '2-digit'
  }).format(date)
}

/**
 * Форматирует только дату
 */
export function formatDate(dateString: string): string {
  const date = new Date(dateString)
  return new Intl.DateTimeFormat('ru-RU', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).format(date)
}

/**
 * Относительное время (например, "5 минут назад")
 */
export function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMinutes = Math.floor(diffMs / (1000 * 60))
  const diffHours = Math.floor(diffMinutes / 60)
  const diffDays = Math.floor(diffHours / 24)

  if (diffMinutes < 1) {
    return 'только что'
  } else if (diffMinutes < 60) {
    return `${diffMinutes} мин. назад`
  } else if (diffHours < 24) {
    return `${diffHours} ч. назад`
  } else {
    return `${diffDays} дн. назад`
  }
}

/**
 * Форматирует время приготовления
 */
export function formatCookingTime(minutes: number): string {
  if (minutes < 60) {
    return `${minutes} мин.`
  } else {
    const hours = Math.floor(minutes / 60)
    const remainingMinutes = minutes % 60
    return remainingMinutes > 0
      ? `${hours} ч. ${remainingMinutes} мин.`
      : `${hours} ч.`
  }
}

/**
 * Форматирует вес
 */
export function formatWeight(grams: number): string {
  if (grams >= 1000) {
    const kg = grams / 1000
    return `${kg.toFixed(kg % 1 === 0 ? 0 : 1)} кг`
  }
  return `${grams} г`
}

/**
 * Форматирует калории
 */
export function formatCalories(calories: number): string {
  return `${calories.toLocaleString('ru-RU')} ккал`
}

/**
 * Форматирует номер телефона
 */
export function formatPhone(phone: string): string {
  // Убираем все кроме цифр
  const numbers = phone.replace(/\D/g, '')

  // Российский номер
  if (numbers.length === 11 && numbers.startsWith('7')) {
    return `+7 (${numbers.slice(1, 4)}) ${numbers.slice(4, 7)}-${numbers.slice(7, 9)}-${numbers.slice(9, 11)}`
  }

  // Если не российский или некорректный, возвращаем как есть
  return phone
}

/**
 * Усекает текст до указанной длины
 */
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) {
    return text
  }
  return text.slice(0, maxLength - 3) + '...'
}

/**
 * Форматирует PIN-код для отображения
 */
export function formatPinDisplay(pin: string): string {
  return pin.split('').map(() => '•').join('')
}

/**
 * Генерирует случайный ID
 */
export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2)
}

/**
 * Проверяет, является ли строка валидным PIN-кодом
 */
export function isValidPin(pin: string): boolean {
  return /^\d{4,6}$/.test(pin)
}

/**
 * Безопасное парсинг JSON
 */
export function safeJsonParse<T>(jsonString: string, defaultValue: T): T {
  try {
    return JSON.parse(jsonString)
  } catch {
    return defaultValue
  }
}

/**
 * Задержка выполнения
 */
export function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

/**
 * Debounce функция
 */
export function debounce<T extends (...args: never[]) => unknown>(
  func: T,
  wait: number
): T {
  let timeout: number | null = null

  return ((...args: Parameters<T>) => {
    const later = () => {
      timeout = null
      func(...args)
    }

    if (timeout) {
      clearTimeout(timeout)
    }
    timeout = setTimeout(later, wait)
  }) as T
}

/**
 * Проверяет, является ли устройство планшетом
 */
export function isTablet(): boolean {
  return window.innerWidth >= 768 && window.innerWidth < 1024
}

/**
 * Проверяет, является ли устройство мобильным
 */
export function isMobile(): boolean {
  return window.innerWidth < 768
}

/**
 * Получает размер экрана согласно Bootstrap breakpoints
 */
export function getScreenSize(): 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'xxl' {
  const width = window.innerWidth

  if (width >= 1400) return 'xxl'
  if (width >= 1200) return 'xl'
  if (width >= 992) return 'lg'
  if (width >= 768) return 'md'
  if (width >= 576) return 'sm'
  return 'xs'
}

/**
 * Копирует текст в буфер обмена
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    // Fallback для старых браузеров
    const textArea = document.createElement('textarea')
    textArea.value = text
    textArea.style.position = 'fixed'
    textArea.style.opacity = '0'
    document.body.appendChild(textArea)
    textArea.focus()
    textArea.select()

    try {
      document.execCommand('copy')
      document.body.removeChild(textArea)
      return true
    } catch {
      document.body.removeChild(textArea)
      return false
    }
  }
}

/**
 * Извлекает сообщение об ошибке из различных типов ошибок
 */
export function extractErrorMessage(error: unknown, defaultMessage = 'Произошла ошибка'): string {
  if (error instanceof Error) {
    return error.message
  }

  // Проверяем на axios ошибку
  if (typeof error === 'object' && error !== null && 'response' in error) {
    const axiosError = error as { response?: { data?: { message?: string; detail?: string } } }
    return axiosError.response?.data?.message || axiosError.response?.data?.detail || defaultMessage
  }

  // Если это строка
  if (typeof error === 'string') {
    return error
  }

  return defaultMessage
}
