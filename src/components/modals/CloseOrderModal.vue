<template>
  <Teleport to="body">
    <div
      v-if="isVisible"
      class="order-modal-backdrop"
      @click="$emit('close')"
    >
      <div class="close-order-modal" @click.stop>
        <div class="order-modal-header">
          <h3 class="order-modal-title">
            <i class="bi bi-credit-card me-2"></i>
            Закрытие счета столика {{ orderData?.tableNumber }}
          </h3>
          <button @click="$emit('close')" class="order-modal-close">
            <i class="bi bi-x-lg"></i>
          </button>
        </div>

        <div class="order-modal-body" v-if="orderData">
          <!-- Способы оплаты на всю ширину -->
          <div class="payment-methods-full-width mt-4">

            <!-- Если нет способов оплаты -->
            <div v-if="!paymentMethods || paymentMethods.length === 0" class="no-payment-methods-compact">
              <i class="bi bi-exclamation-triangle me-2"></i>
              <span>Способы оплаты не загружены</span>
            </div>

            <!-- Сетка способов оплаты 3 в ряд -->
            <div v-else class="payment-methods-grid-full">
              <button
                v-for="method in paymentMethods"
                :key="method.id"
                @click="selectPaymentMethod(method.id)"
                :class="['payment-method-btn-full', { active: selectedPaymentMethod === method.id }]"
                :disabled="!method.isActive"
                :title="method.isActive ? method.name : `${method.name} (недоступен)`"
              >
                <i :class="method.icon"></i>
                <span>{{ method.name }}</span>
              </button>
            </div>
          </div>

          <!-- Свернутые секции -->
          <div class="collapsible-sections">
            <!-- Разделение счета -->
            <div class="section-compact">
              <div class="section-header-compact" @click="toggleSection('split')">
                <h4 class="section-title-compact">
                  <i class="bi bi-pie-chart me-2"></i>
                  Разделение счета
                </h4>
                <i :class="['bi', expandedSections.split ? 'bi-chevron-up' : 'bi-chevron-down']"></i>
              </div>
              <div v-if="expandedSections.split" class="section-content-compact">
                <div class="split-options-compact">
                  <button
                    @click="setSplitType('none')"
                    :class="['split-btn-compact', { active: splitType === 'none' }]"
                  >
                    <i class="bi bi-receipt"></i>
                    <span>Один счет</span>
                  </button>
                  <button
                    @click="setSplitType('equal')"
                    :class="['split-btn-compact', { active: splitType === 'equal' }]"
                  >
                    <i class="bi bi-people"></i>
                    <span>Поровну</span>
                  </button>
                </div>

                <!-- Настройки равного разделения -->
                <div v-if="splitType === 'equal'" class="equal-split-controls-compact">
                  <label class="split-control-label-compact">
                    Количество человек:
                    <input
                      v-model.number="splitPersons"
                      type="number"
                      min="2"
                      max="20"
                      class="split-input-compact"
                    />
                  </label>
                  <div class="split-result-compact">
                    С каждого: {{ Math.ceil(orderData.finalAmount / splitPersons) }}₽
                  </div>
                </div>
              </div>
            </div>

            <!-- Дополнительные опции -->
            <div class="section-compact">
              <div class="section-header-compact" @click="toggleSection('options')">
                <h4 class="section-title-compact">
                  <i class="bi bi-gear me-2"></i>
                  Дополнительные опции
                </h4>
                <i :class="['bi', expandedSections.options ? 'bi-chevron-up' : 'bi-chevron-down']"></i>
              </div>
              <div v-if="expandedSections.options" class="section-content-compact">
                <div class="options-grid-compact">
                  <label class="option-checkbox-compact">
                    <input
                      v-model="printPrecheck"
                      type="checkbox"
                    />
                    <span class="checkmark-compact"></span>
                    <span class="option-label-compact">Предчек</span>
                  </label>
                  <label class="option-checkbox-compact">
                    <input
                      v-model="printReceipt"
                      type="checkbox"
                    />
                    <span class="checkmark-compact"></span>
                    <span class="option-label-compact">Чек</span>
                  </label>

                  <!-- Скидка -->
                  <div class="discount-section-compact">
                    <label class="discount-label-compact">
                      Скидка (%):
                      <input
                        v-model.number="discountPercent"
                        type="number"
                        min="0"
                        max="100"
                        class="discount-input-compact"
                        @input="updateDiscount"
                      />
                    </label>
                  </div>
                </div>

              </div>
            </div>

            <!-- Комментарий -->
            <div class="section-compact">
              <div class="section-header-compact" @click="toggleSection('comment')">
                <h4 class="section-title-compact">
                  <i class="bi bi-chat-text me-2"></i>
                  Комментарий
                </h4>
                <i :class="['bi', expandedSections.comment ? 'bi-chevron-up' : 'bi-chevron-down']"></i>
              </div>
              <div v-if="expandedSections.comment" class="section-content-compact">
                <textarea
                  v-model="closeComment"
                  placeholder="Комментарий к закрытию заказа..."
                  class="comment-textarea-compact"
                  rows="2"
                ></textarea>
              </div>
            </div>
          </div>
        </div>

        <div class="order-modal-footer">
          <div class="order-modal-actions">
            <!-- Итоговая сумма в левой части -->
            <div class="order-total-footer" v-if="orderData">
              <div class="total-info-footer">
                <span class="total-label-footer">К оплате:</span>
                <span class="total-amount-footer">{{ orderData.finalAmount }}₽</span>
              </div>
              <div v-if="orderData.discount > 0" class="discount-info-footer">
                <span class="discount-badge-footer">-{{ orderData.discount }}%</span>
                <span class="original-amount-footer">{{ orderData.originalAmount }}₽</span>
              </div>
            </div>

            <!-- Кнопки действий в правой части -->
            <div class="action-buttons">
              <button
                v-if="printPrecheck"
                @click="$emit('print-precheck')"
                class="qres-btn qres-btn-outline precheck-btn"
              >
                <i class="bi bi-printer me-2"></i>
                Предчек
              </button>

              <button
                @click="$emit('close')"
                class="qres-btn qres-btn-outline cancel-btn"
              >
                <i class="bi bi-x-lg me-2"></i>
                Отмена
              </button>

              <button
                @click="processOrderClosure"
                :disabled="!selectedPaymentMethod || !hasActivePaymentMethods"
                class="qres-btn qres-btn-primary close-order-btn"
              >
                <i class="bi bi-check-circle me-2"></i>
                {{ splitType === 'none' ? 'Закрыть счет' : `Закрыть счет (${splitPersons} чел.)` }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue'

// Типы данных
interface OrderItem {
  id: number
  name: string
  unitPrice: number
  totalPrice: number
  quantity: number
  category: string
  notes?: string
}

interface CloseOrderData {
  tableNumber: string | number
  items: OrderItem[]
  originalAmount: number
  finalAmount: number
  discount: number
  orderId: number
}

// Используем тип из API для способов оплаты
// Данные загружаются в родительском компоненте DashboardView из API
interface PaymentMethod {
  id: string
  name: string
  icon: string
  isActive: boolean
}

// Props
interface Props {
  isVisible: boolean
  orderData: CloseOrderData | null
  paymentMethods: PaymentMethod[]
}

const props = defineProps<Props>()

// Emits
const emit = defineEmits<{
  close: []
  'print-precheck': []
  'update-discount': [data: { discount: number; finalAmount: number }]
  'process-closure': [data: {
    paymentMethod: string
    splitType: 'none' | 'equal'
    splitPersons: number
    splitAssignments: Record<number, number[]>
    finalAmount: number
    discount: number
    printReceipt: boolean
    comment: string
  }]
}>()

// Reactive data
const selectedPaymentMethod = ref<string>('')
const splitType = ref<'none' | 'equal'>('none')
const splitPersons = ref(2)
const splitAssignments = ref<Record<number, number[]>>({})
const printPrecheck = ref(false)
const printReceipt = ref(true)
const discountPercent = ref(0)
const closeComment = ref('')

// Состояние развернутых секций
const expandedSections = ref({
  split: false,
  options: false,
  comment: false
})

// Computed properties
const hasActivePaymentMethods = computed(() => {
  return props.paymentMethods && props.paymentMethods.some(method => method.isActive)
})

// Methods
const toggleSection = (section: 'split' | 'options' | 'comment') => {
  expandedSections.value[section] = !expandedSections.value[section]
}

const selectPaymentMethod = (methodId: string) => {
  const method = props.paymentMethods.find(m => m.id === methodId)
  selectedPaymentMethod.value = methodId
  console.log('Выбран способ оплаты из API:', method?.name || 'Неизвестный', '(ID:', methodId, ')')
}

const setSplitType = (type: 'none' | 'equal') => {
  splitType.value = type
  console.log('Установлен тип разделения:', type)

  // При смене типа сбрасываем назначения
  splitAssignments.value = {}
}

const updateDiscount = () => {
  if (!props.orderData) return

  const originalAmount = props.orderData.originalAmount
  const discountAmount = (originalAmount * discountPercent.value) / 100
  const finalAmount = originalAmount - discountAmount

  // Эмитируем событие об изменении данных заказа
  emit('update-discount', {
    discount: discountPercent.value,
    finalAmount: Math.round(finalAmount)
  })

  console.log(`Применена скидка ${discountPercent.value}%: ${originalAmount}₽ -> ${Math.round(finalAmount)}₽`)
}

const processOrderClosure = () => {
  if (!props.orderData || !selectedPaymentMethod.value) {
    console.warn('Не выбран способ оплаты')
    return
  }

  emit('process-closure', {
    paymentMethod: selectedPaymentMethod.value,
    splitType: splitType.value,
    splitPersons: splitPersons.value,
    splitAssignments: splitAssignments.value,
    finalAmount: props.orderData.finalAmount,
    discount: discountPercent.value,
    printReceipt: printReceipt.value,
    comment: closeComment.value
  })
}

// Сброс данных при закрытии модального окна
const resetForm = () => {
  selectedPaymentMethod.value = ''
  splitType.value = 'none'
  splitPersons.value = 2
  splitAssignments.value = {}
  printPrecheck.value = false
  printReceipt.value = true
  discountPercent.value = 0
  closeComment.value = ''

  // Сброс состояния развернутых секций
  expandedSections.value = {
    split: false,
    options: false,
    comment: false
  }
}

// Watchers
watch(() => props.isVisible, (newValue) => {
  if (!newValue) {
    resetForm()
  } else {
    // Логируем способы оплаты при открытии модального окна
    console.log('CloseOrderModal открыто, способы оплаты:', props.paymentMethods)
    console.log('Активных способов оплаты:', props.paymentMethods.filter(m => m.isActive).length)

    // Определяем источник данных
    const hasDefaultMethods = props.paymentMethods.some(method =>
      ['cash', 'card', 'sbp', 'transfer', 'mixed'].includes(method.id)
    )

    if (hasDefaultMethods) {
      console.warn('⚠️ Используются демо-данные способов оплаты вместо реальных данных из API!')
    } else {
      console.log('✅ Используются реальные способы оплаты из API')
    }
  }
})

// Отслеживание изменений для обновления итоговой суммы
watch([discountPercent], () => {
  updateDiscount()
}, { immediate: false })
</script>

<style scoped lang="scss">
@use '@/styles/views/dashboard';
</style>
