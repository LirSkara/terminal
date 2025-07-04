<template>
  <div class="dashboard-view">
    <div class="container-fluid">
      <div class="row">
        <div class="col-12">
          <h1 class="h3 mb-4">
            <i class="bi bi-house-fill me-2 text-primary"></i>
            Столики ресторана
          </h1>
          
          <!-- Временная заглушка -->
          <div class="alert alert-info" role="alert">
            <h4 class="alert-heading">
              <i class="bi bi-info-circle-fill me-2"></i>
              Dashboard в разработке
            </h4>
            <p class="mb-0">
              Здесь будет отображаться интерактивная сетка столиков со статусами и возможностью управления заказами.
            </p>
          </div>

          <!-- Демонстрационные карточки -->
          <div class="row">
            <div class="col-md-6 col-lg-4 mb-4">
              <div class="card card-elevated">
                <div class="card-body text-center">
                  <i class="bi bi-table display-4 text-primary mb-3"></i>
                  <h5 class="card-title">Столик №1</h5>
                  <p class="card-text">
                    <span class="badge bg-success">Свободен</span>
                  </p>
                  <p class="text-muted">4 места</p>
                  <button class="btn btn-primary">Открыть</button>
                </div>
              </div>
            </div>
            
            <div class="col-md-6 col-lg-4 mb-4">
              <div class="card card-elevated">
                <div class="card-body text-center">
                  <i class="bi bi-table display-4 text-warning mb-3"></i>
                  <h5 class="card-title">Столик №2</h5>
                  <p class="card-text">
                    <span class="badge bg-primary">Занят</span>
                  </p>
                  <p class="text-muted">2 места</p>
                  <button class="btn btn-warning">Открыть</button>
                </div>
              </div>
            </div>
            
            <div class="col-md-6 col-lg-4 mb-4">
              <div class="card card-elevated">
                <div class="card-body text-center">
                  <i class="bi bi-table display-4 text-success mb-3"></i>
                  <h5 class="card-title">Столик №3</h5>
                  <p class="card-text">
                    <span class="badge bg-success pulse">Заказ готов</span>
                  </p>
                  <p class="text-muted">6 мест</p>
                  <button class="btn btn-success">Открыть</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'

onMounted(() => {
  console.log('Dashboard загружен')
})
</script>

<style scoped lang="scss">
.dashboard-view {
  .card {
    transition: all 0.3s ease;
    border: none;
    
    &:hover {
      transform: translateY(-5px);
    }
  }
  
  .display-4 {
    font-size: 3rem;
  }
}
</style>
