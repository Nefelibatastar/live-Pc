<!-- 图片预览弹框 -->
 <!-- LiveManage/components/ImagePreviewModal.vue -->
<template>
  <Modal v-model="modalVisible" title="图片预览" width="800px" class="image-preview-modal">
    <div style="text-align: center; padding: 20px;">
      <img :src="imageUrl" style="max-width: 100%; max-height: 60vh; border-radius: 8px;" alt="预览图片">
    </div>
    <div slot="footer">
      <i-button type="primary" @click="modalVisible = false">关闭</i-button>
    </div>
  </Modal>
</template>

<script>
export default {
  name: 'ImagePreviewModal',
  props: {
    visible: {
      type: Boolean,
      default: false
    },
    imageUrl: {
      type: String,
      default: ''
    }
  },
  data() {
    return {
      modalVisible: false
    };
  },
  watch: {
    visible(val) {
      this.modalVisible = val;
    },
    modalVisible(val) {
      this.$emit('update:visible', val);
    }
  }
};
</script>

<style scoped>
.image-preview-modal >>> .ivu-modal-body {
  padding: 0;
}
</style>