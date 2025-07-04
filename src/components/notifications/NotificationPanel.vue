<template>
  <Teleport to="body">
    <div class="notification-panel">
      <TransitionGroup name="notification" tag="div">
        <div
          v-for="notification in visibleNotifications"
          :key="notification.id"
          class="notification-toast"
          :class="[
            `notification-${notification.type}`,
            { 'notification-unread': !notification.read }
          ]"
          @click="markAsRead(notification.id)"
        >
          <div class="notification-content">
            <div class="notification-header">
              <div class="notification-icon">
                <i :class="getNotificationIcon(notification.type)"></i>
              </div>
              <div class="notification-title">{{ notification.title }}</div>
              <button
                @click.stop="removeNotification(notification.id)"
                class="btn-close btn-close-white"
                aria-label="Закрыть"
              ></button>
            </div>
            <div class="notification-message">{{ notification.message }}</div>
            <div class="notification-time">{{ formatRelativeTime(notification.timestamp) }}</div>
          </div>
          <div 
            class="notification-progress"
            :style="{ animationDuration: `${autoHideDuration}ms` }"
          ></div>
        </div>
      </TransitionGroup>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useNotificationStore } from '@/stores/notifications'
import { formatRelativeTime } from '@/utils/format'

const notificationStore = useNotificationStore()

const autoHideDuration = 5000 // 5 секунд
const maxVisible = 3 // Максимум видимых уведомлений

// Показываем только последние уведомления
const visibleNotifications = computed(() => 
  notificationStore.recentNotifications
    .filter(n => !n.read || isImportant(n.type))
    .slice(0, maxVisible)
)

// Методы
const markAsRead = (notificationId: string) => {
  notificationStore.markAsRead(notificationId)
}

const removeNotification = (notificationId: string) => {
  notificationStore.removeNotification(notificationId)
}

const getNotificationIcon = (type: string): string => {
  const icons = {
    success: 'bi-check-circle-fill',
    error: 'bi-exclamation-triangle-fill',
    warning: 'bi-exclamation-circle-fill',
    info: 'bi-info-circle-fill'
  }
  return icons[type as keyof typeof icons] || icons.info
}

const isImportant = (type: string): boolean => {
  return type === 'error' || type === 'success'
}

// Автоматическое скрытие неважных уведомлений
watch(visibleNotifications, (newNotifications) => {
  newNotifications.forEach(notification => {
    if (!isImportant(notification.type) && !notification.read) {
      setTimeout(() => {
        markAsRead(notification.id)
      }, autoHideDuration)
    }
  })
}, { immediate: true })
</script>

<style scoped lang="scss">
.notification-panel {
  position: fixed;
  top: 80px; // Под навбаром
  right: 1rem;
  z-index: 1055;
  pointer-events: none;
  
  @media (max-width: 576px) {
    left: 1rem;
    right: 1rem;
  }
}

.notification-toast {
  background: white;
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
  margin-bottom: 1rem;
  max-width: 400px;
  min-width: 320px;
  overflow: hidden;
  pointer-events: auto;
  position: relative;
  cursor: pointer;
  backdrop-filter: blur(10px);
  
  @media (max-width: 576px) {
    min-width: auto;
    max-width: none;
  }
  
  &.notification-success {
    border-left: 4px solid var(--qres-success);
    
    .notification-icon {
      color: var(--qres-success);
    }
  }
  
  &.notification-error {
    border-left: 4px solid var(--qres-danger);
    
    .notification-icon {
      color: var(--qres-danger);
    }
  }
  
  &.notification-warning {
    border-left: 4px solid var(--qres-warning);
    
    .notification-icon {
      color: var(--qres-warning);
    }
  }
  
  &.notification-info {
    border-left: 4px solid var(--qres-primary);
    
    .notification-icon {
      color: var(--qres-primary);
    }
  }
  
  &.notification-unread {
    background: linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(255, 255, 255, 0.9) 100%);
  }
  
  &:hover {
    transform: translateX(-5px);
    box-shadow: 0 12px 40px rgba(0, 0, 0, 0.18);
  }
}

.notification-content {
  padding: 1rem;
}

.notification-header {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  margin-bottom: 0.5rem;
}

.notification-icon {
  font-size: 1.25rem;
  margin-top: 0.125rem;
}

.notification-title {
  flex: 1;
  font-weight: 600;
  color: #2c3e50;
  line-height: 1.3;
}

.btn-close {
  opacity: 0.6;
  padding: 0.25rem;
  
  &:hover {
    opacity: 1;
  }
}

.notification-message {
  color: #6c757d;
  line-height: 1.4;
  margin-bottom: 0.5rem;
}

.notification-time {
  color: #adb5bd;
  font-size: 0.8rem;
}

.notification-progress {
  position: absolute;
  bottom: 0;
  left: 0;
  height: 3px;
  background: linear-gradient(90deg, var(--qres-primary), var(--qres-success));
  animation: progress linear;
  transform-origin: left;
}

@keyframes progress {
  from {
    transform: scaleX(1);
  }
  to {
    transform: scaleX(0);
  }
}

// Анимации появления/исчезновения
.notification-enter-active {
  transition: all 0.4s ease;
}

.notification-leave-active {
  transition: all 0.3s ease;
}

.notification-enter-from {
  transform: translateX(100%);
  opacity: 0;
}

.notification-leave-to {
  transform: translateX(100%);
  opacity: 0;
}

.notification-move {
  transition: transform 0.3s ease;
}
</style>
