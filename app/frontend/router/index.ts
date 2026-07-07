import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      name: 'home',
      component: () => import('../views/HomeView.vue')
    },
    {
      path: '/hot',
      name: 'hot',
      component: () => import('../views/HotView.vue')
    },
    {
      path: '/health',
      name: 'health',
      component: () => import('../views/HealthView.vue')
    },
    {
      path: '/collection',
      name: 'collection',
      component: () => import('../views/CollectionView.vue')
    }
  ]
})

export default router
