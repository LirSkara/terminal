import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      redirect: '/dashboard'
    },
    {
      path: '/login',
      name: 'login',
      component: () => import('@/views/LoginView.vue'),
      meta: {
        requiresAuth: false,
        title: 'Вход в систему'
      }
    },
    {
      path: '/dashboard',
      name: 'dashboard',
      component: () => import('@/views/DashboardView.vue'),
      meta: {
        requiresAuth: true,
        title: 'Столики'
      }
    },
    {
      path: '/create-order',
      name: 'create-order',
      component: () => import('@/views/CreateOrderView.vue'),
      meta: {
        requiresAuth: true,
        title: 'Создание заказа'
      }
    },
    {
      path: '/:pathMatch(.*)*',
      redirect: '/dashboard'
    }
  ]
})

// Глобальная защита маршрутов
router.beforeEach(async (to, from, next) => {
  const authStore = useAuthStore()

  // Проверяем требует ли маршрут авторизации
  const requiresAuth = to.meta.requiresAuth !== false

  if (requiresAuth && !authStore.isAuthenticated) {
    // Пытаемся восстановить сессию если есть токен
    if (authStore.token) {
      const success = await authStore.checkCurrentUser()
      if (success) {
        next()
        return
      }
    }

    // Перенаправляем на страницу входа
    next({ name: 'login', query: { redirect: to.fullPath } })
    return
  }

  // Если пользователь авторизован и пытается зайти на страницу входа
  if (to.name === 'login' && authStore.isAuthenticated) {
    next({ name: 'dashboard' })
    return
  }

  next()
})

// Устанавливаем заголовок страницы
router.afterEach((to) => {
  const title = to.meta.title as string
  if (title) {
    document.title = `${title} - QRes Waiter Terminal`
  } else {
    document.title = 'QRes Waiter Terminal'
  }
})

export default router
