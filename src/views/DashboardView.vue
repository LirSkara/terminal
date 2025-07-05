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
                  <button
                    v-for="zone in zonesWithCounts"
                    :key="zone.id"
                    @click="switchZone(zone.id)"
                    :class="['zone-tab-compact', { active: activeZone === zone.id }]"
                    :style="{ '--zone-color': zone.color }"
                    :title="zone.name"
                  >
                    <i :class="zone.icon"></i>
                    <span class="zone-count">{{ zone.count }}</span>
                  </button>
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
        <div class="tables-grid" :key="`zone-${activeZone}-filter-${activeFilter}`">
          <div
            v-for="table in filteredTables"
            :key="table.id"
            @click="openTable(table)"
            :class="[
              'table-card',
              `table-status-${table.status}`,
              { 'table-pulse': table.status === 'ready' }
            ]"
          >
            <div class="table-card-inner">
              <!-- Статус индикатор -->
              <div class="table-status-indicator">
                <i :class="getTableIcon(table.status)"></i>
              </div>

              <!-- Номер столика -->
              <div class="table-number">
                {{ table.number }}
              </div>

              <!-- Информация о столике -->
              <div class="table-info">
                <div class="seats-count">
                  <i class="bi bi-people-fill"></i>
                  {{ table.seats }} мест
                </div>

                <!-- Дополнительная информация в зависимости от статуса -->
                <div class="table-details">
                  <template v-if="table.status === 'occupied'">
                    <div class="order-info-line">
                      <i class="bi bi-clock"></i>
                      {{ formatTime(table.orderTime) }}
                      <span class="separator">•</span>
                      {{ table.orderAmount }}₽
                    </div>
                  </template>

                  <template v-if="table.status === 'qr-waiting'">
                    <div class="order-info-line">
                      <i class="bi bi-clock"></i>
                      {{ formatTime(table.orderTime) }}
                      <span class="separator">•</span>
                      {{ table.orderAmount }}₽
                    </div>
                  </template>

                  <template v-if="table.status === 'ready'">
                    <div class="ready-indicator">
                      <i class="bi bi-check-circle-fill"></i>
                      Заказ готов!
                    </div>
                  </template>

                  <template v-if="table.status === 'cleaning'">
                    <div class="cleaning-indicator">
                      <i class="bi bi-arrow-clockwise"></i>
                      Уборка
                    </div>
                  </template>
                </div>
              </div>

              <!-- Быстрые действия -->
              <div class="table-actions" @click.stop>
                <button
                  v-if="table.status === 'free'"
                  @click="openTable(table)"
                  class="action-btn primary"
                  title="Открыть столик"
                >
                  <i class="bi bi-plus-lg"></i>
                </button>

                <button
                  v-if="table.status === 'occupied'"
                  @click="addToOrder(table)"
                  class="action-btn success"
                  title="Добавить к заказу"
                >
                  <i class="bi bi-plus"></i>
                </button>

                <button
                  v-if="table.status === 'occupied'"
                  @click="viewOrder(table)"
                  class="action-btn view-order"
                  title="Посмотреть заказ"
                >
                  <i class="bi bi-eye"></i>
                </button>

                <button
                  v-if="table.status === 'qr-waiting'"
                  @click="confirmQrOrder(table)"
                  class="action-btn qr-confirm"
                  title="Подтвердить QR заказ"
                >
                  <i class="bi bi-check-lg"></i>
                </button>

                <button
                  v-if="table.status === 'qr-waiting'"
                  @click="viewQrOrder(table)"
                  class="action-btn qr-view"
                  title="Посмотреть заказ"
                >
                  <i class="bi bi-eye"></i>
                </button>

                <button
                  v-if="table.status === 'ready'"
                  @click="serveOrder(table)"
                  class="action-btn ready"
                  title="Подать заказ"
                >
                  <i class="bi bi-check"></i>
                </button>

                <button
                  v-if="table.status === 'occupied' || table.status === 'qr-waiting'"
                  @click="printBill(table)"
                  class="action-btn print-bill"
                  title="Счет"
                >
                  <i class="bi bi-receipt"></i>
                </button>

                <button
                  v-if="table.status === 'cleaning'"
                  @click="closeTable(table)"
                  class="action-btn finish-cleaning"
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
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useRouter } from 'vue-router'

// Типы
interface Table {
  id: number
  number: string
  seats: number
  status: 'free' | 'occupied' | 'ready' | 'cleaning' | 'qr-waiting'
  orderTime: Date | null
  orderAmount: number
  hasQrOrder?: boolean
  zone: string
}

interface Zone {
  id: string
  name: string
  icon: string
  color: string
}

// Auth store
const authStore = useAuthStore()

// Router
const router = useRouter()

// Реактивные данные
const currentTime = ref('')
const activeFilter = ref('all')
const activeZone = ref('all')

// Зоны ресторана
const zones = ref<Zone[]>([
  { id: 'all', name: 'Все зоны', icon: 'bi-grid-3x3', color: '#6c757d' },
  { id: 'hall', name: 'Основной зал', icon: 'bi-house-door', color: '#3498db' },
  { id: 'terrace', name: 'Терраса', icon: 'bi-tree', color: '#27ae60' },
  { id: 'vip', name: 'VIP зона', icon: 'bi-star-fill', color: '#f39c12' },
  { id: 'bar', name: 'Барная зона', icon: 'bi-cup-straw', color: '#9b59b6' }
])

// Имя официанта из store
const waiterName = computed(() => {
  return authStore.user?.full_name || authStore.user?.username || 'Не определен'
})

// Данные столиков (демо)
const tables = ref<Table[]>([
  { id: 1, number: '01', seats: 2, status: 'free', orderTime: null, orderAmount: 0, zone: 'hall' },
  { id: 2, number: '02', seats: 4, status: 'occupied', orderTime: new Date(Date.now() - 3000000), orderAmount: 1250, zone: 'hall' }, // 50 минут назад - долго ждёт
  { id: 3, number: '03', seats: 6, status: 'ready', orderTime: new Date(Date.now() - 3600000), orderAmount: 2340, zone: 'hall' },
  { id: 4, number: '04', seats: 2, status: 'qr-waiting', orderTime: new Date(Date.now() - 300000), orderAmount: 890, hasQrOrder: true, zone: 'bar' },
  { id: 5, number: '05', seats: 4, status: 'occupied', orderTime: new Date(Date.now() - 900000), orderAmount: 890, zone: 'terrace' },
  { id: 6, number: '06', seats: 8, status: 'cleaning', orderTime: null, orderAmount: 0, zone: 'terrace' },
  { id: 7, number: '07', seats: 2, status: 'qr-waiting', orderTime: new Date(Date.now() - 600000), orderAmount: 1456, hasQrOrder: true, zone: 'terrace' },
  { id: 8, number: '08', seats: 4, status: 'ready', orderTime: new Date(Date.now() - 2700000), orderAmount: 1680, zone: 'vip' },
  { id: 9, number: '09', seats: 6, status: 'occupied', orderTime: new Date(Date.now() - 600000), orderAmount: 456, zone: 'vip' },
  { id: 10, number: '10', seats: 4, status: 'free', orderTime: null, orderAmount: 0, zone: 'vip' }
])

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
  // Здесь будет логика просмотра QR заказа
}

const viewOrder = (table: Table) => {
  console.log('Посмотреть заказ столика:', table.number)
  // Здесь будет логика просмотра обычного заказа
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
  console.log('Показать долго ждущие столики')
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

onMounted(() => {
  updateTime()
  timeInterval = setInterval(updateTime, 1000) as unknown as number
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
@import '@/styles/views/dashboard';
</style>
