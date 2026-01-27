export default {
  namespaced: true,
  state: {
    liveFormState: {
      addEnrollmentForm: false, // 必须初始化，避免 undefined
      createModalVisible: false,
      tableFormat: null
    }
  },
  mutations: {
    // 更新状态
    UPDATE_LIVE_FORM_STATE(state, payload) {
      state.liveFormState = { ...state.liveFormState, ...payload };
    },
    // 从本地存储恢复状态到 Vuex state
    RESTORE_STATE_FROM_STORAGE(state, savedState) {
      if (savedState && typeof savedState === 'object') {
        state.liveFormState = { ...state.liveFormState, ...savedState };
      }
    }
  },
  actions: {
    // 保存状态到本地存储
    saveLiveFormState({ state }) {
      localStorage.setItem('liveFormState', JSON.stringify(state.liveFormState));
    },
    
    // 从本地存储恢复状态
    RESTORE_LIVE_FORM_STATE({ commit }) {
      const saved = localStorage.getItem('liveFormState');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          commit('RESTORE_STATE_FROM_STORAGE', parsed);
        } catch (e) {
          console.error('解析本地存储失败', e);
          // 可以在这里处理错误，比如清除无效的存储
          localStorage.removeItem('liveFormState');
        }
      }
    }
  }
};