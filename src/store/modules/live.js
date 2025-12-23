export default {
  namespaced: true,
  state: {
    liveFormState: {
      addEnrollmentForm: false, // 必须初始化，避免 undefined
      createModalVisible: false,
      formData: {}
    }
  },
  mutations: {
    // 更新状态
    UPDATE_LIVE_FORM_STATE(state, payload) {
      state.liveFormState = { ...state.liveFormState, ...payload };
    },
    // 从本地存储恢复状态
    RESTORE_LIVE_FORM_STATE(state) {
      const saved = localStorage.getItem('liveFormState');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          // 确保解析后是对象，避免覆盖初始状态
          if (typeof parsed === 'object' && parsed !== null) {
            state.liveFormState = { ...state.liveFormState, ...parsed };
          }
        } catch (e) {
          console.error('解析本地存储失败', e);
          // 解析失败时保留初始状态
        }
      }
    }
  },
  actions: {
    // 保存状态到本地存储
    saveLiveFormState({ state }) {
      localStorage.setItem('liveFormState', JSON.stringify(state.liveFormState));
    }
  }
};