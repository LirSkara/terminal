<template>
  <div class="dashboard-view">
    <!-- Заголовок с информацией о смене -->
    <div class="dashboard-header">
      <div class="container-fluid">
        <div class="row align-items-center">
          <div class="col-md-8">
            <h1 class="dashboard-title">
              <i class="bi bi-grid-3x3-gap me-3"></i>
              Терминал официанта
            </h1>
            <p class="dashboard-subtitle">
              Смена: <span class="badge bg-success">Активна</span> •
              Время: {{ currentTime }} •
              Официант: {{ waiterName }}
            </p>
          </div>
          <div class="col-md-4 text-end">
            <div class="header-right-section">
              <!-- Статистика и кнопка создания заказа -->
              <div class="stats-and-create">
                <!-- Статистика -->
                <div class="quick-stats">
                  <div class="stat-item clickable" @click="filterTables('all')">
                    <span class="stat-number">{{ totalTables }}</span>
                    <span class="stat-label">Столиков</span>
                  </div>
                  <div class="stat-item clickable" @click="filterTables('occupied')">
                    <span class="stat-number text-primary">{{ occupiedTables }}</span>
                    <span class="stat-label">Занято</span>
                  </div>
                  <div class="stat-item clickable" @click="filterTables('ready')">
                    <span class="stat-number text-success">{{ readyOrders }}</span>
                    <span class="stat-label">Готово</span>
                  </div>
                </div>

                <!-- Кнопка создания заказа -->
                <div class="header-actions">
                  <button
                    @click="createNewOrder"
                    class="create-order-btn-large"
                    title="Создать новый заказ"
                  >
                    <i class="bi bi-plus-circle-fill me-2"></i>
                    Создать заказ
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Основная сетка столиков -->
    <div class="tables-section">
      <div class="container-fluid">
        <!-- Объединенная компактная панель управления -->
        <div class="unified-controls mb-4">
          <div class="row align-items-center">
            <!-- Левая часть: зоны и фильтры -->
            <div class="col-lg-8 col-md-7">
              <div class="controls-left">
                <!-- Компактные вкладки зон -->
                <div class="zones-compact">
                  <div v-if="isLoadingZones" class="zone-loading">
                    <i class="bi bi-arrow-clockwise spin"></i>
                    <span>Загрузка зон...</span>
                  </div>
                  <template v-else>
                    <button
                      v-for="zone in zonesWithCounts"
                      :key="zone.id"
                      @click="switchZone(zone.id)"
                      :class="['zone-tab-compact', { active: activeZone === zone.id }]"
                      :style="{ '--zone-color': zone.color, 'background-color': zone.color }"
                      :title="zone.name"
                    >
                      <div class="zone-content">
                        <span class="zone-name">{{ zone.name }}</span>
                        <span class="zone-count">Столиков {{ zone.count }}</span>
                      </div>
                    </button>
                  </template>
                </div>

                <!-- Компактные фильтры -->
                <div class="filters-compact">
                  <button
                    v-for="filter in filtersWithCounts"
                    :key="filter.key"
                    @click="activeFilter = filter.key"
                    :class="['filter-btn-compact', { active: activeFilter === filter.key }]"
                    :title="filter.label"
                  >
                    <i :class="filter.icon"></i>
                    <span class="filter-count">{{ filter.count }}</span>
                  </button>
                </div>
              </div>
            </div>

            <!-- Правая часть: быстрые действия -->
            <div class="col-lg-4 col-md-5">
              <div class="quick-actions-section">
                <button
                  @click="showAllReady"
                  :class="['quick-action-btn', 'ready', { 'pulse': readyOrders > 0 }]"
                  title="Готовые заказы"
                >
                  <i class="bi bi-bell-fill"></i>
                  <span class="badge-count" v-if="readyOrders > 0">{{ readyOrders }}</span>
                </button>

                <button
                  @click="showWaitingTables"
                  :class="['quick-action-btn', 'waiting', { 'pulse': longWaitingTables > 0 }]"
                  title="Долго ждут"
                >
                  <i class="bi bi-clock-fill"></i>
                  <span class="badge-count" v-if="longWaitingTables > 0">{{ longWaitingTables }}</span>
                </button>

                <button
                  @click="logout"
                  class="quick-action-btn logout"
                  title="Выход из терминала"
                >
                  <i class="bi bi-box-arrow-right"></i>
                  <span class="logout-text">Выход из терминала</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Сетка столиков -->
        <div class="dashboard-tables-grid" :key="`zone-${activeZone}-filter-${activeFilter}`">
          <div
            v-for="table in filteredTables"
            :key="table.id"
            @click="openTable(table)"
            :class="[
              'dashboard-table-card',
              `dashboard-table-status-${table.status}`,
              { 'dashboard-table-pulse': table.status === 'ready' }
            ]"
          >
            <div class="dashboard-table-card-inner">
              <!-- Статус индикатор -->
              <div class="dashboard-table-status-indicator">
                <i :class="getTableIcon(table.status)"></i>
              </div>

              <!-- Номер столика -->
              <div class="dashboard-table-number">
                {{ table.number }}
              </div>

              <!-- Информация о столике -->
              <div class="dashboard-table-info">
                <div class="dashboard-seats-count">
                  <i class="bi bi-people-fill"></i>
                  {{ table.seats }} мест
                </div>

                <!-- Дополнительная информация в зависимости от статуса -->
                <div class="dashboard-table-details">
                  <template v-if="table.status === 'occupied'">
                    <div class="dashboard-order-info-line">
                      <i class="bi bi-clock"></i>
                      {{ formatTime(table.orderTime) }}
                      <span class="dashboard-separator">•</span>
                      {{ table.orderAmount }}₽
                    </div>
                  </template>

                  <template v-if="table.status === 'qr-waiting'">
                    <div class="dashboard-order-info-line">
                      <i class="bi bi-clock"></i>
                      {{ formatTime(table.orderTime) }}
                      <span class="dashboard-separator">•</span>
                      {{ table.orderAmount }}₽
                    </div>
                  </template>

                  <template v-if="table.status === 'ready'">
                    <div class="dashboard-ready-indicator">
                      <i class="bi bi-check-circle-fill"></i>
                      Заказ готов!
                    </div>
                  </template>

                  <template v-if="table.status === 'cleaning'">
                    <div class="dashboard-cleaning-indicator">
                      <i class="bi bi-arrow-clockwise"></i>
                      Уборка
                    </div>
                  </template>
                </div>
              </div>

              <!-- Быстрые действия -->
              <div class="dashboard-table-actions" @click.stop>
                <button
                  v-if="table.status === 'free'"
                  @click="openTable(table)"
                  class="dashboard-action-btn dashboard-primary"
                  title="Открыть столик"
                >
                  <i class="bi bi-plus-lg"></i>
                </button>

                <button
                  v-if="table.status === 'occupied'"
                  @click="addToOrder(table)"
                  class="dashboard-action-btn dashboard-success"
                  title="Добавить к заказу"
                >
                  <i class="bi bi-plus"></i>
                </button>

                <button
                  v-if="table.status === 'occupied'"
                  @click="viewOrder(table)"
                  class="dashboard-action-btn dashboard-view-order"
                  title="Посмотреть заказ"
                >
                  <i class="bi bi-eye"></i>
                </button>

                <button
                  v-if="table.status === 'qr-waiting'"
                  @click="confirmQrOrder(table)"
                  class="dashboard-action-btn dashboard-qr-confirm"
                  title="Подтвердить QR заказ"
                >
                  <i class="bi bi-check-lg"></i>
                </button>

                <button
                  v-if="table.status === 'qr-waiting'"
                  @click="viewQrOrder(table)"
                  class="dashboard-action-btn dashboard-qr-view"
                  title="Посмотреть заказ"
                >
                  <i class="bi bi-eye"></i>
                </button>

                <button
                  v-if="table.status === 'ready'"
                  @click="serveOrder(table)"
                  class="dashboard-action-btn dashboard-ready"
                  title="Подать заказ"
                >
                  <i class="bi bi-check"></i>
                </button>

                <button
                  v-if="table.status === 'occupied' || table.status === 'qr-waiting'"
                  @click="printBill(table)"
                  class="dashboard-action-btn dashboard-print-bill"
                  title="Счет"
                >
                  <i class="bi bi-receipt"></i>
                </button>

                <button
                  v-if="table.status === 'cleaning'"
                  @click="closeTable(table)"
                  class="dashboard-action-btn dashboard-finish-cleaning"
                  title="Закрыть столик"
                >
                  <i class="bi bi-check2-all"></i>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Модальное окно заказа -->
    <Teleport to="body">
      <div
        v-if="showOrderModal"
        class="order-modal-backdrop"
        @click="closeOrderModal"
      >
        <div class="order-modal" @click.stop>
          <div class="order-modal-header">
            <h3 class="order-modal-title">
              <i class="bi bi-receipt me-2"></i>
              Заказ столика {{ selectedOrder?.tableNumber }}
            </h3>
            <button @click="closeOrderModal" class="order-modal-close">
              <i class="bi bi-x-lg"></i>
            </button>
          </div>

          <div class="order-modal-body" v-if="selectedOrder">
            <!-- Позиции заказа -->
            <div class="order-items-section">
              <h4 class="order-section-title">
                <i class="bi bi-list-ul me-2"></i>
                Позиции заказа
              </h4>
              <div class="order-items-list">
                <div
                  v-for="item in selectedOrder.items"
                  :key="item.id"
                  class="order-item"
                >
                  <div class="order-item-info">
                    <div class="order-item-name">{{ item.name }}</div>
                    <div class="order-item-category">{{ item.category }}</div>
                    <div v-if="item.notes" class="order-item-notes">
                      <i class="bi bi-chat-text me-1"></i>
                      {{ item.notes }}
                    </div>
                  </div>
                  <div class="order-item-quantity">{{ item.quantity }}x</div>
                  <div class="order-item-price">{{ item.price * item.quantity }}₽</div>
                </div>
              </div>
            </div>

            <!-- Комментарии к заказу -->
            <div v-if="selectedOrder.notes" class="order-notes-section">
              <h4 class="order-section-title">
                <i class="bi bi-chat-square-text me-2"></i>
                Комментарии к заказу
              </h4>
              <div class="order-notes">{{ selectedOrder.notes }}</div>
            </div>
          </div>          <div class="order-modal-footer">
            <div class="order-modal-actions">
              <!-- Итого слева -->
              <div class="order-total-text">
                Итого: {{ selectedOrder?.total }}₽
              </div>

              <!-- Кнопка печати справа -->
              <button
                @click="printOrderBill"
                class="qres-btn qres-btn-outline order-print-btn"
              >
                <i class="bi bi-printer me-2"></i>
                Печать счета
              </button>
            </div>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useNotificationStore } from '@/stores/notifications'
import { useRouter } from 'vue-router'
import { apiService } from '@/services/api'
import { cacheService } from '@/services/cache'
import type { Location } from '@/types/api'

// Типы
interface Table {
  id: number
  number: number
  seats: number
  location_id: number
  description?: string
  is_active: boolean
  is_occupied: boolean
  qr_code: string
  current_order_id?: number | null
  created_at: string
  updated_at: string
  // Дополнительные поля для UI
  status: 'free' | 'occupied' | 'ready' | 'cleaning' | 'qr-waiting'
  orderTime: Date | null
  orderAmount: number
  hasQrOrder?: boolean
  zone: string
}

// Интерфейс для ответа API при получении локаций
interface LocationsResponse {
  locations: Location[]
  total: number
}

interface OrderItem {
  id: number
  name: string
  price: number
  quantity: number
  category: string
  notes?: string
}

interface Order {
  id: number
  tableNumber: string | number
  items: OrderItem[]
  total: number
  status: 'active' | 'ready' | 'served' | 'cancelled'
  orderTime: Date
  waiterName: string
  notes?: string
}

interface Zone {
  id: string
  name: string
  color: string
  count?: number
}

// Auth store
const authStore = useAuthStore()

// Notification store
const notificationStore = useNotificationStore()

// Router
const router = useRouter()

// Реактивные данные
const currentTime = ref('')
const activeFilter = ref('all')
const activeZone = ref('all')
const isLoadingZones = ref(false)
const isLoadingTables = ref(false)

// Модальное окно заказа
const showOrderModal = ref(false)
const selectedOrder = ref<Order | null>(null)

// Зоны ресторана
const zones = ref<Zone[]>([
  { id: 'all', name: 'Все зоны', color: '#6c757d' }
])

// Столики ресторана (загружаются из API)
const tables = ref<Table[]>([])

// Функция для проверки актуальности кэша
const checkIfCacheNeedsUpdate = () => {
  try {
    // Проверяем, есть ли основные данные в кэше
    const locationsCache = cacheService.get('locations')
    const tablesCache = cacheService.get('tables')

    if (!locationsCache || !tablesCache) {
      console.log('Кэш зон или столиков отсутствует')
      return true
    }

    // Проверяем время последнего обновления
    const cacheInfo = cacheService.get('_dashboard_cache_timestamp')
    if (cacheInfo) {
      const lastUpdate = new Date(cacheInfo as string)
      const now = new Date()
      const minutesSinceUpdate = (now.getTime() - lastUpdate.getTime()) / (1000 * 60)

      // Обновляем кэш если прошло больше 30 минут
      if (minutesSinceUpdate > 30) {
        console.log(`Кэш дашборда устарел: ${minutesSinceUpdate.toFixed(1)} минут назад`)
        return true
      }
    }

    console.log('Кэш дашборда актуален')
    return false

  } catch (error) {
    console.warn('Ошибка проверки кэша дашборда:', error)
    return true // При ошибке лучше обновить
  }
}

// Функция для восстановления данных из кэша
const restoreFromCache = () => {
  console.log('Восстанавливаем данные дашборда из кэша...')

  try {
    // Восстанавливаем зоны
    const locationsCache = cacheService.get('locations') as { locations: Location[] } | null
    if (locationsCache && locationsCache.locations) {
      const activeLocations = locationsCache.locations
        .filter(location => location.is_active)
        .sort((a, b) => a.name.localeCompare(b.name))

      const apiZones = activeLocations.map(mapLocationToZone)
      zones.value = [
        { id: 'all', name: 'Все зоны', color: '#6c757d' },
        ...apiZones
      ]

      console.log(`Восстановлено ${apiZones.length} зон из кэша`)
    }

    // Восстанавливаем столики
    const tablesCache = cacheService.get('tables') as { tables: (import('@/types/api').Table & { current_order_id?: number | null })[] } | null
    if (tablesCache && tablesCache.tables && zones.value.length > 1) {
      // Получаем активные зоны для фильтрации
      const activeLocationIds = zones.value
        .filter(zone => zone.id !== 'all')
        .map(zone => parseInt(zone.id))

      const activeTables = tablesCache.tables.filter(table =>
        table.is_active && activeLocationIds.includes(table.location_id)
      )

      // Создаем список локаций для маппинга
      const locationsForMapping = zones.value
        .filter(zone => zone.id !== 'all')
        .map(zone => ({
          id: parseInt(zone.id),
          name: zone.name,
          color: zone.color,
          is_active: true
        })) as Location[]

      const uiTables = activeTables.map(table => mapApiTableToTable(table, locationsForMapping))
      tables.value = uiTables

      console.log(`Восстановлено ${uiTables.length} столиков из кэша`)
    }

  } catch (error) {
    console.warn('Ошибка восстановления данных дашборда из кэша:', error)
  }
}

// Функция для преобразования API Location в Zone
const mapLocationToZone = (location: Location): Zone => {
  return {
    id: location.id.toString(),
    name: location.name,
    color: location.color || '#6c757d'
  }
}

// Функция для преобразования API Table в UI Table
const mapApiTableToTable = (apiTable: import('@/types/api').Table & { current_order_id?: number | null, created_at?: string, updated_at?: string }, locations: Location[]): Table => {
  const location = locations.find(loc => loc.id === apiTable.location_id)

  // Определяем статус на основе API данных
  let status: Table['status'] = 'free'

  // Если столик занят И есть активный заказ, то он занят
  if (apiTable.is_occupied && apiTable.current_order_id) {
    status = 'occupied'
  }
  // Если столик занят, но нет активного заказа, возможно он на уборке
  else if (apiTable.is_occupied && !apiTable.current_order_id) {
    status = 'cleaning'
  }
  // Если есть заказ, но столик не помечен как занятый, это может быть QR заказ
  else if (!apiTable.is_occupied && apiTable.current_order_id) {
    status = 'qr-waiting'
  }
  // Иначе столик свободен
  else {
    status = 'free'
  }

  return {
    id: apiTable.id,
    number: apiTable.number,
    seats: apiTable.seats,
    location_id: apiTable.location_id,
    description: apiTable.description,
    is_active: apiTable.is_active,
    is_occupied: apiTable.is_occupied,
    qr_code: apiTable.qr_code,
    current_order_id: apiTable.current_order_id || null,
    created_at: apiTable.created_at || new Date().toISOString(),
    updated_at: apiTable.updated_at || new Date().toISOString(),
    status,
    orderTime: apiTable.current_order_id ? new Date() : null, // Временно, пока не загружаем заказы
    orderAmount: 0, // Временно, пока не загружаем заказы
    zone: location?.id.toString() || 'unknown'
  }
}

// Функция загрузки столиков
const loadTables = async () => {
  try {
    isLoadingTables.value = true
    console.log('Загрузка столиков через API...')

    const [tablesResponse, locationsResponse] = await Promise.all([
      apiService.getTables(),
      apiService.getLocations()
    ])

    console.log('Получены столики:', tablesResponse)
    console.log('Получены локации для столиков:', locationsResponse)

    // Обрабатываем ответ локаций
    let locationsArray: Location[]
    if (Array.isArray(locationsResponse)) {
      locationsArray = locationsResponse
    } else if (locationsResponse && typeof locationsResponse === 'object' && 'locations' in locationsResponse) {
      locationsArray = (locationsResponse as LocationsResponse).locations || []
    } else {
      locationsArray = []
    }

    // Обрабатываем ответ столиков
    let tablesArray: (import('@/types/api').Table & { current_order_id?: number | null, created_at?: string, updated_at?: string })[]
    if (Array.isArray(tablesResponse)) {
      tablesArray = tablesResponse
    } else if (tablesResponse && typeof tablesResponse === 'object' && 'tables' in tablesResponse) {
      tablesArray = (tablesResponse as { tables: typeof tablesArray }).tables || []
    } else {
      tablesArray = []
    }

    // Кэшируем данные столиков
    cacheService.set('tables', { tables: tablesArray }, { ttl: 30 * 60 * 1000 }) // 30 минут

    // Получаем только активные локации для фильтрации
    const activeLocationIds = locationsArray
      .filter(location => location.is_active)
      .map(location => location.id)

    // Фильтруем только активные столики из активных зон
    const activeTables = tablesArray.filter(table =>
      table.is_active && activeLocationIds.includes(table.location_id)
    )

    console.log(`Отфильтровано ${activeTables.length} активных столиков из активных зон из ${tablesArray.length} общих столиков`)

    // Преобразуем в UI формат
    const uiTables = activeTables.map(table => mapApiTableToTable(table, locationsArray))

    // Устанавливаем столики
    tables.value = uiTables

    console.log('Столики загружены:', tables.value)

    // Показываем уведомление об успешной загрузке
    if (uiTables.length > 0) {
      notificationStore.addNotification({
        type: 'success',
        title: 'Столики загружены',
        message: `Загружено ${uiTables.length} столиков`,
        read: false,
        sound: false
      })
    }
  } catch (error) {
    handleApiError(error, 'загрузки столиков')

    // В случае ошибки оставляем пустой массив
    tables.value = []
  } finally {
    isLoadingTables.value = false
  }
}

// Функция загрузки зон
const loadZones = async () => {
  try {
    isLoadingZones.value = true
    console.log('Загрузка зон через API...')

    const response = await apiService.getLocations()
    console.log('Получены локации:', response)

    // API может возвращать либо массив Location[], либо объект {locations: Location[], total: number}
    let locationsArray: Location[]
    if (Array.isArray(response)) {
      locationsArray = response
    } else if (response && typeof response === 'object' && 'locations' in response) {
      locationsArray = (response as LocationsResponse).locations || []
    } else {
      locationsArray = []
    }

    // Кэшируем данные локаций
    cacheService.set('locations', { locations: locationsArray }, { ttl: 30 * 60 * 1000 }) // 30 минут

    // Фильтруем только активные локации
    const filteredLocations = locationsArray
      .filter((location: Location) => location.is_active)
      // Сортируем по имени для стабильного порядка
      .sort((a, b) => a.name.localeCompare(b.name))

    console.log(`Отфильтровано ${filteredLocations.length} активных зон из ${locationsArray.length}`)

    // Преобразуем в Zone
    const apiZones = filteredLocations.map(mapLocationToZone)

    // Устанавливаем зоны из API (всегда начинаем с "Все зоны")
    zones.value = [
      { id: 'all', name: 'Все зоны', color: '#6c757d' },
      ...apiZones
    ]

    console.log('Зоны загружены:', zones.value)

    // Показываем уведомление об успешной загрузке
    if (apiZones.length > 0) {
      notificationStore.addNotification({
        type: 'success',
        title: 'Зоны загружены',
        message: `Загружено ${apiZones.length} зон ресторана`,
        read: false,
        sound: false
      })
    }
  } catch (error) {
    handleApiError(error, 'загрузки зон')

    // В случае ошибки оставляем только "Все зоны"
    zones.value = [
      { id: 'all', name: 'Все зоны', color: '#6c757d' }
    ]
  } finally {
    isLoadingZones.value = false
  }
}

// Функция загрузки данных о заказах для столиков
const loadOrdersData = async () => {
  try {
    console.log('Загрузка данных о заказах...')

    // Получаем все столики с активными заказами
    const tablesWithOrders = tables.value.filter(table => table.current_order_id)

    if (tablesWithOrders.length === 0) {
      console.log('Нет столиков с активными заказами')
      return
    }

    // TODO: Пока комментируем загрузку заказов, так как нужно проверить API типы
    // Загружаем данные о заказах
    /*
    const orderPromises = tablesWithOrders.map(async (table) => {
      try {
        const order = await apiService.getOrder(table.current_order_id!)
        return { table, order }
      } catch (error) {
        console.warn(`Ошибка загрузки заказа ${table.current_order_id} для столика ${table.number}:`, error)
        return { table, order: null }
      }
    })

    const ordersData = await Promise.all(orderPromises)

    // Обновляем информацию о столиках
    ordersData.forEach(({ table, order }) => {
      if (order) {
        // Обновляем время заказа
        if (order.created_at) {
          table.orderTime = new Date(order.created_at)
        }

        // Обновляем сумму заказа
        if (order.total) {
          table.orderAmount = order.total
        }

        // Обновляем статус на основе статуса заказа
        if (order.status === 'ready') {
          table.status = 'ready'
        }
      }
    })
    */

    console.log('Данные о заказах загружены и применены к столикам')

  } catch (error) {
    console.error('Ошибка загрузки данных о заказах:', error)
  }
}

// Функция для полной загрузки данных дашборда
const loadAllDashboardData = async () => {
  console.log('Полная загрузка данных дашборда...')

  try {
    // Загружаем зоны и столики
    await Promise.all([
      loadZones(),
      loadTables()
    ])

    // Загружаем данные о заказах для столиков
    await loadOrdersData()

    // Сохраняем timestamp успешной загрузки (дольше чем данные, чтобы не истек раньше)
    cacheService.set('_dashboard_cache_timestamp', new Date().toISOString(), { ttl: 60 * 60 * 1000 }) // 60 минут

    console.log('Полная загрузка данных дашборда завершена')

  } catch (error) {
    console.error('Ошибка полной загрузки данных дашборда:', error)
  }
}

// Функция для отладки зон (показывает подробную информацию)
const debugZones = () => {
  console.group('🔍 Информация о зонах')
  console.log('Всего зон:', zones.value.length)
  console.log('Активная зона:', activeZone.value)

  zones.value.forEach((zone, index) => {
    console.log(`${index + 1}. ${zone.name} (ID: ${zone.id})`)
    console.log(`   Цвет: ${zone.color}`)
    if (zone.count !== undefined) {
      console.log(`   Столиков: ${zone.count}`)
    }
  })

  console.groupEnd()
}

// Функция для отладки столиков (показывает подробную информацию)
const debugTables = () => {
  console.group('🔍 Информация о столиках')
  console.log('Всего столиков:', tables.value.length)

  tables.value.forEach((table, index) => {
    console.log(`${index + 1}. Столик ${table.number} (ID: ${table.id})`)
    console.log(`   Зона: ${table.zone} (location_id: ${table.location_id})`)
    console.log(`   Статус: ${table.status}`)
    console.log(`   Мест: ${table.seats}`)
    console.log(`   Занят: ${table.is_occupied}`)
  })

  console.groupEnd()
}

// Интерфейс для отладочных функций
interface DashboardDebug {
  getCacheInfo: () => void
  clearCache: () => void
  forceReload: () => void
  restoreFromCache: () => void
}

// Добавляем debugZones в window для отладки из консоли браузера
if (typeof window !== 'undefined') {
  (window as unknown as Window & {
    debugZones: () => void
    debugTables: () => void
    qresDashDebug: DashboardDebug
  }).debugZones = debugZones;

  (window as unknown as Window & {
    debugZones: () => void
    debugTables: () => void
    qresDashDebug: DashboardDebug
  }).debugTables = debugTables

  // Добавляем отладочные функции для кэша дашборда
  ;(window as unknown as Window & {
    debugZones: () => void
    debugTables: () => void
    qresDashDebug: DashboardDebug
  }).qresDashDebug = {
    getCacheInfo: () => {
      const locationsCache = cacheService.get('locations')
      const tablesCache = cacheService.get('tables')
      const timestamp = cacheService.get('_dashboard_cache_timestamp')

      console.log('Кэш дашборда:', {
        locations: locationsCache ? 'Есть' : 'Отсутствует',
        tables: tablesCache ? 'Есть' : 'Отсутствует',
        timestamp: timestamp || 'Отсутствует',
        zonesInMemory: zones.value.length,
        tablesInMemory: tables.value.length
      })
    },
    clearCache: () => {
      cacheService.remove('locations')
      cacheService.remove('tables')
      cacheService.remove('_dashboard_cache_timestamp')
      console.log('Кэш дашборда очищен')
    },
    forceReload: () => {
      loadAllDashboardData().then(() => {
        console.log('Принудительная перезагрузка данных дашборда завершена')
      })
    },
    restoreFromCache: () => {
      restoreFromCache()
      console.log('Данные восстановлены из кэша')
    }
  }

  console.log('Dashboard Debug доступен в window.qresDashDebug')
}

// Обработчик ошибок API
const handleApiError = (error: unknown, context: string) => {
  console.error(`Ошибка ${context}:`, error)

  let errorMessage = 'Произошла неизвестная ошибка'

  if (error && typeof error === 'object' && 'response' in error) {
    // Ошибка от сервера
    const axiosError = error as { response: { status: number; data?: { message?: string } } }
    errorMessage = axiosError.response.data?.message || `Ошибка сервера: ${axiosError.response.status}`
  } else if (error && typeof error === 'object' && 'request' in error) {
    // Ошибка сети
    errorMessage = 'Ошибка сети. Проверьте подключение к интернету'
  } else if (error instanceof Error) {
    // Другие ошибки
    errorMessage = error.message || 'Произошла неизвестная ошибка'
  }

  notificationStore.addNotification({
    type: 'error',
    title: `Ошибка ${context}`,
    message: errorMessage,
    read: false,
    sound: true
  })
}

// Имя официанта из store
const waiterName = computed(() => {
  return authStore.user?.full_name || authStore.user?.username || 'Не определен'
})

// Стабильные счетчики для зон (без зависимости от активного фильтра)
const zonesWithCounts = computed(() => {
  return zones.value.map(zone => ({
    ...zone,
    count: zone.id === 'all'
      ? tables.value.length
      : tables.value.filter(t => t.zone === zone.id).length
  }))
})

// Функция для проверки долго ждущих столиков
const isLongWaiting = (table: Table) => {
  if (table.status === 'occupied' && table.orderTime) {
    const now = new Date()
    const diffMs = now.getTime() - table.orderTime.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    return diffMins > 45
  }
  return false
}

// Стабильные счетчики для фильтров (только для текущей зоны, без зависимости от активного фильтра)
const filtersWithCounts = computed(() => {
  const currentZoneTables = activeZone.value === 'all'
    ? tables.value
    : tables.value.filter(t => t.zone === activeZone.value)

  return [
    { key: 'all', label: 'Все', icon: 'bi-grid-3x3', count: currentZoneTables.length },
    { key: 'long-waiting', label: 'Долго ждущие', icon: 'bi-clock-history', count: currentZoneTables.filter(t => isLongWaiting(t)).length },
    { key: 'free', label: 'Свободные', icon: 'bi-check-circle', count: currentZoneTables.filter(t => t.status === 'free').length },
    { key: 'occupied', label: 'Занятые', icon: 'bi-people-fill', count: currentZoneTables.filter(t => t.status === 'occupied').length },
    { key: 'qr-waiting', label: 'QR заказы', icon: 'bi-qr-code-scan', count: currentZoneTables.filter(t => t.status === 'qr-waiting').length },
    { key: 'ready', label: 'Готовые', icon: 'bi-bell-fill', count: currentZoneTables.filter(t => t.status === 'ready').length },
    { key: 'cleaning', label: 'Уборка', icon: 'bi-arrow-clockwise', count: currentZoneTables.filter(t => t.status === 'cleaning').length }
  ]
})

// Вычисляемые свойства для статистики
const totalTables = computed(() => zoneStats.value.total)
const occupiedTables = computed(() => zoneStats.value.occupied)
const readyOrders = computed(() => zoneStats.value.ready)
const longWaitingTables = computed(() => {
  const now = new Date()
  return tables.value.filter(t => {
    if (t.status === 'occupied' && t.orderTime) {
      const diffMs = now.getTime() - t.orderTime.getTime()
      const diffMins = Math.floor(diffMs / 60000)
      return diffMins > 45 // Считаем долго ждущими, если заказ оформлен более 45 минут назад
    }
    return false
  }).length
})

// Фильтрованные столики
const filteredTables = computed(() => {
  let filtered = tables.value

  // Фильтр по зоне
  if (activeZone.value !== 'all') {
    filtered = filtered.filter(table => table.zone === activeZone.value)
  }

  // Фильтр по статусу
  if (activeFilter.value !== 'all') {
    if (activeFilter.value === 'long-waiting') {
      filtered = filtered.filter(table => isLongWaiting(table))
    } else {
      filtered = filtered.filter(table => table.status === activeFilter.value)
    }
  }

  return filtered
})

// Статистика по текущей зоне
const zoneStats = computed(() => {
  const currentZoneTables = activeZone.value === 'all'
    ? tables.value
    : tables.value.filter(t => t.zone === activeZone.value)

  return {
    total: currentZoneTables.length,
    free: currentZoneTables.filter(t => t.status === 'free').length,
    occupied: currentZoneTables.filter(t => t.status === 'occupied').length,
    qrWaiting: currentZoneTables.filter(t => t.status === 'qr-waiting').length,
    ready: currentZoneTables.filter(t => t.status === 'ready').length,
    cleaning: currentZoneTables.filter(t => t.status === 'cleaning').length
  }
})

// Методы
const updateTime = () => {
  const now = new Date()
  currentTime.value = now.toLocaleTimeString('ru-RU', {
    hour: '2-digit',
    minute: '2-digit'
  })
}

const formatTime = (date: Date | null) => {
  if (!date) return ''
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)

  if (diffMins < 60) {
    return `${diffMins}м`
  }

  const diffHours = Math.floor(diffMins / 60)
  const remainingMins = diffMins % 60
  return remainingMins > 0 ? `${diffHours}ч ${remainingMins}м` : `${diffHours}ч`
}

const getTableIcon = (status: string) => {
  const icons = {
    free: 'bi-check-circle-fill',
    occupied: 'bi-people-fill',
    ready: 'bi-bell-fill',
    cleaning: 'bi-arrow-clockwise',
    'qr-waiting': 'bi-qr-code-scan'
  }
  return icons[status as keyof typeof icons] || 'bi-question-circle'
}

const openTable = (table: Table) => {
  console.log('Открыть столик:', table.number)
  // Перенаправляем на страницу создания заказа с номером столика
  router.push({
    path: '/create-order',
    query: { table: table.number }
  })
}

const addToOrder = (table: Table) => {
  console.log('Добавить к заказу столика:', table.number)
  // Перенаправляем на страницу создания заказа с номером столика
  router.push({
    path: '/create-order',
    query: { table: table.number }
  })
}

const serveOrder = (table: Table) => {
  console.log('Подать заказ столика:', table.number)
  // Здесь будет логика подачи заказа
  table.status = 'cleaning'
  playNotificationSound()
}

const confirmQrOrder = (table: Table) => {
  console.log('Подтвердить QR заказ столика:', table.number)
  // Здесь будет логика подтверждения QR заказа
  table.status = 'occupied'
  playNotificationSound()
}

const viewQrOrder = (table: Table) => {
  console.log('Посмотреть QR заказ столика:', table.number)
  // Создаем демо-данные QR заказа
  selectedOrder.value = {
    id: table.id,
    tableNumber: table.number,
    items: [
      { id: 1, name: 'Пицца Маргарита', price: 680, quantity: 1, category: 'Пицца', notes: 'Заказ через QR-код' },
      { id: 2, name: 'Капучино', price: 180, quantity: 2, category: 'Напитки' }
    ],
    total: table.orderAmount,
    status: 'active',
    orderTime: table.orderTime || new Date(),
    waiterName: waiterName.value,
    notes: 'QR заказ. Требует подтверждения официанта'
  }
  showOrderModal.value = true
}

const viewOrder = (table: Table) => {
  console.log('Посмотреть заказ столика:', table.number)
  // Создаем демо-данные заказа
  selectedOrder.value = {
    id: table.id,
    tableNumber: table.number,
    items: [
      { id: 1, name: 'Борщ украинский', price: 350, quantity: 2, category: 'Первые блюда', notes: 'Без сметаны' },
      { id: 2, name: 'Котлета по-киевски', price: 450, quantity: 1, category: 'Основные блюда' },
      { id: 3, name: 'Салат Цезарь', price: 280, quantity: 1, category: 'Салаты', notes: 'Соус отдельно' },
      { id: 4, name: 'Чай черный', price: 120, quantity: 2, category: 'Напитки' }
    ],
    total: table.orderAmount,
    status: table.status === 'ready' ? 'ready' : 'active',
    orderTime: table.orderTime || new Date(),
    waiterName: waiterName.value,
    notes: 'Столик у окна, гости просили быстрее'
  }
  showOrderModal.value = true
}

const closeOrderModal = () => {
  showOrderModal.value = false
  selectedOrder.value = null
}

const printOrderBill = () => {
  if (selectedOrder.value) {
    console.log('Печать счета для заказа столика:', selectedOrder.value.tableNumber)
    // Здесь будет логика печати счета
  }
}

const printBill = (table: Table) => {
  console.log('Печать счета для столика:', table.number)
  // Здесь будет логика печати счета
}

const closeTable = (table: Table) => {
  console.log('Закрыть столик:', table.number)
  // Здесь будет логика закрытия столика
  table.status = 'free'
  table.orderTime = null
  table.orderAmount = 0
}

const createNewOrder = () => {
  router.push({ path: '/create-order' })
}

const filterTables = (status: string) => {
  activeFilter.value = status
  console.log('Фильтр по статусу:', status)
}

const switchZone = (zoneId: string) => {
  activeZone.value = zoneId
  console.log('Переключение на зону:', zoneId)
}

const showAllReady = () => {
  activeFilter.value = 'ready'
  console.log('Показать все готовые заказы')
  // Эмуляция звукового уведомления
  playNotificationSound()
}

const showWaitingTables = () => {
  activeFilter.value = 'long-waiting'
  console.log('Показать долго жддущие столики')
  // Фильтруем столики, которые долго ждут
  const now = new Date()
  const waitingTables = tables.value.filter(t => {
    if (t.status === 'occupied' && t.orderTime) {
      const diffMs = now.getTime() - t.orderTime.getTime()
      const diffMins = Math.floor(diffMs / 60000)
      return diffMins > 45
    }
    return false
  })

  if (waitingTables.length > 0) {
    // Показываем уведомление о долго ждущих столиках
    console.log('Столики, которые долго ждут:', waitingTables.map(t => t.number).join(', '))
  }
}

const playNotificationSound = () => {
  // Эмуляция звукового уведомления
  console.log('🔔 Звуковое уведомление!')
}

const logout = async () => {
  console.log('Выход из системы')
  try {
    // Сначала выходим из системы
    await authStore.logout()
    console.log('Logout completed, redirecting to login')
  } catch (error) {
    console.error('Ошибка при выходе:', error)
  } finally {
    // В любом случае перенаправляем на логин с заменой текущей записи в истории
    await router.replace({ name: 'login' })
    // Принудительная перезагрузка страницы если роутер не сработал
    if (router.currentRoute.value.name !== 'login') {
      window.location.href = '/login'
    }
  }
}

// Таймер для обновления времени
let timeInterval: number

onMounted(async () => {
  updateTime()
  timeInterval = setInterval(updateTime, 1000) as unknown as number

  // Сначала восстанавливаем данные из кэша для быстрого отображения
  restoreFromCache()

  // Проверяем актуальность кэша и загружаем только при необходимости
  const shouldUpdateCache = checkIfCacheNeedsUpdate()

  if (shouldUpdateCache) {
    console.log('Кэш дашборда устарел или отсутствует, загружаем данные...')
    await loadAllDashboardData()
  } else {
    console.log('Кэш дашборда актуален, загрузка с сервера не требуется')
  }

  // Загружаем данные о заказах
  await loadOrdersData()

  // Показываем отладочную информацию о зонах в режиме разработки
  if (import.meta.env.DEV) {
    debugZones()
    debugTables()
  }

  console.log('Dashboard загружен')
})

onUnmounted(() => {
  if (timeInterval) {
    clearInterval(timeInterval)
  }
})

// Автопереключение на "Все" при отсутствии столиков
watch(filteredTables, (newTables) => {
  // Если в текущей выборке нет столиков и мы не на "Все"
  if (newTables.length === 0) {
    // Если активен фильтр по статусу (не "all"), переключаем на "all"
    if (activeFilter.value !== 'all') {
      activeFilter.value = 'all'
      console.log('Автопереключение фильтра на "Все" - нет столиков в текущем фильтре')
    }
    // Если активна зона (не "all") и фильтр уже "all", переключаем зону на "all"
    else if (activeZone.value !== 'all' && activeFilter.value === 'all') {
      activeZone.value = 'all'
      console.log('Автопереключение зоны на "Все зоны" - нет столиков в текущей зоне')
    }
  }
}, { immediate: false })
</script>

<style scoped lang="scss">
@use '@/styles/views/dashboard';
</style>
