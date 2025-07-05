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
      <!-- Основной контент -->
      <main class="main-content" :class="{
        'login-page': $route.name === 'login'
      }">
        <RouterView />
      </main>
    </template>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'
import { RouterView, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useNotificationStore } from '@/stores/notifications'

const authStore = useAuthStore()
const notificationStore = useNotificationStore()
const route = useRoute()

const isInitializing = ref(true)

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
    updateBrowserTheme('#696fd4')
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
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  margin: 0;
  padding: 0;
}

.qres-app {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.main-content {
  flex: 1;
  padding: 1rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  position: relative;
  min-height: 100vh;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><pattern id="grid" width="10" height="10" patternUnits="userSpaceOnUse"><path d="M 10 0 L 0 0 0 10" fill="none" stroke="rgba(255,255,255,0.1)" stroke-width="0.5"/></pattern></defs><rect width="100" height="100" fill="url(%23grid)"/></svg>');
    opacity: 0.3;
    pointer-events: none;
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
  position: relative;
  z-index: 1;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);

  &:hover {
    transform: translateY(-5px);
    box-shadow: 0 15px 40px rgba(0, 0, 0, 0.2);
    background: rgba(255, 255, 255, 1);
  }

  &:active {
    transform: translateY(-2px);
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
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15);
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  position: relative;
  z-index: 1;

  &:hover {
    box-shadow: 0 12px 40px rgba(0, 0, 0, 0.2);
    background: rgba(255, 255, 255, 1);
    transform: translateY(-2px);
  }
}

/* Стили для всех карточек на фиолетовом фоне */
.card {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  position: relative;
  z-index: 1;
  border-radius: 16px;
  transition: all 0.3s ease;

  &:hover {
    background: rgba(255, 255, 255, 1);
    transform: translateY(-2px);
    box-shadow: 0 12px 40px rgba(0, 0, 0, 0.15);
  }
}
</style>
