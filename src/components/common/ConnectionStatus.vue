<template>
  <div 
    class="connection-status"
    :class="[
      `status-${connectionStatus}`,
      { 'status-visible': showStatus }
    ]"
  >
    <div class="status-content">
      <div class="status-icon">
        <i :class="statusIcon"></i>
      </div>
      <div class="status-text">
        <div class="status-title">{{ statusTitle }}</div>
        <div class="status-subtitle">{{ statusSubtitle }}</div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { webSocketService } from '@/services/websocket'

const connectionStatus = ref<'connected' | 'connecting' | 'disconnected' | 'error'>('disconnected')
const showStatus = ref(false)
const statusCheckInterval = ref<number | null>(null)

// Computed свойства для отображения
const statusIcon = computed(() => {
  const icons = {
    connected: 'bi-wifi text-success',
    connecting: 'bi-arrow-repeat text-warning',
    disconnected: 'bi-wifi-off text-danger',
    error: 'bi-exclamation-triangle-fill text-danger'
  }
  return icons[connectionStatus.value]
})

const statusTitle = computed(() => {
  const titles = {
    connected: 'Подключено',
    connecting: 'Подключение...',
    disconnected: 'Нет соединения',
    error: 'Ошибка соединения'
  }
  return titles[connectionStatus.value]
})

const statusSubtitle = computed(() => {
  const subtitles = {
    connected: 'Real-time обновления активны',
    connecting: 'Восстановление соединения',
    disconnected: 'Проверьте интернет соединение',
    error: 'Не удается подключиться к серверу'
  }
  return subtitles[connectionStatus.value]
})

// Методы
const checkConnectionStatus = () => {
  const wsState = webSocketService.getConnectionState()
  let newStatus: typeof connectionStatus.value

  switch (wsState) {
    case 'connected':
      newStatus = 'connected'
      break
    case 'connecting':
      newStatus = 'connecting'
      break
    case 'disconnected':
      newStatus = 'disconnected'
      break
    default:
      newStatus = 'error'
  }

  // Показываем статус только если он изменился или если есть проблемы
  const shouldShow = connectionStatus.value !== newStatus || newStatus !== 'connected'
  
  connectionStatus.value = newStatus
  showStatus.value = shouldShow

  // Автоматически скрываем статус "подключено" через 3 секунды
  if (newStatus === 'connected' && shouldShow) {
    setTimeout(() => {
      if (connectionStatus.value === 'connected') {
        showStatus.value = false
      }
    }, 3000)
  }
}

const startStatusCheck = () => {
  // Проверяем статус каждые 2 секунды
  statusCheckInterval.value = setInterval(checkConnectionStatus, 2000)
  // Начальная проверка
  checkConnectionStatus()
}

const stopStatusCheck = () => {
  if (statusCheckInterval.value) {
    clearInterval(statusCheckInterval.value)
    statusCheckInterval.value = null
  }
}

// Жизненный цикл
onMounted(() => {
  startStatusCheck()
})

onUnmounted(() => {
  stopStatusCheck()
})
</script>

<style scoped lang="scss">
.connection-status {
  position: fixed;
  bottom: 1rem;
  left: 1rem;
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
  padding: 0.75rem 1rem;
  min-width: 250px;
  transform: translateY(100px);
  opacity: 0;
  transition: all 0.4s ease;
  z-index: 1050;
  backdrop-filter: blur(10px);
  
  @media (max-width: 576px) {
    left: 0.5rem;
    right: 0.5rem;
    min-width: auto;
  }
  
  &.status-visible {
    transform: translateY(0);
    opacity: 1;
  }
  
  &.status-connected {
    border-left: 4px solid var(--qres-success);
    background: linear-gradient(135deg, rgba(39, 174, 96, 0.05) 0%, rgba(255, 255, 255, 0.95) 100%);
  }
  
  &.status-connecting {
    border-left: 4px solid var(--qres-warning);
    background: linear-gradient(135deg, rgba(243, 156, 18, 0.05) 0%, rgba(255, 255, 255, 0.95) 100%);
    
    .status-icon i {
      animation: spin 1s linear infinite;
    }
  }
  
  &.status-disconnected,
  &.status-error {
    border-left: 4px solid var(--qres-danger);
    background: linear-gradient(135deg, rgba(231, 76, 60, 0.05) 0%, rgba(255, 255, 255, 0.95) 100%);
    
    &.status-visible {
      animation: shake 0.5s ease-in-out;
    }
  }
}

.status-content {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.status-icon {
  font-size: 1.25rem;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
}

.status-text {
  flex: 1;
}

.status-title {
  font-weight: 600;
  color: #2c3e50;
  line-height: 1.2;
  margin-bottom: 0.125rem;
}

.status-subtitle {
  font-size: 0.85rem;
  color: #6c757d;
  line-height: 1.2;
}

// Анимации
@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

@keyframes shake {
  0%, 100% {
    transform: translateX(0);
  }
  25% {
    transform: translateX(-5px);
  }
  75% {
    transform: translateX(5px);
  }
}

// Пульсация для критических статусов
.status-error.status-visible,
.status-disconnected.status-visible {
  animation: shake 0.5s ease-in-out, pulse 2s infinite 1s;
}

@keyframes pulse {
  0% {
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
  }
  50% {
    box-shadow: 0 4px 20px rgba(231, 76, 60, 0.3);
  }
  100% {
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
  }
}
</style>
