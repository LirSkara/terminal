<template>
  <div v-if="show" class="dish-modal-overlay" @click="handleClose">
    <div class="dish-modal" @click.stop>
      <div class="modal-header" :style="{ backgroundImage: selectedDish?.image ? `url(${selectedDish.image})` : 'none' }">
        <h3>{{ selectedDish?.name }}</h3>
        <button @click="handleClose" class="modal-close-btn">
          <i class="bi bi-x"></i>
        </button>
      </div>

      <div class="modal-body">
        <div class="dish-details">
          <!-- Информация для официантов -->
          <div class="info-grid" v-if="selectedDish">
            <div class="info-item" v-if="currentDishInfo?.cookingTime">
              <i class="bi bi-clock"></i>
              <div>
                <span class="label">Готовится</span>
                <span class="value">{{ currentDishInfo.cookingTime }} мин</span>
              </div>
            </div>

            <div class="info-item" v-if="currentDishInfo?.portionWeight">
              <i class="bi bi-speedometer2"></i>
              <div>
                <span class="label">Вес порции</span>
                <span class="value">{{ currentDishInfo.portionWeight }} г</span>
              </div>
            </div>

            <div class="info-item" v-if="currentDishInfo?.calories">
              <i class="bi bi-lightning"></i>
              <div>
                <span class="label">Калорийность</span>
                <span class="value">{{ currentDishInfo.calories }} ккал</span>
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
              <div class="variation-options">
                <button
                  v-for="option in variation.options"
                  :key="option.id"
                  @click="$emit('selectVariation', variation.id, option)"
                  :class="['variation-option', {
                    active: selectedVariations[variation.id]?.id === option.id
                  }]"
                >
                  <div class="option-main">
                    <span class="option-name">{{ option.name }}</span>
                    <span class="option-price">{{ option.price }}₽</span>
                  </div>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="modal-footer">
        <div class="modal-quantity">
          <button @click="decreaseQuantity" class="qty-btn">
            <i class="bi bi-dash"></i>
          </button>
          <span class="quantity">{{ quantity }}</span>
          <button @click="increaseQuantity" class="qty-btn">
            <i class="bi bi-plus"></i>
          </button>
        </div>

        <button @click="$emit('addToCart')" class="add-to-cart-btn">
          <i class="bi bi-cart-plus"></i>
          Добавить ({{ totalPrice }}₽)
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface DishVariationOption {
  id: string
  name: string
  price: number
  portionWeight?: number
  calories?: number
  cookingTime?: number
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
  cookingTime?: number
  calories?: number
  allergens?: string[]
  ingredients?: string[]
  recommendations?: string
  isAvailable?: boolean
  portionWeight?: number
  spicyLevel?: 'mild' | 'medium' | 'hot' | 'very-hot'
}

interface Props {
  show: boolean
  selectedDish: Dish | null
  selectedVariations: Record<string, DishVariationOption>
  quantity: number
  totalPrice: number
}

interface Emits {
  (e: 'close'): void
  (e: 'selectVariation', variationId: string, option: DishVariationOption): void
  (e: 'increaseQuantity'): void
  (e: 'decreaseQuantity'): void
  (e: 'addToCart'): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

// Динамические значения для модального окна на основе выбранных вариаций
const currentDishInfo = computed(() => {
  if (!props.selectedDish) return null

  let cookingTime = props.selectedDish.cookingTime
  let calories = props.selectedDish.calories
  let portionWeight = props.selectedDish.portionWeight

  // Если есть выбранные вариации, используем их значения
  const selectedOptions = Object.values(props.selectedVariations)
  if (selectedOptions.length > 0) {
    const firstOption = selectedOptions[0]
    cookingTime = firstOption.cookingTime ?? cookingTime
    calories = firstOption.calories ?? calories
    portionWeight = firstOption.portionWeight ?? portionWeight
  }

  return {
    cookingTime,
    calories,
    portionWeight
  }
})

const handleClose = () => {
  emit('close')
}

const increaseQuantity = () => {
  emit('increaseQuantity')
}

const decreaseQuantity = () => {
  if (props.quantity > 1) {
    emit('decreaseQuantity')
  }
}
</script>

<style scoped>
/* Стили будут унаследованы из основного компонента или добавлены здесь */
</style>
