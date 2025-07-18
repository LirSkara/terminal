<template>
  <div class="create-order-view">
    <!-- Заголовок -->
    <div class="order-header">
      <div class="container-fluid">
        <div class="row align-items-center">
          <div class="col-md-8">
            <h1 class="order-title">
              <i :class="editMode ? 'bi bi-pencil-square me-3' : 'bi bi-plus-circle-fill me-3'"></i>
              {{ editMode ? `Редактирование заказа #${existingOrder?.id}` : 'Создание заказа' }}
              <span
                class="order-info-item clickable ms-3"
                @click="openOrderTypeModal"
                :class="{
                  'order-table': selectedOrderType === 'table' && selectedTable,
                  'order-takeaway': selectedOrderType === 'takeaway',
                  'order-delivery': selectedOrderType === 'delivery',
                  'order-pending': !selectedOrderType || (selectedOrderType === 'table' && !selectedTable)
                }"
              >
                <i :class="getOrderTypeIcon()" class="me-1"></i>
                {{ getOrderLocationText() }}
                <i v-if="!editMode" class="bi bi-pencil-square ms-1"></i>
              </span>
            </h1>
            <p class="order-subtitle">
              Время: {{ currentTime }} •
              Официант: {{ waiterName }}
            </p>
          </div>
          <div class="col-md-4 text-end">
            <button
              @click="goBack"
              class="back-btn"
              title="Вернуться назад"
            >
              <i class="bi bi-arrow-left"></i>
              Назад
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Категории блюд -->
    <div class="categories-section">
      <div class="container-fluid">
        <div class="categories-tabs">
          <div class="categories-list">
            <button
              v-for="category in combinedCategories"
              :key="category.id"
              @click="activeCategory = category.id"
              :class="['category-tab', { active: activeCategory === category.id }]"
              :style="{ '--category-color': category.color }"
            >
              <i :class="category.icon"></i>
              <span>{{ category.name }}</span>
              <div class="category-count">
                {{ getCategoryCount(category) }}
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Основной контент -->
    <div class="order-content">
      <div class="container-fluid">
        <div class="row h-100">
          <!-- Левая часть: меню -->
          <div class="col-lg-8 col-md-7">
            <div class="menu-section">
              <!-- Блюда в категории -->
              <div class="dishes-grid">
                <div
                  v-for="dish in currentCategoryDishes"
                  :key="dish.id"
                  class="dish-card"
                  @click="openDishModal(dish)"
                >
                  <div class="dish-image">
                    <img :src="dish.image" :alt="dish.name" />
                    <div class="dish-overlay">
                      <i class="bi bi-plus-lg"></i>
                    </div>
                  </div>
                  <div class="dish-info">
                    <h4 class="dish-name">{{ dish.name }}</h4>

                    <!-- Информация для официантов -->
                    <div class="waiter-info">
                      <div class="info-row" v-if="dish.cookingTime">
                        <i class="bi bi-clock"></i>
                        <span>{{ dish.cookingTime }} мин</span>
                      </div>
                      <div class="info-row" v-if="dish.portionWeight">
                        <i class="bi bi-speedometer2"></i>
                        <span>{{ dish.portionWeight }}г</span>
                      </div>
                      <div class="info-row" v-if="dish.calories">
                        <i class="bi bi-lightning"></i>
                        <span>{{ dish.calories }} ккал</span>
                      </div>
                      <div class="info-row allergens" v-if="dish.allergens && dish.allergens.length > 0">
                        <i class="bi bi-exclamation-triangle"></i>
                        <span>{{ dish.allergens.join(', ') }}</span>
                      </div>
                    </div>

                    <div class="dish-footer">
                      <div class="dish-price">
                        {{ formatDishPrice(dish) }}₽
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Правая часть: корзина -->
          <div class="col-lg-4 col-md-5">
            <div class="cart-section">
              <div class="cart-header">
                <h3 class="cart-title">
                  <i :class="editMode ? 'bi bi-plus-circle' : 'bi bi-cart3'"></i>
                  {{ editMode ? `Дозаказ к #${existingOrder?.id}` : 'Заказ' }}
                  <span class="cart-count" v-if="cartItems.length > 0">({{ cartItems.length }})</span>
                </h3>
                <button
                  v-if="cartItems.length > 0"
                  @click="clearCart"
                  class="clear-cart-btn"
                  title="Очистить корзину"
                >
                  <i class="bi bi-trash"></i>
                </button>
              </div>

              <!-- Пустая корзина -->
              <div v-if="cartItems.length === 0" class="empty-cart">
                <i :class="editMode ? 'bi bi-plus-circle-dotted' : 'bi bi-cart-x'"></i>
                <p>{{ editMode ? 'Нет новых позиций' : 'Корзина пуста' }}</p>
                <span>{{ editMode ? 'Добавьте дополнительные блюда к заказу' : 'Добавьте блюда из меню' }}</span>
              </div>

              <!-- Товары в корзине -->
              <div v-else class="cart-items">
                <div
                  v-for="item in cartItems"
                  :key="item.id"
                  class="cart-item"
                >
                  <div class="cart-item-image">
                    <img :src="item.image" :alt="item.name" />
                  </div>
                  <div class="cart-item-info">
                    <h5 class="cart-item-name">{{ item.name }}</h5>
                    <p class="cart-item-variations" v-if="item.selectedVariations">
                      {{ formatVariations(item.selectedVariations) }}
                    </p>                      <div class="cart-item-controls">
                        <div class="quantity-controls">
                          <button
                            @click="item.quantity === 1 ? removeFromCart(item) : decreaseQuantity(item)"
                            class="qty-btn"
                            :class="{ 'qty-btn-remove': item.quantity === 1 }"
                          >
                            <i :class="item.quantity === 1 ? 'bi bi-trash' : 'bi bi-dash'"></i>
                          </button>
                          <span class="quantity">{{ item.quantity }}</span>
                          <button @click="increaseQuantity(item)" class="qty-btn">
                            <i class="bi bi-plus"></i>
                          </button>
                        </div>
                        <div class="cart-item-price">{{ item.totalPrice }}₽</div>
                      </div>                    </div>
                    <button @click="removeFromCart(item)" class="remove-item-btn" style="display: none;">
                      <i class="bi bi-x"></i>
                    </button>
                </div>
              </div>

              <!-- Итого и оформление -->
              <div v-if="cartItems.length > 0" class="cart-footer">
                <!-- Кнопки действий -->
                <div class="cart-actions">
                  <button
                    @click="editMode ? addItemsToOrder() : createOrder()"
                    class="create-order-btn"
                  >
                    <i :class="editMode ? 'bi bi-plus-circle-fill' : 'bi bi-check-circle-fill'"></i>
                    {{ editMode ? `Добавить позиции (${totalPrice}₽)` : `Оформить заказ (${totalPrice}₽)` }}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Модальные окна -->
    <DishModal
      :show="showDishModal"
      :selected-dish="selectedDish"
      :selected-variations="selectedVariations"
      :quantity="modalQuantity"
      :total-price="calculateDishPrice() * modalQuantity"
      @close="closeDishModal"
      @select-variation="selectVariation"
      @increase-quantity="modalQuantity++"
      @decrease-quantity="modalQuantity > 1 && modalQuantity--"
      @add-to-cart="addDishToCart"
    />

    <OrderTypeModal
      :show="showOrderTypeModal"
      :order-types="orderTypes"
      :selected-order-type="selectedOrderType"
      :is-loading-zones="isLoadingZones"
      :is-loading-tables="isLoadingTables"
      :available-zones="availableZones"
      :active-zone="activeZone"
      :tables-by-zones="tablesByZones"
      :zones="zones"
      @close="closeOrderTypeModal"
      @select-order-type="selectOrderType"
      @select-zone="selectZone"
      @select-table="selectTable"
    />

    <OrderConfirmModal
      :show="showOrderConfirmModal"
      :order-summary-text="orderConfirmData.orderSummaryText"
      :items-count="orderConfirmData.itemsCount"
      :payment-method-name="orderConfirmData.paymentMethodName"
      :total-price="orderConfirmData.totalPrice"
      :order-type="selectedOrderType || ''"
      :is-delivery="selectedOrderType === 'delivery'"
      @close="closeOrderConfirmModal"
      @go-to-dashboard="goToDashboard"
      @create-another-order="createAnotherOrder"
      @confirm-order="handleDeliveryOrderConfirm"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useNotificationStore } from '@/stores/notifications'
import { apiService } from '@/services/api'
import { cacheService } from '@/services/cache'
import type { Location, Dish as ApiDish, DishVariation as ApiDishVariation } from '@/types/api'
import DishModal from '@/components/modals/DishModal.vue'
import OrderTypeModal from '@/components/modals/OrderTypeModal.vue'
import OrderConfirmModal from '@/components/modals/OrderConfirmModal.vue'

// Типы
interface DishVariationOption {
  id: string
  name: string
  price: number // Фиксированная цена вместо модификатора
  portionWeight?: number // вес порции в граммах
  calories?: number // калорийность
  cookingTime?: number // время приготовления в минутах
}

interface DishVariation {
  id: string
  name: string
  required: boolean
  options: DishVariationOption[]
}

interface Dish {
  id: string
  name: string
  description: string
  image: string
  basePrice: number
  categoryId: string
  isPopular?: boolean
  isNew?: boolean
  isVegetarian?: boolean
  variations?: DishVariation[]
  // Информация для официантов
  cookingTime?: number // в минутах
  calories?: number
  allergens?: string[]
  ingredients?: string[]
  recommendations?: string
  isAvailable?: boolean
  portionWeight?: number // в граммах
  spicyLevel?: 'mild' | 'medium' | 'hot' | 'very-hot'
}

interface Category {
  id: string
  name: string
  icon: string
  color: string
  items: Dish[]
}

interface CartItem {
  id: string
  dishId: string
  name: string
  image: string
  basePrice: number
  quantity: number
  selectedVariations?: Record<string, DishVariationOption>
  totalPrice: number
}

interface OrderType {
  id: string
  name: string
  icon: string
  description: string
}

// Интерфейс для столика в UI
interface UITable {
  id: string           // Настоящий ID столика из API
  number: string       // Номер столика для отображения
  name: string
  capacity: number
  zone: string
}

// Интерфейс для зоны
interface Zone {
  id: string
  name: string
  color: string
}

// Stores and router
const router = useRouter()
const authStore = useAuthStore()
const notificationStore = useNotificationStore()

// Реактивные данные
const currentTime = ref('')
const activeCategory = ref('')
const selectedTable = ref<string | null>(null)
const cartItems = ref<CartItem[]>([])
const selectedOrderType = ref<string | null>(null)

// Режим редактирования заказа
const editMode = ref(false)
const editingOrderId = ref<number | null>(null)
const existingOrder = ref<import('@/types/api').Order | null>(null)

// Состояние загрузки
const isLoadingZones = ref(false)
const isLoadingTables = ref(false)
const isLoadingCategories = ref(false)
const isLoadingDishes = ref(false)
const loadingDishesForCategories = ref<Set<number>>(new Set()) // Трекинг загрузки блюд для категорий

// Данные из API
const zones = ref<Zone[]>([])
const availableTables = ref<UITable[]>([])
const apiCategories = ref<import('@/types/api').Category[]>([])
const apiDishes = ref<Record<number, import('@/types/api').Dish[]>>({}) // categoryId -> dishes
const dishVariations = ref<Record<number, import('@/types/api').DishVariation[]>>({}) // dishId -> variations

// Модальные окна
const showDishModal = ref(false)
const showOrderTypeModal = ref(false)
const showOrderConfirmModal = ref(false)
const selectedDish = ref<Dish | null>(null)
const selectedVariations = ref<Record<string, DishVariationOption>>({})
const modalQuantity = ref(1)
const activeZone = ref<string | null>(null)

// Данные для модального окна подтверждения
const orderConfirmData = ref({
  orderSummaryText: '',
  itemsCount: 0,
  paymentMethodName: '',
  totalPrice: 0
})

// Типы заказов
const orderTypes = ref<OrderType[]>([
  {
    id: 'table',
    name: 'За столиком',
    icon: 'bi-table',
    description: 'Выберите свободный столик в зале'
  },
  {
    id: 'takeaway',
    name: 'С собой',
    icon: 'bi-bag',
    description: 'Заказ на вынос'
  },
  {
    id: 'delivery',
    name: 'Доставка',
    icon: 'bi-truck',
    description: 'Доставим по указанному адресу'
  }
])

// Имя официанта
const waiterName = computed(() => {
  return authStore.user?.full_name || authStore.user?.username || 'Не определен'
})

// Все данные загружаются из API, демо данные удалены

// Функции преобразования данных API в UI формат
const mapApiCategoryToUICategory = (apiCategory: import('@/types/api').Category): Category => {
  // Используем иконку и цвет из API, или значения по умолчанию если они отсутствуют
  const defaultIcon = 'bi-star'
  const defaultColor = '#6c757d'

  return {
    id: apiCategory.id.toString(),
    name: apiCategory.name,
    icon: apiCategory.icon || defaultIcon,
    color: apiCategory.color || defaultColor,
    items: [] // Будет заполнено позже при загрузке блюд
  }
}

const mapApiDishToUIDish = (apiDish: import('@/types/api').Dish, variations?: import('@/types/api').DishVariation[]): Dish => {
  // Получаем базовую цену из первой вариации или используем 0
  let basePrice = 0
  const dishVariations: DishVariation[] = []

  if (variations && variations.length > 0) {
    // Создаем группу размеров если есть вариации
    const sizeOptions: DishVariationOption[] = variations.map(variation => ({
      id: variation.id.toString(),
      name: variation.name,
      price: typeof variation.price === 'string' ? parseFloat(variation.price) : variation.price,
      portionWeight: variation.weight || undefined,
      calories: variation.calories || undefined,
      cookingTime: apiDish.cooking_time || undefined
    }))

    // Берем цену первой вариации как базовую
    const firstVariationPrice = variations[0].price
    basePrice = typeof firstVariationPrice === 'string' ? parseFloat(firstVariationPrice) : firstVariationPrice

    // Если есть несколько вариаций, создаем группу выбора
    if (variations.length > 1) {
      dishVariations.push({
        id: 'size',
        name: 'Размер',
        required: true,
        options: sizeOptions
      })
    }
  }

  return {
    id: apiDish.id.toString(),
    name: apiDish.name,
    description: apiDish.description,
    image: apiDish.main_image_url || '/placeholder-dish.jpg',
    basePrice: basePrice,
    categoryId: apiDish.category_id.toString(),
    isPopular: apiDish.is_popular,
    isNew: false, // TODO: добавить поле в API
    isVegetarian: false, // TODO: добавить поле в API
    cookingTime: apiDish.cooking_time || undefined,
    calories: apiDish.calories || undefined,
    allergens: [], // TODO: добавить поле в API
    ingredients: apiDish.ingredients || [],
    recommendations: '', // TODO: добавить поле в API
    isAvailable: apiDish.is_available,
    portionWeight: apiDish.weight || undefined,
    variations: dishVariations
  }
}

// Вычисляемые свойства
const combinedCategories = computed(() => {
  // Преобразуем API категории в UI формат
  const apiCategoriesUI = apiCategories.value.map(category => {
    const uiCategory = mapApiCategoryToUICategory(category)

    // Добавляем блюда если они загружены для этой категории
    const dishesForCategory = apiDishes.value[category.id] || []
    uiCategory.items = dishesForCategory.map(dish => {
      // Получаем вариации для данного блюда
      const variations = dishVariations.value[dish.id] || []
      return mapApiDishToUIDish(dish, variations)
    })

    return uiCategory
  })

  // Возвращаем только API категории (демо данные удалены)
  return apiCategoriesUI
})

const currentCategoryDishes = computed(() => {
  const category = combinedCategories.value.find(c => c.id === activeCategory.value)
  return category?.items || []
})

const totalPrice = computed(() => {
  return cartItems.value.reduce((sum, item) => sum + item.totalPrice, 0)
})

// Группировка столиков по зонам
const tablesByZones = computed(() => {
  const zones: Record<string, typeof availableTables.value> = {}
  availableTables.value.forEach(table => {
    if (!zones[table.zone]) {
      zones[table.zone] = []
    }
    zones[table.zone].push(table)
  })
  return zones
})

// Список всех зон
const availableZones = computed(() => {
  return Object.keys(tablesByZones.value)
})

// Методы
const updateTime = () => {
  const now = new Date()
  currentTime.value = now.toLocaleTimeString('ru-RU', {
    hour: '2-digit',
    minute: '2-digit'
  })
}

const goBack = () => {
  router.push({ name: 'dashboard' })
}

const getOrderLocationText = () => {
  if (selectedOrderType.value === 'table' && selectedTable.value) {
    const table = availableTables.value.find(t => t.id === selectedTable.value)
    return table ? `${table.name} (${table.zone})` : `Столик ${selectedTable.value}`
  } else if (selectedOrderType.value === 'takeaway') {
    return 'С собой'
  } else if (selectedOrderType.value === 'delivery') {
    return 'Доставка'
  }
  return 'Выберите тип заказа'
}

const getOrderTypeIcon = () => {
  if (selectedOrderType.value === 'table') {
    return 'bi bi-table'
  } else if (selectedOrderType.value === 'takeaway') {
    return 'bi bi-bag'
  } else if (selectedOrderType.value === 'delivery') {
    return 'bi bi-truck'
  }
  return 'bi bi-question-circle'
}

const openOrderTypeModal = () => {
  // В режиме редактирования не открываем модальное окно выбора типа заказа
  if (editMode.value) {
    return
  }

  showOrderTypeModal.value = true
  // Устанавливаем первую зону как активную по умолчанию
  if (availableZones.value.length > 0) {
    activeZone.value = availableZones.value[0]
  }
}

const closeOrderTypeModal = () => {
  showOrderTypeModal.value = false
  activeZone.value = null
}

const selectZone = (zoneName: string) => {
  activeZone.value = zoneName
}

const selectOrderType = (type: string) => {
  selectedOrderType.value = type
  if (type === 'takeaway' || type === 'delivery') {
    selectedTable.value = type
    closeOrderTypeModal()
  }
  // Для столика оставляем модальное окно открытым для выбора конкретного столика
}

const selectTable = (tableId: string) => {
  selectedTable.value = tableId
  closeOrderTypeModal()
}

const openDishModal = (dish: Dish) => {
  selectedDish.value = dish
  selectedVariations.value = {}
  modalQuantity.value = 1

  // Устанавливаем значения по умолчанию для обязательных вариаций
  if (dish.variations) {
    dish.variations.forEach(variation => {
      if (variation.required && variation.options.length > 0) {
        selectedVariations.value[variation.id] = variation.options[0]
      }
    })
  }

  showDishModal.value = true
}

const closeDishModal = () => {
  showDishModal.value = false
  selectedDish.value = null
  selectedVariations.value = {}
  modalQuantity.value = 1
}

// Функции для модального окна подтверждения заказа
const closeOrderConfirmModal = () => {
  showOrderConfirmModal.value = false
}

const goToDashboard = () => {
  showOrderConfirmModal.value = false
  router.push({ name: 'dashboard' })
}

const createAnotherOrder = () => {
  showOrderConfirmModal.value = false
  // Очищаем корзину и данные заказа
  cartItems.value = []
  selectedOrderType.value = null
  selectedTable.value = null

  // Показываем модальное окно выбора типа заказа для нового заказа
  openOrderTypeModal()
}

const handleDeliveryOrderConfirm = async (deliveryData?: { customerName: string; phone: string; address: string; comment?: string }) => {
  console.log('Подтверждение заказа доставки:', {
    orderType: selectedOrderType.value,
    items: cartItems.value,
    total: totalPrice.value,
    deliveryData
  })

  try {
    // Проверяем, что есть данные для создания заказа
    if (!selectedOrderType.value || cartItems.value.length === 0) {
      throw new Error('Недостаточно данных для создания заказа')
    }

    // Преобразуем UI тип заказа в API формат
    let apiOrderType: import('@/types/api').OrderType
    if (selectedOrderType.value === 'table') {
      apiOrderType = 'dine_in'
    } else if (selectedOrderType.value === 'takeaway') {
      apiOrderType = 'takeaway'
    } else if (selectedOrderType.value === 'delivery') {
      apiOrderType = 'delivery'
    } else {
      throw new Error('Неверный тип заказа')
    }

    // Определяем ID столика (для доставки используем специальный столик)
    let tableId: number
    if (selectedOrderType.value === 'table' && selectedTable.value) {
      tableId = parseInt(selectedTable.value) // Здесь selectedTable.value уже содержит правильный ID столика
    } else {
      // Для доставки и заказов на вынос используем специальный столик ID 1
      tableId = 1
    }

    // Формируем заметки с данными доставки
    let notes = ''
    let kitchen_notes = ''

    if (deliveryData) {
      notes = `Доставка - ${deliveryData.customerName}, тел: ${deliveryData.phone}, адрес: ${deliveryData.address}`
      if (deliveryData.comment) {
        kitchen_notes = deliveryData.comment
      }
    }

    // Формируем данные заказа для API
    const orderData: import('@/types/api').CreateOrderRequest = {
      table_id: tableId,
      order_type: apiOrderType,
      notes: notes,
      kitchen_notes: kitchen_notes,
      items: cartItems.value.map(item => {
        const apiItem: import('@/types/api').CreateOrderItemRequest = {
          dish_id: parseInt(item.dishId),
          quantity: item.quantity,
          comment: item.selectedVariations ? formatVariations(item.selectedVariations) : undefined
        }

        // Добавляем ID вариации если выбрана
        if (item.selectedVariations && Object.keys(item.selectedVariations).length > 0) {
          const firstVariation = Object.values(item.selectedVariations)[0]
          if (firstVariation && firstVariation.id) {
            apiItem.dish_variation_id = parseInt(firstVariation.id)
          }
        }

        return apiItem
      })
    }

    console.log('Отправляем заказ доставки на сервер:', orderData)

    // Отправляем заказ на сервер
    const createdOrder = await apiService.createOrder(orderData)

    console.log('Заказ доставки успешно создан:', createdOrder)

    // Показываем уведомление об успешном создании заказа
    notificationStore.addNotification({
      type: 'success',
      title: 'Заказ создан',
      message: deliveryData
        ? `Заказ доставки #${createdOrder.id} на адрес: ${deliveryData.address}`
        : `Заказ #${createdOrder.id} успешно создан`,
      read: false,
      sound: true
    })

    // Очищаем корзину и данные заказа
    cartItems.value = []
    selectedOrderType.value = null
    selectedTable.value = null

    // Переходим на главную страницу
    showOrderConfirmModal.value = false
    router.push({ name: 'dashboard' })

  } catch (error) {
    console.error('Ошибка создания заказа доставки:', error)

    let errorMessage = 'Не удалось создать заказ доставки'

    if (error && typeof error === 'object' && 'response' in error) {
      const axiosError = error as { response: { status: number; data?: { detail?: string } } }
      errorMessage = axiosError.response.data?.detail || `Ошибка сервера: ${axiosError.response.status}`
    } else if (error instanceof Error) {
      errorMessage = error.message
    }

    notificationStore.addNotification({
      type: 'error',
      title: 'Ошибка создания заказа',
      message: errorMessage,
      read: false,
      sound: true
    })
  }
}

const selectVariation = (variationId: string, option: DishVariationOption) => {
  selectedVariations.value[variationId] = option
}

const calculateDishPrice = () => {
  if (!selectedDish.value) return 0

  // Проверяем, выбраны ли все обязательные вариации
  const requiredVariations = selectedDish.value.variations?.filter(v => v.required) || []
  if (requiredVariations.length > 0) {
    const selectedOptions = Object.values(selectedVariations.value)
    if (selectedOptions.length > 0) {
      // Возвращаем цену первой выбранной вариции (в новой логике цена уже финальная)
      return selectedOptions[0].price || selectedDish.value.basePrice
    }
  }

  return selectedDish.value.basePrice
}

const addDishToCart = () => {
  if (!selectedDish.value) return

  // Создаём уникальный ключ на основе ID блюда и ID выбранных вариаций
  const selectedVariationsKey = Object.values(selectedVariations.value)
    .map(opt => opt.id)
    .sort()
    .join('-')

  const itemKey = `${selectedDish.value.id}-${selectedVariationsKey}`

  // Ищем такое же блюдо с такими же вариациями в корзине
  const existingItemIndex = cartItems.value.findIndex(item => {
    if (item.dishId !== selectedDish.value?.id) return false

    // Если нет вариаций, просто сравниваем ID блюда
    if (!item.selectedVariations || Object.keys(item.selectedVariations).length === 0) {
      return Object.keys(selectedVariations.value).length === 0
    }

    // Создаём ключ для существующего элемента так же, как и для нового
    const itemVariationsKey = Object.values(item.selectedVariations)
      .map(opt => opt.id)
      .sort()
      .join('-')

    return itemKey === `${item.dishId}-${itemVariationsKey}`
  })

  if (existingItemIndex !== -1) {
    // Если такое блюдо уже есть, увеличиваем количество
    cartItems.value[existingItemIndex].quantity += modalQuantity.value
    updateCartItemPrice(cartItems.value[existingItemIndex])
  } else {
    // Если нет, создаём новую позицию
    const cartItem: CartItem = {
      id: `${selectedDish.value.id}-${Date.now()}`,
      dishId: selectedDish.value.id,
      name: selectedDish.value.name,
      image: selectedDish.value.image,
      basePrice: selectedDish.value.basePrice,
      quantity: modalQuantity.value,
      selectedVariations: { ...selectedVariations.value },
      totalPrice: calculateDishPrice() * modalQuantity.value
    }
    cartItems.value.push(cartItem)
  }

  closeDishModal()
}

const increaseQuantity = (item: CartItem) => {
  item.quantity++
  updateCartItemPrice(item)
}

const decreaseQuantity = (item: CartItem) => {
  if (item.quantity > 1) {
    item.quantity--
    updateCartItemPrice(item)
  }
}

const updateCartItemPrice = (item: CartItem) => {
  let price = item.basePrice

  if (item.selectedVariations) {
    const selectedOptions = Object.values(item.selectedVariations)
    if (selectedOptions.length > 0) {
      // В новой логике используем цену первой выбранной вариции
      price = selectedOptions[0].price || item.basePrice
    }
  }

  item.totalPrice = price * item.quantity
}

const removeFromCart = (item: CartItem) => {
  const index = cartItems.value.findIndex(i => i.id === item.id)
  if (index > -1) {
    cartItems.value.splice(index, 1)
  }
}

const clearCart = () => {
  cartItems.value = []
}

const formatVariations = (variations: Record<string, DishVariationOption>) => {
  return Object.values(variations).map(v => v.name).join(', ')
}

const getCategoryCount = (category: Category) => {
  const categoryId = parseInt(category.id)

  // Если блюда загружаются для этой категории
  if (loadingDishesForCategories.value.has(categoryId)) {
    return '...'
  }

  // Если блюда загружены в память, возвращаем их количество
  if (apiDishes.value[categoryId]) {
    return apiDishes.value[categoryId].length.toString()
  }

  // Проверяем кэш если данных нет в памяти
  try {
    const cacheKey = `category_dishes_${categoryId}`
    const cachedData = cacheService.get(cacheKey) as { dishes: ApiDish[] } | null

    if (cachedData && cachedData.dishes) {
      // Считаем только доступные блюда
      const availableDishes = cachedData.dishes.filter((dish: ApiDish) => dish.is_available)
      return availableDishes.length.toString()
    }
  } catch (error) {
    console.warn(`Ошибка чтения кэша для категории ${categoryId}:`, error)
  }

  // Если блюда еще не загружены и нет в кэше, показываем "?"
  return '?'
}

const formatDishPrice = (dish: Dish) => {
  if (dish.variations && dish.variations.length > 0) {
    // Если есть вариации, показываем "от" минимальной цены
    const minPrice = Math.min(...dish.variations[0].options.map(option => option.price))
    return `от ${minPrice}`
  }
  return dish.basePrice.toString()
}

const createOrder = async () => {
  if (cartItems.value.length === 0) return

  // Проверяем, что выбран тип заказа
  if (!selectedOrderType.value) {
    openOrderTypeModal()
    return
  }

  // Для заказа за столиком проверяем, что выбран столик
  if (selectedOrderType.value === 'table' && !selectedTable.value) {
    openOrderTypeModal()
    return
  }

  try {
    // Показываем индикатор загрузки
    notificationStore.addNotification({
      type: 'info',
      title: 'Создание заказа',
      message: 'Отправляем заказ на сервер...',
      read: false,
      sound: false
    })

    // Преобразуем UI тип заказа в API формат
    let apiOrderType: import('@/types/api').OrderType
    if (selectedOrderType.value === 'table') {
      apiOrderType = 'dine_in'
    } else if (selectedOrderType.value === 'takeaway') {
      apiOrderType = 'takeaway'
    } else if (selectedOrderType.value === 'delivery') {
      apiOrderType = 'delivery'
    } else {
      throw new Error('Неверный тип заказа')
    }

    // Определяем ID столика
    let tableId: number
    if (selectedOrderType.value === 'table' && selectedTable.value) {
      // Для заказа за столиком используем ID выбранного столика
      tableId = parseInt(selectedTable.value)
    } else {
      // Для заказов на вынос и доставку нужно найти специальный столик или обойтись без него
      // По документации table_id обязательный, но для takeaway/delivery может потребоваться другая логика
      notificationStore.addNotification({
        type: 'error',
        title: 'Ошибка конфигурации',
        message: 'Для заказов на вынос и доставку требуется настройка специальных столиков в системе',
        read: false,
        sound: true
      })
      return
    }

    console.log('Формируем данные заказа:')
    console.log('- Тип заказа UI:', selectedOrderType.value)
    console.log('- Тип заказа API:', apiOrderType)
    console.log('- ID столика:', tableId)
    console.log('- Товары в корзине:', cartItems.value)

    // Формируем данные заказа для API
    const orderData: import('@/types/api').CreateOrderRequest = {
      table_id: tableId,
      order_type: apiOrderType,
      notes: '', // Можно добавить поле для заметок в UI
      kitchen_notes: '', // Можно добавить поле для заметок кухне в UI
      items: cartItems.value.map(item => {
        console.log('Обрабатываем товар:', item)

        const apiItem: import('@/types/api').CreateOrderItemRequest = {
          dish_id: parseInt(item.dishId),
          quantity: item.quantity,
          comment: item.selectedVariations ? formatVariations(item.selectedVariations) : undefined
        }

        // Добавляем ID вариации если выбрана
        if (item.selectedVariations && Object.keys(item.selectedVariations).length > 0) {
          const firstVariation = Object.values(item.selectedVariations)[0]
          if (firstVariation && firstVariation.id) {
            apiItem.dish_variation_id = parseInt(firstVariation.id)
            console.log('Добавлена вариация:', firstVariation.id, firstVariation.name)
          }
        }

        console.log('API товар:', apiItem)
        return apiItem
      })
    }

    console.log('Отправляем заказ на сервер:', orderData)

    // Отправляем заказ на сервер
    const createdOrder = await apiService.createOrder(orderData)

    console.log('Заказ успешно создан:', createdOrder)

    // Показываем уведомление об успехе
    notificationStore.addNotification({
      type: 'success',
      title: 'Заказ создан',
      message: `Заказ #${createdOrder.id} успешно создан`,
      read: false,
      sound: true
    })

    // Заполняем данные для модального окна подтверждения
    let orderTypeText = ''
    if (selectedOrderType.value === 'table') {
      const table = availableTables.value.find(t => t.id === selectedTable.value)
      if (table) {
        orderTypeText = `${table.zone} - ${table.name}`
      } else {
        // Если столик не найден, пытаемся найти его номер для отображения
        orderTypeText = `Столик ${selectedTable.value}`
      }
    } else if (selectedOrderType.value === 'takeaway') {
      orderTypeText = 'С собой'
    } else if (selectedOrderType.value === 'delivery') {
      orderTypeText = 'Доставка'
    }

    orderConfirmData.value = {
      orderSummaryText: orderTypeText,
      itemsCount: cartItems.value.length,
      paymentMethodName: 'Не указан',
      totalPrice: parseFloat(createdOrder.total_price) // Конвертируем строку в число
    }

    // Показываем модальное окно подтверждения
    showOrderConfirmModal.value = true

  } catch (error) {
    console.error('Ошибка создания заказа:', error)

    let errorMessage = 'Не удалось создать заказ'

    if (error && typeof error === 'object' && 'response' in error) {
      const axiosError = error as { response: { status: number; data?: unknown } }

      console.log('Детали ошибки от сервера:', axiosError.response.data)

      if (axiosError.response.status === 400) {
        errorMessage = 'Ошибка валидации данных заказа'

        // Пытаемся извлечь детали ошибки
        const data = axiosError.response.data as Record<string, unknown>
        if (data && typeof data === 'object') {
          if (data.detail) {
            errorMessage += `: ${data.detail}`
          } else if (data.message) {
            errorMessage += `: ${data.message}`
          }
        }
      } else if (axiosError.response.status === 500) {
        // Специальная обработка для ошибки кухонной системы
        const data = axiosError.response.data as Record<string, unknown>
        if (data && typeof data === 'object' && data.message &&
            (data.message as string).includes('IN_PROGRESS')) {
          errorMessage = 'Для этого столика уже есть заказ в работе. Обновите страницу (F5) для автоматического перехода в режим дозаказа.'

          // Показываем дополнительное уведомление с инструкцией
          setTimeout(() => {
            notificationStore.addNotification({
              type: 'info',
              title: 'Режим дозаказа',
              message: 'Нажмите F5 для обновления страницы и автоматического перехода в режим дозаказа',
              read: false,
              sound: false
            })
          }, 2000)
        } else {
          errorMessage = 'Ошибка сервера при создании заказа'
          if (data.message) {
            errorMessage += `: ${data.message}`
          }
        }
      } else if (axiosError.response.status === 404) {
        errorMessage = 'Столик или блюдо не найдены'
      } else if (axiosError.response.status === 403) {
        errorMessage = 'Недостаточно прав для создания заказа'
      } else {
        errorMessage = `Ошибка сервера: ${axiosError.response.status}`
      }
    } else if (error instanceof Error) {
      errorMessage = error.message
    }

    notificationStore.addNotification({
      type: 'error',
      title: 'Ошибка создания заказа',
      message: errorMessage,
      read: false,
      sound: true
    })
  }
}

// Функция для добавления позиций к существующему заказу
const addItemsToOrder = async () => {
  if (cartItems.value.length === 0 || !editingOrderId.value) return

  try {
    // Показываем индикатор загрузки
    notificationStore.addNotification({
      type: 'info',
      title: 'Добавление позиций',
      message: 'Добавляем новые позиции к заказу...',
      read: false,
      sound: false
    })

    // Формируем данные для добавления позиций
    const items: import('@/types/api').CreateOrderItemRequest[] = cartItems.value.map(item => {
      const apiItem: import('@/types/api').CreateOrderItemRequest = {
        dish_id: parseInt(item.dishId),
        quantity: item.quantity,
        comment: item.selectedVariations ? formatVariations(item.selectedVariations) : undefined
      }

      // Добавляем ID вариации если выбрана
      if (item.selectedVariations && Object.keys(item.selectedVariations).length > 0) {
        const firstVariation = Object.values(item.selectedVariations)[0]
        if (firstVariation && firstVariation.id) {
          apiItem.dish_variation_id = parseInt(firstVariation.id)
        }
      }

      return apiItem
    })

    console.log('Добавляем позиции к заказу:', editingOrderId.value, items)

    // Отправляем запрос на добавление позиций
    await apiService.addItemsToOrder(editingOrderId.value, items)

    console.log('Позиции успешно добавлены к заказу')

    // Показываем уведомление об успехе
    notificationStore.addNotification({
      type: 'success',
      title: 'Позиции добавлены',
      message: `Добавлено ${cartItems.value.length} позиций к заказу #${editingOrderId.value}`,
      read: false,
      sound: true
    })

    // Очищаем корзину
    cartItems.value = []

    // Возвращаемся на главную страницу
    router.push({ name: 'dashboard' })

  } catch (error) {
    console.error('Ошибка добавления позиций к заказу:', error)

    let errorMessage = 'Не удалось добавить позиции к заказу'

    if (error && typeof error === 'object' && 'response' in error) {
      const axiosError = error as { response: { status: number; data?: unknown } }

      if (axiosError.response.status === 400) {
        errorMessage = 'Ошибка валидации данных позиций'

        const data = axiosError.response.data as Record<string, unknown>
        if (data && typeof data === 'object' && data.detail) {
          errorMessage += `: ${data.detail}`
        }
      } else if (axiosError.response.status === 404) {
        errorMessage = 'Заказ не найден или недоступен для редактирования'
      } else if (axiosError.response.status === 403) {
        errorMessage = 'Недостаточно прав для редактирования заказа'
      } else {
        errorMessage = `Ошибка сервера: ${axiosError.response.status}`
      }
    } else if (error instanceof Error) {
      errorMessage = error.message
    }

    notificationStore.addNotification({
      type: 'error',
      title: 'Ошибка добавления позиций',
      message: errorMessage,
      read: false,
      sound: true
    })
  }
}

// Функция для загрузки существующего заказа для редактирования
const loadOrderForEdit = async (orderId: number) => {
  try {
    console.log(`Загружаем заказ ${orderId} для редактирования...`)

    const orderResponse = await apiService.getOrderForEdit(orderId)
    existingOrder.value = orderResponse.order

    console.log('Заказ загружен для редактирования:', existingOrder.value)

    // Устанавливаем данные заказа
    selectedTable.value = existingOrder.value.table_id.toString()

    // Преобразуем API тип заказа в UI формат
    if (existingOrder.value.order_type === 'dine_in') {
      selectedOrderType.value = 'table'
    } else if (existingOrder.value.order_type === 'takeaway') {
      selectedOrderType.value = 'takeaway'
    } else if (existingOrder.value.order_type === 'delivery') {
      selectedOrderType.value = 'delivery'
    }

    editMode.value = true
    editingOrderId.value = orderId

    // Показываем уведомление
    notificationStore.addNotification({
      type: 'info',
      title: 'Режим редактирования',
      message: `Загружен заказ #${orderId}. Добавьте новые позиции.`,
      read: false,
      sound: false
    })

  } catch (error) {
    console.error('Ошибка загрузки заказа для редактирования:', error)

    let errorMessage = 'Не удалось загрузить заказ для редактирования'

    if (error && typeof error === 'object' && 'response' in error) {
      const axiosError = error as { response: { status: number; data?: unknown } }

      if (axiosError.response.status === 404) {
        errorMessage = 'Заказ не найден'
      } else if (axiosError.response.status === 403) {
        errorMessage = 'Заказ недоступен для редактирования'
      } else {
        errorMessage = `Ошибка сервера: ${axiosError.response.status}`
      }
    } else if (error instanceof Error) {
      errorMessage = error.message
    }

    notificationStore.addNotification({
      type: 'error',
      title: 'Ошибка загрузки заказа',
      message: errorMessage,
      read: false,
      sound: true
    })

    // Возвращаемся на главную при ошибке
    router.push({ name: 'dashboard' })
  }
}

// Функция для проверки актуальности кэша
const checkIfCacheNeedsUpdate = () => {
  try {
    // Проверяем, есть ли основные данные в кэше
    const categoriesCache = cacheService.get('categories')
    const locationsCache = cacheService.get('locations')
    const tablesCache = cacheService.get('tables')

    if (!categoriesCache) {
      console.log('Кэш категорий отсутствует')
      return true
    }

    if (!locationsCache || !tablesCache) {
      console.log('Кэш зон или столиков отсутствует')
      return true
    }

    // Проверяем время последнего обновления (если есть поддержка TTL)
    const cacheInfo = cacheService.get('_cache_timestamp')
    if (cacheInfo) {
      const lastUpdate = new Date(cacheInfo as string)
      const now = new Date()
      const minutesSinceUpdate = (now.getTime() - lastUpdate.getTime()) / (1000 * 60)

      // Обновляем кэш если прошло больше 60 минут
      if (minutesSinceUpdate > 60) {
        console.log(`Кэш меню устарел: ${minutesSinceUpdate.toFixed(1)} минут назад`)
        return true
      }
    }

    // Проверяем время последнего обновления зон и столиков (используем dashboard timestamp)
    const dashboardCacheInfo = cacheService.get('_dashboard_cache_timestamp')
    if (dashboardCacheInfo) {
      const lastUpdate = new Date(dashboardCacheInfo as string)
      const now = new Date()
      const minutesSinceUpdate = (now.getTime() - lastUpdate.getTime()) / (1000 * 60)

      // Проверяем, не устарели ли зоны и столики (30 минут как в DashboardView)
      if (minutesSinceUpdate > 30) {
        console.log(`Кэш зон и столиков устарел: ${minutesSinceUpdate.toFixed(1)} минут назад`)
        return true
      }
    }

    // Проверяем, есть ли блюда для всех категорий в кэше
    if (apiCategories.value.length > 0) {
      const missingDishesCategories = apiCategories.value.filter(category => {
        const cacheKey = `category_dishes_${category.id}`
        return !cacheService.get(cacheKey)
      })

      if (missingDishesCategories.length > 0) {
        console.log(`Отсутствуют блюда для ${missingDishesCategories.length} категорий`)
        return true
      }
    }

    console.log('Кэш актуален')
    return false

  } catch (error) {
    console.warn('Ошибка проверки кэша:', error)
    return true // При ошибке лучше обновить
  }
}

// Функция для полной загрузки всех данных при первом входе
const loadAllDataInitial = async () => {
  console.log('Начинаем полную загрузку всех данных...')

  try {
    // Показываем уведомление о начале загрузки
    notificationStore.addNotification({
      type: 'info',
      title: 'Загрузка данных',
      message: 'Загружаем меню ресторана...',
      read: false,
      sound: false
    })

    // Загружаем категории сначала
    await loadCategories()

    // Если категории загружены, загружаем блюда и вариации для всех категорий
    if (apiCategories.value.length > 0) {
      console.log(`Загружаем блюда для ${apiCategories.value.length} категорий...`)

      // Загружаем блюда для всех категорий параллельно, но с ограничением
      const batchSize = 3 // Загружаем по 3 категории одновременно
      const categories = [...apiCategories.value]

      for (let i = 0; i < categories.length; i += batchSize) {
        const batch = categories.slice(i, i + batchSize)

        await Promise.all(batch.map(async (category) => {
          try {
            await loadDishesForCategory(category.id)
          } catch (error) {
            console.warn(`Ошибка загрузки категории ${category.id}:`, error)
          }
        }))

        // Небольшая пауза между пакетами
        if (i + batchSize < categories.length) {
          await new Promise(resolve => setTimeout(resolve, 200))
        }
      }
    }

    console.log('Полная загрузка данных завершена')

    // Сохраняем timestamp успешной загрузки (дольше чем данные для надежности)
    cacheService.set('_cache_timestamp', new Date().toISOString(), { ttl: 120 * 60 * 1000 }) // 120 минут

    // Показываем уведомление об успешной загрузке
    notificationStore.addNotification({
      type: 'success',
      title: 'Данные загружены',
      message: 'Все данные меню успешно загружены и кэшированы',
      read: false,
      sound: false
    })

  } catch (error) {
    console.error('Ошибка полной загрузки данных:', error)

    notificationStore.addNotification({
      type: 'error',
      title: 'Ошибка загрузки',
      message: 'Не удалось загрузить все данные меню',
      read: false,
      sound: true
    })
  }
}

// Функция для восстановления данных из кэша при инициализации
const restoreFromCache = () => {
  console.log('Восстанавливаем данные из кэша...')

  // Восстанавливаем категории
  try {
    const categoriesCache = cacheService.get('categories') as { categories: import('@/types/api').Category[] } | null
    if (categoriesCache && categoriesCache.categories) {
      const activeCategories = categoriesCache.categories
        .filter(category => category.is_active)
        .sort((a, b) => a.sort_order - b.sort_order || a.name.localeCompare(b.name))

      apiCategories.value = activeCategories
      console.log(`Восстановлено ${activeCategories.length} категорий из кэша`)
    }
  } catch (error) {
    console.warn('Ошибка восстановления категорий из кэша:', error)
  }

  // Восстанавливаем блюда и вариации для каждой категории
  for (const category of apiCategories.value) {
    try {
      // Восстанавливаем блюда категории
      const cacheKey = `category_dishes_${category.id}`
      const cachedData = cacheService.get(cacheKey) as { dishes: ApiDish[] } | null

      if (cachedData && cachedData.dishes) {
        const activeDishes = cachedData.dishes
          .filter((dish: ApiDish) => dish.is_available)
          .sort((a: ApiDish, b: ApiDish) => a.sort_order - b.sort_order || a.name.localeCompare(b.name))

        apiDishes.value[category.id] = activeDishes
        console.log(`Восстановлено ${activeDishes.length} блюд для категории ${category.id}`)

        // Восстанавливаем вариации для каждого блюда
        for (const dish of activeDishes) {
          try {
            const variationsCacheKey = `dish_variations_${dish.id}`
            const cachedVariations = cacheService.get(variationsCacheKey) as { variations: ApiDishVariation[] } | null

            if (cachedVariations && cachedVariations.variations) {
              const activeVariations = cachedVariations.variations
                .filter((variation: ApiDishVariation) => variation.is_available)
                .sort((a: ApiDishVariation, b: ApiDishVariation) => a.sort_order - b.sort_order || a.name.localeCompare(b.name))

              dishVariations.value[dish.id] = activeVariations
            }
          } catch (error) {
            console.warn(`Ошибка восстановления вариаций для блюда ${dish.id}:`, error)
          }
        }
      }
    } catch (error) {
      console.warn(`Ошибка восстановления блюд для категории ${category.id}:`, error)
    }
  }

  // Восстанавливаем зоны (используем те же ключи что и в DashboardView)
  try {
    const locationsCache = cacheService.get('locations') as { locations: Location[] } | null
    if (locationsCache && locationsCache.locations) {
      const activeLocations = locationsCache.locations
        .filter(location => location.is_active)
        .sort((a, b) => a.name.localeCompare(b.name))

      const apiZones = activeLocations.map(mapLocationToZone)
      zones.value = apiZones

      console.log(`Восстановлено ${apiZones.length} зон из кэша`)
    }
  } catch (error) {
    console.warn('Ошибка восстановления зон из кэша:', error)
  }

  // Восстанавливаем столики (используем те же ключи что и в DashboardView)
  try {
    const tablesCache = cacheService.get('tables') as { tables: (import('@/types/api').Table & { current_order_id?: number | null })[] } | null
    if (tablesCache && tablesCache.tables && zones.value.length > 0) {
      // Получаем активные зоны для фильтрации
      const activeLocationIds = zones.value.map(zone => parseInt(zone.id))

      const activeTables = tablesCache.tables.filter(table =>
        table.is_active && activeLocationIds.includes(table.location_id)
      )

      // Создаем список локаций для маппинга
      const locationsForMapping = zones.value.map(zone => ({
        id: parseInt(zone.id),
        name: zone.name,
        color: zone.color,
        is_active: true
      })) as Location[]

      const uiTables = activeTables.map(table => mapApiTableToUITable(table, locationsForMapping))
      availableTables.value = uiTables

      console.log(`Восстановлено ${uiTables.length} столиков из кэша`)
    }
  } catch (error) {
    console.warn('Ошибка восстановления столиков из кэша:', error)
  }

  console.log('Восстановление из кэша завершено')
}

// Функция для преобразования API Location в Zone
const mapLocationToZone = (location: Location): Zone => {
  return {
    id: location.id.toString(),
    name: location.name,
    color: location.color || '#6c757d'
  }
}

// Функция для преобразования API Table в UI Table
const mapApiTableToUITable = (apiTable: import('@/types/api').Table & { current_order_id?: number | null }, locations: Location[]): UITable => {
  const location = locations.find(loc => loc.id === apiTable.location_id)

  return {
    id: apiTable.id.toString(),           // Используем настоящий ID столика
    number: apiTable.number.toString(),   // Номер столика для отображения
    name: `Столик ${apiTable.number}`,
    capacity: apiTable.seats,
    zone: location?.name || 'Неизвестная зона'
  }
}

// Функция загрузки зон
const loadZones = async () => {
  try {
    isLoadingZones.value = true
    console.log('Загрузка зон через API...')

    const response = await apiService.getLocations()
    console.log('Получены локации:', response)

    // API может возвращать либо массив Location[], либо объект {locations: Location[], total: number}
    let locationsArray: Location[]
    if (Array.isArray(response)) {
      locationsArray = response
    } else if (response && typeof response === 'object' && 'locations' in response) {
      locationsArray = (response as { locations: Location[] }).locations || []
    } else {
      locationsArray = []
    }

    // Кэшируем данные локаций (используем те же ключи что и в DashboardView)
    cacheService.set('locations', { locations: locationsArray }, { ttl: 30 * 60 * 1000 }) // 30 минут

    // Фильтруем только активные локации
    const filteredLocations = locationsArray
      .filter((location: Location) => location.is_active)
      // Сортируем по имени для стабильного порядка
      .sort((a, b) => a.name.localeCompare(b.name))

    console.log(`Отфильтровано ${filteredLocations.length} активных зон из ${locationsArray.length}`)

    // Преобразуем в Zone
    const apiZones = filteredLocations.map(mapLocationToZone)

    // Устанавливаем зоны из API
    zones.value = apiZones

    console.log('Зоны загружены:', zones.value)

    // Показываем уведомление об успешной загрузке
    if (apiZones.length > 0) {
      notificationStore.addNotification({
        type: 'success',
        title: 'Зоны загружены',
        message: `Загружено ${apiZones.length} зон ресторана`,
        read: false,
        sound: false
      })
    }
  } catch (error) {
    handleApiError(error, 'загрузки зон')

    // В случае ошибки оставляем пустой массив
    zones.value = []
  } finally {
    isLoadingZones.value = false
  }
}

// Функция загрузки столиков
const loadTables = async () => {
  try {
    isLoadingTables.value = true
    console.log('Загрузка столиков через API...')

    const [tablesResponse, locationsResponse] = await Promise.all([
      apiService.getTables(),
      apiService.getLocations()
    ])

    console.log('Получены столики:', tablesResponse)
    console.log('Получены локации для столиков:', locationsResponse)

    // Обрабатываем ответ локаций
    let locationsArray: Location[]
    if (Array.isArray(locationsResponse)) {
      locationsArray = locationsResponse
    } else if (locationsResponse && typeof locationsResponse === 'object' && 'locations' in locationsResponse) {
      locationsArray = (locationsResponse as { locations: Location[] }).locations || []
    } else {
      locationsArray = []
    }

    // Обрабатываем ответ столиков
    let tablesArray: (import('@/types/api').Table & { current_order_id?: number | null })[]
    if (Array.isArray(tablesResponse)) {
      tablesArray = tablesResponse
    } else if (tablesResponse && typeof tablesResponse === 'object' && 'tables' in tablesResponse) {
      tablesArray = (tablesResponse as { tables: typeof tablesArray }).tables || []
    } else {
      tablesArray = []
    }

    // Кэшируем данные столиков (используем те же ключи что и в DashboardView)
    cacheService.set('tables', { tables: tablesArray }, { ttl: 30 * 60 * 1000 }) // 30 минут

    // Получаем только активные локации для фильтрации
    const activeLocationIds = locationsArray
      .filter(location => location.is_active)
      .map(location => location.id)

    // Фильтруем только активные столики из активных зон
    const activeTables = tablesArray.filter(table =>
      table.is_active && activeLocationIds.includes(table.location_id)
    )

    console.log(`Отфильтровано ${activeTables.length} активных столиков из активных зон из ${tablesArray.length} общих столиков`)

    // Преобразуем в UI формат
    const uiTables = activeTables.map(table => mapApiTableToUITable(table, locationsArray))

    // Устанавливаем столики
    availableTables.value = uiTables

    console.log('Столики загружены:', availableTables.value)

    // Показываем уведомление об успешной загрузке
    if (uiTables.length > 0) {
      notificationStore.addNotification({
        type: 'success',
        title: 'Столики загружены',
        message: `Загружено ${uiTables.length} столиков`,
        read: false,
        sound: false
      })
    }
  } catch (error) {
    handleApiError(error, 'загрузки столиков')

    // В случае ошибки оставляем пустой массив
    availableTables.value = []
  } finally {
    isLoadingTables.value = false
  }
}

// Функция загрузки категорий
const loadCategories = async () => {
  try {
    isLoadingCategories.value = true
    console.log('Загрузка категорий через API...')

    const response = await apiService.getCategories()
    console.log('Получены категории:', response)

    // Фильтруем только активные категории и сортируем по sort_order
    const activeCategories = response.categories
      .filter(category => category.is_active)
      .sort((a, b) => a.sort_order - b.sort_order || a.name.localeCompare(b.name))

    console.log(`Отфильтровано ${activeCategories.length} активных категорий из ${response.categories.length}`)

    // Устанавливаем категории из API
    apiCategories.value = activeCategories

    // Показываем уведомление об успешной загрузке
    if (activeCategories.length > 0) {
      notificationStore.addNotification({
        type: 'success',
        title: 'Категории загружены',
        message: `Загружено ${activeCategories.length} категорий меню`,
        read: false,
        sound: false
      })

      // Проверяем, есть ли категории без иконок или цветов
      const categoriesWithoutIcons = activeCategories.filter(cat => !cat.icon && !cat.color)
      if (categoriesWithoutIcons.length > 0) {
        notificationStore.addNotification({
          type: 'info',
          title: 'Настройте иконки категорий',
          message: `${categoriesWithoutIcons.length} категорий не имеют настроенных иконок или цветов. Настройте их в административной панели.`,
          read: false,
          sound: false
        })
      }
    }
  } catch (error) {
    handleApiError(error, 'загрузки категорий')
    // В случае ошибки оставляем пустой массив
    apiCategories.value = []
  } finally {
    isLoadingCategories.value = false
  }
}

// Функция загрузки блюд для категории
const loadDishesForCategory = async (categoryId: number) => {
  // Проверяем, не загружаются ли уже блюда для этой категории
  if (loadingDishesForCategories.value.has(categoryId)) {
    return
  }

  // Проверяем, не загружены ли уже блюда для этой категории
  if (apiDishes.value[categoryId]) {
    return
  }

  try {
    loadingDishesForCategories.value.add(categoryId)
    isLoadingDishes.value = true
    console.log(`Загрузка блюд для категории ${categoryId} через API...`)

    const response = await apiService.getCategoryDishes(categoryId)
    console.log('Получены блюда:', response)

    // Фильтруем только активные блюда и сортируем по sort_order
    const activeDishes = response.dishes
      .filter(dish => dish.is_available)
      .sort((a, b) => a.sort_order - b.sort_order || a.name.localeCompare(b.name))

    console.log(`Отфильтровано ${activeDishes.length} доступных блюд для категории ${categoryId} из ${response.dishes.length}`)

    // Устанавливаем блюда для категории
    apiDishes.value[categoryId] = activeDishes

    // Загружаем вариации для каждого блюда
    console.log('Загрузка вариаций для блюд...')
    await Promise.all(activeDishes.map(async (dish) => {
      try {
        const variationsResponse = await apiService.getDishVariations(dish.id)
        // Фильтруем только доступные вариации и сортируем
        const activeVariations = variationsResponse.variations
          .filter(variation => variation.is_available)
          .sort((a, b) => a.sort_order - b.sort_order || a.name.localeCompare(b.name))

        dishVariations.value[dish.id] = activeVariations
        console.log(`Загружено ${activeVariations.length} вариаций для блюда "${dish.name}"`)
      } catch (error) {
        console.warn(`Ошибка загрузки вариаций для блюда ${dish.id}:`, error)
        dishVariations.value[dish.id] = []
      }
    }))

    console.log('Блюда и вариации загружены для категории', categoryId)
  } catch (error) {
    handleApiError(error, `загрузки блюд для категории ${categoryId}`)
    // В случае ошибки оставляем пустой массив
    apiDishes.value[categoryId] = []
  } finally {
    loadingDishesForCategories.value.delete(categoryId)
    // Проверяем, остались ли еще загружающиеся категории
    if (loadingDishesForCategories.value.size === 0) {
      isLoadingDishes.value = false
    }
  }
}

// Обработчик ошибок API
const handleApiError = (error: unknown, context: string) => {
  console.error(`Ошибка ${context}:`, error)

  let errorMessage = 'Произошла неизвестная ошибка'

  if (error && typeof error === 'object' && 'response' in error) {
    // Ошибка от сервера
    const axiosError = error as { response: { status: number; data?: { message?: string } } }
    errorMessage = axiosError.response.data?.message || `Ошибка сервера: ${axiosError.response.status}`
  } else if (error && typeof error === 'object' && 'request' in error) {
    // Ошибка сети
    errorMessage = 'Ошибка сети. Проверьте подключение к интернету'
  } else if (error instanceof Error) {
    // Другие ошибки
    errorMessage = error.message || 'Произошла неизвестная ошибка'
  }

  notificationStore.addNotification({
    type: 'error',
    title: `Ошибка ${context}`,
    message: errorMessage,
    read: false,
    sound: true
  })
}

// Watchers
watch(activeCategory, async (newCategoryId) => {
  // Проверяем есть ли это в API категориях
  const apiCategory = apiCategories.value.find(cat => cat.id.toString() === newCategoryId)
  if (apiCategory && !apiDishes.value[apiCategory.id]) {
    // Если категория из API и блюда еще не загружены, загружаем их
    await loadDishesForCategory(apiCategory.id)
  }
})

// Lifecycle
let timeInterval: number

onMounted(async () => {
  updateTime()
  timeInterval = setInterval(updateTime, 1000) as unknown as number

  // Сначала восстанавливаем данные из кэша для быстрого отображения
  restoreFromCache()

  // Загружаем зоны и столики (они не так критичны для основного интерфейса)
  const zonesAndTablesPromise = Promise.all([
    loadZones(),
    loadTables()
  ]).then(() => {
    // Сохраняем dashboard timestamp после успешной загрузки зон и столиков
    cacheService.set('_dashboard_cache_timestamp', new Date().toISOString(), { ttl: 60 * 60 * 1000 }) // 60 минут
    console.log('Зоны и столики загружены, dashboard timestamp обновлен')
  }).catch(error => {
    console.warn('Ошибка загрузки зон и столиков:', error)
  })

  // Если в кэше нет категорий, загружаем их сначала
  if (apiCategories.value.length === 0) {
    await loadCategories()
  }

  // Устанавливаем первую доступную категорию как активную
  if (combinedCategories.value.length > 0 && !activeCategory.value) {
    activeCategory.value = combinedCategories.value[0].id
  }

  // Получаем параметры из роута
  const tableParam = router.currentRoute.value.query.table as string
  const editOrderParam = router.currentRoute.value.query.editOrder as string

  // Проверяем режим редактирования заказа
  if (editOrderParam) {
    const orderId = parseInt(editOrderParam)
    if (!isNaN(orderId)) {
      console.log(`Режим редактирования заказа: ${orderId}`)
      await loadOrderForEdit(orderId)
    } else {
      console.warn('Неверный ID заказа для редактирования:', editOrderParam)
      notificationStore.addNotification({
        type: 'error',
        title: 'Ошибка',
        message: 'Неверный ID заказа для редактирования',
        read: false,
        sound: true
      })
      router.push({ name: 'dashboard' })
    }
  } else if (tableParam) {
    selectedTable.value = tableParam
    selectedOrderType.value = 'table' // Автоматически устанавливаем тип заказа "За столиком"

    // Проверяем, есть ли активный заказ для этого столика
    try {
      const tableId = parseInt(tableParam)
      if (!isNaN(tableId)) {
        console.log(`Проверяем активные заказы для столика ${tableId}...`)
        const activeOrder = await apiService.getActiveOrderByTable(tableId)

        if (activeOrder) {
          console.log(`✅ Найден активный заказ для столика ${tableId}:`, activeOrder)
          console.log(`📋 Статус заказа: ${activeOrder.status}`)
          console.log(`💰 Сумма заказа: ${activeOrder.total_price}`)
          console.log(`📅 Создан: ${activeOrder.created_at}`)

          // Если есть активный заказ, переводим в режим редактирования
          if (activeOrder.status === 'in_progress' || activeOrder.status === 'pending') {
            console.log(`🔄 Переводим в режим дозаказа для заказа #${activeOrder.id}`)
            await loadOrderForEdit(activeOrder.id)
          } else {
            console.log(`ℹ️ Заказ #${activeOrder.id} имеет статус "${activeOrder.status}", создаем новый заказ`)
          }
        } else {
          console.log(`❌ Активных заказов для столика ${tableId} не найдено, можно создавать новый`)
        }
      }
    } catch (error) {
      console.warn('Ошибка при проверке активных заказов для столика:', error)
      // Продолжаем как обычно - создание нового заказа
    }
  } else {
    // Если столик не выбран, сразу открываем модальное окно выбора типа заказа
    openOrderTypeModal()
  }

  // Ждём загрузки зон и столиков
  await zonesAndTablesPromise

  // Проверяем актуальность кэша и запускаем загрузку только при необходимости
  const shouldUpdateCache = checkIfCacheNeedsUpdate()

  if (shouldUpdateCache) {
    console.log('Кэш устарел или отсутствует, запускаем фоновую загрузку...')
    loadAllDataInitial().catch(error => {
      console.warn('Ошибка фоновой загрузки всех данных:', error)
    })
  } else {
    console.log('Кэш актуален, загрузка с сервера не требуется')
  }
})

onUnmounted(() => {
  if (timeInterval) {
    clearInterval(timeInterval)
  }
})

// Отладочные функции кэша
const getCacheInfo = () => {
  const info = apiService.getCacheInfo()
  console.log('Информация о кэше:', info)

  notificationStore.addNotification({
    type: 'info',
    title: 'Кэш приложения',
    message: `Сохранено ${info.keys.length} записей, размер: ${Math.round(info.totalSize / 1024)}KB`,
    read: false,
    sound: false
  })
}

// Добавляем функцию очистки кэша (для отладки)
const clearAllCache = () => {
  apiService.clearCache()

  notificationStore.addNotification({
    type: 'success',
    title: 'Кэш очищен',
    message: 'Все данные будут загружены заново при следующем обращении',
    read: false,
    sound: false
  })
}

// Глобальные функции для отладки (доступны в консоли браузера)
if (typeof window !== 'undefined') {
  // @ts-expect-error - добавляем глобальный объект для отладки
  window.qresDebug = {
    getCacheInfo,
    clearAllCache,
    forceReload: () => {
      loadAllDataInitial().then(() => {
        notificationStore.addNotification({
          type: 'success',
          title: 'Данные обновлены',
          message: 'Все данные принудительно обновлены из API',
          read: false,
          sound: false
        })
      })
    },
    restoreFromCache: () => {
      restoreFromCache()
      notificationStore.addNotification({
        type: 'info',
        title: 'Данные восстановлены',
        message: 'Данные восстановлены из кэша',
        read: false,
        sound: false
      })
    },
    loadAll: () => {
      loadAllDataInitial().then(() => {
        notificationStore.addNotification({
          type: 'success',
          title: 'Полная загрузка завершена',
          message: 'Все данные загружены и сохранены в кэш',
          read: false,
          sound: false
        })
      })
    },
    // Добавляем функции для зон и столиков (совместимость с DashboardView)
    getCacheInfoZones: () => {
      const locationsCache = cacheService.get('locations')
      const tablesCache = cacheService.get('tables')
      const dashboardTimestamp = cacheService.get('_dashboard_cache_timestamp')

      console.log('Кэш зон и столиков (CreateOrderView):', {
        locations: locationsCache ? 'Есть' : 'Отсутствует',
        tables: tablesCache ? 'Есть' : 'Отсутствует',
        dashboardTimestamp: dashboardTimestamp || 'Отсутствует',
        zonesInMemory: zones.value.length,
        tablesInMemory: availableTables.value.length
      })
    },
    clearZonesCache: () => {
      cacheService.remove('locations')
      cacheService.remove('tables')
      cacheService.remove('_dashboard_cache_timestamp')
      zones.value = []
      availableTables.value = []
      console.log('Кэш зон и столиков очищен')
    },
    forceReloadZones: () => {
      Promise.all([loadZones(), loadTables()]).then(() => {
        cacheService.set('_dashboard_cache_timestamp', new Date().toISOString(), { ttl: 60 * 60 * 1000 })
        console.log('Принудительная перезагрузка зон и столиков завершена')
      })
    }
  }

  console.log('QRes Debug доступен в window.qresDebug')
}
</script>
