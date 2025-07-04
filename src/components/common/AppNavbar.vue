<template>
  <nav class="navbar navbar-expand-lg navbar-dark bg-primary fixed-top shadow">
    <div class="container-fluid">
      <!-- Логотип и название -->
      <RouterLink to="/dashboard" class="navbar-brand d-flex align-items-center">
        <i class="bi bi-egg-fried me-2 fs-4"></i>
        <span class="fw-bold">QRes</span>
        <small class="ms-2 text-light opacity-75 d-none d-md-inline">Официант</small>
      </RouterLink>

      <!-- Кнопка мобильного меню -->
      <button 
        class="navbar-toggler border-0" 
        type="button" 
        data-bs-toggle="collapse" 
        data-bs-target="#navbarNav"
      >
        <span class="navbar-toggler-icon"></span>
      </button>

      <div class="collapse navbar-collapse" id="navbarNav">
        <!-- Навигационные ссылки -->
        <ul class="navbar-nav me-auto">
          <li class="nav-item">
            <RouterLink to="/dashboard" class="nav-link" active-class="active">
              <i class="bi bi-house-fill me-1"></i>
              <span class="d-lg-inline d-none">Столики</span>
            </RouterLink>
          </li>
          <li class="nav-item">
            <RouterLink to="/orders" class="nav-link" active-class="active">
              <i class="bi bi-receipt me-1"></i>
              <span class="d-lg-inline d-none">Заказы</span>
            </RouterLink>
          </li>
          <li class="nav-item">
            <RouterLink to="/menu" class="nav-link" active-class="active">
              <i class="bi bi-collection-fill me-1"></i>
              <span class="d-lg-inline d-none">Меню</span>
            </RouterLink>
          </li>
        </ul>

        <!-- Правая часть навбара -->
        <div class="navbar-nav align-items-lg-center">
          <!-- Уведомления -->
          <div class="nav-item dropdown me-2">
            <button
              class="btn btn-outline-light position-relative"
              data-bs-toggle="dropdown"
              aria-expanded="false"
            >
              <i class="bi bi-bell-fill"></i>
              <span 
                v-if="hasUnread" 
                class="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger"
              >
                {{ unreadCount > 99 ? '99+' : unreadCount }}
              </span>
            </button>
            <div class="dropdown-menu dropdown-menu-end notifications-dropdown">
              <h6 class="dropdown-header d-flex justify-content-between">
                Уведомления
                <button 
                  v-if="hasUnread"
                  @click="markAllAsRead"
                  class="btn btn-sm btn-link p-0 text-decoration-none"
                >
                  Прочитать все
                </button>
              </h6>
              <div class="dropdown-divider"></div>
              
              <div v-if="recentNotifications.length === 0" class="dropdown-item-text text-muted">
                Нет уведомлений
              </div>
              
              <template v-else>
                <button
                  v-for="notification in recentNotifications"
                  :key="notification.id"
                  @click="markAsRead(notification.id)"
                  class="dropdown-item notification-item"
                  :class="{ 'unread': !notification.read }"
                >
                  <div class="d-flex">
                    <div class="notification-icon me-2">
                      <i :class="getNotificationIcon(notification.type)"></i>
                    </div>
                    <div class="flex-fill">
                      <div class="fw-semibold">{{ notification.title }}</div>
                      <div class="small text-muted">{{ notification.message }}</div>
                      <div class="small text-muted">{{ formatTime(notification.timestamp) }}</div>
                    </div>
                  </div>
                </button>
                
                <div class="dropdown-divider"></div>
                <RouterLink to="/notifications" class="dropdown-item text-center">
                  Все уведомления
                </RouterLink>
              </template>
            </div>
          </div>

          <!-- Звук уведомлений -->
          <button
            @click="toggleSound"
            class="btn btn-outline-light me-3"
            :class="{ 'active': soundEnabled }"
            :title="soundEnabled ? 'Отключить звук' : 'Включить звук'"
          >
            <i :class="soundEnabled ? 'bi-volume-up-fill' : 'bi-volume-mute-fill'"></i>
          </button>

          <!-- Информация о пользователе -->
          <div class="nav-item dropdown">
            <button
              class="btn btn-outline-light dropdown-toggle"
              data-bs-toggle="dropdown"
              aria-expanded="false"
            >
              <i class="bi bi-person-fill me-1"></i>
              <span class="d-none d-md-inline">{{ user?.full_name || 'Пользователь' }}</span>
            </button>
            <ul class="dropdown-menu dropdown-menu-end">
              <li class="dropdown-header">
                <div class="fw-semibold">{{ user?.full_name }}</div>
                <div class="small text-muted">{{ user?.username }}</div>
                <div class="small">
                  <i class="bi bi-circle-fill text-success me-1" style="font-size: 0.5rem;"></i>
                  На смене
                </div>
              </li>
              <li><hr class="dropdown-divider"></li>
              <li>
                <RouterLink to="/profile" class="dropdown-item">
                  <i class="bi bi-person me-2"></i>
                  Профиль
                </RouterLink>
              </li>
              <li>
                <button @click="showSettings" class="dropdown-item">
                  <i class="bi bi-gear me-2"></i>
                  Настройки
                </button>
              </li>
              <li><hr class="dropdown-divider"></li>
              <li>
                <button @click="handleLogout" class="dropdown-item text-danger">
                  <i class="bi bi-box-arrow-right me-2"></i>
                  Выйти
                </button>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  </nav>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useNotificationStore } from '@/stores/notifications'
import { formatTime } from '@/utils/format'

const router = useRouter()
const authStore = useAuthStore()
const notificationStore = useNotificationStore()

// Computed свойства
const user = computed(() => authStore.user)
const hasUnread = computed(() => notificationStore.hasUnread)
const unreadCount = computed(() => notificationStore.unreadCount)
const recentNotifications = computed(() => notificationStore.recentNotifications)
const soundEnabled = computed(() => notificationStore.soundEnabled)

// Методы
const markAsRead = (notificationId: string) => {
  notificationStore.markAsRead(notificationId)
}

const markAllAsRead = () => {
  notificationStore.markAllAsRead()
}

const toggleSound = () => {
  notificationStore.toggleSound()
}

const getNotificationIcon = (type: string): string => {
  const icons = {
    success: 'bi-check-circle-fill text-success',
    error: 'bi-exclamation-triangle-fill text-danger',
    warning: 'bi-exclamation-circle-fill text-warning',
    info: 'bi-info-circle-fill text-info'
  }
  return icons[type as keyof typeof icons] || icons.info
}

const showSettings = () => {
  // TODO: Открыть модал настроек
  console.log('Открыть настройки')
}

const handleLogout = async () => {
  if (confirm('Вы уверены, что хотите выйти?')) {
    await authStore.logout()
    router.push('/login')
  }
}
</script>

<style scoped lang="scss">
.navbar {
  backdrop-filter: blur(10px);
  background: linear-gradient(135deg, var(--qres-primary) 0%, #2980b9 100%) !important;
}

.navbar-brand {
  font-size: 1.5rem;
  transition: all 0.3s ease;
  
  &:hover {
    transform: scale(1.05);
  }
}

.nav-link {
  border-radius: 8px;
  margin: 0 2px;
  transition: all 0.3s ease;
  
  &:hover {
    background-color: rgba(255, 255, 255, 0.1);
    transform: translateY(-1px);
  }
  
  &.active {
    background-color: rgba(255, 255, 255, 0.2);
    font-weight: 600;
  }
}

.notifications-dropdown {
  width: 350px;
  max-height: 400px;
  overflow-y: auto;
  
  @media (max-width: 576px) {
    width: 300px;
  }
}

.notification-item {
  padding: 0.75rem 1rem;
  border: none;
  text-align: left;
  white-space: normal;
  
  &.unread {
    background-color: rgba(var(--bs-primary-rgb), 0.05);
    border-left: 3px solid var(--bs-primary);
  }
  
  &:hover {
    background-color: rgba(var(--bs-primary-rgb), 0.1);
  }
}

.notification-icon {
  width: 20px;
  text-align: center;
}

.btn-outline-light {
  border-width: 2px;
  transition: all 0.3s ease;
  
  &:hover, &:focus, &.active {
    transform: scale(1.05);
  }
}

// Анимация для счетчика уведомлений
.badge {
  animation: pulse 1s infinite;
}

@keyframes pulse {
  0% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.1);
  }
  100% {
    transform: scale(1);
  }
}
</style>
