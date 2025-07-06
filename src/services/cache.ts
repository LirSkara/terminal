// ==========================================
// QRes OS 4 - Cache Service
// ==========================================
// Централизованное кэширование данных API

interface CacheItem<T> {
  data: T
  timestamp: number
  ttl: number // время жизни в миллисекундах
}

interface CacheOptions {
  ttl?: number // время жизни в миллисекундах (по умолчанию 5 минут)
  force?: boolean // принудительно обновить кэш
}

class CacheService {
  private readonly defaultTTL = 5 * 60 * 1000 // 5 минут
  private readonly keyPrefix = 'qres_cache_'

  /**
   * Получить данные из кэша
   */
  get<T>(key: string): T | null {
    try {
      const cacheKey = this.keyPrefix + key
      const cached = localStorage.getItem(cacheKey)

      if (!cached) {
        return null
      }

      const cacheItem: CacheItem<T> = JSON.parse(cached)
      const now = Date.now()

      // Проверяем, не истек ли срок действия кэша
      if (now - cacheItem.timestamp > cacheItem.ttl) {
        this.remove(key)
        return null
      }

      return cacheItem.data
    } catch (error) {
      console.warn(`Ошибка чтения кэша для ключа ${key}:`, error)
      this.remove(key)
      return null
    }
  }

  /**
   * Сохранить данные в кэш
   */
  set<T>(key: string, data: T, options: CacheOptions = {}): void {
    try {
      const cacheKey = this.keyPrefix + key
      const ttl = options.ttl || this.defaultTTL

      const cacheItem: CacheItem<T> = {
        data,
        timestamp: Date.now(),
        ttl
      }

      localStorage.setItem(cacheKey, JSON.stringify(cacheItem))
    } catch (error) {
      console.warn(`Ошибка записи в кэш для ключа ${key}:`, error)
      // Если localStorage заполнен, очищаем старые данные
      this.cleanup()
      try {
        localStorage.setItem(this.keyPrefix + key, JSON.stringify({
          data,
          timestamp: Date.now(),
          ttl: options.ttl || this.defaultTTL
        }))
      } catch (retryError) {
        console.error(`Критическая ошибка записи в кэш для ключа ${key}:`, retryError)
      }
    }
  }

  /**
   * Удалить данные из кэша
   */
  remove(key: string): void {
    try {
      const cacheKey = this.keyPrefix + key
      localStorage.removeItem(cacheKey)
    } catch (error) {
      console.warn(`Ошибка удаления из кэша для ключа ${key}:`, error)
    }
  }

  /**
   * Проверить, есть ли валидные данные в кэше
   */
  has(key: string): boolean {
    return this.get(key) !== null
  }

  /**
   * Очистить весь кэш приложения
   */
  clear(): void {
    try {
      const keys = Object.keys(localStorage)
      keys.forEach(key => {
        if (key.startsWith(this.keyPrefix)) {
          localStorage.removeItem(key)
        }
      })
    } catch (error) {
      console.warn('Ошибка очистки кэша:', error)
    }
  }

  /**
   * Очистить устаревшие записи кэша
   */
  cleanup(): void {
    try {
      const keys = Object.keys(localStorage)
      const now = Date.now()

      keys.forEach(key => {
        if (key.startsWith(this.keyPrefix)) {
          try {
            const cached = localStorage.getItem(key)
            if (cached) {
              const cacheItem: CacheItem<unknown> = JSON.parse(cached)
              if (now - cacheItem.timestamp > cacheItem.ttl) {
                localStorage.removeItem(key)
              }
            }
          } catch {
            // Если не можем парсить, удаляем
            localStorage.removeItem(key)
          }
        }
      })
    } catch (error) {
      console.warn('Ошибка очистки устаревшего кэша:', error)
    }
  }

  /**
   * Получить или загрузить данные с кэшированием
   */
  async getOrFetch<T>(
    key: string,
    fetchFn: () => Promise<T>,
    options: CacheOptions = {}
  ): Promise<T> {
    // Если принудительное обновление не требуется, проверяем кэш
    if (!options.force) {
      const cached = this.get<T>(key)
      if (cached !== null) {
        console.log(`Данные для ${key} загружены из кэша`)
        return cached
      }
    }

    // Загружаем данные из API
    console.log(`Загрузка данных для ${key} из API...`)
    const data = await fetchFn()

    // Сохраняем в кэш
    this.set(key, data, options)

    return data
  }

  /**
   * Получить информацию о кэше
   */
  getInfo(): { keys: string[], totalSize: number } {
    const keys: string[] = []
    let totalSize = 0

    try {
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith(this.keyPrefix)) {
          keys.push(key.replace(this.keyPrefix, ''))
          const item = localStorage.getItem(key)
          if (item) {
            totalSize += item.length
          }
        }
      })
    } catch (error) {
      console.warn('Ошибка получения информации о кэше:', error)
    }

    return { keys, totalSize }
  }
}

// Создаем singleton экземпляр
export const cacheService = new CacheService()

// Очищаем устаревшие данные при инициализации
cacheService.cleanup()

// Определяем ключи кэша для различных типов данных
export const CACHE_KEYS = {
  CATEGORIES: 'categories',
  LOCATIONS: 'locations',
  TABLES: 'tables',
  DISHES: (categoryId: number) => `dishes_category_${categoryId}`,
  DISH_VARIATIONS: (dishId: number) => `dish_variations_${dishId}`,
  PAYMENT_METHODS: 'payment_methods',
  MENU_FULL: 'menu_full'
} as const

// TTL константы (в миллисекундах)
export const CACHE_TTL = {
  SHORT: 2 * 60 * 1000,      // 2 минуты
  MEDIUM: 5 * 60 * 1000,     // 5 минут
  LONG: 15 * 60 * 1000,      // 15 минут
  VERY_LONG: 60 * 60 * 1000  // 1 час
} as const
