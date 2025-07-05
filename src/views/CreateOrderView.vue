<template>
  <div class="create-order-view">
    <!-- Заголовок -->
    <div class="order-header">
      <div class="container-fluid">
        <div class="row align-items-center">
          <div class="col-md-8">
            <h1 class="order-title">
              <i class="bi bi-plus-circle-fill me-3"></i>
              Создание заказа
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
                <i class="bi bi-pencil-square ms-1"></i>
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
              v-for="category in categories"
              :key="category.id"
              @click="activeCategory = category.id"
              :class="['category-tab', { active: activeCategory === category.id }]"
              :style="{ '--category-color': category.color }"
            >
              <i :class="category.icon"></i>
              <span>{{ category.name }}</span>
              <div class="category-count">{{ category.items.length }}</div>
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
                        {{ dish.variations && dish.variations.length > 0 ?
                           'от ' + (dish.variations[0].options[0]?.price || dish.basePrice) :
                           dish.basePrice }}₽
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
                  <i class="bi bi-cart3"></i>
                  Заказ
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
                <i class="bi bi-cart-x"></i>
                <p>Корзина пуста</p>
                <span>Добавьте блюда из меню</span>
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
                    </p>
                    <div class="cart-item-controls">
                      <div class="quantity-controls">
                        <button @click="decreaseQuantity(item)" class="qty-btn">
                          <i class="bi bi-dash"></i>
                        </button>
                        <span class="quantity">{{ item.quantity }}</span>
                        <button @click="increaseQuantity(item)" class="qty-btn">
                          <i class="bi bi-plus"></i>
                        </button>
                      </div>
                      <div class="cart-item-price">{{ item.totalPrice }}₽</div>
                    </div>
                  </div>
                  <button @click="removeFromCart(item)" class="remove-item-btn">
                    <i class="bi bi-x"></i>
                  </button>
                </div>
              </div>

              <!-- Итого и оформление -->
              <div v-if="cartItems.length > 0" class="cart-footer">
                <div class="cart-summary">
                  <div class="summary-row">
                    <span>Блюд:</span>
                    <span>{{ cartItems.length }}</span>
                  </div>
                  <div class="summary-row">
                    <span>Количество:</span>
                    <span>{{ totalQuantity }}</span>
                  </div>
                  <div class="summary-row total">
                    <span>Итого:</span>
                    <span>{{ totalPrice }}₽</span>
                  </div>
                </div>

                <!-- Способы оплаты -->
                <div class="payment-methods">
                  <h4>Способ оплаты:</h4>
                  <div class="payment-options">
                    <button
                      v-for="method in paymentMethods"
                      :key="method.id"
                      @click="selectedPaymentMethod = method.id"
                      :class="['payment-btn', { active: selectedPaymentMethod === method.id }]"
                    >
                      <i :class="method.icon"></i>
                      <span>{{ method.name }}</span>
                    </button>
                  </div>
                </div>

                <!-- Кнопки действий -->
                <div class="cart-actions">
                  <button
                    @click="createOrder"
                    class="create-order-btn"
                    :disabled="!selectedPaymentMethod"
                  >
                    <i class="bi bi-check-circle-fill"></i>
                    Оформить заказ
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Модальное окно выбора вариаций -->
    <div v-if="showDishModal" class="dish-modal-overlay" @click="closeDishModal">
      <div class="dish-modal" @click.stop>
        <div class="modal-header">
          <h3>{{ selectedDish?.name }}</h3>
          <button @click="closeDishModal" class="modal-close-btn">
            <i class="bi bi-x"></i>
          </button>
        </div>

        <div class="modal-body">
          <div class="dish-details">
            <!-- Информация для официантов -->
            <div class="info-grid" v-if="selectedDish">
              <div class="info-item" v-if="selectedDish.cookingTime">
                <i class="bi bi-clock"></i>
                <div>
                  <span class="label">Время приготовления</span>
                  <span class="value">{{ selectedDish.cookingTime }} мин</span>
                </div>
              </div>

              <div class="info-item" v-if="selectedDish.portionWeight">
                <i class="bi bi-speedometer2"></i>
                <div>
                  <span class="label">Вес порции</span>
                  <span class="value">{{ selectedDish.portionWeight }} г</span>
                </div>
              </div>

              <div class="info-item" v-if="selectedDish.calories">
                <i class="bi bi-lightning"></i>
                <div>
                  <span class="label">Калорийность</span>
                  <span class="value">{{ selectedDish.calories }} ккал</span>
                </div>
              </div>

              <div class="info-item allergens-alert" v-if="selectedDish.allergens && selectedDish.allergens.length > 0">
                <i class="bi bi-exclamation-triangle-fill"></i>
                <div>
                  <span class="label">Аллергены</span>
                  <span class="value">{{ selectedDish.allergens.join(', ') }}</span>
                </div>
              </div>
            </div>

            <!-- Вариации -->
            <div v-if="selectedDish?.variations" class="variations-section">
              <div
                v-for="variation in selectedDish.variations"
                :key="variation.id"
                class="variation-group"
              >
                <h4>{{ variation.name }}:</h4>
                <div class="variation-options">
                  <button
                    v-for="option in variation.options"
                    :key="option.id"
                    @click="selectVariation(variation.id, option)"
                    :class="['variation-option', {
                      active: selectedVariations[variation.id]?.id === option.id
                    }]"
                  >
                    <span>{{ option.name }}</span>
                    <span class="option-price">
                      {{ option.price }}₽
                    </span>
                  </button>
                </div>
              </div>
            </div>

            <!-- Итоговая цена -->
            <!-- Убрано, так как цена показывается в кнопке -->
          </div>
        </div>

        <div class="modal-footer">
          <div class="modal-quantity">
            <button @click="modalQuantity > 1 && modalQuantity--" class="qty-btn">
              <i class="bi bi-dash"></i>
            </button>
            <span class="quantity">{{ modalQuantity }}</span>
            <button @click="modalQuantity++" class="qty-btn">
              <i class="bi bi-plus"></i>
            </button>
          </div>

          <button @click="addDishToCart" class="add-to-cart-btn">
            <i class="bi bi-cart-plus"></i>
            Добавить ({{ calculateDishPrice() * modalQuantity }}₽)
          </button>
        </div>
      </div>
    </div>

    <!-- Модальное окно выбора типа заказа -->
    <div v-if="showOrderTypeModal" class="dish-modal-overlay" @click="closeOrderTypeModal">
      <div class="order-type-modal" @click.stop>
        <div class="modal-header">
          <h3>Выберите тип заказа</h3>
          <button @click="closeOrderTypeModal" class="modal-close-btn">
            <i class="bi bi-x"></i>
          </button>
        </div>

        <div class="modal-body">
          <!-- Типы заказов -->
          <div class="order-types-section">
            <div class="order-types-grid">
              <button
                v-for="orderType in orderTypes"
                :key="orderType.id"
                @click="selectOrderType(orderType.id)"
                class="order-type-card"
                :class="`order-type-${orderType.id}`"
              >
                <div class="order-type-icon">
                  <i :class="orderType.icon"></i>
                </div>
                <h4>{{ orderType.name }}</h4>
                <p>{{ orderType.description }}</p>
              </button>
            </div>
          </div>

          <!-- Выбор столика (показывается только если выбран тип "За столиком") -->
          <div v-if="selectedOrderType === 'table'" class="tables-section">
            <h4>Выберите столик:</h4>

            <!-- Вкладки зон -->
            <div class="zone-tabs">
              <button
                v-for="zoneName in availableZones"
                :key="zoneName"
                @click="selectZone(zoneName)"
                :class="['zone-tab', { active: activeZone === zoneName }]"
                :style="{ '--zone-color': getZoneColor(zoneName) }"
              >
                <span
                  class="zone-tab-badge"
                  :style="{ backgroundColor: getZoneColor(zoneName) }"
                >
                  {{ zoneName }}
                </span>
                <span class="zone-count">{{ tablesByZones[zoneName]?.length || 0 }}</span>
              </button>
            </div>

            <!-- Столики активной зоны -->
            <div v-if="activeZone" class="zone-content">
              <div class="tables-grid">
                <button
                  v-for="table in activeZoneTables"
                  :key="table.id"
                  @click="selectTable(table.id)"
                  class="table-card"
                >
                  <div class="table-info">
                    <h5>{{ table.name }}</h5>
                    <span class="table-capacity">
                      <i class="bi bi-people"></i>
                      {{ table.capacity }} мест
                    </span>
                  </div>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

// Типы
interface DishVariationOption {
  id: string
  name: string
  price: number // Фиксированная цена вместо модификатора
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

interface PaymentMethod {
  id: string
  name: string
  icon: string
}

interface OrderType {
  id: string
  name: string
  icon: string
  description: string
}

// Stores and router
const router = useRouter()
const authStore = useAuthStore()

// Реактивные данные
const currentTime = ref('')
const activeCategory = ref('appetizers')
const selectedTable = ref<string | null>(null)
const cartItems = ref<CartItem[]>([])
const selectedPaymentMethod = ref<string | null>(null)
const selectedOrderType = ref<string | null>(null)

// Модальные окна
const showDishModal = ref(false)
const showOrderTypeModal = ref(false)
const selectedDish = ref<Dish | null>(null)
const selectedVariations = ref<Record<string, DishVariationOption>>({})
const modalQuantity = ref(1)
const activeZone = ref<string | null>(null)

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

// Столики (демо данные)
const availableTables = ref([
  { id: '01', name: 'Столик 01', capacity: 2, zone: 'Основной зал' },
  { id: '02', name: 'Столик 02', capacity: 4, zone: 'Основной зал' },
  { id: '03', name: 'Столик 03', capacity: 6, zone: 'Основной зал' },
  { id: '04', name: 'Столик 04', capacity: 2, zone: 'Основной зал' },
  { id: '05', name: 'Столик 05', capacity: 4, zone: 'Терраса' },
  { id: '06', name: 'Столик 06', capacity: 8, zone: 'Терраса' },
  { id: '07', name: 'Столик 07', capacity: 2, zone: 'Терраса' },
  { id: '08', name: 'Столик 08', capacity: 4, zone: 'VIP зона' },
  { id: '09', name: 'Столик 09', capacity: 6, zone: 'VIP зона' },
  { id: '10', name: 'Столик 10', capacity: 4, zone: 'VIP зона' }
])

// Имя официанта
const waiterName = computed(() => {
  return authStore.user?.full_name || authStore.user?.username || 'Не определен'
})

// Способы оплаты
const paymentMethods = ref<PaymentMethod[]>([
  { id: 'cash', name: 'Наличные', icon: 'bi-cash-stack' },
  { id: 'card', name: 'Карта', icon: 'bi-credit-card' },
  { id: 'online', name: 'Онлайн', icon: 'bi-phone' }
])

// Демо данные категорий и блюд
const categories = ref<Category[]>([
  {
    id: 'appetizers',
    name: 'Закуски',
    icon: 'bi-egg-fried',
    color: '#e74c3c',
    items: [
      {
        id: 'cheese-plate',
        name: 'Сырная тарелка',
        description: 'Ассорти из итальянских сыров с медом и орехами',
        image: 'https://images.unsplash.com/photo-1486297678162-eb2a19b0a32d?w=300&h=200&fit=crop',
        basePrice: 890,
        categoryId: 'appetizers',
        isVegetarian: true,
        cookingTime: 5,
        calories: 420,
        allergens: ['молоко', 'орехи'],
        ingredients: ['сыр пармезан', 'сыр горгонзола', 'сыр камамбер', 'мед', 'грецкие орехи'],
        recommendations: 'Отлично сочетается с красным вином',
        isAvailable: true,
        portionWeight: 180
      },
      {
        id: 'foie-gras',
        name: 'Фуа-гра с брусничным соусом',
        description: 'Изысканная фуа-гра с домашним брусничным соусом и тостами',
        image: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=300&h=200&fit=crop',
        basePrice: 2800,
        categoryId: 'appetizers',
        cookingTime: 8,
        calories: 680,
        allergens: ['глютен'],
        ingredients: ['фуа-гра', 'брусничный соус', 'тосты', 'микрозелень'],
        recommendations: 'Премиальная позиция. Подавать с шампанским или белым вином',
        isAvailable: false,
        portionWeight: 120
      }
    ]
  },
  {
    id: 'salads',
    name: 'Салаты',
    icon: 'bi-flower1',
    color: '#27ae60',
    items: [
      {
        id: 'caesar',
        name: 'Цезарь',
        description: 'Классический салат с курицей, сухариками и соусом цезарь',
        image: 'https://images.unsplash.com/photo-1546793665-c74683f339c1?w=300&h=200&fit=crop',
        basePrice: 650,
        categoryId: 'salads',
        isPopular: true,
        cookingTime: 8,
        calories: 380,
        allergens: ['яйца', 'молоко', 'глютен'],
        ingredients: ['салат айсберг', 'куриная грудка', 'пармезан', 'сухарики', 'соус цезарь'],
        recommendations: 'Рекомендуем с белым вином или безалкогольным мохито',
        isAvailable: true,
        portionWeight: 220,
        variations: [
          {
            id: 'size',
            name: 'Размер',
            required: true,
            options: [
              { id: 'small', name: 'Маленький', price: 550 },
              { id: 'regular', name: 'Обычный', price: 650 },
              { id: 'large', name: 'Большой', price: 750 }
            ]
          }
        ]
      }
    ]
  },
  {
    id: 'soups',
    name: 'Супы',
    icon: 'bi-cup-hot',
    color: '#f39c12',
    items: [
      {
        id: 'tomato-soup',
        name: 'Томатный крем-суп',
        description: 'Нежный крем-суп из спелых томатов с базиликом',
        image: 'https://images.unsplash.com/photo-1547592166-23ac45744acd?w=300&h=200&fit=crop',
        basePrice: 380,
        categoryId: 'soups',
        isVegetarian: true,
        isNew: true,
        cookingTime: 6,
        calories: 180,
        allergens: ['молоко'],
        ingredients: ['томаты', 'сливки', 'базилик', 'лук', 'чеснок'],
        recommendations: 'Подавать с хрустящими гренками',
        isAvailable: true,
        portionWeight: 300
      }
    ]
  },
  {
    id: 'mains',
    name: 'Основные блюда',
    icon: 'bi-egg-fry',
    color: '#8e44ad',
    items: [
      {
        id: 'steak',
        name: 'Стейк Рибай',
        description: 'Сочный стейк из мраморной говядины с гарниром',
        image: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=300&h=200&fit=crop',
        basePrice: 1890,
        categoryId: 'mains',
        isPopular: true,
        cookingTime: 18,
        calories: 650,
        allergens: [],
        ingredients: ['говядина рибай', 'специи', 'масло', 'тимьян'],
        recommendations: 'Рекомендуем красное вино. При medium-rare сок будет розовым',
        isAvailable: true,
        portionWeight: 280,
        variations: [
          {
            id: 'size',
            name: 'Размер',
            required: true,
            options: [
              { id: 'small', name: 'Порция 200г', price: 1490 },
              { id: 'regular', name: 'Порция 280г', price: 1890 },
              { id: 'large', name: 'Порция 350г', price: 2290 }
            ]
          }
        ]
      },
      {
        id: 'spicy-pasta',
        name: 'Паста Арабьята',
        description: 'Острая паста с томатным соусом, чили и базиликом',
        image: 'https://images.unsplash.com/photo-1551183053-bf91a1d81141?w=300&h=200&fit=crop',
        basePrice: 690,
        categoryId: 'mains',
        cookingTime: 12,
        calories: 520,
        allergens: ['глютен'],
        ingredients: ['паста пенне', 'томаты', 'чили', 'чеснок', 'базилик', 'оливковое масло'],
        recommendations: 'Острое блюдо! Предупредите гостей. Подавать с пармезаном',
        isAvailable: true,
        portionWeight: 350,
        spicyLevel: 'hot'
      }
    ]
  },
  {
    id: 'desserts',
    name: 'Десерты',
    icon: 'bi-cake2',
    color: '#e91e63',
    items: [
      {
        id: 'tiramisu',
        name: 'Тирамису',
        description: 'Классический итальянский десерт с кофе и маскарпоне',
        image: 'https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?w=300&h=200&fit=crop',
        basePrice: 450,
        categoryId: 'desserts',
        isPopular: true,
        cookingTime: 3,
        calories: 320,
        allergens: ['яйца', 'молоко', 'глютен'],
        ingredients: ['маскарпоне', 'печенье савоярди', 'кофе эспрессо', 'какао'],
        recommendations: 'Отлично сочетается с кофе или дижестивом',
        isAvailable: true,
        portionWeight: 150
      }
    ]
  },
  {
    id: 'drinks',
    name: 'Напитки',
    icon: 'bi-cup-straw',
    color: '#3498db',
    items: [
      {
        id: 'espresso',
        name: 'Эспрессо',
        description: 'Классический итальянский кофе',
        image: 'https://images.unsplash.com/photo-1511537190424-bbbab87ac5eb?w=300&h=200&fit=crop',
        basePrice: 180,
        categoryId: 'drinks',
        cookingTime: 2,
        calories: 5,
        allergens: [],
        ingredients: ['кофе арабика 100%'],
        recommendations: 'Подавать с сахаром или лимонной цедрой',
        isAvailable: true,
        portionWeight: 30,
        variations: [
          {
            id: 'size',
            name: 'Размер',
            required: true,
            options: [
              { id: 'single', name: 'Одинарный', price: 180 },
              { id: 'double', name: 'Двойной', price: 280 }
            ]
          }
        ]
      }
    ]
  }
])

// Вычисляемые свойства
const currentCategoryDishes = computed(() => {
  const category = categories.value.find(c => c.id === activeCategory.value)
  return category?.items || []
})

const totalQuantity = computed(() => {
  return cartItems.value.reduce((sum, item) => sum + item.quantity, 0)
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

// Столики активной зоны
const activeZoneTables = computed(() => {
  if (!activeZone.value || !tablesByZones.value[activeZone.value]) {
    return []
  }
  return tablesByZones.value[activeZone.value]
})

// Цвета для зон
const getZoneColor = (zoneName: string) => {
  const colors: Record<string, string> = {
    'Основной зал': '#2ecc71',
    'VIP зона': '#9b59b6',
    'Банкетный зал': '#e67e22',
    'Терраса': '#3498db',
    'Бар': '#e74c3c'
  }
  return colors[zoneName] || '#6c757d'
}

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

const createOrder = () => {
  if (!selectedPaymentMethod.value || cartItems.value.length === 0) return

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

  console.log('Создание заказа:', {
    orderType: selectedOrderType.value,
    table: selectedTable.value,
    items: cartItems.value,
    paymentMethod: selectedPaymentMethod.value,
    total: totalPrice.value
  })

  // Здесь будет логика создания заказа через API
  // После успешного создания вернемся на главную
  let orderTypeText = ''
  if (selectedOrderType.value === 'table') {
    const table = availableTables.value.find(t => t.id === selectedTable.value)
    orderTypeText = table ? `${table.name}` : `Столик ${selectedTable.value}`
  } else if (selectedOrderType.value === 'takeaway') {
    orderTypeText = 'с собой'
  } else if (selectedOrderType.value === 'delivery') {
    orderTypeText = 'доставка'
  }

  alert(`Заказ ${orderTypeText} создан! Сумма: ${totalPrice.value}₽`)
  router.push({ name: 'dashboard' })
}

// Lifecycle
let timeInterval: number

onMounted(() => {
  updateTime()
  timeInterval = setInterval(updateTime, 1000) as unknown as number

  // Получаем столик из роута если есть
  const tableParam = router.currentRoute.value.query.table as string
  if (tableParam) {
    selectedTable.value = tableParam
    selectedOrderType.value = 'table' // Автоматически устанавливаем тип заказа "За столиком"
  } else {
    // Если столик не выбран, сразу открываем модальное окно выбора типа заказа
    openOrderTypeModal()
  }
})

onUnmounted(() => {
  if (timeInterval) {
    clearInterval(timeInterval)
  }
})
</script>
