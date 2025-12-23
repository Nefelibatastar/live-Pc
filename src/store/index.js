import Vue from 'vue';
import Vuex from 'vuex';
import live from './modules/live';

Vue.use(Vuex);

export default new Vuex.Store({
  modules: {
    live
  }
});