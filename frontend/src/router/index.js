import { createRouter, createWebHistory } from 'vue-router'
import DashboardView from '../views/DashboardView.vue'
import EstoqueView from '@/views/EstoqueView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'dashboard',
      component: DashboardView
    },
    {
      path: '/estoque',
      name: 'estoque',
      component: EstoqueView
    },
    {
      path: '/entradas',
      name: 'entradas',
      component: () => import('../views/EntradasView.vue')
    },
    {
      path: '/historico',
      name: 'historico',
      component: () => import('../views/HistoricoView.vue')
    }
  ]
})

export default router
