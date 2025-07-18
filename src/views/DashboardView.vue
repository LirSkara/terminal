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
                <div class="dashboard-zone-name">
                  {{ getZoneName(table.zone) }}
                </div>
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

                  <template v-if="table.status === 'dining'">
                    <div class="dashboard-dining-indicator">
                      <i class="bi bi-cup-hot"></i>
                      Доедают
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
                  class="dashboard-action-btn dashboard-primary"
                  title="Добавить к заказу"
                >
                  <i class="bi bi-plus"></i>
                </button>

                <button
                  v-if="table.status === 'dining'"
                  @click="addToOrder(table)"
                  class="dashboard-action-btn dashboard-primary"
                  title="Дополнительный заказ"
                >
                  <i class="bi bi-plus"></i>
                </button>

                <button
                  v-if="table.status === 'occupied'"
                  @click="viewOrder(table)"
                  class="dashboard-action-btn dashboard-warning"
                  title="Посмотреть заказ"
                >
                  <i class="bi bi-receipt"></i>
                </button>

                <button
                  v-if="table.status === 'dining'"
                  @click="viewOrder(table)"
                  class="dashboard-action-btn dashboard-warning"
                  title="Посмотреть заказ"
                >
                  <i class="bi bi-receipt"></i>
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
                  class="dashboard-action-btn dashboard-warning"
                  title="Посмотреть заказ"
                >
                  <i class="bi bi-receipt"></i>
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
                  v-if="table.status === 'occupied' || table.status === 'qr-waiting' || table.status === 'dining'"
                  @click="openCloseOrderModal(table)"
                  class="dashboard-action-btn dashboard-success"
                  title="Закрыть счет"
                >
                  <i class="bi bi-check-circle"></i>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Модальное окно закрытия заказа -->
    <CloseOrderModal
      :is-visible="showCloseOrderModal"
      :order-data="closeOrderData"
      :payment-methods="paymentMethods"
      @close="closeCloseOrderModal"
      @print-precheck="printPrecheckOnly"
      @update-discount="onUpdateDiscount"
      @process-closure="onProcessOrderClosure"
    />

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
                    <div class="order-item-unit-price">{{ item.unitPrice }}₽ за шт.</div>
                    <div v-if="item.notes" class="order-item-notes">
                      <i class="bi bi-chat-text me-1"></i>
                      {{ item.notes }}
                    </div>
                  </div>
                  <div class="order-item-quantity">{{ item.quantity }}x</div>
                  <div class="order-item-price">{{ item.totalPrice }}₽</div>
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

              <!-- Кнопка закрытия справа -->
              <button
                @click="closeOrderModal"
                class="qres-btn qres-btn-outline order-close-btn"
              >
                <i class="bi bi-x-lg me-2"></i>
                Закрыть
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
import CloseOrderModal from '@/components/modals/CloseOrderModal.vue'
import type { Location, Order as ApiOrder, OrderItem as ApiOrderItem } from '@/types/api'

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
  status: 'free' | 'occupied' | 'ready' | 'dining' | 'qr-waiting'
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
  unitPrice: number  // Цена за единицу
  totalPrice: number // Общая стоимость позиции
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

// Модальное окно закрытия заказа
const showCloseOrderModal = ref(false)
const closeOrderData = ref<{
  tableNumber: string | number
  items: OrderItem[]
  originalAmount: number
  finalAmount: number
  discount: number
  orderId: number
} | null>(null)

// Способы оплаты (загружаются из API)
const paymentMethods = ref<{ id: string; name: string; icon: string; isActive: boolean }[]>([])

// Загрузка способов оплаты по умолчанию (fallback)
const defaultPaymentMethods = [
  { id: 'cash', name: 'Наличные', icon: 'bi-cash-stack', isActive: true },
  { id: 'card', name: 'Банковская карта', icon: 'bi-credit-card', isActive: true },
  { id: 'sbp', name: 'СБП', icon: 'bi-qr-code', isActive: true },
  { id: 'transfer', name: 'Безналичный перевод', icon: 'bi-bank', isActive: true },
  { id: 'mixed', name: 'Смешанная оплата', icon: 'bi-wallet2', isActive: true }
]

// Зоны ресторана
const zones = ref<Zone[]>([
  { id: 'all', name: 'Все зоны', color: '#6c757d' }
])

// Столики ресторана (загружаются из API)
const tables = ref<Table[]>([])

// Функция для проверки актуальности кэша зон
const checkIfZonesCacheNeedsUpdate = () => {
  try {
    // Проверяем, есть ли кэш зон
    const locationsCache = cacheService.get('locations')

    if (!locationsCache) {
      console.log('Кэш зон отсутствует')
      return true
    }

    // Проверяем время последнего обновления зон
    const cacheInfo = cacheService.get('_zones_cache_timestamp')
    if (cacheInfo) {
      const lastUpdate = new Date(cacheInfo as string)
      const now = new Date()
      const minutesSinceUpdate = (now.getTime() - lastUpdate.getTime()) / (1000 * 60)

      // Обновляем кэш зон если прошло больше 60 минут (зоны меняются редко)
      if (minutesSinceUpdate > 60) {
        console.log(`Кэш зон устарел: ${minutesSinceUpdate.toFixed(1)} минут назад`)
        return true
      }
    }

    console.log('Кэш зон актуален')
    return false

  } catch (error) {
    console.warn('Ошибка проверки кэша зон:', error)
    return true // При ошибке лучше обновить
  }
}

// Функция для восстановления зон из кэша
const restoreZonesFromCache = () => {
  console.log('Восстанавливаем зоны из кэша...')

  try {
    // Очищаем устаревший кэш столиков, если он есть
    if (cacheService.get('tables')) {
      console.log('Очищаем устаревший кэш столиков...')
      cacheService.remove('tables')
      cacheService.remove('_dashboard_cache_timestamp')
    }

    // Восстанавливаем только зоны
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

  } catch (error) {
    console.warn('Ошибка восстановления зон из кэша:', error)
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
  // Если столик занят, но нет активного заказа, возможно гости доедают
  else if (apiTable.is_occupied && !apiTable.current_order_id) {
    status = 'dining'
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

    // НЕ кэшируем данные столиков - они меняются часто

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

    // Кэшируем данные локаций (зоны меняются редко)
    cacheService.set('locations', { locations: locationsArray }, { ttl: 60 * 60 * 1000 }) // 60 минут

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

    // Сохраняем timestamp успешной загрузки зон
    cacheService.set('_zones_cache_timestamp', new Date().toISOString(), { ttl: 120 * 60 * 1000 }) // 120 минут

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

    // Загружаем данные о заказах
    const orderPromises = tablesWithOrders.map(async (table) => {
      try {
        const order: ApiOrder = await apiService.getOrder(table.current_order_id!)
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
        if (order.total_price) {
          table.orderAmount = order.total_price
        }

        // Обновляем статус на основе статуса заказа
        if (order.status === 'ready') {
          table.status = 'ready'
        } else if (order.status === 'served') {
          // Если заказ подан, столик переходит в статус "доедают"
          table.status = 'dining'
        } else if (order.payment_status === 'paid') {
          // Только если заказ оплачен, столик освобождается
          table.status = 'free'
          table.current_order_id = null
          table.orderTime = null
          table.orderAmount = 0
        }
      }
    })

    console.log('Данные о заказах загружены и применены к столикам')

  } catch (error) {
    console.error('Ошибка загрузки данных о заказах:', error)
  }
}

// Функция для полной загрузки данных дашборда
const loadAllDashboardData = async () => {
  console.log('Полная загрузка данных дашборда...')

  try {
    // Загружаем зоны, столики и способы оплаты параллельно
    await Promise.all([
      loadZones(),
      loadTables(),
      loadPaymentMethods()
    ])

    // Загружаем данные о заказах для столиков (не кэшируем)
    await loadOrdersData()

    // Сохраняем timestamp успешной загрузки зон
    cacheService.set('_zones_cache_timestamp', new Date().toISOString(), { ttl: 120 * 60 * 1000 }) // 120 минут

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

// Функция для отладки способов оплаты (показывает подробную информацию)
const debugPaymentMethods = () => {
  console.group('🔍 Информация о способах оплаты')
  console.log('Всего способов оплаты:', paymentMethods.value.length)

  paymentMethods.value.forEach((method, index) => {
    console.log(`${index + 1}. ${method.name} (ID: ${method.id})`)
    console.log(`   Иконка: ${method.icon}`)
    console.log(`   Активен: ${method.isActive}`)
  })

  console.groupEnd()
}

// Интерфейс для отладочных функций
interface DashboardDebug {
  getCacheInfo: () => void
  clearCache: () => void
  forceReload: () => void
  restoreFromCache: () => void
  reloadPaymentMethods: () => void
}

// Добавляем debugZones в window для отладки из консоли браузера
if (typeof window !== 'undefined') {
  (window as unknown as Window & {
    debugZones: () => void
    debugTables: () => void
    debugPaymentMethods: () => void
    qresDashDebug: DashboardDebug
  }).debugZones = debugZones;

  (window as unknown as Window & {
    debugZones: () => void
    debugTables: () => void
    debugPaymentMethods: () => void
    qresDashDebug: DashboardDebug
  }).debugTables = debugTables;

  (window as unknown as Window & {
    debugZones: () => void
    debugTables: () => void
    debugPaymentMethods: () => void
    qresDashDebug: DashboardDebug
  }).debugPaymentMethods = debugPaymentMethods

  // Добавляем отладочные функции для кэша зон
  ;(window as unknown as Window & {
    debugZones: () => void
    debugTables: () => void
    debugPaymentMethods: () => void
    qresDashDebug: DashboardDebug
  }).qresDashDebug = {
    getCacheInfo: () => {
      const locationsCache = cacheService.get('locations')
      const timestamp = cacheService.get('_zones_cache_timestamp')

      console.log('Кэш дашборда:', {
        locations: locationsCache ? 'Есть' : 'Отсутствует',
        timestamp: timestamp || 'Отсутствует',
        zonesInMemory: zones.value.length,
        tablesInMemory: tables.value.length,
        paymentMethodsInMemory: paymentMethods.value.length
      })
    },
    clearCache: () => {
      cacheService.remove('locations')
      cacheService.remove('_zones_cache_timestamp')
      console.log('Кэш зон очищен')
    },
    forceReload: () => {
      loadAllDashboardData().then(() => {
        console.log('Принудительная перезагрузка данных дашборда завершена')
      })
    },
    restoreFromCache: () => {
      restoreZonesFromCache()
      console.log('Зоны восстановлены из кэша')
    },
    reloadPaymentMethods: () => {
      loadPaymentMethods().then(() => {
        console.log('Способы оплаты перезагружены')
      })
    }
  }

  console.log('Dashboard Debug доступен в window.qresDashDebug')
  console.log('Доступные функции отладки: debugZones(), debugTables(), debugPaymentMethods()')
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
    { key: 'dining', label: 'Доедают', icon: 'bi-cup-hot', count: currentZoneTables.filter(t => t.status === 'dining').length }
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

  // Сортируем столики по зонам и номерам
  filtered.sort((a, b) => {
    // Сначала сортируем по зонам
    const zoneA = getZoneName(a.zone)
    const zoneB = getZoneName(b.zone)

    if (zoneA !== zoneB) {
      return zoneA.localeCompare(zoneB)
    }

    // Если зоны одинаковые, сортируем по номеру столика
    return a.number - b.number
  })

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
    dining: currentZoneTables.filter(t => t.status === 'dining').length
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
    dining: 'bi-cup-hot',
    'qr-waiting': 'bi-qr-code-scan'
  }
  return icons[status as keyof typeof icons] || 'bi-question-circle'
}

const getZoneName = (zoneId: string) => {
  const zone = zones.value.find(z => z.id === zoneId)
  return zone ? zone.name : 'Неизвестная зона'
}

const openTable = (table: Table) => {
  console.log('Открыть столик:', table.number)
  // Перенаправляем на страницу создания заказа с ID столика
  router.push({
    path: '/create-order',
    query: { table: table.id }
  })
}

const addToOrder = (table: Table) => {
  console.log('Добавить к заказу столика:', table.number)
  // Перенаправляем на страницу создания заказа с ID столика
  router.push({
    path: '/create-order',
    query: { table: table.id }
  })
}

// Функция для загрузки категорий блюд для заказа
const loadDishCategories = async (order: Order | null) => {
  if (!order || !order.items.length) return

  try {
    // Получаем ВСЕ категории, блюда и вариации отдельно
    const [categoriesData, dishesData, orderData] = await Promise.all([
      apiService.getCategories(), // Получаем ВСЕ категории системы
      apiService.getDishes(), // Получаем все блюда
      apiService.getOrder(order.id) // Получаем детали заказа для dish_id и dish_variation_id
    ])

    console.log('Загружены все категории системы:', categoriesData)
    console.log('Загружены блюда:', dishesData)
    console.log('Загружены детали заказа:', orderData)

    // Создаем маппинг блюд к категориям
    const dishCategoryMap = new Map<number, string>()

    // Создаем маппинг вариаций к ценам
    const variationPriceMap = new Map<number, { unit_price: number, variation_name: string }>()

    // Обрабатываем блюда и их категории
    let dishesArray: import('@/types/api').Dish[] = []
    if (Array.isArray(dishesData)) {
      dishesArray = dishesData
    } else if (dishesData && typeof dishesData === 'object' && 'dishes' in dishesData) {
      dishesArray = (dishesData as { dishes: import('@/types/api').Dish[] }).dishes || []
    }

    // Обрабатываем категории
    let categoriesArray: import('@/types/api').Category[] = []
    if (Array.isArray(categoriesData)) {
      categoriesArray = categoriesData
    } else if (categoriesData && typeof categoriesData === 'object' && 'categories' in categoriesData) {
      categoriesArray = (categoriesData as { categories: import('@/types/api').Category[] }).categories || []
    }

    console.log('Массив блюд для обработки:', dishesArray)
    console.log('Массив категорий для обработки:', categoriesArray)

    // Показываем ID всех категорий
    const categoryIds = categoriesArray.map(cat => cat.id)
    console.log('ID всех категорий в системе:', categoryIds)

    // Создаем карту категорий блюд
    dishesArray.forEach(dish => {
      console.log(`Проверяем блюдо: ID=${dish.id}, название="${dish.name}", category_id=${dish.category_id}`)
      const category = categoriesArray.find(cat => cat.id === dish.category_id)
      if (category) {
        dishCategoryMap.set(dish.id, category.name)
        console.log(`  ✅ Найдена категория: ${category.name}`)
      } else {
        console.log(`  ❌ Категория не найдена для category_id=${dish.category_id}`)
      }
    })

    // Собираем уникальные ID вариаций из заказа
    const variationIds = new Set<number>()
    orderData.items?.forEach(item => {
      if (item.dish_variation_id) {
        variationIds.add(item.dish_variation_id)
      }
    })

    console.log('Нужно загрузить вариации с ID:', Array.from(variationIds))

    // Загружаем информацию о вариациях
    if (variationIds.size > 0) {
      try {
        // Загружаем вариации для каждого dish_id из заказа
        const dishIds = new Set<number>()
        orderData.items?.forEach(item => {
          if (item.dish_id) {
            dishIds.add(item.dish_id)
          }
        })

        const variationPromises = Array.from(dishIds).map(async (dishId) => {
          try {
            const variations = await apiService.getDishVariations(dishId)
            console.log(`Загружены вариации для блюда ${dishId}:`, variations)
            return { dishId, variations }
          } catch (error) {
            console.warn(`Ошибка загрузки вариаций для блюда ${dishId}:`, error)
            return { dishId, variations: [] }
          }
        })

        const variationsResults = await Promise.all(variationPromises)

        // Обрабатываем загруженные вариации
        variationsResults.forEach(({ variations }) => {
          let variationsArray: import('@/types/api').DishVariation[] = []
          if (Array.isArray(variations)) {
            variationsArray = variations
          } else if (variations && typeof variations === 'object' && 'variations' in variations) {
            variationsArray = (variations as { variations: import('@/types/api').DishVariation[] }).variations || []
          }

          variationsArray.forEach(variation => {
            variationPriceMap.set(variation.id, {
              unit_price: Number(variation.price),
              variation_name: variation.name
            })
            console.log(`  📋 Вариация ${variation.id} "${variation.name}": ${variation.price}₽`)
          })
        })

        console.log('Создана карта цен вариаций:', variationPriceMap)
      } catch (error) {
        console.warn('Ошибка загрузки вариаций:', error)
      }
    }

    console.log('Создана карта категорий блюд:', dishCategoryMap)

    // Обновляем категории и цены в элементах заказа
    console.log('Начинаем обновление категорий и цен в элементах заказа...')
    order.items.forEach((item, index) => {
      console.log(`Обрабатываем элемент заказа ${index + 1}: ID=${item.id}, название="${item.name}"`)

      const apiItem = orderData.items?.find(apiItem => apiItem.id === item.id)
      console.log(`  Найден API элемент:`, apiItem)

      if (apiItem) {
        // Обновляем категорию
        if (apiItem.dish_id) {
          console.log(`  dish_id элемента: ${apiItem.dish_id}`)
          const categoryName = dishCategoryMap.get(apiItem.dish_id)
          console.log(`  Найденная категория из карты: ${categoryName}`)

          if (categoryName) {
            item.category = categoryName
            console.log(`  ✅ Установлена категория: ${categoryName}`)
          } else {
            item.category = 'Без категории'
            console.log(`  ⚠️ Категория не найдена, установлено: "Без категории"`)
          }
        }

        // Обновляем цены из вариации
        if (apiItem.dish_variation_id) {
          console.log(`  dish_variation_id элемента: ${apiItem.dish_variation_id}`)
          const variationInfo = variationPriceMap.get(apiItem.dish_variation_id)
          console.log(`  Найденная информация о вариации:`, variationInfo)

          if (variationInfo) {
            item.unitPrice = variationInfo.unit_price
            item.totalPrice = variationInfo.unit_price * item.quantity
            console.log(`  💰 Установлена цена за единицу: ${item.unitPrice}₽`)
            console.log(`  💰 Рассчитана общая цена: ${item.totalPrice}₽ (${item.unitPrice} × ${item.quantity})`)
          } else {
            console.log(`  ⚠️ Информация о вариации не найдена, цены остаются нулевыми`)
          }
        } else {
          console.log(`  ❌ Нет dish_variation_id у элемента`)
        }
      } else {
        item.category = 'Неизвестная категория'
        console.log(`  ❌ API элемент не найден, установлено: "Неизвестная категория"`)
      }

      console.log(`  Итоговое состояние элемента: категория="${item.category}", цена=${item.unitPrice}₽, итого=${item.totalPrice}₽`)
    })

    console.log('Категории блюд и цены загружены и обновлены')
    console.log('Финальное состояние элементов заказа:', order.items.map(item => ({
      id: item.id,
      name: item.name,
      category: item.category,
      unitPrice: item.unitPrice,
      totalPrice: item.totalPrice,
      quantity: item.quantity
    })))

  } catch (error) {
    console.warn('Ошибка загрузки категорий блюд и цен:', error)

    // В случае ошибки устанавливаем "Без категории" и нулевые цены
    order.items.forEach(item => {
      item.category = 'Без категории'
      item.unitPrice = 0
      item.totalPrice = 0
    })
  }
}

const serveOrder = async (table: Table) => {
  console.log('Подать заказ столика:', table.number)

  if (!table.current_order_id) {
    console.warn('Нет активного заказа для подачи у столика', table.number)
    return
  }

  try {
    // Обновляем статус заказа через API
    await apiService.updateOrderStatus(table.current_order_id, 'served')

    // Обновляем статус столика для перехода в режим "доедают"
    // (столик занят, но заказ уже подан)
    await apiService.updateTableStatus(table.id, true)

    // Локально обновляем статус столика
    table.status = 'dining'
    // НЕ очищаем current_order_id - гости могут сделать дополнительный заказ

    // Показываем уведомление об успешной подаче
    notificationStore.addNotification({
      type: 'success',
      title: 'Заказ подан',
      message: `Заказ столика ${table.number} подан гостям`,
      read: false,
      sound: true
    })

    playNotificationSound()

    // Не обновляем данные столиков автоматически, чтобы не перезаписать статус
    // await loadOrdersData()

  } catch (error) {
    console.error('Ошибка подачи заказа:', error)
    handleApiError(error, 'подачи заказа')
  }
}

const freeTable = async (table: Table) => {
  console.log('Освобождение столика:', table.number)

  try {
    // Обновляем статус столика на сервере (освобождаем)
    await apiService.updateTableStatus(table.id, false)

    // Локально обновляем статус столика
    table.status = 'free'
    table.is_occupied = false
    table.current_order_id = null
    table.orderTime = null
    table.orderAmount = 0

    // Показываем уведомление об успешном освобождении
    notificationStore.addNotification({
      type: 'success',
      title: 'Столик освобожден',
      message: `Столик ${table.number} освобожден и готов к приему новых гостей`,
      read: false,
      sound: true
    })

    playNotificationSound()

  } catch (error) {
    console.error('Ошибка освобождения столика:', error)
    handleApiError(error, 'освобождения столика')
  }
}

const confirmQrOrder = async (table: Table) => {
  console.log('Подтвердить QR заказ столика:', table.number)

  if (!table.current_order_id) {
    console.warn('Нет активного QR заказа для подтверждения у столика', table.number)
    return
  }

  try {
    // Обновляем статус заказа через API (подтверждаем QR заказ)
    await apiService.updateOrderStatus(table.current_order_id, 'confirmed')

    // Локально обновляем статус столика
    table.status = 'occupied'

    // Показываем уведомление об успешном подтверждении
    notificationStore.addNotification({
      type: 'success',
      title: 'QR заказ подтвержден',
      message: `QR заказ столика ${table.number} подтвержден официантом`,
      read: false,
      sound: true
    })

    playNotificationSound()

    // Не обновляем данные столиков автоматически, чтобы не перезаписать статус
    // await loadOrdersData()

  } catch (error) {
    console.error('Ошибка подтверждения QR заказа:', error)
    handleApiError(error, 'подтверждения QR заказа')
  }
}

const viewQrOrder = async (table: Table) => {
  console.log('Посмотреть QR заказ столика:', table.number)

  if (!table.current_order_id) {
    console.warn('Нет активного заказа для столика', table.number)
    return
  }

  try {
    // Загружаем реальные данные заказа из API
    const orderData: ApiOrder = await apiService.getOrder(table.current_order_id)
    console.log('Загружен заказ:', orderData)

    // Преобразуем данные API в формат UI
    selectedOrder.value = {
      id: orderData.id,
      tableNumber: table.number,
      items: orderData.items?.map((item: ApiOrderItem) => {
        console.log('Обрабатываем элемент QR заказа:', item)
        return {
          id: item.id || 0,
          name: item.dish_name || 'Неизвестное блюдо',
          unitPrice: Number(item.price) || 0,
          totalPrice: Number(item.total) || 0,
          quantity: item.quantity || 1,
          category: 'Загружается...', // Будем загружать асинхронно
          notes: item.comment || undefined
        }
      }) || [],
      total: orderData.total_price || table.orderAmount,
      status: orderData.status === 'ready' ? 'ready' : 'active',
      orderTime: orderData.created_at ? new Date(orderData.created_at) : (table.orderTime || new Date()),
      waiterName: orderData.waiter_name || waiterName.value,
      notes: orderData.notes || 'QR заказ. Требует подтверждения официанта'
    }
    showOrderModal.value = true

    // Асинхронно загружаем категории блюд
    loadDishCategories(selectedOrder.value)

  } catch (error) {
    console.error('Ошибка загрузки QR заказа:', error)
    handleApiError(error, 'загрузки QR заказа')

    // В случае ошибки показываем базовую информацию
    selectedOrder.value = {
      id: table.current_order_id,
      tableNumber: table.number,
      items: [],
      total: table.orderAmount,
      status: 'active',
      orderTime: table.orderTime || new Date(),
      waiterName: waiterName.value,
      notes: 'Ошибка загрузки данных заказа'
    }
    showOrderModal.value = true
  }
}

const viewOrder = async (table: Table) => {
  console.log('Посмотреть заказ столика:', table.number)

  if (!table.current_order_id) {
    console.warn('Нет активного заказа для столика', table.number)
    return
  }

  try {
    // Загружаем реальные данные заказа из API
    const orderData: ApiOrder = await apiService.getOrder(table.current_order_id)
    console.log('Загружен заказ:', orderData)
    console.log('Позиции заказа:', orderData.items)

    // Преобразуем данные API в формат UI
    selectedOrder.value = {
      id: orderData.id,
      tableNumber: table.number,
      items: orderData.items?.map((item: ApiOrderItem) => {
        console.log('Обрабатываем элемент заказа:', item)
        console.log('  unit_price:', item.price, 'typeof:', typeof item.price)
        console.log('  total_price:', item.total, 'typeof:', typeof item.total)
        console.log('  После Number(unit_price):', Number(item.price))
        console.log('  После Number(total_price):', Number(item.total))

        return {
          id: item.id || 0,
          name: item.dish_name || 'Неизвестное блюдо',
          unitPrice: Number(item.price) || 0,
          totalPrice: Number(item.total) || 0,
          quantity: item.quantity || 1,
          category: 'Загружается...', // Будем загружать асинхронно
          notes: item.comment || undefined
        }
      }) || [],
      total: orderData.total_price || table.orderAmount,
      status: table.status === 'ready' ? 'ready' : 'active',
      orderTime: orderData.created_at ? new Date(orderData.created_at) : (table.orderTime || new Date()),
      waiterName: orderData.waiter_name || waiterName.value,
      notes: orderData.notes || undefined
    }
    showOrderModal.value = true

    // Асинхронно загружаем категории блюд
    loadDishCategories(selectedOrder.value)

  } catch (error) {
    console.error('Ошибка загрузки заказа:', error)
    handleApiError(error, 'загрузки заказа')

    // В случае ошибки показываем базовую информацию
    selectedOrder.value = {
      id: table.current_order_id,
      tableNumber: table.number,
      items: [],
      total: table.orderAmount,
      status: table.status === 'ready' ? 'ready' : 'active',
      orderTime: table.orderTime || new Date(),
      waiterName: waiterName.value,
      notes: 'Ошибка загрузки данных заказа'
    }
    showOrderModal.value = true
  }
}

const closeOrderModal = () => {
  showOrderModal.value = false
  selectedOrder.value = null
}

// Методы для модального окна закрытия заказа
const openCloseOrderModal = async (table: Table) => {
  console.log('Открытие модального окна закрытия заказа для столика:', table.number)

  if (!table.current_order_id) {
    console.warn('Нет активного заказа для столика', table.number)
    return
  }

  try {
    // Загружаем реальные данные заказа из API
    const orderData: ApiOrder = await apiService.getOrder(table.current_order_id)
    console.log('Загружен заказ для закрытия:', orderData)

    // Преобразуем данные API в формат UI для закрытия
    const orderItems: OrderItem[] = orderData.items?.map((item: ApiOrderItem) => ({
      id: item.id || 0,
      name: item.dish_name || 'Неизвестное блюдо',
      unitPrice: Number(item.price) || 0,
      totalPrice: Number(item.total) || 0,
      quantity: item.quantity || 1,
      category: 'Загружается...', // Будем загружать асинхронно
      notes: item.comment || undefined
    })) || []

    const originalAmount = orderData.total_price || table.orderAmount

    closeOrderData.value = {
      tableNumber: table.number,
      items: orderItems,
      originalAmount,
      finalAmount: originalAmount,
      discount: 0,
      orderId: orderData.id
    }

    showCloseOrderModal.value = true

    // Асинхронно загружаем категории блюд
    await loadDishCategoriesForCloseOrder(orderItems)

  } catch (error) {
    console.error('Ошибка загрузки заказа для закрытия:', error)
    handleApiError(error, 'загрузки заказа для закрытия')
  }
}

const closeCloseOrderModal = () => {
  showCloseOrderModal.value = false
  closeOrderData.value = null
}

// Обработчики событий для модального окна закрытия заказа
const onUpdateDiscount = (data: { discount: number; finalAmount: number }) => {
  if (closeOrderData.value) {
    closeOrderData.value.discount = data.discount
    closeOrderData.value.finalAmount = data.finalAmount
  }
}

const onProcessOrderClosure = async (data: {
  paymentMethod: string
  splitType: 'none' | 'equal'
  splitPersons: number
  splitAssignments: Record<number, number[]>
  finalAmount: number
  discount: number
  printReceipt: boolean
  comment: string
}) => {
  if (!closeOrderData.value) {
    console.warn('Нет данных заказа для закрытия')
    return
  }

  console.log('Обработка закрытия заказа:', {
    tableNumber: closeOrderData.value.tableNumber,
    ...data
  })

  try {
    // API вызов для закрытия заказа
    await apiService.closeOrder(closeOrderData.value.orderId, {
      payment_method: data.paymentMethod,
      split_type: data.splitType,
      split_persons: data.splitPersons,
      final_amount: data.finalAmount,
      discount_percent: data.discount,
      print_receipt: data.printReceipt,
      comment: data.comment
    })

    // Показываем уведомление об успешном закрытии
    notificationStore.addNotification({
      type: 'success',
      title: 'Заказ закрыт',
      message: `Заказ столика ${closeOrderData.value.tableNumber} успешно закрыт. Сумма: ${data.finalAmount}₽`,
      read: false,
      sound: true
    })

    // Находим столик и освобождаем его
    const table = tables.value.find(t => t.number === closeOrderData.value?.tableNumber)
    if (table) {
      await freeTable(table)
    }

    // Закрываем модальное окно
    closeCloseOrderModal()

    // Обновляем данные дашборда
    await loadTables()
    await loadOrdersData()

  } catch (error) {
    console.error('Ошибка закрытия заказа:', error)
    handleApiError(error, 'закрытия заказа')
  }
}

const printPrecheckOnly = () => {
  console.log('Печать предчека для столика:', closeOrderData.value?.tableNumber)
  // Здесь будет логика печати предчека
  notificationStore.addNotification({
    type: 'success',
    title: 'Предчек распечатан',
    message: `Предчек для столика ${closeOrderData.value?.tableNumber} отправлен на печать`,
    read: false,
    sound: false
  })
}

// Загрузка категорий для модального окна закрытия заказа
const loadDishCategoriesForCloseOrder = async (orderItems: OrderItem[]) => {
  if (!orderItems.length) return

  try {
    // Получаем все категории и блюда
    const [categoriesData, dishesData] = await Promise.all([
      apiService.getCategories(),
      apiService.getDishes()
    ])

    // Создаем маппинг блюд к категориям (аналогично основной функции)
    const dishCategoryMap = new Map<number, string>()

    let dishesArray: import('@/types/api').Dish[] = []
    if (Array.isArray(dishesData)) {
      dishesArray = dishesData
    } else if (dishesData && typeof dishesData === 'object' && 'dishes' in dishesData) {
      dishesArray = (dishesData as { dishes: import('@/types/api').Dish[] }).dishes || []
    }

    let categoriesArray: import('@/types/api').Category[] = []
    if (Array.isArray(categoriesData)) {
      categoriesArray = categoriesData
    } else if (categoriesData && typeof categoriesData === 'object' && 'categories' in categoriesData) {
      categoriesArray = (categoriesData as { categories: import('@/types/api').Category[] }).categories || []
    }

    dishesArray.forEach(dish => {
      const category = categoriesArray.find(cat => cat.id === dish.category_id)
      if (category) {
        dishCategoryMap.set(dish.id, category.name)
      }
    })

    // Обновляем категории в элементах заказа
    orderItems.forEach(item => {
      // Для закрытия заказа нам нужно будет получить dish_id из API заказа
      // Пока устанавливаем базовую категорию
      item.category = 'Блюдо'
    })

  } catch (error) {
    console.warn('Ошибка загрузки категорий для закрытия заказа:', error)
    orderItems.forEach(item => {
      item.category = 'Без категории'
    })
  }
}

// const printOrderBill = () => {
//   if (selectedOrder.value) {
//     console.log('Печать счета для заказа столика:', selectedOrder.value.tableNumber)
//     // Здесь будет логика печати счета
//   }
// }

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

  // Сначала восстанавливаем зоны из кэша для быстрого отображения
  restoreZonesFromCache()

  // Загружаем способы оплаты сразу (они не кэшируются)
  await loadPaymentMethods()

  // Проверяем актуальность кэша зон и загружаем только при необходимости
  const shouldUpdateZonesCache = checkIfZonesCacheNeedsUpdate()

  if (shouldUpdateZonesCache) {
    console.log('Кэш зон устарел или отсутствует, загружаем данные...')
    await loadAllDashboardData()
  } else {
    console.log('Кэш зон актуален, загружаем только столики')
    // Загружаем только столики (они не кэшируются)
    await loadTables()
    // Загружаем данные о заказах
    await loadOrdersData()
  }

  // Показываем отладочную информацию о зонах в режиме разработки
  if (import.meta.env.DEV) {
    debugZones()
    debugTables()
    debugPaymentMethods()
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

// Функция для маппинга API способа оплаты в UI формат
const mapApiPaymentMethodToUI = (apiMethod: import('@/types/api').PaymentMethod) => {
  // Маппинг иконок по названию способа оплаты
  const getIcon = (name: string) => {
    const lowerName = name.toLowerCase()
    if (lowerName.includes('наличн') || lowerName.includes('cash')) return 'bi-cash-stack'
    if (lowerName.includes('карт') || lowerName.includes('card')) return 'bi-credit-card'
    if (lowerName.includes('сбп') || lowerName.includes('qr')) return 'bi-qr-code'
    if (lowerName.includes('перевод') || lowerName.includes('transfer') || lowerName.includes('банк')) return 'bi-bank'
    if (lowerName.includes('смешан') || lowerName.includes('mixed')) return 'bi-wallet2'
    if (lowerName.includes('crypto') || lowerName.includes('крипто')) return 'bi-currency-bitcoin'
    if (lowerName.includes('paypal')) return 'bi-paypal'
    return 'bi-credit-card' // По умолчанию
  }

  return {
    id: apiMethod.id.toString(),
    name: apiMethod.name,
    icon: getIcon(apiMethod.name),
    isActive: apiMethod.is_active
  }
}

// Функция загрузки способов оплаты
const loadPaymentMethods = async () => {
  try {
    console.log('Загрузка способов оплаты из API...')

    // Загружаем все способы оплаты
    const apiResponse = await apiService.getPaymentMethods()
    console.log('Получены способы оплаты из API:', apiResponse)

    // Извлекаем массив способов оплаты из ответа
    const apiMethods = apiResponse.payment_methods
    console.log('Извлеченный массив способов оплаты:', apiMethods)

    // Детально логируем каждый способ оплаты
    apiMethods.forEach((method, index) => {
      console.log(`Способ оплаты ${index + 1}:`, {
        id: method.id,
        name: method.name,
        is_active: method.is_active
      })
    })

    // Маппим все способы оплаты (и активные, и неактивные)
    const allMethods = apiMethods.map(mapApiPaymentMethodToUI)
    console.log('Все способы оплаты после маппинга:', allMethods)

    // Фильтруем только активные способы оплаты для подсчета
    const activeMethods = allMethods.filter(method => method.isActive)
    console.log(`Активных способов оплаты: ${activeMethods.length} из ${allMethods.length}`)

    if (allMethods.length > 0) {
      // Устанавливаем все способы оплаты из API (включая неактивные)
      paymentMethods.value = allMethods
      console.log('Способы оплаты из API загружены:', paymentMethods.value)

      // Показываем уведомление
      if (activeMethods.length > 0) {
        notificationStore.addNotification({
          type: 'success',
          title: 'Способы оплаты загружены',
          message: `Доступно ${activeMethods.length} из ${allMethods.length} способов оплаты`,
          read: false,
          sound: false
        })
      } else {
        notificationStore.addNotification({
          type: 'warning',
          title: 'Способы оплаты загружены',
          message: `Загружено ${allMethods.length} способов оплаты, но все недоступны`,
          read: false,
          sound: false
        })
      }
    } else {
      console.warn('Нет активных способов оплаты в API, используем значения по умолчанию')
      console.log('Способы оплаты по умолчанию:', defaultPaymentMethods)
      // Используем способы оплаты по умолчанию
      paymentMethods.value = defaultPaymentMethods

      // Показываем предупреждение
      notificationStore.addNotification({
        type: 'warning',
        title: 'Способы оплаты по умолчанию',
        message: 'API не вернул активных способов оплаты, используются настройки по умолчанию',
        read: false,
        sound: false
      })
    }

  } catch (error) {
    console.warn('Ошибка загрузки способов оплаты из API:', error)
    handleApiError(error, 'загрузки способов оплаты')

    // В случае ошибки используем способы оплаты по умолчанию
    paymentMethods.value = defaultPaymentMethods
    console.log('Используются способы оплаты по умолчанию из-за ошибки:', paymentMethods.value)

    // Показываем предупреждение об ошибке
    notificationStore.addNotification({
      type: 'error',
      title: 'Ошибка загрузки способов оплаты',
      message: 'Не удалось загрузить способы оплаты из API, используются настройки по умолчанию',
      read: false,
      sound: false
    })
  }
}

// Первоначальная загрузка способов оплаты
loadPaymentMethods()
</script>

<style scoped lang="scss">
@use '@/styles/views/dashboard';
</style>
