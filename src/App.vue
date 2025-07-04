<template>
  <div id="app" class="qres-app">
    <!-- Индикатор загрузки -->
    <div v-if="isInitializing" class="app-loader">
      <div class="loader-container">
        <div class="qres-logo">
          <i class="bi bi-egg-fried display-1 text-primary"></i>
        </div>
        <h3 class="text-primary mb-4">QRes OS 4</h3>
        <div class="spinner-border text-primary" role="status">
          <span class="visually-hidden">Загрузка...</span>
        </div>
        <p class="mt-3 text-muted">Загрузка приложения...</p>
      </div>
    </div>

    <!-- Основное приложение -->
    <template v-else>
      <!-- Навигация (только если авторизован) -->
      <nav v-if="isAuthenticated" class="navbar navbar-expand-lg navbar-dark bg-primary fixed-top shadow">
        <div class="container-fluid">
          <RouterLink to="/dashboard" class="navbar-brand d-flex align-items-center">
            <i class="bi bi-egg-fried me-2 fs-4"></i>
            <span class="fw-bold">QRes</span>
            <small class="ms-2 text-light opacity-75 d-none d-md-inline">Официант</small>
          </RouterLink>
        </div>
      </nav>

      <!-- Основной контент -->
      <main class="main-content" :class="{
        'with-navbar': isAuthenticated,
        'login-page': $route.name === 'login'
      }">
        <RouterView />
      </main>
    </template>
  </div>
</template>

<script setup lang="ts">
import { onMounted, computed, ref, watch } from 'vue'
import { RouterView, RouterLink, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useNotificationStore } from '@/stores/notifications'

const authStore = useAuthStore()
const notificationStore = useNotificationStore()
const route = useRoute()

const isInitializing = ref(true)

const isAuthenticated = computed(() => authStore.isAuthenticated)

// Функция для обновления цвета браузера
const updateBrowserTheme = (color: string) => {
  // Обновляем существующий мета-тег theme-color
  const themeColorMeta = document.querySelector('meta[name="theme-color"]') as HTMLMetaElement
  if (themeColorMeta) {
    themeColorMeta.content = color
  }

  // Обновляем мета-тег для Microsoft
  const msNavButtonMeta = document.querySelector('meta[name="msapplication-navbutton-color"]') as HTMLMetaElement
  if (msNavButtonMeta) {
    msNavButtonMeta.content = color
  }
}

// Наблюдаем за изменениями маршрута и обновляем цвет браузера
watch(() => route.name, (newRouteName) => {
  if (newRouteName === 'login') {
    // Фиолетовый градиент для страницы входа
    updateBrowserTheme('#696fd4')
  } else {
    // Синий цвет для остальных страниц
    updateBrowserTheme('#3498db')
  }
}, { immediate: true })

onMounted(async () => {
  try {
    // Инициализация аутентификации
    authStore.initializeAuth()

    // Инициализация настроек уведомлений
    notificationStore.initializeSoundSettings()

    // Проверяем текущего пользователя если есть токен
    if (authStore.token) {
      await authStore.checkCurrentUser()
    }
  } catch (error) {
    console.error('Ошибка инициализации приложения:', error)
  } finally {
    isInitializing.value = false
  }
})
</script>

<style lang="scss">
:root {
  /* Цветовая схема QRes */
  --qres-primary: #3498db;
  --qres-success: #27ae60;
  --qres-warning: #f39c12;
  --qres-danger: #e74c3c;
  --qres-background: #ecf0f1;
  --qres-free: #95a5a6;
  --qres-occupied: #3498db;
  --qres-ready: #27ae60;
  --qres-attention: #f39c12;
  --qres-inactive: #bdc3c7;

  /* Переопределяем Bootstrap переменные */
  --bs-primary: var(--qres-primary);
  --bs-success: var(--qres-success);
  --bs-warning: var(--qres-warning);
  --bs-danger: var(--qres-danger);
  --bs-body-bg: var(--qres-background);
}

body {
  background-color: var(--qres-background);
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
}

.qres-app {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.main-content {
  flex: 1;
  padding: 1rem;

  &.with-navbar {
    padding-top: calc(1rem + 60px); /* Высота navbar + отступ */
  }

  &.login-page {
    padding: 0; /* Убираем отступы для страницы входа */
  }
}

/* Кастомные классы для статусов столиков */
.table-status {
  &-free {
    background-color: var(--qres-free);
    color: white;
  }

  &-occupied {
    background-color: var(--qres-occupied);
    color: white;
  }

  &-ready {
    background-color: var(--qres-ready);
    color: white;
  }

  &-attention {
    background-color: var(--qres-attention);
    color: white;
  }

  &-inactive {
    background-color: var(--qres-inactive);
    color: white;
  }
}

/* Стили для больших кнопок (планшеты) */
.btn-lg-touch {
  padding: 1rem 1.5rem;
  font-size: 1.25rem;
  min-height: 60px;

  @media (max-width: 991.98px) {
    padding: 1.25rem 2rem;
    font-size: 1.5rem;
    min-height: 80px;
  }
}

/* Сетка столиков */
.tables-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 1rem;

  @media (max-width: 767.98px) {
    grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
    gap: 0.75rem;
  }
}

/* Карточка столика */
.table-card {
  aspect-ratio: 1;
  border: none;
  border-radius: 12px;
  transition: all 0.3s ease;
  cursor: pointer;

  &:hover {
    transform: translateY(-3px);
    box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
  }

  &:active {
    transform: translateY(0);
  }
}

/* Анимации */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.slide-up-enter-active,
.slide-up-leave-active {
  transition: all 0.3s ease;
}

.slide-up-enter-from {
  transform: translateY(20px);
  opacity: 0;
}

.slide-up-leave-to {
  transform: translateY(-20px);
  opacity: 0;
}

/* Пульсация для важных элементов */
@keyframes pulse {
  0% {
    box-shadow: 0 0 0 0 rgba(255, 255, 255, 0.7);
  }
  70% {
    box-shadow: 0 0 0 10px rgba(255, 255, 255, 0);
  }
  100% {
    box-shadow: 0 0 0 0 rgba(255, 255, 255, 0);
  }
}

.pulse {
  animation: pulse 2s infinite;
}

/* Тени для карточек */
.card-elevated {
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);

  &:hover {
    box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
  }
}
</style>
