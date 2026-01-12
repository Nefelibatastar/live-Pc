import babelpolyfill from 'babel-polyfill'
import Vue from 'vue'
import App from './App'
import VueRouter from 'vue-router'
import store from './vuex/store'
import Vuex from 'vuex'
import routes from './routes'
// import Mock from './mock'
import iview from 'iview'
import 'iview/dist/styles/iview.css'
import VueClipboard from 'vue-clipboard2'
import ElementUI from "element-ui";
// 引入 Element UI 中文语言包
// import "element-ui/lib/theme-chalk/index.css";
import locale from "element-ui/lib/locale/lang/zh-CN";
import api from './api/api';
Vue.prototype.$api = api;
// 使用中文语言包
Vue.use(ElementUI, { locale });

// Mock.bootstrap();

Vue.use(VueClipboard)
Vue.use(VueRouter)
Vue.use(Vuex)
Vue.use(iview)

const router = new VueRouter({
    routes
})

router.beforeEach((to, from, next) => {
    if (to.path == '/login') {
        localStorage.removeItem('userInfo');
    }
    let userInfo = JSON.parse(localStorage.getItem('userInfo'));
    if (!userInfo && to.path != '/login') {
        next({ path: '/login' })
    } else {
        next()
    }
})
new Vue({
    el: '#app',
    template: '<App/>',
    router,
    store,
    components: { App }
    //render: h => h(Login)
}).$mount('#app')

//router.replace('/login')