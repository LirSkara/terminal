import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { apiService } from '@/services/api'
import { webSocketService } from '@/services/websocket'
import type { User, AuthResponse } from '@/types'
import { storageKeys } from '@/utils/constants'
import { safeJsonParse } from '@/utils/format'

export const useAuthStore = defineStore('auth', () => {
  // Состояние
  const user = ref<User | null>(null)
  const token = ref<string | null>(null)
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  // Геттеры
  const isAuthenticated = computed(() => !!token.value && !!user.value)
  const isWaiter = computed(() => user.value?.role === 'waiter')
  const isAdmin = computed(() => user.value?.role === 'admin')
  const isOnShift = computed(() => user.value?.shift_active === true)

  // Инициализация из localStorage
  const initializeAuth = () => {
    const savedToken = localStorage.getItem(storageKeys.token)
    const savedUser = localStorage.getItem(storageKeys.user)

    if (savedToken && savedUser) {
      token.value = savedToken
      user.value = safeJsonParse(savedUser, null)
    }
  }

  // Сохранение в localStorage
  const saveAuthData = (authData: { token: string; user: User }) => {
    token.value = authData.token
    user.value = authData.user
    localStorage.setItem(storageKeys.token, authData.token)
    localStorage.setItem(storageKeys.user, JSON.stringify(authData.user))
  }

  // Очистка данных аутентификации
  const clearAuthData = () => {
    token.value = null
    user.value = null
    error.value = null
    localStorage.removeItem(storageKeys.token)
    localStorage.removeItem(storageKeys.user)
  }

  // Вход по PIN-коду
  const loginWithPin = async (username: string, pinCode: string): Promise<boolean> => {
    try {
      isLoading.value = true
      error.value = null

      const authResponse: AuthResponse = await apiService.loginWithPin(username, pinCode)
      const userData: User = await apiService.getCurrentUser()

      saveAuthData({
        token: authResponse.access_token,
        user: userData
      })

      // Подключаемся к WebSocket
      webSocketService.connect(authResponse.access_token)

      return true
    } catch (err: unknown) {
      error.value = err instanceof Error ? err.message : 'Неверный PIN-код'
      return false
    } finally {
      isLoading.value = false
    }
  }

  // Вход по логину и паролю
  const loginWithPassword = async (username: string, password: string): Promise<boolean> => {
    try {
      isLoading.value = true
      error.value = null

      const authResponse: AuthResponse = await apiService.loginWithPassword(username, password)
      const userData: User = await apiService.getCurrentUser()

      saveAuthData({
        token: authResponse.access_token,
        user: userData
      })

      // Подключаемся к WebSocket
      webSocketService.connect(authResponse.access_token)

      return true
    } catch (err: unknown) {
      error.value = err instanceof Error ? err.message : 'Неверные учетные данные'
      return false
    } finally {
      isLoading.value = false
    }
  }

  // Проверка текущего пользователя
  const checkCurrentUser = async (): Promise<boolean> => {
    if (!token.value) {
      return false
    }

    try {
      isLoading.value = true
      const userData: User = await apiService.getCurrentUser()
      user.value = userData
      localStorage.setItem(storageKeys.user, JSON.stringify(userData))

      // Подключаемся к WebSocket если еще не подключены
      if (!webSocketService.isConnected() && token.value) {
        webSocketService.connect(token.value)
      }

      return true
    } catch {
      // Токен недействителен
      clearAuthData()
      return false
    } finally {
      isLoading.value = false
    }
  }

  // Выход
  const logout = async (): Promise<void> => {
    try {
      isLoading.value = true

      // Отключаемся от WebSocket
      webSocketService.disconnect()

      // Вызываем API выхода
      await apiService.logout()
    } catch (err) {
      console.warn('Ошибка при выходе:', err)
    } finally {
      clearAuthData()
      isLoading.value = false
    }
  }

  // Обновление информации о пользователе
  const refreshUser = async (): Promise<void> => {
    if (!token.value) return

    try {
      const userData: User = await apiService.getCurrentUser()
      user.value = userData
      localStorage.setItem(storageKeys.user, JSON.stringify(userData))
    } catch (err) {
      console.error('Ошибка обновления пользователя:', err)
    }
  }

  // Очистка ошибок
  const clearError = () => {
    error.value = null
  }

  return {
    // Состояние
    user,
    token,
    isLoading,
    error,

    // Геттеры
    isAuthenticated,
    isWaiter,
    isAdmin,
    isOnShift,

    // Действия
    initializeAuth,
    loginWithPin,
    loginWithPassword,
    logout,
    checkCurrentUser,
    refreshUser,
    clearError
  }
})
