import Vue from 'vue';
import App from './App.vue';
import router from './router/index';
import '@/style/common.scss';

new Vue({
  render: h => h(App),
  router
}).$mount('#app')