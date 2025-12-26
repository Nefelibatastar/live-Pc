import Vue from 'vue';
import Vuex from 'vuex';
import live from './modules/live';
import actions from '../vuex/actions';
import mutations from '../vuex/mutations';

Vue.use(Vuex);

export default new Vuex.Store({
  modules: {
    live,
    mutations, // 注册 mutations
    actions
  }
});