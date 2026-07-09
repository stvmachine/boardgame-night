import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

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
    },
    {
      path: '/login',
      name: 'login',
      component: () => import('../views/LoginView.vue')
    },
    {
      path: '/signup',
      name: 'signup',
      component: () => import('../views/SignupView.vue')
    },
    {
      path: '/account',
      name: 'account',
      component: () => import('../views/AccountView.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/groups',
      name: 'groups',
      component: () => import('../views/GroupsView.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/g/:token',
      name: 'group',
      component: () => import('../views/GroupView.vue')
    },
    {
      path: '/invite/:token',
      name: 'invite',
      component: () => import('../views/InviteView.vue')
    }
  ]
})

router.beforeEach((to) => {
  const authStore = useAuthStore()
  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    return { path: '/login', query: { redirectTo: to.fullPath } }
  }
})

export default router