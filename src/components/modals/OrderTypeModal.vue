<template>
  <div v-if="show" class="dish-modal-overlay" @click="handleClose">
    <div class="order-type-modal" @click.stop>
      <div class="modal-header">
        <h3>Выберите тип заказа</h3>
        <button @click="handleClose" class="modal-close-btn">
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
              @click="$emit('selectOrderType', orderType.id)"
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

          <!-- Индикатор загрузки зон -->
          <div v-if="isLoadingZones || isLoadingTables" class="loading-indicator">
            <i class="bi bi-arrow-clockwise spin"></i>
            <span>Загрузка данных...</span>
          </div>

          <!-- Вкладки зон -->
          <div v-else-if="availableZones.length > 0" class="zone-tabs">
            <button
              v-for="zoneName in availableZones"
              :key="zoneName"
              @click="$emit('selectZone', zoneName)"
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

          <!-- Сообщение об отсутствии зон -->
          <div v-else class="no-zones-message">
            <p>Зоны не найдены</p>
          </div>

          <!-- Столики активной зоны -->
          <div v-if="activeZone" class="zone-content">
            <div class="tables-grid">
              <button
                v-for="table in activeZoneTables"
                :key="table.id"
                @click="$emit('selectTable', table.id)"
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
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface OrderType {
  id: string
  name: string
  icon: string
  description: string
}

interface UITable {
  id: string
  name: string
  capacity: number
  zone: string
}

interface Zone {
  id: string
  name: string
  color: string
}

interface Props {
  show: boolean
  orderTypes: OrderType[]
  selectedOrderType: string | null
  isLoadingZones: boolean
  isLoadingTables: boolean
  availableZones: string[]
  activeZone: string | null
  tablesByZones: Record<string, UITable[]>
  zones: Zone[]
}

interface Emits {
  (e: 'close'): void
  (e: 'selectOrderType', type: string): void
  (e: 'selectZone', zoneName: string): void
  (e: 'selectTable', tableId: string): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

// Столики активной зоны
const activeZoneTables = computed(() => {
  if (!props.activeZone || !props.tablesByZones[props.activeZone]) {
    return []
  }
  return props.tablesByZones[props.activeZone]
})

// Цвета для зон (используем данные из API)
const getZoneColor = (zoneName: string) => {
  const zone = props.zones.find(z => z.name === zoneName)
  return zone?.color || '#6c757d'
}

const handleClose = () => {
  emit('close')
}
</script>

<style scoped>
/* Стили будут унаследованы из основного компонента или добавлены здесь */
</style>
