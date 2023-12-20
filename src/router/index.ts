import Vue from 'vue';
import VueRouter from 'vue-router';
import Home from '@/views/home.vue'

Vue.use(VueRouter);

export const constantRoutes = [
  {
    path: '/',
    name: 'Home',
    redirect: '/resizeGroup',
    meta: {
      title: '首页',
    },
    component: Home,
    children: [
      {
        path: '/resizeGroup',
        name: 'resizeGroup',
        meta: {
          title: 'resizeGroup',
        },
        component: () =>
          import(
            /* webpackChunkName: "HomePage" */ '../views/resizeGroup.vue'
          ),
      },
      {
        path: '/resizeGroupWithDirection',
        name: 'resizeGroupWithDirection',
        meta: {
          title: 'resizeGroupWithDirection',
        },
        component: () =>
          import(
            /* webpackChunkName: "HomePage" */ '../views/resizeGroupWithDirection.vue'
          ),
      },
      {
        path: '/bar',
        name: 'bar',
        meta: {
          title: 'bar',
        },
        component: () =>
          import(
            /* webpackChunkName: "HomePage" */ '../views/charts/bar.vue'
          ),
      },
      {
        path: '/pie',
        name: 'pie',
        meta: {
          title: 'pie',
        },
        component: () =>
          import(
            /* webpackChunkName: "HomePage" */ '../views/charts/pie.vue'
          ),
      },
      {
        path: '/funnel',
        name: 'funnel',
        meta: {
          title: 'funnel',
        },
        component: () =>
          import(
            /* webpackChunkName: "HomePage" */ '../views/charts/funnel.vue'
          ),
      },
      {
        path: '/table',
        name: 'table',
        meta: {
          title: 'table',
        },
        component: () =>
          import(
            /* webpackChunkName: "HomePage" */ '../views/charts/s2Table.vue'
          ),
      },
      {
        path: '/radar',
        name: 'radar',
        meta: {
          title: 'radar',
        },
        component: () =>
          import(
            /* webpackChunkName: "HomePage" */ '../views/charts/radar.vue'
          ),
      },
    ],
  },
]

const createRouter = () =>
  new VueRouter({
    routes: constantRoutes,
  })

const router = createRouter()

export default router