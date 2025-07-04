import './assets/main.css'
import 'bootstrap/dist/css/bootstrap.min.css'
import 'bootstrap-icons/font/bootstrap-icons.css'

import { createApp } from 'vue'
import { createPinia } from 'pinia'
import Toast from 'vue-toastification'
import 'vue-toastification/dist/index.css'

import App from './App.vue'
import router from './router'

const app = createApp(App)

// Настройка Pinia
const pinia = createPinia()
app.use(pinia)

// Настройка роутера
app.use(router)

// Настройка уведомлений
app.use(Toast, {
  timeout: 5000,
  closeOnClick: true,
  pauseOnFocusLoss: true,
  pauseOnHover: true,
  draggable: true,
  draggablePercent: 0.6,
  showCloseButtonOnHover: false,
  hideProgressBar: false,
  closeButton: "button",
  icon: true,
  rtl: false,
  position: "top-right",
  transition: "Vue-Toastification__bounce",
  maxToasts: 5,
  newestOnTop: true
})

app.mount('#app')
