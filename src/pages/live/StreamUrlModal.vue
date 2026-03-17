<!-- LiveManage/components/StreamUrlModal.vue -->
<template>
  <Modal v-model="modalVisible" :title="title" width="800px">
    <div class="stream-url-container">
      <!-- 推流地址 -->
      <div v-if="type === 'push'" class="url-item">
        <label class="url-label">RTMP 推流地址：</label>
        <div class="url-content">
          <span>{{ streamUrls.pushRtmpUrl || '暂无' }}</span>
          <i-button type="text" @click="copyToClipboard(streamUrls.pushRtmpUrl)" icon="ivu-icon-ios-copy">复制</i-button>
        </div>
      </div>

      <!-- 播流地址 -->
      <template v-if="type === 'pull'">
        <div class="url-item">
          <label class="url-label">FLV 播流地址：</label>
          <div class="url-content">
            <span>{{ streamUrls.pullFlvUrl || '暂无' }}</span>
            <i-button type="text" @click="toClipboard('flv')" icon="ivu-icon-ios-copy">跳转</i-button>
          </div>
        </div>
        <div class="qr-code-item" v-if="streamUrls.pullFlvQrCode">
          <label class="url-label">FLV格式观看二维码：</label>
          <div class="qr-code-content">
            <img :src="'data:image/png;base64,' + streamUrls.pullFlvQrCode" alt="观看二维码"
              style="max-width: 200px; max-height: 200px; border: 1px solid #e9ecef; border-radius: 4px;" />
          </div>
        </div>
        <div v-else class="url-item">
          <label class="url-label">观看二维码：</label>
          <div class="url-content"><span>暂无二维码</span></div>
        </div>
        <div class="url-item">
          <label class="url-label">M3U8 播流地址：</label>
          <div class="url-content">
            <span>{{ streamUrls.pullM3u8Url || '暂无' }}</span>
            <i-button type="text" @click="toClipboard('m3u8')" icon="ivu-icon-ios-copy">跳转</i-button>
          </div>
        </div>
      </template>
    </div>
  </Modal>
</template>

<script>
import { config } from '../../config'
export default {
  name: 'StreamUrlModal',
  props: {
    visible: {
      type: Boolean,
      default: false
    },
    type: {
      type: String,
      default: 'push', // 'push' 或 'pull'
      validator: value => ['push', 'pull'].includes(value)
    },
    streamUrls: {
      type: Object,
      default: () => ({})
    },
    liveId: {
      type: String,
      default: ''
    }
  },
  data() {
    return {
      modalVisible: false
    };
  },
  computed: {
    title() {
      return this.type === 'push' ? '推流地址详情' : '播流地址详情';
    },
    playerBaseUrl() {
      // 可以直接返回 config.playerBaseUrl，或者在这里做额外处理
      return config.playerBaseUrl;
    }
  },
  watch: {
    visible(val) {
      this.modalVisible = val;
    },
    modalVisible(val) {
      this.$emit('update:visible', val);
    }
  },
  methods: {
    copyToClipboard(text) {
      if (!text) {
        this.$Message.warning('暂无地址可复制');
        return;
      }

      const textarea = document.createElement('textarea');
      textarea.value = text;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);

      this.$Message.success('地址已复制到剪贴板');
    },

    toClipboard(streamType) {
      if (!this.liveId) {
        this.$Message.warning('直播ID不存在');
        return;
      }

      const playerUrl = `${this.playerBaseUrl}/?id=${this.liveId}&type=${streamType}`;
      window.open(playerUrl, '_blank');
    }
  }
};
</script>

<style scoped>
.stream-url-container {
  padding: 10px;
}

.url-item {
  margin-bottom: 15px;
  display: flex;
  align-items: flex-start;
}

.url-label {
  font-weight: bold;
  color: #333;
  min-width: 120px;
  padding-top: 4px;
  flex-shrink: 0;
}

.url-content {
  flex: 1;
  display: flex;
  align-items: center;
  background: #f8f9fa;
  padding: 8px 12px;
  border-radius: 4px;
  border: 1px solid #e9ecef;
  word-break: break-all;
}

.url-content span {
  flex: 1;
  font-family: monospace;
  font-size: 14px;
}

.url-content i-button {
  margin-left: 10px;
  color: #409eff;
}

.url-content i-button:hover {
  color: #66b1ff;
}

.qr-code-item {
  margin-bottom: 15px;
  display: flex;
  align-items: flex-start;
}

.qr-code-content {
  flex: 1;
  display: flex;
  justify-content: center;
  /* 图片居中 */
  background: #f8f9fa;
  padding: 12px;
  border-radius: 4px;
  border: 1px solid #e9ecef;
}
</style>