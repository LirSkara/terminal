<template>
  <div class="orders-list-view">
    <!-- Заголовок с информацией о смене -->
    <div class="dashboard-header">
      <div class="container-fluid">
        <div class="row align-items-center">
          <div class="col-md-8">
            <h1 class="dashboard-title">
              <i class="bi bi-fire me-3"></i>
              Кухня - Заказы
            </h1>
            <p class="dashboard-subtitle">
              Смена: <span class="badge bg-success">Активна</span> •
              Время: {{ currentTime }} •
              Повар: {{ waiterName }}
            </p>
          </div>
          <div class="col-md-4 text-end">
            <div class="header-right-section">
              <button
                @click="goBack"
                class="btn btn-outline-primary me-3"
                title="Вернуться к столикам"
              >
                <i class="bi bi-arrow-left me-2"></i>
                К столикам
              </button>
              <button
                @click="refreshOrders"
                class="btn btn-primary"
                :disabled="isLoading"
                title="Обновить заказы"
              >
                <i class="bi bi-arrow-clockwise me-2" :class="{ 'spin': isLoading }"></i>
                Обновить
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Фильтры и статистика -->
    <div class="orders-controls">
      <div class="row align-items-center mb-4">
        <!-- Фильтры -->
        <div class="col-lg-8 col-md-7">
          <div class="filters-section">
            <div class="filter-group">
              <label class="filter-label">Статус:</label>
              <div class="filter-buttons">
                <button
                  v-for="filter in statusFilters"
                  :key="filter.key"
                  @click="activeStatusFilter = filter.key"
                  :class="[
                    'filter-btn',
                    { 'active': activeStatusFilter === filter.key }
                  ]"
                >
                  <i :class="filter.icon"></i>
                  {{ filter.label }}
                  <span class="filter-count">({{ filter.count }})</span>
                </button>
              </div>
            </div>

            <div class="filter-group">
              <label class="filter-label">Зона:</label>
              <div class="filter-buttons">
                <button
                  v-for="zone in zonesWithCounts"
                  :key="zone.id"
                  @click="activeZoneFilter = zone.id"
                  :class="[
                    'filter-btn zone-btn',
                    { 'active': activeZoneFilter === zone.id }
                  ]"
                  :style="{ '--zone-color': zone.color }"
                >
                  {{ zone.name }}
                  <span class="filter-count">({{ zone.count }})</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Статистика -->
        <div class="col-lg-4 col-md-5">
          <div class="orders-stats">
            <div class="stat-item">
              <i class="bi bi-receipt-cutoff stat-icon"></i>
              <div class="stat-content">
                <div class="stat-number">{{ totalOrders }}</div>
                <div class="stat-label">Всего заказов</div>
              </div>
            </div>
            <div class="stat-item">
              <i class="bi bi-currency-exchange stat-icon"></i>
              <div class="stat-content">
                <div class="stat-number">{{ totalAmount }}₽</div>
                <div class="stat-label">Общая сумма</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Плитки заказов -->
    <div class="orders-grid-section">
      <div class="container-fluid">
        <div class="orders-grid-wrapper">
          <div v-if="isLoading" class="loading-state">
            <div class="spinner-border text-primary" role="status">
              <span class="visually-hidden">Загрузка...</span>
            </div>
            <p class="mt-3">Загрузка заказов...</p>
          </div>

          <div v-else-if="filteredOrders.length === 0" class="empty-state">
            <i class="bi bi-receipt-cutoff empty-icon"></i>
            <h4>Заказы не найдены</h4>
            <p>Нет заказов, соответствующих выбранным фильтрам</p>
          </div>

          <!-- Сетка заказов -->
          <div v-else class="orders-grid">
            <div
              v-for="order in paginatedOrders"
              :key="order.id"
              :class="[
                'order-card',
                `status-${order.status}`,
                { 'long-waiting': isLongWaiting(order) }
              ]"
              @click="viewOrder(order)"
            >
              <!-- Заголовок карточки -->
              <div class="order-card-header">
                <div class="order-main-info">
                  <h3 class="order-number">#{{ order.id }}</h3>
                  <div class="order-table">
                    <i class="bi bi-geo-alt-fill me-1"></i>
                    Столик {{ order.tableNumber || 'Нет' }}
                  </div>
                </div>
                <div class="order-status-section">
                  <span :class="['status-badge', `status-${order.status}`]">
                    <i :class="getStatusIcon(order.status)"></i>
                    {{ getStatusLabel(order.status) }}
                  </span>
                  <div class="order-time-info">
                    {{ formatTimeAgo(order.created_at) }}
                  </div>
                </div>
              </div>

              <!-- Блюда в заказе -->
              <div class="order-items-section">
                <h4 class="items-title">
                  <i class="bi bi-list-ul me-2"></i>
                  Блюда ({{ order.items?.length || 0 }})
                </h4>
                <div class="order-items-list">
                  <div
                    v-for="item in order.items?.slice(0, 4)"
                    :key="item.id"
                    class="order-item"
                  >
                    <div class="item-main">
                      <span class="item-quantity">{{ item.quantity }}x</span>
                      <span class="item-name">{{ item.dish_name }}</span>
                    </div>
                    <div v-if="item.comment" class="item-comment">
                      <i class="bi bi-chat-square-text me-1"></i>
                      {{ item.comment }}
                    </div>
                  </div>
                  <div v-if="(order.items?.length || 0) > 4" class="more-items">
                    и ещё {{ (order.items?.length || 0) - 4 }} блюд...
                  </div>
                </div>
              </div>

              <!-- Дополнительная информация -->
              <div class="order-meta-section">
                <div class="order-meta-item">
                  <i class="bi bi-person-badge me-1"></i>
                  {{ order.waiter_name || 'Не указан' }}
                </div>
                <div class="order-meta-item">
                  <i class="bi bi-clock me-1"></i>
                  {{ formatDateTime(order.created_at) }}
                </div>
                <div class="order-meta-item">
                  <i class="bi bi-currency-exchange me-1"></i>
                  {{ order.total_price }}₽
                </div>
              </div>

              <!-- Кнопка действия для кухни -->
              <div class="order-actions" @click.stop>
                <button
                  v-if="order.status === 'pending' || order.status === 'in_progress'"
                  @click="markDishReady(order)"
                  class="kitchen-action-btn ready-btn"
                  :disabled="updatingOrders.has(order.id)"
                  :class="{ 'updating': updatingOrders.has(order.id) }"
                >
                  <i v-if="updatingOrders.has(order.id)" class="bi bi-arrow-clockwise spin me-2"></i>
                  <i v-else class="bi bi-check-circle me-2"></i>
                  {{ updatingOrders.has(order.id) ? 'Обновление...' : 'Готов к подаче' }}
                </button>
                <div v-else-if="order.status === 'ready'" class="order-ready">
                  <i class="bi bi-check-circle-fill me-2"></i>
                  Готово к подаче
                </div>
                <div v-else-if="order.status === 'cancelled'" class="order-cancelled">
                  <i class="bi bi-x-circle-fill me-2"></i>
                  Заказ отменен
                </div>
              </div>

              <!-- Индикатор времени ожидания -->
              <div v-if="isLongWaiting(order)" class="waiting-indicator">
                <i class="bi bi-exclamation-triangle me-1"></i>
                Долгое ожидание
              </div>
            </div>
          </div>

          <!-- Пагинация -->
          <div v-if="totalPages > 1" class="pagination-wrapper">
            <nav aria-label="Пагинация заказов">
              <ul class="pagination justify-content-center">
                <li class="page-item" :class="{ disabled: currentPage === 1 }">
                  <button @click="goToPage(currentPage - 1)" class="page-link">
                    <i class="bi bi-chevron-left"></i>
                  </button>
                </li>

                <li
                  v-for="page in visiblePages"
                  :key="page"
                  class="page-item"
                  :class="{ active: page === currentPage }"
                >
                  <button @click="goToPage(page)" class="page-link">
                    {{ page }}
                  </button>
                </li>

                <li class="page-item" :class="{ disabled: currentPage === totalPages }">
                  <button @click="goToPage(currentPage + 1)" class="page-link">
                    <i class="bi bi-chevron-right"></i>
                  </button>
                </li>
              </ul>
            </nav>

            <div class="pagination-info">
              Показано {{ paginatedOrders.length }} из {{ filteredOrders.length }} заказов
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Модальное окно просмотра заказа (переиспользуем из Dashboard) -->
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
              Заказ #{{ selectedOrder?.id }} (Столик {{ selectedOrder?.tableNumber }})
            </h3>
            <button @click="closeOrderModal" class="order-modal-close">
              <i class="bi bi-x-lg"></i>
            </button>
          </div>

          <div class="order-modal-body" v-if="selectedOrder">
            <!-- Информация о заказе -->
            <div class="order-info-section mb-4">
              <div class="row">
                <div class="col-md-6">
                  <div class="info-item">
                    <label>Номер заказа:</label>
                    <span>#{{ selectedOrder.id }}</span>
                  </div>
                  <div class="info-item">
                    <label>Столик:</label>
                    <span>{{ selectedOrder.tableNumber || 'Не указан' }}</span>
                  </div>
                  <div class="info-item">
                    <label>Зона:</label>
                    <span>{{ getZoneName(selectedOrder.zone) }}</span>
                  </div>
                </div>
                <div class="col-md-6">
                  <div class="info-item">
                    <label>Статус:</label>
                    <span :class="['status-badge', `status-${selectedOrder.status}`]">
                      <i :class="getStatusIcon(selectedOrder.status)"></i>
                      {{ getStatusLabel(selectedOrder.status) }}
                    </span>
                  </div>
                  <div class="info-item">
                    <label>Официант:</label>
                    <span>{{ selectedOrder.waiter_name || 'Не указан' }}</span>
                  </div>
                  <div class="info-item">
                    <label>Время создания:</label>
                    <span>{{ formatDateTime(selectedOrder.created_at) }}</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- Позиции заказа -->
            <div class="order-items-section">
              <h4 class="order-section-title">
                <i class="bi bi-list-ul me-2"></i>
                Позиции заказа ({{ selectedOrder.items?.length || 0 }})
              </h4>
              <div class="order-items-list">
                <div
                  v-for="item in selectedOrder.items"
                  :key="item.id"
                  class="order-item"
                >
                  <div class="order-item-info">
                    <div class="item-name">{{ item.dish_name }}</div>
                    <div class="item-details">
                      {{ item.quantity }}x {{ item.unit_price }}₽
                      <span v-if="item.comment" class="item-comment">
                        • {{ item.comment }}
                      </span>
                    </div>
                  </div>
                  <div class="order-item-price">{{ item.total_price }}₽</div>
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
          </div>

          <div class="order-modal-footer">
            <div class="order-modal-actions">
              <!-- Итого слева -->
              <div class="order-total-text">
                Итого: {{ selectedOrder?.total_price }}₽
              </div>

              <!-- Кнопки справа -->
              <div class="modal-action-buttons">
                <button
                  v-if="selectedOrder?.status === 'pending' || selectedOrder?.status === 'in_progress'"
                  @click="markDishReadyFromModal"
                  class="btn btn-success me-2"
                  :disabled="selectedOrder && updatingOrders.has(selectedOrder.id)"
                >
                  <i v-if="selectedOrder && updatingOrders.has(selectedOrder.id)" class="bi bi-arrow-clockwise spin me-2"></i>
                  <i v-else class="bi bi-check-circle me-2"></i>
                  {{ selectedOrder && updatingOrders.has(selectedOrder.id) ? 'Обновление...' : 'Готов к подаче' }}
                </button>
                <button
                  @click="closeOrderModal"
                  class="btn btn-outline-secondary"
                >
                  <i class="bi bi-x-lg me-2"></i>
                  Закрыть
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useNotificationStore } from '@/stores/notifications'
import { useRouter } from 'vue-router'
import { apiService } from '@/services/api'
import type { Order as ApiOrder, Location } from '@/types/api'

// Интерфейсы
interface ExtendedOrder extends ApiOrder {
  tableNumber?: string | number
  zone?: string
}

// Stores
const authStore = useAuthStore()
const notificationStore = useNotificationStore()
const router = useRouter()

// Реактивные данные
const currentTime = ref('')
const isLoading = ref(false)
const orders = ref<ExtendedOrder[]>([])
const locations = ref<Location[]>([])

// Фильтры
const activeStatusFilter = ref('all')
const activeZoneFilter = ref('all')

// Сортировка
const sortField = ref<string>('created_at')
const sortDirection = ref<'asc' | 'desc'>('desc')

// Пагинация
const currentPage = ref(1)
const itemsPerPage = 12

// Состояние для отслеживания обновления заказов
const updatingOrders = ref<Set<number>>(new Set())

// Модальное окно
const showOrderModal = ref(false)
const selectedOrder = ref<ExtendedOrder | null>(null)

// Вычисляемые свойства
const waiterName = computed(() => {
  return authStore.user?.full_name || authStore.user?.username || 'Не определен'
})

// Фильтры статусов с подсчетом (исключаем поданные заказы для кухни)
const kitchenOrders = computed(() => orders.value.filter(o => o.status !== 'served'))

const statusFilters = computed(() => [
  { key: 'all', label: 'Все', icon: 'bi-grid-3x3', count: kitchenOrders.value.length },
  { key: 'pending', label: 'Ожидающие', icon: 'bi-clock', count: kitchenOrders.value.filter(o => o.status === 'pending').length },
  { key: 'in_progress', label: 'В процессе', icon: 'bi-arrow-clockwise', count: kitchenOrders.value.filter(o => o.status === 'in_progress').length },
  { key: 'ready', label: 'Готовые', icon: 'bi-bell-fill', count: kitchenOrders.value.filter(o => o.status === 'ready').length },
  { key: 'cancelled', label: 'Отмененные', icon: 'bi-x-circle', count: kitchenOrders.value.filter(o => o.status === 'cancelled').length }
])

// Зоны с подсчетом
const zonesWithCounts = computed(() => {
  const allZones = [
    { id: 'all', name: 'Все зоны', color: '#6c757d', count: kitchenOrders.value.length }
  ]

  const locationZones = locations.value
    .filter(location => location.is_active)
    .map(location => ({
      id: location.id.toString(),
      name: location.name,
      color: location.color || '#6c757d',
      count: kitchenOrders.value.filter(o => o.zone === location.id.toString()).length
    }))

  return [...allZones, ...locationZones]
})

// Отфильтрованные заказы (исключаем поданные для кухни)
const filteredOrders = computed(() => {
  let filtered = kitchenOrders.value

  // Фильтр по статусу
  if (activeStatusFilter.value !== 'all') {
    filtered = filtered.filter(order => order.status === activeStatusFilter.value)
  }

  // Фильтр по зоне
  if (activeZoneFilter.value !== 'all') {
    filtered = filtered.filter(order => order.zone === activeZoneFilter.value)
  }

  // Сортировка
  filtered.sort((a, b) => {
    let aValue: string | number | Date = a[sortField.value as keyof ExtendedOrder] as string | number | Date
    let bValue: string | number | Date = b[sortField.value as keyof ExtendedOrder] as string | number | Date

    // Специальная обработка для некоторых полей
    if (sortField.value === 'table') {
      aValue = a.tableNumber || 0
      bValue = b.tableNumber || 0
    }

    if (sortField.value === 'created_at') {
      aValue = new Date(aValue || 0).getTime()
      bValue = new Date(bValue || 0).getTime()
    }

    if (typeof aValue === 'string' && typeof bValue === 'string') {
      aValue = aValue.toLowerCase()
      bValue = bValue.toLowerCase()
    }

    if (aValue < bValue) return sortDirection.value === 'asc' ? -1 : 1
    if (aValue > bValue) return sortDirection.value === 'asc' ? 1 : -1
    return 0
  })

  return filtered
})

// Пагинированные заказы
const paginatedOrders = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage
  const end = start + itemsPerPage
  return filteredOrders.value.slice(start, end)
})

// Общее количество страниц
const totalPages = computed(() => {
  return Math.ceil(filteredOrders.value.length / itemsPerPage)
})

// Видимые страницы для пагинации
const visiblePages = computed(() => {
  const pages = []
  const start = Math.max(1, currentPage.value - 2)
  const end = Math.min(totalPages.value, currentPage.value + 2)

  for (let i = start; i <= end; i++) {
    pages.push(i)
  }

  return pages
})

// Статистика
const totalOrders = computed(() => filteredOrders.value.length)
const totalAmount = computed(() => {
  return filteredOrders.value.reduce((sum, order) => {
    const price = typeof order.total_price === 'string' ? parseFloat(order.total_price) : (order.total_price || 0)
    return sum + price
  }, 0)
})

// Методы
const updateTime = () => {
  const now = new Date()
  currentTime.value = now.toLocaleTimeString('ru-RU', {
    hour: '2-digit',
    minute: '2-digit'
  })
}

const loadOrders = async () => {
  try {
    isLoading.value = true
    console.log('Загрузка всех заказов...')

    // Загружаем заказы и локации параллельно
    const [ordersResponse, locationsResponse] = await Promise.all([
      apiService.getOrders(),
      apiService.getLocations()
    ])

    console.log('Получены заказы:', ordersResponse)
    console.log('Получены локации:', locationsResponse)

    // Обрабатываем локации
    let locationsArray: Location[] = []
    if (Array.isArray(locationsResponse)) {
      locationsArray = locationsResponse
    } else if (locationsResponse && typeof locationsResponse === 'object' && 'locations' in locationsResponse) {
      locationsArray = (locationsResponse as { locations: Location[] }).locations || []
    }
    locations.value = locationsArray

    // Обрабатываем заказы
    let ordersArray: ApiOrder[] = []
    if (Array.isArray(ordersResponse)) {
      ordersArray = ordersResponse
    } else if (ordersResponse && typeof ordersResponse === 'object' && 'orders' in ordersResponse) {
      ordersArray = (ordersResponse as { orders: ApiOrder[] }).orders || []
    }

    // Обогащаем заказы информацией о столиках и зонах
    const enrichedOrders: ExtendedOrder[] = await Promise.all(
      ordersArray.map(async (order) => {
        let tableInfo = null
        let zone = 'unknown'

        if (order.table_id) {
          try {
            // Получаем информацию о столике
            const tableResponse = await apiService.getTable(order.table_id)
            if (tableResponse) {
              tableInfo = tableResponse
              // Находим зону по location_id
              const location = locationsArray.find(loc => loc.id === tableResponse.location_id)
              if (location) {
                zone = location.id.toString()
              }
            }
          } catch (error) {
            console.warn(`Ошибка загрузки информации о столике ${order.table_id}:`, error)
          }
        }

        return {
          ...order,
          tableNumber: tableInfo?.number || 'Нет',
          zone
        }
      })
    )

    orders.value = enrichedOrders
    console.log('Заказы загружены и обогащены:', orders.value)

    // Сбрасываем на первую страницу при новой загрузке
    currentPage.value = 1

    notificationStore.addNotification({
      type: 'success',
      title: 'Заказы загружены',
      message: `Загружено ${enrichedOrders.length} заказов`,
      read: false,
      sound: false
    })

  } catch (error) {
    console.error('Ошибка загрузки заказов:', error)
    handleApiError(error, 'загрузки заказов')
  } finally {
    isLoading.value = false
  }
}

const refreshOrders = () => {
  loadOrders()
}

const goBack = () => {
  router.push({ name: 'dashboard' })
}

const goToPage = (page: number) => {
  if (page >= 1 && page <= totalPages.value) {
    currentPage.value = page
  }
}

const markDishReady = async (order: ExtendedOrder) => {
  // Предотвращаем повторные клики
  if (updatingOrders.value.has(order.id)) return

  try {
    // Добавляем в состояние обновления
    updatingOrders.value.add(order.id)

    // Отправляем API запрос для изменения статуса заказа на "готов"
    const updatedOrder = await apiService.updateOrderStatus(order.id, 'ready')

    // Обновляем локально данными с сервера
    const orderIndex = orders.value.findIndex(o => o.id === order.id)
    if (orderIndex !== -1) {
      orders.value[orderIndex] = {
        ...orders.value[orderIndex],
        ...updatedOrder
      }
    }

    notificationStore.addNotification({
      type: 'success',
      title: 'Заказ готов',
      message: `Заказ #${order.id} готов к подаче!`,
      read: false,
      sound: true
    })

  } catch (error) {
    console.error('Ошибка изменения статуса заказа:', error)
    handleApiError(error, 'изменения статуса заказа')
  } finally {
    // Убираем из состояния обновления
    updatingOrders.value.delete(order.id)
  }
}

const getStatusIcon = (status: string) => {
  const icons = {
    pending: 'bi-clock',
    in_progress: 'bi-arrow-clockwise',
    ready: 'bi-bell-fill',
    served: 'bi-check-circle',
    cancelled: 'bi-x-circle'
  }
  return icons[status as keyof typeof icons] || 'bi-question-circle'
}

const getStatusLabel = (status: string) => {
  const labels = {
    pending: 'Ожидает',
    in_progress: 'В процессе',
    ready: 'Готов',
    served: 'Подан',
    cancelled: 'Отменен'
  }
  return labels[status as keyof typeof labels] || 'Неизвестно'
}

const getZoneName = (zoneId?: string) => {
  if (!zoneId || zoneId === 'unknown') return 'Неизвестная зона'
  const location = locations.value.find(loc => loc.id.toString() === zoneId)
  return location?.name || 'Неизвестная зона'
}

const formatDateTime = (dateString?: string) => {
  if (!dateString) return 'Не указано'
  const date = new Date(dateString)
  return date.toLocaleString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const formatTimeAgo = (dateString?: string) => {
  if (!dateString) return ''
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)

  if (diffMins < 60) {
    return `${diffMins}м назад`
  }

  const diffHours = Math.floor(diffMins / 60)
  if (diffHours < 24) {
    return `${diffHours}ч назад`
  }

  const diffDays = Math.floor(diffHours / 24)
  return `${diffDays}д назад`
}

const isLongWaiting = (order: ExtendedOrder) => {
  if (order.status !== 'in_progress' || !order.created_at) return false
  const now = new Date()
  const orderTime = new Date(order.created_at)
  const diffMs = now.getTime() - orderTime.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  return diffMins > 45
}

const viewOrder = (order: ExtendedOrder) => {
  selectedOrder.value = order
  showOrderModal.value = true
}

const closeOrderModal = () => {
  showOrderModal.value = false
  selectedOrder.value = null
}

const markDishReadyFromModal = async () => {
  if (selectedOrder.value) {
    await markDishReady(selectedOrder.value)
    // Закрываем модальное окно после успешного обновления, если заказ стал готовым
    if (selectedOrder.value.status === 'ready') {
      closeOrderModal()
    }
  }
}

const handleApiError = (error: unknown, context: string) => {
  console.error(`Ошибка ${context}:`, error)

  let errorMessage = 'Произошла неизвестная ошибка'

  if (error && typeof error === 'object' && 'response' in error) {
    const axiosError = error as { response: { status: number; data?: { message?: string } } }
    errorMessage = axiosError.response.data?.message || `Ошибка сервера: ${axiosError.response.status}`
  } else if (error && typeof error === 'object' && 'request' in error) {
    errorMessage = 'Ошибка сети. Проверьте подключение к интернету'
  } else if (error instanceof Error) {
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

// Таймер для обновления времени
let timeInterval: number

onMounted(async () => {
  updateTime()
  timeInterval = setInterval(updateTime, 1000) as unknown as number

  // Загружаем заказы при монтировании
  await loadOrders()
})

onUnmounted(() => {
  if (timeInterval) {
    clearInterval(timeInterval)
  }
})
</script>

<style scoped lang="scss">
// Используем те же стили что и в Dashboard
@use '@/styles/views/dashboard';

// Дополнительные стили для страницы заказов
.orders-list-view {
  min-height: 100vh;
  background-color: var(--bs-gray-50);
}

.orders-controls {
  background: white;
  border-radius: 0.5rem;
  box-shadow: 0 0.125rem 0.25rem rgba(0, 0, 0, 0.075);
  margin: 1rem auto;
  padding: 1.5rem;
  max-width: 100%;
  width: 100%;

  .container-fluid {
    padding: 0;
  }
}

.filters-section {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.filter-group {
  display: flex;
  align-items: center;
  gap: 1rem;
  flex-wrap: wrap;
}

.filter-label {
  font-weight: 600;
  color: var(--bs-gray-700);
  min-width: 60px;
  margin: 0;
}

.filter-buttons {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.filter-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  border: 1px solid var(--bs-gray-300);
  background: white;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background: var(--bs-gray-50);
    border-color: var(--bs-primary);
  }

  &.active {
    background: var(--bs-primary);
    border-color: var(--bs-primary);
    color: white;
  }
}

.zone-btn.active {
  background: var(--zone-color);
  border-color: var(--zone-color);
}

.filter-count {
  font-size: 0.75rem;
  opacity: 0.8;
}

.orders-stats {
  display: flex;
  gap: 2rem;
  justify-content: flex-end;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.stat-icon {
  font-size: 2rem;
  color: var(--bs-primary);
}

.stat-content {
  text-align: left;
}

.stat-number {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--bs-gray-900);
  line-height: 1;
}

.stat-label {
  font-size: 0.875rem;
  color: var(--bs-gray-600);
}

.orders-grid-section {
  margin: 1rem auto;
  max-width: 100%;
}

.orders-grid-wrapper {
  background: white;
  border-radius: 0.5rem;
  box-shadow: 0 0.125rem 0.25rem rgba(0, 0, 0, 0.075);
  padding: 1.5rem;
}

.orders-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
}

.order-card {
  background: white;
  border: 2px solid var(--bs-gray-200);
  border-radius: 1rem;
  padding: 1.5rem;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 0.25rem 0.5rem rgba(0, 0, 0, 0.05);
  position: relative;
  overflow: hidden;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 0.5rem 1.5rem rgba(0, 0, 0, 0.15);
    border-color: var(--bs-primary);
  }

  &.status-pending {
    border-left: 6px solid var(--bs-warning);
    background: linear-gradient(135deg, rgba(var(--bs-warning-rgb), 0.05) 0%, white 50%);
  }

  &.status-in_progress {
    border-left: 6px solid var(--bs-info);
    background: linear-gradient(135deg, rgba(var(--bs-info-rgb), 0.05) 0%, white 50%);
  }

  &.status-ready {
    border-left: 6px solid var(--bs-success);
    background: linear-gradient(135deg, rgba(var(--bs-success-rgb), 0.05) 0%, white 50%);
    animation: pulse-ready 2s infinite;
  }

  &.status-cancelled {
    border-left: 6px solid var(--bs-danger);
    background: linear-gradient(135deg, rgba(var(--bs-danger-rgb), 0.05) 0%, white 50%);
    opacity: 0.6;
  }

  &.long-waiting {
    animation: pulse-warning 1.5s infinite;
    border-color: var(--bs-danger);
  }
}

@keyframes pulse-ready {
  0%, 100% { box-shadow: 0 0.25rem 0.5rem rgba(0, 0, 0, 0.05); }
  50% { box-shadow: 0 0.5rem 1.5rem rgba(var(--bs-success-rgb), 0.3); }
}

@keyframes pulse-warning {
  0%, 100% { box-shadow: 0 0.25rem 0.5rem rgba(0, 0, 0, 0.05); }
  50% { box-shadow: 0 0.5rem 1.5rem rgba(var(--bs-danger-rgb), 0.3); }
}

.order-card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 1.5rem;
  padding-bottom: 1rem;
  border-bottom: 2px solid var(--bs-gray-100);
}

.order-main-info {
  .order-number {
    font-size: 1.75rem;
    font-weight: 700;
    color: var(--bs-primary);
    margin: 0 0 0.5rem 0;
    font-family: 'SF Mono', 'Monaco', 'Consolas', monospace;
  }

  .order-table {
    font-size: 1rem;
    color: var(--bs-gray-700);
    font-weight: 600;
  }
}

.order-status-section {
  text-align: right;

  .status-badge {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem 1rem;
    border-radius: 2rem;
    font-size: 0.875rem;
    font-weight: 600;
    margin-bottom: 0.5rem;

    &.status-pending {
      background: var(--bs-warning);
      color: white;
    }

    &.status-in_progress {
      background: var(--bs-info);
      color: white;
    }

    &.status-ready {
      background: var(--bs-success);
      color: white;
    }

    &.status-cancelled {
      background: var(--bs-danger);
      color: white;
    }
  }

  .order-time-info {
    font-size: 0.875rem;
    color: var(--bs-gray-600);
    font-weight: 500;
  }
}

.order-items-section {
  margin-bottom: 1.5rem;

  .items-title {
    font-size: 1.1rem;
    font-weight: 600;
    color: var(--bs-gray-800);
    margin-bottom: 1rem;
    display: flex;
    align-items: center;
  }
}

.order-items-list {
  .order-item {
    background: var(--bs-gray-50);
    border: 1px solid var(--bs-gray-200);
    border-radius: 0.5rem;
    padding: 1rem;
    margin-bottom: 0.75rem;

    &:last-child {
      margin-bottom: 0;
    }

    .item-main {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      margin-bottom: 0.5rem;

      .item-quantity {
        background: var(--bs-primary);
        color: white;
        padding: 0.25rem 0.5rem;
        border-radius: 1rem;
        font-size: 0.875rem;
        font-weight: 600;
        min-width: 2.5rem;
        text-align: center;
      }

      .item-name {
        font-weight: 600;
        color: var(--bs-gray-900);
        font-size: 1rem;
      }
    }

    .item-comment {
      font-size: 0.875rem;
      color: var(--bs-info);
      font-style: italic;
      background: rgba(var(--bs-info-rgb), 0.1);
      padding: 0.5rem;
      border-radius: 0.25rem;
      border-left: 3px solid var(--bs-info);
    }
  }

  .more-items {
    text-align: center;
    padding: 0.75rem;
    color: var(--bs-gray-600);
    font-style: italic;
    border: 1px dashed var(--bs-gray-300);
    border-radius: 0.5rem;
    background: var(--bs-gray-25);
  }
}

.order-meta-section {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 0.75rem;
  margin-bottom: 1.5rem;
  padding: 1rem;
  background: var(--bs-gray-25);
  border-radius: 0.5rem;

  .order-meta-item {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.875rem;
    color: var(--bs-gray-700);

    i {
      color: var(--bs-primary);
      font-size: 1rem;
    }
  }
}

.order-actions {
  .kitchen-action-btn {
    width: 100%;
    padding: 1rem;
    border: none;
    border-radius: 0.75rem;
    font-size: 1.1rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.3s ease;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;

    &.ready-btn {
      background: linear-gradient(135deg, var(--bs-success), #157347);
      color: white;
      box-shadow: 0 0.25rem 0.5rem rgba(var(--bs-success-rgb), 0.3);

      &:hover:not(:disabled) {
        background: linear-gradient(135deg, #157347, var(--bs-success));
        transform: translateY(-2px);
        box-shadow: 0 0.5rem 1rem rgba(var(--bs-success-rgb), 0.4);
      }

      &:disabled,
      &.updating {
        opacity: 0.7;
        cursor: not-allowed;
        transform: none;
        background: linear-gradient(135deg, #6c757d, #5a6268);
      }
    }
  }

  .order-completed {
    text-align: center;
    padding: 1rem;
    color: var(--bs-success);
    font-weight: 600;
    background: rgba(var(--bs-success-rgb), 0.1);
    border-radius: 0.75rem;
    border: 2px solid rgba(var(--bs-success-rgb), 0.2);
  }

  .order-ready {
    text-align: center;
    padding: 1rem;
    color: var(--bs-success);
    font-weight: 600;
    background: rgba(var(--bs-success-rgb), 0.15);
    border-radius: 0.75rem;
    border: 2px solid rgba(var(--bs-success-rgb), 0.3);
    animation: pulse-green 2s infinite;
  }

  .order-cancelled {
    text-align: center;
    padding: 1rem;
    color: var(--bs-danger);
    font-weight: 600;
    background: rgba(var(--bs-danger-rgb), 0.1);
    border-radius: 0.75rem;
    border: 2px solid rgba(var(--bs-danger-rgb), 0.2);
  }
}

@keyframes pulse-green {
  0%, 100% {
    background: rgba(var(--bs-success-rgb), 0.15);
    border-color: rgba(var(--bs-success-rgb), 0.3);
  }
  50% {
    background: rgba(var(--bs-success-rgb), 0.25);
    border-color: rgba(var(--bs-success-rgb), 0.5);
  }
}

.waiting-indicator {
  position: absolute;
  top: 1rem;
  right: 1rem;
  background: var(--bs-danger);
  color: white;
  padding: 0.5rem 1rem;
  border-radius: 1rem;
  font-size: 0.875rem;
  font-weight: 600;
  animation: pulse 1s infinite;
  z-index: 1;
}

.loading-state,
.empty-state {
  text-align: center;
  padding: 4rem 2rem;
  color: var(--bs-gray-600);
}

.empty-icon {
  font-size: 4rem;
  color: var(--bs-gray-400);
  margin-bottom: 1rem;
}

.pagination-wrapper {
  padding: 2rem;
  text-align: center;
}

.pagination-info {
  margin-top: 1rem;
  font-size: 0.875rem;
  color: var(--bs-gray-600);
}

// Модальное окно - переиспользуем стили из Dashboard
.order-modal-backdrop {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1050;
  backdrop-filter: blur(4px);
}

.order-modal {
  background: white;
  border-radius: 0.5rem;
  max-width: 800px;
  width: 90%;
  max-height: 90vh;
  overflow: hidden;
  box-shadow: 0 1rem 3rem rgba(0, 0, 0, 0.175);
  display: flex;
  flex-direction: column;
}

.order-modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1.5rem;
  border-bottom: 1px solid var(--bs-gray-200);
  background: var(--bs-gray-50);
}

.order-modal-title {
  margin: 0;
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--bs-gray-900);
}

.order-modal-close {
  background: none;
  border: none;
  font-size: 1.25rem;
  color: var(--bs-gray-600);
  cursor: pointer;
  padding: 0.25rem;
  border-radius: 0.25rem;
  transition: all 0.2s ease;

  &:hover {
    background: var(--bs-gray-200);
    color: var(--bs-gray-900);
  }
}

.order-modal-body {
  flex: 1;
  padding: 1.5rem;
  overflow-y: auto;
}

.order-info-section {
  .info-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0.5rem 0;
    border-bottom: 1px solid var(--bs-gray-100);

    &:last-child {
      border-bottom: none;
    }

    label {
      font-weight: 500;
      color: var(--bs-gray-700);
      margin: 0;
    }

    span {
      color: var(--bs-gray-900);
    }
  }
}

.order-section-title {
  margin-bottom: 1rem;
  padding-bottom: 0.5rem;
  border-bottom: 2px solid var(--bs-gray-200);
  font-size: 1.1rem;
  font-weight: 600;
  color: var(--bs-gray-800);
}

.order-items-list {
  .order-item {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    padding: 1rem;
    border: 1px solid var(--bs-gray-200);
    border-radius: 0.375rem;
    margin-bottom: 0.75rem;
    background: var(--bs-gray-25);

    &:last-child {
      margin-bottom: 0;
    }

    .order-item-info {
      flex: 1;

      .item-name {
        font-weight: 500;
        color: var(--bs-gray-900);
        margin-bottom: 0.25rem;
      }

      .item-details {
        font-size: 0.875rem;
        color: var(--bs-gray-600);

        .item-comment {
          color: var(--bs-info);
          font-style: italic;
        }
      }
    }

    .order-item-price {
      font-weight: 600;
      color: var(--bs-gray-900);
      margin-left: 1rem;
    }
  }
}

.order-notes {
  background: var(--bs-gray-50);
  padding: 1rem;
  border-radius: 0.375rem;
  border-left: 4px solid var(--bs-info);
  font-style: italic;
  color: var(--bs-gray-700);
}

.order-modal-footer {
  padding: 1.5rem;
  border-top: 1px solid var(--bs-gray-200);
  background: var(--bs-gray-50);
}

.order-modal-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.order-total-text {
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--bs-gray-900);
}

.modal-action-buttons {
  display: flex;
  gap: 0.5rem;
}

// Анимация загрузки
.spin {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

// Адаптивность
@media (max-width: 1200px) {
  .orders-grid {
    grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  }
}

@media (max-width: 768px) {
  .filters-section {
    .filter-group {
      flex-direction: column;
      align-items: flex-start;
    }

    .filter-label {
      min-width: auto;
    }
  }

  .orders-stats {
    flex-direction: column;
    gap: 1rem;
    align-items: flex-start;
  }

  .orders-grid {
    grid-template-columns: 1fr;
    gap: 1rem;
  }

  .order-card {
    padding: 1rem;

    .order-card-header {
      flex-direction: column;
      align-items: flex-start;
      gap: 1rem;
    }

    .order-status-section {
      text-align: left;
      width: 100%;
    }

    .order-meta-section {
      grid-template-columns: 1fr;
      gap: 0.5rem;
    }
  }

  .order-modal {
    width: 95%;
    margin: 1rem;
  }

  .order-modal-actions {
    flex-direction: column;
    gap: 1rem;
    align-items: stretch;

    .order-total-text {
      text-align: center;
    }

    .modal-action-buttons {
      justify-content: center;
    }
  }
}

@media (max-width: 480px) {
  .order-card {
    .order-main-info .order-number {
      font-size: 1.5rem;
    }

    .order-items-list .order-item .item-main {
      flex-direction: column;
      align-items: flex-start;
      gap: 0.5rem;
    }

    .kitchen-action-btn {
      padding: 0.75rem;
      font-size: 1rem;
    }
  }
}
</style>
