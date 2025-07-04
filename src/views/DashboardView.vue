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
        <!-- Фильтры и поиск -->
        <div class="tables-controls mb-4">
          <div class="row align-items-center">
            <div class="col-md-8">
              <div class="filter-buttons">
                <button
                  v-for="filter in tableFilters"
                  :key="filter.key"
                  @click="activeFilter = filter.key"
                  :class="['filter-btn', { active: activeFilter === filter.key }]"
                >
                  <i :class="filter.icon"></i>
                  <span>{{ filter.label }}</span>
                  <span class="count">{{ filter.count }}</span>
                </button>
              </div>
            </div>
            <div class="col-md-4">
              <!-- Быстрые действия справа -->
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
              </div>
            </div>
          </div>
        </div>

        <!-- Сетка столиков -->
        <div class="tables-grid">
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
                    <div class="order-time">
                      <i class="bi bi-clock"></i>
                      {{ formatTime(table.orderTime) }}
                    </div>
                    <div class="order-amount">
                      <i class="bi bi-currency-dollar"></i>
                      {{ table.orderAmount }}₽
                    </div>
                  </template>

                  <template v-if="table.status === 'qr-waiting'">
                    <div class="order-time">
                      <i class="bi bi-clock"></i>
                      {{ formatTime(table.orderTime) }}
                    </div>
                    <div class="order-amount">
                      <i class="bi bi-currency-dollar"></i>
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
                  @click="callTable(table)"
                  class="action-btn info"
                  title="Позвать"
                >
                  <i class="bi bi-megaphone"></i>
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
                  class="action-btn info"
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
                  class="action-btn warning"
                  title="Счет"
                >
                  <i class="bi bi-receipt"></i>
                </button>

                <button
                  v-if="table.status === 'cleaning'"
                  @click="closeTable(table)"
                  class="action-btn primary"
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
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useAuthStore } from '@/stores/auth'

// Типы
interface Table {
  id: number
  number: string
  seats: number
  status: 'free' | 'occupied' | 'ready' | 'cleaning' | 'qr-waiting'
  orderTime: Date | null
  orderAmount: number
  hasQrOrder?: boolean
}

// Auth store
const authStore = useAuthStore()

// Реактивные данные
const currentTime = ref('')
const activeFilter = ref('all')

// Имя официанта из store
const waiterName = computed(() => {
  return authStore.user?.full_name || authStore.user?.username || 'Не определен'
})

// Данные столиков (демо)
const tables = ref<Table[]>([
  { id: 1, number: '01', seats: 2, status: 'free', orderTime: null, orderAmount: 0 },
  { id: 2, number: '02', seats: 4, status: 'occupied', orderTime: new Date(Date.now() - 1800000), orderAmount: 1250 },
  { id: 3, number: '03', seats: 6, status: 'ready', orderTime: new Date(Date.now() - 3600000), orderAmount: 2340 },
  { id: 4, number: '04', seats: 2, status: 'qr-waiting', orderTime: new Date(Date.now() - 300000), orderAmount: 890, hasQrOrder: true },
  { id: 5, number: '05', seats: 4, status: 'occupied', orderTime: new Date(Date.now() - 900000), orderAmount: 890 },
  { id: 6, number: '06', seats: 8, status: 'cleaning', orderTime: null, orderAmount: 0 },
  { id: 7, number: '07', seats: 2, status: 'qr-waiting', orderTime: new Date(Date.now() - 600000), orderAmount: 1456, hasQrOrder: true },
  { id: 8, number: '08', seats: 4, status: 'ready', orderTime: new Date(Date.now() - 2700000), orderAmount: 1680 },
  { id: 9, number: '09', seats: 6, status: 'occupied', orderTime: new Date(Date.now() - 600000), orderAmount: 456 },
  { id: 10, number: '10', seats: 4, status: 'free', orderTime: null, orderAmount: 0 },
  { id: 11, number: '11', seats: 2, status: 'occupied', orderTime: new Date(Date.now() - 2100000), orderAmount: 1100 },
  { id: 12, number: '12', seats: 6, status: 'qr-waiting', orderTime: new Date(Date.now() - 900000), orderAmount: 2100, hasQrOrder: true }
])

// Фильтры столиков
const tableFilters = computed(() => [
  { key: 'all', label: 'Все', icon: 'bi-grid-3x3', count: tables.value.length },
  { key: 'free', label: 'Свободные', icon: 'bi-check-circle', count: tables.value.filter(t => t.status === 'free').length },
  { key: 'occupied', label: 'Занятые', icon: 'bi-people-fill', count: tables.value.filter(t => t.status === 'occupied').length },
  { key: 'qr-waiting', label: 'QR заказы', icon: 'bi-qr-code-scan', count: tables.value.filter(t => t.status === 'qr-waiting').length },
  { key: 'ready', label: 'Готовые', icon: 'bi-bell-fill', count: tables.value.filter(t => t.status === 'ready').length },
  { key: 'cleaning', label: 'Уборка', icon: 'bi-arrow-clockwise', count: tables.value.filter(t => t.status === 'cleaning').length }
])

// Вычисляемые свойства для статистики
const totalTables = computed(() => tables.value.length)
const occupiedTables = computed(() => tables.value.filter(t => t.status === 'occupied').length)
const readyOrders = computed(() => tables.value.filter(t => t.status === 'ready').length)
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

  // Фильтр по статусу
  if (activeFilter.value !== 'all') {
    filtered = filtered.filter(table => table.status === activeFilter.value)
  }

  return filtered
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

const callTable = (table: Table) => {
  console.log('Позвать столик:', table.number)
  // Здесь будет логика вызова столика (например, отправка сообщения или звонок)
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
  margin-bottom: 1.5rem;
  flex-grow: 1;
  display: flex;
  flex-direction: column;
  text-align: center;
}

.seats-count {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  font-weight: 600;
  font-size: 1.1rem;
  color: #6c757d;
  margin-bottom: 0.75rem;
}

.table-details {
  .order-time,
  .order-amount {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    font-size: 1rem;
    font-weight: 600;
    color: #5a6c7d;
    margin-bottom: 0.5rem;
  }

  .ready-indicator {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    color: #f39c12;
    font-weight: 700;
    font-size: 1.1rem;
    text-align: center;
    margin-top: 0.5rem;
    animation: ready-glow 2s infinite;
  }

  .cleaning-indicator {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    color: #95a5a6;
    font-weight: 600;
    font-size: 1rem;
    text-align: center;
  }
}

.table-actions {
  display: flex;
  gap: 0.75rem;
  justify-content: center;
  margin-top: auto;
  padding-top: 1rem;
}

.action-btn {
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

  &.primary {
    background: linear-gradient(45deg, #667eea, #764ba2);
  }

  &.success {
    background: linear-gradient(45deg, #27ae60, #2ecc71);
  }

  &.ready {
    background: linear-gradient(45deg, #f39c12, #f4d03f);
  }

  &.info {
    background: linear-gradient(45deg, #3498db, #2980b9);
  }

  &.warning {
    background: linear-gradient(45deg, #e67e22, #d35400);
  }

  &.qr-confirm {
    background: linear-gradient(45deg, #9b59b6, #8e44ad);
  }

  &.secondary {
    background: linear-gradient(45deg, #6c757d, #95a5a6);
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

// Адаптивность
@media (max-width: 768px) {
  .dashboard-header {
    margin: 0.5rem;
    padding: 1.5rem;
  }

  .dashboard-title {
    font-size: 2rem;
  }

  .header-right-section {
    flex-direction: column;
    gap: 1rem;
    align-items: flex-end;
  }

  .stats-and-create {
    flex-direction: column;
    gap: 1rem;
    align-items: flex-end;
  }

  .quick-actions-section {
    justify-content: center;
  }

  .quick-action-btn {
    width: 44px;
    height: 44px;
    font-size: 1.1rem;
  }

  .quick-stats {
    gap: 1rem;
  }

  .header-actions {
    justify-content: center;
    margin-bottom: 0;
  }

  .create-order-btn-large {
    font-size: 1.1rem;
    padding: 0.9rem 1.8rem;
  }

  .filter-buttons {
    justify-content: center;
    margin-bottom: 1rem;
  }

  .quick-actions-section {
    justify-content: center;
  }

  .tables-grid {
    grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
    gap: 1rem;
  }

  .table-number {
    font-size: 3rem;
  }

  .seats-count {
    font-size: 1rem;
  }

  .action-btn {
    width: 44px;
    height: 44px;
  }
}

@media (max-width: 576px) {
  .tables-section {
    padding: 0 0.5rem 1rem;
  }

  .dashboard-header {
    margin: 0.25rem;
    padding: 1rem;
  }

  .tables-controls {
    padding: 1rem;
  }

  .filter-buttons {
    flex-direction: column;
    align-items: stretch;
    margin-bottom: 1rem;
  }

  .filter-btn {
    justify-content: center;
  }

  .header-right-section {
    flex-direction: column;
    gap: 1rem;
    align-items: center;
  }

  .stats-and-create {
    flex-direction: column;
    gap: 1rem;
    align-items: center;
  }

  .quick-actions-section {
    justify-content: center;
    margin-top: 1rem;
  }

  .quick-action-btn {
    width: 40px;
    height: 40px;
    font-size: 1rem;
  }

  .quick-stats {
    order: 2;
    gap: 0.8rem;
  }

  .header-actions {
    order: 1;
  }

  .create-order-btn-large {
    width: 100%;
    justify-content: center;
    font-size: 1rem;
    padding: 0.8rem 1.5rem;
  }

  .tables-grid {
    grid-template-columns: 1fr;
  }

  .table-number {
    font-size: 2.8rem;
  }

  .seats-count {
    font-size: 0.95rem;
  }

  .action-btn {
    width: 40px;
    height: 40px;
    font-size: 1rem;
  }
}
</style>
