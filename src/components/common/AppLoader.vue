<template>
  <div class="app-loader">
    <div class="loader-container">
      <div class="qres-logo">
        <i class="bi bi-egg-fried display-1 text-primary"></i>
      </div>
      <h3 class="text-primary mb-4">QRes OS 4</h3>
      <div class="spinner-border text-primary" role="status">
        <span class="visually-hidden">Загрузка...</span>
      </div>
      <p class="mt-3 text-muted">{{ message }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'

interface Props {
  message?: string
}

const props = withDefaults(defineProps<Props>(), {
  message: 'Загрузка приложения...'
})

const currentMessage = ref(props.message)

const messages = [
  'Загрузка приложения...',
  'Инициализация модулей...',
  'Подготовка интерфейса...',
  'Почти готово...'
]

onMounted(() => {
  let index = 0
  const interval = setInterval(() => {
    index = (index + 1) % messages.length
    currentMessage.value = messages[index]
  }, 1000)

  // Очищаем интервал через 5 секунд
  setTimeout(() => {
    clearInterval(interval)
  }, 5000)
})
</script>

<style scoped lang="scss">
.app-loader {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, var(--qres-background) 0%, #d5e8f0 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
}

.loader-container {
  text-align: center;
  animation: fadeInUp 0.6s ease-out;
}

.qres-logo {
  margin-bottom: 1rem;
  animation: bounce 2s infinite;
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
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
</style>
