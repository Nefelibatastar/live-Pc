// 修改后的 store.js
import Vue from 'vue'
import Vuex from 'vuex'
import * as actions from './actions'
import * as getters from './getters'
// 引入 live 模块
import live from '../store/modules/live' // 注意路径是否正确（根据实际目录结构调整）

Vue.use(Vuex)

const state = {
    count: 10
}

const mutations = {
    INCREMENT(state) {
        state.count++
    },
    DECREMENT(state) {
        state.count--
    }
}

export default new Vuex.Store({
    actions,
    getters,
    state,
    mutations,
    modules: {
        live // 注册 live 模块，此时才能通过 'live' 命名空间访问
    }
})