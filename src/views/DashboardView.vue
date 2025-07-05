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
                  @click="showKitchen"
                  class="quick-action-btn kitchen"
                  title="Связь с кухней"
                >
                  <i class="bi bi-chat-dots-fill"></i>
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
  { id: 2, number: '02', seats: 4, status: 'occupied', orderTime: new Date(Date.now() - 1800000), orderAmount: 1250, zone: 'hall' },
  { id: 3, number: '03', seats: 6, status: 'ready', orderTime: new Date(Date.now() - 3600000), orderAmount: 2340, zone: 'hall' },
  { id: 4, number: '04', seats: 2, status: 'qr-waiting', orderTime: new Date(Date.now() - 300000), orderAmount: 890, hasQrOrder: true, zone: 'hall' },
  { id: 5, number: '05', seats: 4, status: 'occupied', orderTime: new Date(Date.now() - 900000), orderAmount: 890, zone: 'terrace' },
  { id: 6, number: '06', seats: 8, status: 'cleaning', orderTime: null, orderAmount: 0, zone: 'terrace' },
  { id: 7, number: '07', seats: 2, status: 'qr-waiting', orderTime: new Date(Date.now() - 600000), orderAmount: 1456, hasQrOrder: true, zone: 'terrace' },
  { id: 8, number: '08', seats: 4, status: 'ready', orderTime: new Date(Date.now() - 2700000), orderAmount: 1680, zone: 'vip' },
  { id: 9, number: '09', seats: 6, status: 'occupied', orderTime: new Date(Date.now() - 600000), orderAmount: 456, zone: 'vip' },
  { id: 10, number: '10', seats: 4, status: 'free', orderTime: null, orderAmount: 0, zone: 'vip' },
  { id: 11, number: '11', seats: 2, status: 'occupied', orderTime: new Date(Date.now() - 2100000), orderAmount: 1100, zone: 'bar' },
  { id: 12, number: '12', seats: 6, status: 'qr-waiting', orderTime: new Date(Date.now() - 900000), orderAmount: 2100, hasQrOrder: true, zone: 'bar' }
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

// Стабильные счетчики для фильтров (только для текущей зоны, без зависимости от активного фильтра)
const filtersWithCounts = computed(() => {
  const currentZoneTables = activeZone.value === 'all'
    ? tables.value
    : tables.value.filter(t => t.zone === activeZone.value)

  return [
    { key: 'all', label: 'Все', icon: 'bi-grid-3x3', count: currentZoneTables.length },
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
    filtered = filtered.filter(table => table.status === activeFilter.value)
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
  // Здесь будет логика открытия столика
}

const addToOrder = (table: Table) => {
  console.log('Добавить к заказу столика:', table.number)
  // Здесь будет логика добавления к заказу
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
  console.log('Создать новый заказ')
  // Здесь будет логика создания нового заказа
  // Возможно, откроется модальное окно с выбором столика или создание заказа на вынос
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

const showKitchen = () => {
  console.log('Связь с кухней')
  // Здесь будет логика открытия чата с кухней или уведомлений
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
.dashboard-view {
  position: relative;
  z-index: 1;
  min-height: 100vh;
}

// Заголовок Dashboard
.dashboard-header {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border-radius: 20px;
  margin: 1rem;
  padding: 2rem;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  position: relative;
  z-index: 2;
}

.dashboard-title {
  font-size: 2.5rem;
  font-weight: 800;
  color: #2c3e50;
  margin-bottom: 0.5rem;
  display: flex;
  align-items: center;

  i {
    background: linear-gradient(45deg, #667eea, #764ba2);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }
}

.dashboard-subtitle {
  color: #6c757d;
  font-size: 1.1rem;
  margin: 0;

  .badge {
    font-size: 0.9rem;
    padding: 0.5rem 1rem;
  }
}

.header-right-section {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  align-items: flex-end;
}

.stats-and-create {
  display: flex;
  gap: 2rem;
  align-items: center;
  justify-content: flex-end;
}

.quick-actions-section {
  display: flex;
  gap: 0.75rem;
  justify-content: flex-end;
  align-items: center;
}

.quick-action-btn {
  position: relative;
  width: 48px;
  height: 48px;
  border-radius: 12px;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.2rem;
  color: white;
  transition: all 0.3s ease;
  cursor: pointer;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 25px rgba(0, 0, 0, 0.2);
  }

  &.ready {
    background: linear-gradient(45deg, #f39c12, #f4d03f);

    &.pulse {
      animation: urgent-pulse 1.5s infinite;
    }
  }

  &.kitchen {
    background: linear-gradient(45deg, #9b59b6, #8e44ad);
  }

  &.waiting {
    background: linear-gradient(45deg, #e74c3c, #c0392b);

    &.pulse {
      animation: urgent-pulse 1.5s infinite;
    }
  }

  &.logout {
    width: auto;
    min-width: 48px;
    padding: 0 16px;
    background: linear-gradient(45deg, #e74c3c, #c0392b);
    gap: 8px;

    &:hover {
      background: linear-gradient(45deg, #c0392b, #e74c3c);
    }

    .logout-text {
      font-size: 0.85rem;
      font-weight: 500;
      white-space: nowrap;
    }

    i {
      font-size: 1.1rem;
    }
  }

  .badge-count {
    position: absolute;
    top: -8px;
    right: -8px;
    background: #e74c3c;
    color: white;
    border-radius: 50%;
    width: 20px;
    height: 20px;
    font-size: 0.7rem;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 700;
    border: 2px solid white;
  }
}

.quick-stats {
  display: flex;
  gap: 1.5rem;
  align-items: center;
}

.stat-item {
  text-align: center;
  cursor: pointer;
  padding: 0.5rem;
  border-radius: 8px;
  transition: all 0.3s ease;

  &.clickable:hover {
    background: rgba(102, 126, 234, 0.1);
    transform: translateY(-1px);
  }

  .stat-number {
    display: block;
    font-size: 2rem;
    font-weight: 700;
    line-height: 1;
  }

  .stat-label {
    display: block;
    font-size: 0.9rem;
    color: #6c757d;
    margin-top: 0.25rem;
  }
}

.header-actions {
  display: flex;
  justify-content: flex-end;
}

.create-order-btn-large {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: none;
  border-radius: 16px;
  padding: 1rem 2rem;
  color: white;
  font-weight: 700;
  font-size: 1.2rem;
  display: flex;
  align-items: center;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 6px 20px rgba(102, 126, 234, 0.3);

  &:hover {
    transform: translateY(-3px);
    box-shadow: 0 12px 35px rgba(102, 126, 234, 0.4);
    background: linear-gradient(135deg, #764ba2 0%, #667eea 100%);
  }

  &:active {
    transform: translateY(-1px);
  }

  i {
    font-size: 1.3rem;
  }
}

.stat-item {
  text-align: center;

  .stat-number {
    display: block;
    font-size: 2rem;
    font-weight: 700;
    line-height: 1;
  }

  .stat-label {
    display: block;
    font-size: 0.9rem;
    color: #6c757d;
    margin-top: 0.25rem;
  }
}

// Секция столиков
.tables-section {
  padding: 0 1rem 2rem;
}

// Вкладки зон
.zones-tabs {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border-radius: 20px;
  padding: 1.5rem;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  margin-bottom: 1.5rem;
}

.zones-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
}

.zones-title {
  font-size: 1.5rem;
  font-weight: 700;
  color: #2c3e50;
  margin: 0;
  display: flex;
  align-items: center;

  i {
    background: linear-gradient(45deg, #667eea, #764ba2);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }
}

.zone-stats {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.current-zone-info {
  font-size: 1rem;
  color: #6c757d;
  font-weight: 600;
  padding: 0.5rem 1rem;
  background: rgba(102, 126, 234, 0.1);
  border-radius: 20px;
}

.zones-navigation {
  display: flex;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.zone-tab {
  background: rgba(255, 255, 255, 0.8);
  border: 2px solid transparent;
  border-radius: 16px;
  padding: 1rem 1.5rem;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  font-weight: 600;
  color: #6c757d;
  transition: all 0.3s ease;
  cursor: pointer;
  position: relative;
  overflow: hidden;
  min-width: 140px;

  &:hover {
    background: rgba(255, 255, 255, 1);
    border-color: var(--zone-color, #667eea);
    transform: translateY(-2px);
    box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
    color: var(--zone-color, #667eea);
  }

  &.active {
    background: var(--zone-color, #667eea);
    color: white;
    border-color: transparent;
    box-shadow: 0 8px 25px rgba(0, 0, 0, 0.2);

    .zone-indicator {
      background: rgba(255, 255, 255, 0.3);
      color: white;
    }
  }

  i {
    font-size: 1.2rem;
  }

  span {
    flex: 1;
    text-align: left;
  }
}

.zone-indicator {
  background: rgba(108, 117, 125, 0.2);
  border-radius: 20px;
  padding: 0.25rem 0.75rem;
  font-size: 0.85rem;
  font-weight: 700;
  min-width: 2rem;
  text-align: center;
  transition: all 0.3s ease;
}

// Элементы управления
.tables-controls {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border-radius: 20px;
  padding: 1.5rem;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.filter-buttons {
  display: flex;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.filter-btn {
  background: rgba(255, 255, 255, 0.8);
  border: 2px solid transparent;
  border-radius: 12px;
  padding: 0.75rem 1.25rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: 600;
  color: #6c757d;
  transition: all 0.3s ease;
  cursor: pointer;
  position: relative;
  overflow: hidden;

  &:hover {
    background: rgba(255, 255, 255, 1);
    border-color: rgba(102, 126, 234, 0.3);
    transform: translateY(-2px);
    box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
  }

  &.active {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    border-color: transparent;
    box-shadow: 0 8px 25px rgba(102, 126, 234, 0.3);
  }

  .count {
    background: rgba(255, 255, 255, 0.2);
    border-radius: 20px;
    padding: 0.25rem 0.5rem;
    font-size: 0.8rem;
    min-width: 1.5rem;
    text-align: center;
  }

  &.active .count {
    background: rgba(255, 255, 255, 0.3);
  }
}

// Компактная объединенная панель управления
.unified-controls {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border-radius: 20px;
  padding: 1rem 1.5rem;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  margin-bottom: 1.5rem;
}

.controls-left {
  display: flex;
  align-items: center;
  gap: 1.5rem;
  flex-wrap: wrap;
}

// Компактные зоны
.zones-compact {
  display: flex;
  gap: 0.5rem;
  align-items: center;
}

.zone-tab-compact {
  position: relative;
  width: 56px;
  height: 56px;
  border-radius: 16px;
  border: 2px solid transparent;
  background: rgba(255, 255, 255, 0.8);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s ease;
  color: #6c757d;
  font-weight: 600;

  i {
    font-size: 1.1rem;
    margin-bottom: 2px;
  }

  .zone-count {
    font-size: 0.7rem;
    font-weight: 700;
    line-height: 1;
  }

  &:hover {
    background: rgba(255, 255, 255, 1);
    border-color: var(--zone-color, #667eea);
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(0, 0, 0, 0.1);
    color: var(--zone-color, #667eea);
  }

  &.active {
    background: var(--zone-color, #667eea);
    color: white;
    border-color: transparent;
    box-shadow: 0 6px 20px rgba(0, 0, 0, 0.2);
    transform: translateY(-2px);

    .zone-count {
      color: rgba(255, 255, 255, 0.9);
    }
  }
}

// Компактные фильтры
.filters-compact {
  display: flex;
  gap: 0.5rem;
  align-items: center;
}

.filter-btn-compact {
  position: relative;
  width: 48px;
  height: 48px;
  border-radius: 12px;
  border: 2px solid transparent;
  background: rgba(255, 255, 255, 0.8);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s ease;
  color: #6c757d;
  font-weight: 600;

  i {
    font-size: 1rem;
    margin-bottom: 1px;
  }

  .filter-count {
    font-size: 0.65rem;
    font-weight: 700;
    line-height: 1;
  }

  &:hover {
    background: rgba(255, 255, 255, 1);
    border-color: rgba(102, 126, 234, 0.3);
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(0, 0, 0, 0.1);
    color: #667eea;
  }

  &.active {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    border-color: transparent;
    box-shadow: 0 6px 20px rgba(102, 126, 234, 0.3);
    transform: translateY(-2px);

    .filter-count {
      color: rgba(255, 255, 255, 0.9);
    }
  }
}

.search-box {
  position: relative;

  i {
    position: absolute;
    left: 1rem;
    top: 50%;
    transform: translateY(-50%);
    color: #6c757d;
    z-index: 2;
  }

  .form-control {
    padding-left: 2.5rem;
    border-radius: 12px;
    border: 2px solid rgba(0, 0, 0, 0.1);
    background: rgba(255, 255, 255, 0.9);
    backdrop-filter: blur(10px);
    transition: all 0.3s ease;

    &:focus {
      border-color: #667eea;
      box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
      background: white;
    }
  }
}


// Сетка столиков
.tables-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 1.5rem;
  margin-top: 1.5rem;
  animation: fadeInUp 0.4s ease-out;
}

// Карточки столиков
.table-card {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border-radius: 20px;
  border: 2px solid transparent;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
  cursor: pointer;
  position: relative;
  overflow: hidden;

  &:hover {
    transform: translateY(-5px);
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.15);
  }

  &.table-pulse {
    animation: table-pulse 2s infinite;
  }
}

.table-card-inner {
  padding: 1.5rem;
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 240px;
  justify-content: space-between;
}

.table-status-indicator {
  position: absolute;
  top: 1rem;
  right: 1rem;
  width: 50px;
  height: 50px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.25rem;
  color: white;

  .table-status-free & {
    background: linear-gradient(45deg, #27ae60, #2ecc71);
  }

  .table-status-occupied & {
    background: linear-gradient(45deg, #3498db, #5dade2);
  }

  .table-status-qr-waiting & {
    background: linear-gradient(45deg, #9b59b6, #e74c3c);
    animation: qr-pulse 1.5s infinite;
  }

  .table-status-ready & {
    background: linear-gradient(45deg, #f39c12, #f4d03f);
    animation: ready-pulse 1.5s infinite;
  }

  .table-status-cleaning & {
    background: linear-gradient(45deg, #95a5a6, #bdc3c7);

    i {
      animation: spin 2s linear infinite;
    }
  }
}

.table-number {
  font-size: 4rem;
  font-weight: 900;
  color: #2c3e50;
  line-height: 1;
  margin-bottom: 1rem;
  text-align: center;
}

.table-info {
  margin-bottom: 1rem;
  flex-grow: 1;
  display: flex;
  flex-direction: column;
  text-align: center;
}

.seats-count {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.3rem;
  font-weight: 600;
  font-size: 0.9rem;
  color: #6c757d;
  margin-bottom: 0.5rem;
}

.table-details {
  .order-info-line {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.4rem;
    font-size: 0.85rem;
    font-weight: 600;
    color: #5a6c7d;
    margin-bottom: 0.3rem;
    flex-wrap: nowrap;

    .separator {
      color: #95a5a6;
      font-weight: 400;
    }
  }

  .order-time,
  .order-amount {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.3rem;
    font-size: 0.85rem;
    font-weight: 600;
    color: #5a6c7d;
    margin-bottom: 0.3rem;
  }

  .ready-indicator {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.3rem;
    color: #f39c12;
    font-weight: 700;
    font-size: 0.9rem;
    text-align: center;
    margin-top: 0.3rem;
    animation: ready-glow 2s infinite;
  }

  .cleaning-indicator {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.3rem;
    color: #95a5a6;
    font-weight: 600;
    font-size: 0.85rem;
    text-align: center;
  }
}

.table-actions {
  display: flex;
  gap: 0.5rem;
  justify-content: stretch;
  margin-top: auto;
  padding-top: 0.75rem;
  width: 100%;
}

.action-btn {
  flex: 1;
  min-width: 0;
  height: 82px;
  border-radius: 16px;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.6rem;
  color: white;
  transition: all 0.3s ease;
  cursor: pointer;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 25px rgba(0, 0, 0, 0.2);
  }

  // Открыть столик (свободный) - синий градиент
  &.primary {
    background: linear-gradient(45deg, #667eea, #764ba2);
  }

  // Добавить к заказу - зеленый градиент
  &.success {
    background: linear-gradient(45deg, #27ae60, #2ecc71);
  }

  // Подать заказ (готовый) - оранжевый градиент
  &.ready {
    background: linear-gradient(45deg, #f39c12, #f4d03f);
  }

  // Посмотреть заказ - голубой градиент
  &.info {
    background: linear-gradient(45deg, #3498db, #2980b9);
  }

  // Счет - коричневый/оранжевый градиент
  &.warning {
    background: linear-gradient(45deg, #e67e22, #d35400);
  }

  // Подтвердить QR заказ - фиолетовый градиент
  &.qr-confirm {
    background: linear-gradient(45deg, #9b59b6, #8e44ad);
  }

  // Закрыть столик (уборка) - серый градиент
  &.secondary {
    background: linear-gradient(45deg, #6c757d, #95a5a6);
  }

  // Новые уникальные цвета для дополнительных действий

  // Посмотреть QR заказ - розовый градиент
  &.qr-view {
    background: linear-gradient(45deg, #e91e63, #f06292);
  }

  // Альтернативный цвет для просмотра заказа - морской волны
  &.view-order {
    background: linear-gradient(45deg, #1abc9c, #16a085);
  }

  // Печать счета - темно-коричневый градиент
  &.print-bill {
    background: linear-gradient(45deg, #8d4004, #a0522d);
  }

  // Завершить уборку - изумрудный градиент
  &.finish-cleaning {
    background: linear-gradient(45deg, #00b894, #00a085);
  }
}

// Цветовая схема для статусов столиков
.table-status-free {
  border-color: rgba(39, 174, 96, 0.3);

  &:hover {
    border-color: rgba(39, 174, 96, 0.5);
  }
}

.table-status-occupied {
  border-color: rgba(52, 152, 219, 0.3);

  &:hover {
    border-color: rgba(52, 152, 219, 0.5);
  }
}

.table-status-qr-waiting {
  background: rgba(255, 255, 255, 0.98) !important;
  border-color: rgba(155, 89, 182, 0.6);
  animation: qr-purple-pulse 2s infinite;

  &:hover {
    border-color: rgba(155, 89, 182, 0.8);
  }
}

.table-status-ready {
  background: rgba(255, 255, 255, 0.98) !important;
  border-color: rgba(243, 156, 18, 0.6);
  animation: ready-orange-pulse 2s infinite;

  &:hover {
    border-color: rgba(243, 156, 18, 0.8);
  }
}

.table-status-cleaning {
  border-color: rgba(149, 165, 166, 0.3);

  &:hover {
    border-color: rgba(149, 165, 166, 0.5);
  }
}

// Анимации
@keyframes table-pulse {
  0%, 100% {
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1), 0 0 0 0 rgba(243, 156, 18, 0.7);
  }
  50% {
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1), 0 0 0 10px rgba(243, 156, 18, 0);
  }
}

@keyframes ready-pulse {
  0%, 100% {
    transform: scale(1);
    opacity: 1;
  }
  50% {
    transform: scale(1.1);
    opacity: 0.8;
  }
}

@keyframes ready-glow {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.7;
  }
}

@keyframes qr-pulse {
  0%, 100% {
    transform: scale(1);
    opacity: 1;
  }
  50% {
    transform: scale(1.1);
    opacity: 0.8;
  }
}

@keyframes qr-purple-pulse {
  0%, 100% {
    border-color: rgba(155, 89, 182, 0.6);
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1), 0 0 0 0 rgba(155, 89, 182, 0.4);
  }
  50% {
    border-color: rgba(155, 89, 182, 0.9);
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1), 0 0 0 8px rgba(155, 89, 182, 0.2);
  }
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

@keyframes ready-orange-pulse {
  0%, 100% {
    border-color: rgba(243, 156, 18, 0.6);
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1), 0 0 0 0 rgba(243, 156, 18, 0.4);
  }
  50% {
    border-color: rgba(243, 156, 18, 0.9);
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1), 0 0 0 8px rgba(243, 156, 18, 0.2);
  }
}

@keyframes urgent-pulse {
  0%, 100% {
    transform: scale(1);
    opacity: 1;
  }
  50% {
    transform: scale(1.05);
    opacity: 0.9;
  }
}

@keyframes fadeInUp {
  0% {
    opacity: 0;
    transform: translateY(20px);
  }
  100% {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
