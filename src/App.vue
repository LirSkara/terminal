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
@import '@/styles/main';
</style>
