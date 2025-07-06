<template>
  <div class="login-page">
    <!-- Фоновая секция на всю ширину -->
    <div class="background-section">
      <!-- Индикатор соединения по центру сверху -->
      <div
        class="connection-status"
        :class="connectionClass"
        :title="`API: ${apiService.getApiUrl()} • Нажмите для проверки`"
        @click="checkConnection"
      >
        <i :class="connectionIcon"></i>
        <span>{{ connectionText }}</span>
      </div>

      <!-- Левая часть с брендингом -->
      <div class="qres-login-brand-content">
        <div class="qres-login-brand-header">
          <div class="qres-login-brand-logo">
            <i class="bi bi-cup-hot-fill"></i>
          </div>
          <h1 class="qres-login-brand-title">QRes OS 4</h1>
          <h2 class="qres-login-brand-subtitle">Терминал официанта</h2>
          <p class="qres-login-brand-description">
            Современная система управления заказами в ресторане.
            Быстро, надёжно, удобно.
          </p>
        </div>

        <div class="qres-login-brand-features">
          <div class="qres-login-feature-item">
            <div class="qres-login-feature-icon">
              <i class="bi bi-lightning-charge-fill"></i>
            </div>
            <div class="qres-login-feature-text">
              <h4>Быстрая работа</h4>
              <p>Принимайте заказы мгновенно</p>
            </div>
          </div>

          <div class="qres-login-feature-item">
            <div class="qres-login-feature-icon">
              <i class="bi bi-shield-fill-check"></i>
            </div>
            <div class="qres-login-feature-text">
              <h4>Безопасность</h4>
              <p>Защищённая авторизация</p>
            </div>
          </div>

          <div class="qres-login-feature-item">
            <div class="qres-login-feature-icon">
              <i class="bi bi-graph-up-arrow"></i>
            </div>
            <div class="qres-login-feature-text">
              <h4>Аналитика</h4>
              <p>Статистика в реальном времени</p>
            </div>
          </div>
        </div>

        <div class="qres-login-brand-footer">
          <p class="qres-login-version-info">Версия {{ appVersion }} • © 2025 QRes Technologies</p>
        </div>
      </div>

      <!-- Форма входа поверх фона -->
      <div class="login-form-card">
        <div class="form-content">

          <!-- Переключатель режимов входа -->
          <div class="login-mode-switcher">
            <button
              class="mode-button"
              :class="{ active: loginMode === 'pin' }"
              @click="loginMode = 'pin'"
              type="button"
            >
              <i class="bi bi-grid-3x3-gap-fill"></i>
              <span>PIN-код</span>
            </button>
            <button
              class="mode-button"
              :class="{ active: loginMode === 'password' }"
              @click="loginMode = 'password'"
              type="button"
            >
              <i class="bi bi-key-fill"></i>
              <span>Пароль</span>
            </button>
          </div>

          <!-- Контейнер форм входа -->
          <div class="forms-container">
            <!-- Форма входа по PIN -->
            <div v-if="loginMode === 'pin'" class="login-form">
              <div>
                <!-- Поле логина -->
                <div class="qres-form-group">
                  <div class="qres-form-input-group">
                    <div class="qres-input-icon">
                      <i class="bi bi-person-fill"></i>
                    </div>
                    <select
                      v-model="pinUsername"
                      class="qres-form-control qres-form-select"
                      :disabled="isLoadingWaiters"
                      required
                    >
                      <option value="" disabled>
                        {{ isLoadingWaiters ? 'Загрузка...' : `Выберите официанта (${waiters.length})` }}
                      </option>
                      <option
                        v-for="waiter in waiters"
                        :key="waiter.id"
                        :value="waiter.id"
                      >
                        {{ waiter.name }}
                      </option>
                    </select>
                  </div>
                </div>

                <!-- PIN дисплей -->
                <div class="qres-form-group">
                  <div class="pin-display">
                    <div
                      v-for="(filled, index) in pinDisplay"
                      :key="index"
                      class="pin-digit"
                      :class="{ filled: filled }"
                    >
                    </div>
                  </div>
                </div>

                <!-- PIN клавиатура -->
                <div class="pin-keyboard">
                  <div class="keyboard-row">
                    <button
                      v-for="digit in [1, 2, 3]"
                      :key="digit"
                      @click="addPinDigit(digit.toString())"
                      type="button"
                      class="keyboard-btn"
                    >
                      {{ digit }}
                    </button>
                  </div>
                  <div class="keyboard-row">
                    <button
                      v-for="digit in [4, 5, 6]"
                      :key="digit"
                      @click="addPinDigit(digit.toString())"
                      type="button"
                      class="keyboard-btn"
                    >
                      {{ digit }}
                    </button>
                  </div>
                  <div class="keyboard-row">
                    <button
                      v-for="digit in [7, 8, 9]"
                      :key="digit"
                      @click="addPinDigit(digit.toString())"
                      type="button"
                      class="keyboard-btn"
                    >
                      {{ digit }}
                    </button>
                  </div>
                  <div class="keyboard-row">
                    <button
                      @click="clearPin"
                      type="button"
                      class="keyboard-btn special"
                    >
                      <i class="bi bi-arrow-left"></i>
                    </button>
                    <button
                      @click="addPinDigit('0')"
                      type="button"
                      class="keyboard-btn"
                    >
                      0
                    </button>
                    <button
                      @click="clearAllPin"
                      type="button"
                      class="keyboard-btn special danger"
                    >
                      <i class="bi bi-x-lg"></i>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <!-- Форма входа по паролю -->
            <div v-else class="login-form">
              <form @submit.prevent="handlePasswordLogin">
                <!-- Поле логина -->
                <div class="qres-form-group">
                  <label class="qres-form-label">Логин</label>
                  <div class="qres-form-input-group">
                    <div class="qres-input-icon">
                      <i class="bi bi-person-fill"></i>
                    </div>
                    <input
                      v-model="username"
                      type="text"
                      class="qres-form-control"
                      placeholder="Введите логин"
                      required
                      autocomplete="username"
                    />
                  </div>
                </div>

                <!-- Поле пароля -->
                <div class="qres-form-group">
                  <label class="qres-form-label">Пароль</label>
                  <div class="qres-form-input-group">
                    <div class="qres-input-icon">
                      <i class="bi bi-lock-fill"></i>
                    </div>
                    <input
                      v-model="password"
                      :type="showPassword ? 'text' : 'password'"
                      class="qres-form-control"
                      placeholder="Введите пароль"
                      required
                      autocomplete="current-password"
                    />
                    <button
                      @click="showPassword = !showPassword"
                      type="button"
                      class="password-toggle"
                    >
                      <i :class="showPassword ? 'bi-eye-slash' : 'bi-eye'"></i>
                    </button>
                  </div>
                </div>

                <!-- Кнопка входа -->
                <button
                  type="submit"
                  class="btn-submit"
                  :disabled="!username || !password || isLoading"
                >
                  <span v-if="isLoading" class="spinner"></span>
                  <i v-else class="bi bi-box-arrow-in-right"></i>
                  <span>{{ isLoading ? 'Вход...' : 'Войти' }}</span>
                </button>
              </form>
            </div>
          </div>

          <!-- Сообщение об ошибке -->
          <div v-if="error" class="error-message">
            <i class="bi bi-exclamation-triangle-fill"></i>
            <span>{{ error }}</span>
          </div>

          <!-- Отладочная информация (только в dev режиме) -->
          <div v-if="isDev && waiters.length === 0" class="debug-info">
            <small class="text-muted">
              Нет доступных официантов. Проверьте подключение к серверу.
            </small>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { apiService } from '@/services/api'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()

// Состояние формы
const loginMode = ref<'pin' | 'password'>('pin')
const pinCode = ref('')
const pinUsername = ref('')
const username = ref('')
const password = ref('')
const showPassword = ref(false)
const isLoading = ref(false)
const error = ref('')
const appVersion = ref('1.0.0')

// Список официантов (загружается с сервера)
const waiters = ref<Array<{ id: string; name: string; pin?: string }>>([])
const isLoadingWaiters = ref(false)

// Состояние соединения
const isConnected = ref(false)
const connectionError = ref('')

// PIN-клавиатура
const pinDisplay = computed(() => {
  const digits = pinCode.value.split('')
  const maxLength = 6 // всегда 6 индикаторов

  // Заполняем массив индикаторами заполнения
  while (digits.length < maxLength) {
    digits.push('')
  }

  return digits.map(digit => digit ? true : false)
})

// Состояние соединения
const connectionClass = computed(() =>
  isConnected.value ? 'connected' : 'disconnected'
)

const connectionIcon = computed(() =>
  isConnected.value ? 'bi-wifi' : 'bi-wifi-off'
)

const connectionText = computed(() => {
  if (isConnected.value) {
    return 'Подключен к серверу'
  } else {
    if (connectionError.value.includes('AbortError') || connectionError.value.includes('timeout')) {
      return '⏱️ Превышен таймаут'
    } else if (connectionError.value.includes('CORS')) {
      return '🚫 Ошибка CORS'
    } else if (connectionError.value.includes('fetch') || connectionError.value.includes('NetworkError')) {
      return '🔌 Сервер недоступен'
    } else {
      return '❌ Нет соединения'
    }
  }
})

// Проверка dev режима
const isDev = computed(() => import.meta.env.DEV)

// Методы PIN-клавиатуры
const addPinDigit = (digit: string) => {
  if (pinCode.value.length < 6) {
    pinCode.value += digit

    // Проверяем, нужен ли автоматический вход
    if (pinUsername.value.trim()) {
      const selectedWaiter = waiters.value.find(w => w.id === pinUsername.value)
      const expectedPinLength = selectedWaiter?.pin?.length || 6

      // Автоматический вход при достижении длины PIN выбранного официанта
      if (pinCode.value.length === expectedPinLength) {
        handlePinLogin()
      }
      // Или при заполнении максимальной длины (6 цифр)
      else if (pinCode.value.length === 6) {
        handlePinLogin()
      }
    }
  }
}

const clearPin = () => {
  pinCode.value = pinCode.value.slice(0, -1)
}

const clearAllPin = () => {
  pinCode.value = ''
}

// Обработчики входа
const handlePinLogin = async () => {
  if (!pinUsername.value.trim()) {
    error.value = 'Выберите официанта'
    return
  }

  // Находим выбранного официанта для проверки длины PIN
  const selectedWaiter = waiters.value.find(w => w.id === pinUsername.value)
  const expectedPinLength = selectedWaiter?.pin?.length || 4 // по умолчанию 4 цифры

  if (pinCode.value.length < 4) {
    error.value = 'PIN-код должен содержать минимум 4 цифры'
    return
  }

  // Если введено меньше цифр, чем ожидается для данного официанта, и это не максимум (6)
  if (pinCode.value.length < expectedPinLength && pinCode.value.length < 6) {
    // Не выполняем вход, ждем еще цифр
    return
  }

  try {
    isLoading.value = true
    error.value = ''

    const success = await authStore.loginWithPin(pinUsername.value, pinCode.value)

    if (success) {
      const redirectPath = (route.query.redirect as string) || '/dashboard'
      router.push(redirectPath)
    }
  } catch (err: unknown) {
    error.value = err instanceof Error ? err.message : 'Ошибка входа в систему'
  } finally {
    isLoading.value = false
    // Очищаем PIN после попытки входа
    pinCode.value = ''
  }
}

const handlePasswordLogin = async () => {
  try {
    isLoading.value = true
    error.value = ''

    const success = await authStore.loginWithPassword(username.value, password.value)

    if (success) {
      const redirectPath = (route.query.redirect as string) || '/dashboard'
      router.push(redirectPath)
    }
  } catch (err: unknown) {
    error.value = err instanceof Error ? err.message : 'Ошибка входа в систему'
  } finally {
    isLoading.value = false
    // Очищаем пароль после попытки входа
    password.value = ''
  }
}

// Проверка соединения с сервером
const checkConnection = async () => {
  const apiUrl = apiService.getApiUrl()

  try {
    // Простая проверка доступности API с таймаутом
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 5000)

    const response = await fetch(`${apiUrl}/health`, {
      method: 'GET',
      signal: controller.signal,
      headers: {
        'Accept': 'application/json'
      }
    })

    clearTimeout(timeoutId)

    if (response.ok) {
      isConnected.value = true
      connectionError.value = ''
    } else {
      isConnected.value = false
      connectionError.value = `HTTP ${response.status}`
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Неизвестная ошибка'
    isConnected.value = false
    connectionError.value = errorMessage
  }
}

// Загрузка списка официантов с сервера
const loadWaiters = async () => {
  try {
    isLoadingWaiters.value = true

    const waitersFromServer = await apiService.getWaiters()

    // Извлекаем массив пользователей из ответа сервера
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const usersArray = (waitersFromServer as any).users || waitersFromServer

    // Преобразуем данные с сервера в нужный формат
    const filteredWaiters = usersArray
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .filter((user: any) => user.role === 'waiter' && user.is_active)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .map((user: any) => ({
        id: user.username, // используем username как id для совместимости
        name: user.full_name,
        pin: user.pin_code
      }))

    waiters.value = filteredWaiters
  } catch (error) {
    console.error('Ошибка загрузки официантов:', error)
    waiters.value = []
  } finally {
    isLoadingWaiters.value = false
  }
}

// Инициализация
onMounted(async () => {
  // Проверяем соединение
  checkConnection()

  // Загружаем список официантов
  await loadWaiters()

  // Периодически проверяем соединение
  setInterval(checkConnection, 10000)

  // Если уже авторизован, перенаправляем
  if (authStore.isAuthenticated) {
    router.push('/dashboard')
  }
})
</script>

<style scoped lang="scss">
@use '@/styles/views/login';
</style>
