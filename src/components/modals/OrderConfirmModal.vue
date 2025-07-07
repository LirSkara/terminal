<template>
  <div v-if="show" class="dish-modal-overlay">
    <div class="order-confirm-modal" @click.stop>
      <div class="modal-header success">
        <div class="success-icon">
          <i class="bi bi-check-circle-fill"></i>
        </div>
        <h3>{{ isDelivery ? 'Заказ принят!' : 'Заказ успешно создан!' }}</h3>
      </div>

      <div class="modal-body">
        <div class="order-summary">
          <!-- Данные для доставки (только если выбрана доставка) -->
          <div v-if="isDelivery" class="delivery-form">
            <h4>
              <i class="bi bi-truck"></i>
              Данные для доставки
            </h4>

            <div class="form-group">
              <label for="customerName">
                <i class="bi bi-person"></i>
                Имя получателя *
              </label>
              <input
                id="customerName"
                v-model="deliveryData.customerName"
                type="text"
                placeholder="Введите ваше имя"
                required
              />
            </div>

            <div class="form-group">
              <label for="phone">
                <i class="bi bi-telephone"></i>
                Телефон *
              </label>
              <input
                id="phone"
                v-model="deliveryData.phone"
                type="tel"
                placeholder="+7 (999) 123-45-67"
                required
              />
            </div>

            <div class="form-group">
              <label for="address">
                <i class="bi bi-geo-alt"></i>
                Адрес доставки *
              </label>
              <textarea
                id="address"
                v-model="deliveryData.address"
                placeholder="Улица, дом, квартира"
                rows="3"
                required
              ></textarea>
            </div>

            <div class="form-group">
              <label for="comment">
                <i class="bi bi-chat-text"></i>
                Комментарий к заказу
              </label>
              <textarea
                id="comment"
                v-model="deliveryData.comment"
                placeholder="Дополнительные пожелания или комментарии"
                rows="2"
              ></textarea>
            </div>
          </div>

          <!-- Информация о заказе -->
          <div class="order-info">

            <div class="modal-info-card">
              <div class="info-row">
                <span class="label">
                  <i class="bi bi-tag"></i>
                  Тип заказа:
                </span>
                <span class="value">{{ orderSummaryText }}</span>
              </div>

              <div class="info-row">
                <span class="label">
                  <i class="bi bi-bag"></i>
                  Количество позиций:
                </span>
                <span class="value">{{ itemsCount }}</span>
              </div>

              <div class="info-row">
                <span class="label">
                  <i class="bi bi-credit-card"></i>
                  Способ оплаты:
                </span>
                <span class="value">{{ paymentMethodName }}</span>
              </div>

              <div class="info-row total">
                <span class="label">
                  Итоговая сумма:
                </span>
                <span class="value">{{ totalPrice }}₽</span>
              </div>
            </div>
          </div>

          <!-- Кнопки действий -->
          <div class="order-actions">
            <button
              v-if="isDelivery"
              @click="confirmDeliveryOrder"
              class="primary-btn"
              :disabled="!isDeliveryFormValid"
            >
              <i class="bi bi-check-circle"></i>
              Подтвердить заказ
            </button>

            <template v-else>
              <button @click="$emit('createAnotherOrder')" class="secondary-btn">
                <i class="bi bi-plus-circle"></i>
                Создать еще заказ
              </button>
              <button @click="$emit('goToDashboard')" class="primary-btn">
                <i class="bi bi-house-fill"></i>
                На главную
              </button>
            </template>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'

interface DeliveryData {
  customerName: string
  phone: string
  address: string
  comment?: string
}

interface Props {
  show: boolean
  orderSummaryText: string
  itemsCount: number
  paymentMethodName: string
  totalPrice: number
  orderType: string
  isDelivery?: boolean
}

interface Emits {
  (e: 'close'): void
  (e: 'goToDashboard'): void
  (e: 'createAnotherOrder'): void
  (e: 'confirmOrder', deliveryData?: DeliveryData): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

// Данные для доставки
const deliveryData = ref<DeliveryData>({
  customerName: '',
  phone: '',
  address: '',
  comment: ''
})

// Проверка валидности формы доставки
const isDeliveryFormValid = computed(() => {
  if (!props.isDelivery) return true

  return deliveryData.value.customerName.trim() !== '' &&
         deliveryData.value.phone.trim() !== '' &&
         deliveryData.value.address.trim() !== ''
})

const confirmDeliveryOrder = () => {
  if (isDeliveryFormValid.value) {
    emit('confirmOrder', deliveryData.value)
  }
}
</script>

<style scoped lang="scss">
/* Стили для модального окна подтверждения заказа */
.order-confirm-modal {
  width: 95%;
  max-width: 600px;
  background: white;
  border-radius: 24px;
  box-shadow: 0 25px 80px rgba(0, 0, 0, 0.15);
  overflow: hidden;
  animation: modalSlideUp 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
  border: 1px solid rgba(255, 255, 255, 0.2);

  .modal-header {
    &.success {
      background: linear-gradient(135deg, #4ade80, #22c55e, #16a34a);
      color: white;
      text-align: center;
      padding: 0.5rem 2rem;
      position: relative;
      overflow: hidden;

      &::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E") repeat;
        animation: sparkle 20s linear infinite;
      }

      .success-icon {
        font-size: 4rem;
        margin-bottom: 1rem;
        position: relative;
        z-index: 1;

        i {
          color: white;
          filter: drop-shadow(0 4px 8px rgba(0, 0, 0, 0.2));
          animation: bounce 2s infinite;
        }
      }

      h3 {
        margin: 0 0 0.5rem 0;
        font-size: 1.75rem;
        font-weight: 700;
        text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        position: relative;
        z-index: 1;
      }

      .subtitle {
        margin: 0;
        font-size: 1rem;
        opacity: 0.9;
        font-weight: 400;
        position: relative;
        z-index: 1;
      }
    }
  }

  .modal-body {
    padding: 2rem;
    max-height: 70vh;
    overflow-y: auto;

    .order-summary {
      .delivery-form {
        background: linear-gradient(135deg, #f8fafc, #f1f5f9);
        border-radius: 16px;
        padding: 1.5rem;
        margin-bottom: 2rem;
        border: 1px solid #e2e8f0;

        h4 {
          color: #1e293b;
          font-size: 1.2rem;
          font-weight: 600;
          margin: 0 0 1.5rem 0;
          display: flex;
          align-items: center;
          gap: 0.5rem;

          i {
            color: #3b82f6;
            font-size: 1.3em;
          }
        }

        .form-group {
          margin-bottom: 1.25rem;

          &:last-child {
            margin-bottom: 0;
          }

          label {
            display: flex;
            align-items: center;
            gap: 0.5rem;
            font-weight: 600;
            color: #374151;
            margin-bottom: 0.5rem;
            font-size: 0.9rem;

            i {
              color: #6b7280;
              font-size: 1.1em;
            }
          }

          input, textarea {
            width: 100%;
            padding: 0.875rem 1rem;
            border: 2px solid #e5e7eb;
            border-radius: 12px;
            font-size: 1rem;
            transition: all 0.2s ease;
            background: white;
            box-sizing: border-box;

            &:focus {
              outline: none;
              border-color: #3b82f6;
              box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
              transform: translateY(-1px);
            }

            &::placeholder {
              color: #9ca3af;
            }

            &:required:invalid {
              border-color: #ef4444;
            }
          }

          textarea {
            resize: vertical;
            min-height: 80px;
            font-family: inherit;
          }
        }
      }

      .order-info {
        margin-bottom: 2rem;

        h4 {
          color: #1e293b;
          font-size: 1.2rem;
          font-weight: 600;
          margin: 0 0 1rem 0;
          display: flex;
          align-items: center;
          gap: 0.5rem;

          i {
            color: #8b5cf6;
            font-size: 1.3em;
          }
        }

        .modal-info-card {
          background: linear-gradient(135deg, #fefefe, #f9fafb);
          border-radius: 16px;
          padding: 0 1.5rem;
          border: 1px solid #e5e7eb;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);

          .info-row {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 1rem 0;
            border-bottom: 1px solid #f3f4f6;

            &:last-child {
              border-bottom: none;
            }

            &.total {
              font-weight: 700;
              font-size: 1.2rem;
              color: #059669;
              border-top: 2px solid #10b981;
              margin-top: 1rem;
              padding-top: 1.25rem;
              margin-left: -1.5rem;
              margin-right: -1.5rem;
              padding-left: 1.5rem;
              padding-right: 1.5rem;
              border-radius: 0 0 16px 16px;
            }

            .label {
              color: #6b7280;
              font-weight: 500;
              display: flex;
              align-items: center;
              gap: 0.5rem;

              i {
                color: #9ca3af;
                font-size: 1.1em;
              }
            }

            .value {
              font-weight: 600;
              color: #1f2937;
            }

            &.total .label i {
              color: #059669;
            }
          }
        }
      }

      .order-actions {
        display: flex;
        flex-direction: column;
        gap: 1rem;

        @media (min-width: 576px) {
          flex-direction: row;
          justify-content: space-between;
        }

        .primary-btn, .secondary-btn {
          flex: 1;
          padding: 1.125rem 1.5rem;
          border: none;
          border-radius: 16px;
          font-weight: 600;
          font-size: 1rem;
          cursor: pointer;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          position: relative;
          overflow: hidden;

          i {
            font-size: 1.2em;
            transition: transform 0.2s ease;
          }

          &:hover:not(:disabled) {
            transform: translateY(-2px);
            box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);

            i {
              transform: scale(1.1);
            }
          }

          &:active:not(:disabled) {
            transform: translateY(-1px);
          }

          &:disabled {
            opacity: 0.6;
            cursor: not-allowed;
            transform: none;
          }
        }

        .primary-btn {
          background: linear-gradient(135deg, #3b82f6, #2563eb, #1d4ed8);
          color: white;
          box-shadow: 0 4px 14px rgba(59, 130, 246, 0.4);

          &::before {
            content: '';
            position: absolute;
            top: 0;
            left: -100%;
            width: 100%;
            height: 100%;
            background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
            transition: left 0.5s;
          }

          &:hover:not(:disabled) {
            background: linear-gradient(135deg, #2563eb, #1d4ed8, #1e40af);

            &::before {
              left: 100%;
            }
          }
        }

        .secondary-btn {
          background: linear-gradient(135deg, #f8fafc, #f1f5f9);
          color: #475569;
          border: 2px solid #e2e8f0;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);

          &:hover {
            background: linear-gradient(135deg, #e2e8f0, #cbd5e1);
            border-color: #cbd5e1;
            color: #334155;
          }
        }
      }
    }
  }
}

@keyframes modalSlideUp {
  from {
    opacity: 0;
    transform: translateY(60px) scale(0.9);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

@keyframes bounce {
  0%, 20%, 50%, 80%, 100% {
    transform: translateY(0);
  }
  40% {
    transform: translateY(-10px);
  }
  60% {
    transform: translateY(-5px);
  }
}

@keyframes sparkle {
  0% {
    transform: translateX(0);
  }
  100% {
    transform: translateX(60px);
  }
}

/* Адаптивность для мобильных устройств */
@media (max-width: 575px) {
  .order-confirm-modal {
    width: 98%;
    margin: 1rem auto;
    max-height: 90vh;

    .modal-header.success {
      padding: 2rem 1.5rem;

      h3 {
        font-size: 1.5rem;
      }
    }

    .modal-body {
      padding: 1.5rem;

      .order-summary {
        .delivery-form, .order-info .modal-info-card {
          padding: 1.25rem;
        }

        .order-actions {
          .primary-btn, .secondary-btn {
            padding: 1rem;
            font-size: 0.95rem;
          }
        }
      }
    }
  }
}

/* Скроллбар для длинного контента */
.modal-body::-webkit-scrollbar {
  width: 6px;
}

.modal-body::-webkit-scrollbar-track {
  background: #f1f5f9;
  border-radius: 3px;
}

.modal-body::-webkit-scrollbar-thumb {
  background: #cbd5e1;
  border-radius: 3px;
}

.modal-body::-webkit-scrollbar-thumb:hover {
  background: #94a3b8;
}
</style>
