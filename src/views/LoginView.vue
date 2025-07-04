<template>
  <div class="login-page">
    <!-- Фоновая секция на всю ширину -->
    <div class="background-section">
      <!-- Индикатор соединения в правом верхнем углу -->
      <div
        class="connection-status"
        :class="connectionClass"
        :title="`API: ${apiService.getApiUrl()}`"
        @click="checkConnection"
      >
        <i :class="connectionIcon"></i>
        <span>{{ connectionText }}</span>
      </div>

      <!-- Левая часть с брендингом -->
      <div class="brand-content">
        <div class="brand-header">
          <div class="brand-logo">
            <i class="bi bi-egg-fried"></i>
          </div>
          <h1 class="brand-title">QRes OS 4</h1>
          <h2 class="brand-subtitle">Терминал официанта</h2>
          <p class="brand-description">
            Современная система управления заказами в ресторане.
            Быстро, надёжно, удобно.
          </p>
        </div>

        <div class="brand-features">
          <div class="feature-item">
            <div class="feature-icon">
              <i class="bi bi-lightning-charge-fill"></i>
            </div>
            <div class="feature-text">
              <h4>Быстрая работа</h4>
              <p>Принимайте заказы мгновенно</p>
            </div>
          </div>

          <div class="feature-item">
            <div class="feature-icon">
              <i class="bi bi-shield-fill-check"></i>
            </div>
            <div class="feature-text">
              <h4>Безопасность</h4>
              <p>Защищённая авторизация</p>
            </div>
          </div>

          <div class="feature-item">
            <div class="feature-icon">
              <i class="bi bi-graph-up-arrow"></i>
            </div>
            <div class="feature-text">
              <h4>Аналитика</h4>
              <p>Статистика в реальном времени</p>
            </div>
          </div>
        </div>

        <div class="brand-footer">
          <p class="version-info">Версия {{ appVersion }} • © 2025 QRes Technologies</p>
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
                <div class="form-group">
                  <div class="input-group">
                    <div class="input-icon">
                      <i class="bi bi-person-fill"></i>
                    </div>
                    <select
                      v-model="pinUsername"
                      class="form-control form-select"
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
                <div class="form-group">
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
                <div class="form-group">
                  <label class="form-label">Логин</label>
                  <div class="input-group">
                    <div class="input-icon">
                      <i class="bi bi-person-fill"></i>
                    </div>
                    <input
                      v-model="username"
                      type="text"
                      class="form-control"
                      placeholder="Введите логин"
                      required
                      autocomplete="username"
                    />
                  </div>
                </div>

                <!-- Поле пароля -->
                <div class="form-group">
                  <label class="form-label">Пароль</label>
                  <div class="input-group">
                    <div class="input-icon">
                      <i class="bi bi-lock-fill"></i>
                    </div>
                    <input
                      v-model="password"
                      :type="showPassword ? 'text' : 'password'"
                      class="form-control"
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
    return 'Сервер подключен'
  } else {
    if (connectionError.value.includes('AbortError') || connectionError.value.includes('timeout')) {
      return 'Таймаут соединения'
    } else if (connectionError.value.includes('CORS')) {
      return 'Ошибка CORS'
    } else if (connectionError.value.includes('fetch') || connectionError.value.includes('NetworkError')) {
      return 'Сервер недоступен'
    } else {
      return 'Нет соединения с сервером'
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
.login-page {
  height: 100vh;
  display: flex;
  position: relative;
}

// Фоновая секция на всю ширину
.background-section {
  width: 100%;
  height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><pattern id="grid" width="10" height="10" patternUnits="userSpaceOnUse"><path d="M 10 0 L 0 0 0 10" fill="none" stroke="rgba(255,255,255,0.1)" stroke-width="0.5"/></pattern></defs><rect width="100" height="100" fill="url(%23grid)"/></svg>');
    opacity: 0.3;
  }
}

// Контейнер брендинга и формы
.brand-content {
  position: relative;
  z-index: 1;
  width: 100%;
  max-width: 400px;
  color: white;
  text-align: center;
  margin-right: 3rem;

  @media (max-width: 1024px) {
    display: none; // Скрываем на планшетах и мобильных
  }
}

.brand-header {
  margin-bottom: 3rem;
}

.brand-logo {
  font-size: 5rem;
  margin-bottom: 1rem;

  i {
    background: linear-gradient(45deg, #ffd700, #ffed4e);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    animation: float 3s ease-in-out infinite;
  }
}

.brand-title {
  font-size: 3.5rem;
  font-weight: 800;
  margin-bottom: 0.5rem;
  text-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
}

.brand-subtitle {
  font-size: 1.5rem;
  font-weight: 300;
  margin-bottom: 1rem;
  color: rgba(255, 255, 255, 0.9);
}

.brand-description {
  font-size: 1.1rem;
  line-height: 1.6;
  color: rgba(255, 255, 255, 0.8);
  max-width: 400px;
  margin: 0 auto;
}

.brand-features {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  margin-bottom: 3rem;
}

.feature-item {
  display: flex;
  align-items: center;
  text-align: left;
  padding: 1rem;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  backdrop-filter: blur(10px);
}

.feature-icon {
  width: 60px;
  height: 60px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 1rem;

  i {
    font-size: 1.5rem;
    color: #ffd700;
  }
}

.feature-text {
  h4 {
    margin: 0 0 0.25rem 0;
    font-size: 1.1rem;
    font-weight: 600;
  }

  p {
    margin: 0;
    font-size: 0.9rem;
    color: rgba(255, 255, 255, 0.8);
  }
}

.brand-footer {
  .version-info {
    font-size: 0.9rem;
    color: rgba(255, 255, 255, 0.7);
    margin: 0;
  }
}

// Форма входа поверх фона
.login-form-card {
  position: relative;
  z-index: 2;
  width: 100%;
  max-width: 450px;
  background: white;
  border-radius: 20px;
  padding: 2.5rem;
  box-shadow: 0 25px 80px rgba(0, 0, 0, 0.15);
  backdrop-filter: blur(10px);

  @media (max-width: 768px) {
    max-width: 100%;
    margin: 1rem;
    padding: 2rem;
    border-radius: 16px;
  }
}

.connection-status {
  position: fixed;
  top: 20px;
  right: 20px;
  padding: 0.75rem 1.25rem;
  border-radius: 25px;
  font-size: 0.9rem;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  background: rgba(255, 255, 255, 0.95);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  backdrop-filter: blur(10px);
  z-index: 9999;
  transition: all 0.3s ease;
  cursor: pointer;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 12px 40px rgba(0, 0, 0, 0.15);
  }

  &.connected {
    color: #155724;
    border: 2px solid #28a745;

    i {
      color: #28a745;
      animation: pulse-success 2s infinite;
    }
  }

  &.disconnected {
    color: #721c24;
    border: 2px solid #dc3545;
    animation: shake 0.5s ease-in-out;

    i {
      color: #dc3545;
      animation: pulse-danger 1s infinite;
    }
  }

  @media (max-width: 768px) {
    top: 15px;
    right: 15px;
    padding: 0.6rem 1rem;
    font-size: 0.85rem;
  }

  @media (max-width: 576px) {
    top: 10px;
    right: 10px;
    padding: 0.5rem 0.75rem;
    font-size: 0.8rem;
    gap: 0.5rem;
  }
}

.form-header {
  text-align: center;
  margin-bottom: 2rem;
}

.form-title {
  font-size: 2rem;
  font-weight: 700;
  color: #2c3e50;
  margin-bottom: 0.5rem;
}

.form-subtitle {
  color: #6c757d;
  font-size: 1rem;
  margin: 0;
}

.login-mode-switcher {
  display: flex;
  background: #f8f9fa;
  border-radius: 12px;
  padding: 0.25rem;
  margin-bottom: 2rem;
}

.mode-button {
  flex: 1;
  padding: 0.75rem 1rem;
  border: none;
  background: transparent;
  color: #6c757d;
  font-weight: 500;
  border-radius: 8px;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;

  &.active {
    background: #696fd4;
    color: white;
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(52, 152, 219, 0.3);
  }

  &:hover:not(.active) {
    background: rgba(52, 152, 219, 0.1);
    color: #696fd4;
  }
}

.forms-container {
  margin-bottom: 1.5rem;
}

.login-form {
  .form-group {
    margin-bottom: 1.5rem;
  }

  .form-label {
    display: block;
    margin-bottom: 0.5rem;
    font-weight: 600;
    color: #2c3e50;
  }

  .input-group {
    position: relative;
    display: flex;
    align-items: center;
  }

  .input-icon {
    position: absolute;
    left: 1rem;
    z-index: 3;
    color: #6c757d;
  }

  .form-control {
    width: 100%;
    padding: 1rem 1rem 1rem 3rem;
    border: 2px solid #e9ecef;
    border-radius: 12px;
    font-size: 1rem;
    transition: all 0.3s ease;

    &:focus {
      outline: none;
      border-color: #696fd4;
      box-shadow: 0 0 0 3px rgba(52, 152, 219, 0.1);
    }
  }

  .form-select {
    background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16'%3e%3cpath fill='none' stroke='%23343a40' stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='m1 6 7 7 7-7'/%3e%3c/svg%3e");
    background-repeat: no-repeat;
    background-position: right 1rem center;
    background-size: 16px 12px;
    padding-right: 3rem;
    appearance: none;

    &:focus {
      background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16'%3e%3cpath fill='none' stroke='%23696fd4' stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='m1 6 7 7 7-7'/%3e%3c/svg%3e");
    }

    &:disabled {
      background-color: #f8f9fa;
      color: #6c757d;
      cursor: not-allowed;
      opacity: 0.7;
    }
  }

  .password-toggle {
    position: absolute;
    right: 1rem;
    background: none;
    border: none;
    color: #6c757d;
    cursor: pointer;
    z-index: 3;

    &:hover {
      color: #696fd4;
    }
  }
}

.pin-display {
  display: flex;
  justify-content: center;
  gap: 0.75rem;
  margin-bottom: 1.5rem;
}

.pin-digit {
  width: 50px;
  height: 6px;
  border: none;
  border-radius: 3px;
  background: #e9ecef;
  transition: all 0.3s ease;
  position: relative;

  &.filled {
    background: #696fd4;
    box-shadow: 0 0 8px rgba(105, 111, 212, 0.4);
  }
}

.pin-keyboard {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  margin-bottom: 1.5rem;
}

.keyboard-row {
  display: flex;
  gap: 0.75rem;
  justify-content: space-between;
  width: 100%;
}

.keyboard-btn {
  flex: 1;
  height: 70px;
  border: 2px solid #e9ecef;
  background: white;
  color: #2c3e50;
  font-size: 1.4rem;
  font-weight: 600;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    border-color: #696fd4;
    background: #f8f9fa;
    transform: translateY(-2px);
  }

  &:active {
    transform: translateY(0);
  }

  &.special {
    background: #f8f9fa;

    &.danger {
      color: #e74c3c;

      &:hover {
        border-color: #e74c3c;
        background: #fdf2f2;
      }
    }
  }
}

.btn-submit {
  width: 100%;
  padding: 1rem 1.5rem;
  background: linear-gradient(135deg, #696fd4, #2980b9);
  color: white;
  border: none;
  border-radius: 12px;
  font-size: 1.1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;

  &:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 8px 25px rgba(52, 152, 219, 0.3);
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .spinner {
    width: 20px;
    height: 20px;
    border: 2px solid rgba(255, 255, 255, 0.3);
    border-top: 2px solid white;
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }
}

.error-message {
  padding: 1rem;
  background: #f8d7da;
  color: #721c24;
  border: 1px solid #f5c6cb;
  border-radius: 8px;
  margin-bottom: 1rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.debug-info {
  padding: 0.5rem;
  background: #f8f9fa;
  border: 1px solid #dee2e6;
  border-radius: 4px;
  margin-top: 0.5rem;
  font-size: 0.75rem;
  text-align: center;
}

// Анимации
@keyframes float {
  0%, 100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-10px);
  }
}

@keyframes pulse {
  0% {
    opacity: 1;
  }
  50% {
    opacity: 0.7;
  }
  100% {
    opacity: 1;
  }
}

@keyframes pulse-success {
  0%, 100% {
    opacity: 1;
    transform: scale(1);
  }
  50% {
    opacity: 0.8;
    transform: scale(1.1);
  }
}

@keyframes pulse-danger {
  0%, 100% {
    opacity: 1;
    transform: scale(1);
  }
  50% {
    opacity: 0.6;
    transform: scale(1.2);
  }
}

@keyframes shake {
  0%, 100% {
    transform: translateX(0);
  }
  25% {
    transform: translateX(-2px);
  }
  75% {
    transform: translateX(2px);
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

// Адаптивность
@media (max-width: 1200px) {
  .background-section {
    padding: 1.5rem;
  }

  .brand-content {
    margin-right: 2rem;
  }
}

@media (max-width: 1024px) {
  .background-section {
    justify-content: center;
  }

  .login-form-card {
    max-width: 500px;
  }
}

@media (max-width: 768px) {
  .background-section {
    padding: 1rem;
  }

  .login-form-card {
    margin: 0.5rem;
    padding: 2rem;
  }

  .brand-logo {
    font-size: 3rem;
  }

  .brand-title {
    font-size: 2.5rem;
  }

  .feature-item {
    padding: 0.75rem;
  }
}

@media (max-width: 576px) {
  .login-form-card {
    margin: 0.25rem;
    padding: 1.5rem;
  }

  .form-title {
    font-size: 1.75rem;
  }

  .pin-digit {
    width: 40px;
    height: 5px;
  }

  .keyboard-btn {
    height: 60px;
    font-size: 1.2rem;
  }
}
</style>
