import Vue from 'vue';
import App from './App.vue';
import VueRouter from 'vue-router';
import axios from 'axios';
import VueAxios from 'vue-axios';
import VeeValidate from './custom/vue-vee-custom';
import VueSession from './custom/vue-session-custom';
import routes from './custom/routes';
import midelware from './custom/midelware';
import permission from './custom/permission.json';
import globalFilters from'./custom/vue-global-filters';
import globalDirectives from'./custom/vue-global-directives';

Vue.use(VueRouter);
Vue.use(globalDirectives);
Vue.use(globalFilters);
Vue.use(VeeValidate);
Vue.use(VueSession, {
  persist: true
});
Vue.use(midelware,permission);
const router = new VueRouter({ mode: 'history', routes: routes });
const customAxios = axios.create({
  baseURL: 'https://wtaops.com/app/apiWtaOnline/',
  headers: {
    DEBUG: false,
    'Content-Type': 'multipart/form-data'
  }
});
customAxios.interceptors.response.use(
  function (response) {
    return response;
  },
  function (error) {
    if (error.response.status == 401 && router.currentRoute.fullPath!=='/') {
      Vue._session.set('TOKEN','');
      router.go('/');
    }
    return error.response;
  }
);
customAxios.interceptors.request.use(function (config) {
  if(!Vue._session.exists()){
    Vue._session.start();
  }
  config.headers.common['SESSION'] = Vue._session.id().replace('sess:','');
  if ((Vue._session.get('TOKEN') || '').length == 16 && (config.headers.common['TOKEN'] || '').length == 0) {
    config.headers.common['TOKEN'] = Vue._session.get('TOKEN');
    config.headers.common['USER'] = Vue._session.get("user");
  }
  return config;
}, function (err) {
  return Promise.reject(err);
});
Vue.use(VueAxios, customAxios);
router.beforeEach((to, from, next) => {
  //console.log('Vue.$canSee',Vue.$canSee([18]));
  if (to.meta.isPublic) {
    if (to.name == "Login" && (Vue._session.get('TOKEN') || '').length == 16) {
      next('/dasboard');
    } else {
      next();
    }
  } else {
    if (Vue._session.exists() && (Vue._session.get('TOKEN') || '').length == 16) {
      if (Vue._session.get('changePassword')==1 && to.name!='MyAcount') {
        next('MyAcount');
      } else {
        next();
      }
    } else {
      next('/');
    }
  }
});
Vue.config.productionTip = false;
new Vue({
  render: h => h(App),
  router
}).$mount('#app')
