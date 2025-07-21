<template>
  <div v-if="showUpdatePrompt" class="pwa-update-prompt">
    <div class="update-banner">
      <div class="update-content">
        <i class="bi bi-arrow-repeat me-2"></i>
        <span>Доступно обновление приложения</span>
      </div>
      <div class="update-actions">
        <button
          @click="updateApp"
          class="btn btn-primary btn-sm me-2"
        >
          Обновить
        </button>
        <button
          @click="dismissUpdate"
          class="btn btn-secondary btn-sm"
        >
          Позже
        </button>
      </div>
    </div>
  </div>

  <div v-if="showOfflineReady" class="pwa-offline-ready">
    <div class="offline-banner">
      <div class="offline-content">
        <i class="bi bi-wifi-off me-2"></i>
        <span>Приложение готово к работе офлайн</span>
      </div>
      <button
        @click="dismissOffline"
        class="btn btn-success btn-sm"
      >
        OK
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { registerSW } from 'virtual:pwa-register'

const showUpdatePrompt = ref(false)
const showOfflineReady = ref(false)

let updateSW: ((reloadPage?: boolean) => Promise<void>) | undefined

onMounted(() => {
  updateSW = registerSW({
    onNeedRefresh() {
      showUpdatePrompt.value = true
    },
    onOfflineReady() {
      showOfflineReady.value = true
      // Автоматически скрыть через 5 секунд
      setTimeout(() => {
        showOfflineReady.value = false
      }, 5000)
    }
  })
})

const updateApp = async () => {
  if (updateSW) {
    await updateSW(true)
  }
}

const dismissUpdate = () => {
  showUpdatePrompt.value = false
}

const dismissOffline = () => {
  showOfflineReady.value = false
}
</script>

<style scoped>
.pwa-update-prompt,
.pwa-offline-ready {
  position: fixed;
  top: 20px;
  right: 20px;
  z-index: 9999;
  max-width: 400px;
}

.update-banner,
.offline-banner {
  background: var(--qres-glass-bg);
  backdrop-filter: blur(10px);
  border: 1px solid var(--qres-glass-border);
  border-radius: var(--qres-radius-md);
  padding: 1rem;
  box-shadow: var(--qres-shadow-lg);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
}

.update-content,
.offline-content {
  display: flex;
  align-items: center;
  color: var(--qres-dark);
  font-weight: 500;
}

.update-actions {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.offline-banner {
  background: rgba(39, 174, 96, 0.1);
  border-color: var(--qres-success);
}

.offline-content {
  color: var(--qres-success);
}

@media (max-width: 768px) {
  .pwa-update-prompt,
  .pwa-offline-ready {
    top: 10px;
    right: 10px;
    left: 10px;
    max-width: none;
  }

  .update-banner,
  .offline-banner {
    flex-direction: column;
    text-align: center;
  }
}
</style>
