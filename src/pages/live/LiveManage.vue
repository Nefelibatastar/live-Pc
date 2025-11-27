<template>
  <div>
    <!-- 查询区域 -->
    <div class="search-container">
      <Row :gutter="16" class="search-row">
        <!-- 直播名称搜索框 -->
        <Col :span="6">
        <i-input v-model="queryForm.liveName" placeholder="请输入直播名称" class="search-input"></i-input>
        </Col>
        <!-- 按钮区域 -->
        <Col :span="18" class="btn-group">
        <i-button type="default" @click="resetQuery">清空</i-button>
        <i-button type="primary" @click="searchLive">搜索</i-button>
        <i-button type="success" @click="createLive">创建直播</i-button>
        </Col>
      </Row>
    </div>

    <!-- 直播列表表格 -->
    <Table :context="self" :data="tableData" :columns="tableColumns" stripe border></Table>

    <!-- 分页控件 -->
    <div style="margin: 10px; overflow: hidden">
      <div style="float: right;">
        <Page :total="total" :current="pageNum" :page-size="pageSize" @on-change="handlePageChange"
          @on-page-size-change="handlePageSizeChange" show-total show-size-changer></Page>
      </div>
    </div>

    <!-- 创建直播模态框 -->
    <Modal v-model="createModalVisible" title="创建直播" @on-ok="handleCreateSubmit" @on-cancel="handleCreateCancel"
      :loading="modalLoading">
      <Form ref="createLiveForm" :model="createLiveForm" :rules="createLiveRules" :label-width="100">
        <!-- 直播名称 -->
        <Form-item label="直播名称" prop="liveName">
          <Input v-model="createLiveForm.liveName" placeholder="请输入直播名称" :maxlength="100" show-word-limit></Input>
        </Form-item>

        <!-- 开始时间 -->
        <Form-item label="开始时间" prop="startTime">
          <DatePicker type="datetime" v-model="createLiveForm.startTime" placeholder="选择日期和时间"
            @on-change="handleDatePicker" format="yyyy-MM-dd HH:mm:ss" style="width: 100%" :options="{
              disabledDate(date) {
                // 禁止选择过去的时间
                return date && date.valueOf() < Date.now() - 86400000;
              }
            }">
          </DatePicker>
        </Form-item>
        <!-- 直播封面 -->
        <Form-item label="直播封面" prop="coverUrl">
          <div class="cover-upload">
            <!-- 手动文件选择 -->
            <input type="file" ref="fileInput" @change="handleFileSelect" accept="image/jpeg, image/png"
              style="display: none">

            <!-- 上传区域：有图片时显示缩略图，无图片时显示上传图标 -->
            <div class="upload-area" v-if="!createLiveForm.coverUrl" @click="$refs.fileInput.click()">
              <div class="upload-icon">
                <i class="el-icon-picture-outline"></i>
              </div>
              <div class="upload-text">选择图片</div>
            </div>

            <!-- 预览区域：有图片时显示 -->
            <div class="preview-area" v-else>
              <div class="preview-wrapper" @click="previewImage">
                <img :src="createLiveForm.coverUrl" class="preview-thumb" alt="直播封面">
                <!-- 删除图标 -->
                <div class="delete-icon" @click.stop="removeCoverImage">
                  <i class="el-icon-close"></i>
                </div>
              </div>
            </div>
          </div>

          <div class="upload-tips">
            推荐图片尺寸为: 1000×562，支持 JPG、PNG 格式，图片大小不超过 10M
          </div>
        </Form-item>
      </Form>
    </Modal>

    <!-- 推流地址详情模态框 -->
    <Modal v-model="streamUrlModalVisible" title="推流地址详情" width="800px">
      <div class="stream-url-container">
        <div class="url-item">
          <label class="url-label">FLV 拉流地址：</label>
          <div class="url-content">
            <span>{{ currentStreamUrls.pullFlvUrl || '暂无' }}</span>
            <i-button type="text" @click="copyToClipboard(currentStreamUrls.pullFlvUrl)" icon="ivu-icon-ios-copy">复制</i-button>
          </div>
        </div>
        <div class="url-item">
          <label class="url-label">M3U8 拉流地址：</label>
          <div class="url-content">
            <span>{{ currentStreamUrls.pullM3u8Url || '暂无' }}</span>
            <i-button type="text" @click="copyToClipboard(currentStreamUrls.pullM3u8Url)" icon="ivu-icon-ios-copy">复制</i-button>
          </div>
        </div>
        <div class="url-item">
          <label class="url-label">RTMP 拉流地址：</label>
          <div class="url-content">
            <span>{{ currentStreamUrls.pullRtmpUrl || '暂无' }}</span>
            <i-button type="text" @click="copyToClipboard(currentStreamUrls.pullRtmpUrl)" icon="ivu-icon-ios-copy">复制</i-button>
          </div>
        </div>
        <div class="url-item">
          <label class="url-label">RTMP 推流地址：</label>
          <div class="url-content">
            <span>{{ currentStreamUrls.pushRtmpUrl || '暂无' }}</span>
            <i-button type="text" @click="copyToClipboard(currentStreamUrls.pushRtmpUrl)" icon="ivu-icon-ios-copy">复制</i-button>
          </div>
        </div>
      </div>
    </Modal>
  </div>
</template>

<script>
export default {
  name: 'LiveManage',
  data() {
    return {
      self: this,
      uploading: false, // 上传状态
      // 表格数据
      tableData: [],
      total: 0,
      // 分页参数
      pageNum: 1,
      pageSize: 10,
      // 查询表单
      queryForm: {
        liveName: ''
      },
      imgId: '',
      // 创建直播模态框相关
      createModalVisible: false,
      modalLoading: false,
      // 创建直播表单数据
      createLiveForm: {
        liveName: '',       // 直播名称
        startTime: '',      // 开始时间
        coverUrl: ''        // 封面图片URL
      },
      // 推流地址模态框相关
      streamUrlModalVisible: false,
      currentStreamUrls: {
        pullFlvUrl: '',
        pullM3u8Url: '',
        pullRtmpUrl: '',
        pushRtmpUrl: ''
      },

      // 表单验证规则
      createLiveRules: {
        liveName: [
          { required: true, message: '请输入直播名称', trigger: 'blur' },
          { max: 100, message: '直播名称不能超过100个字', trigger: 'blur' }
        ],
        startTime: [
          { required: true, message: '请选择开始时间', trigger: ['change', 'blur'] }
        ]
      },
      // 表格列配置
      tableColumns: [
        {
          title: '直播ID',
          key: 'id',
          align: 'center',
          width: 150
        },
        {
          title: '直播名称',
          key: 'liveName',
          align: 'center',
          width: 210
        },
        {
          title: '创建时间',
          key: 'createTime',
          align: 'center',
          width: 200,
        },
        {
          title: '开始时间',
          key: 'startTime',
          align: 'center',
          width: 200,
        },
        {
          title: '推流地址',
          key: 'streamUrls',
          align: 'center',
          width: 200,
          render: (h, params) => {
            return h('i-button', {
              props: {
                type: 'primary',
                size: 'small'
              },
              on: {
                click: () => this.showStreamUrls(params.row)
              }
            }, '查看地址');
          }
        },
        {
          title: '操作',
          key: 'action',
          width: 200,
          align: 'center',
          render: (h, params) => {
            return h('div', [
              h('i-button', {
                props: { type: 'warning', size: 'small' },
                style: { marginRight: '5px' },
                on: { click: () => this.editLive(params.index) }
              }, '编辑'),
              h('i-button', {
                props: { type: 'error', size: 'small' },
                on: { click: () => this.deleteLive(params.index) }
              }, '删除')
            ]);
          }
        }
      ]
    };
  },
  methods: {
    // 获取直播列表
    getLiveList() {
      const params = {
        pageNum: this.pageNum,
        pageSize: this.pageSize,
        liveName: this.queryForm.liveName || ''
      };
      this.$api.list(params)
        .then(res => {
          if (res.code === 200) {
            this.tableData = res.data.records || [];
            this.total = res.data.total || 0;
          } else {
            this.$Message.error('获取直播列表失败：' + res.message);
          }
        })
        .catch(err => {
          console.error('获取直播列表接口报错：', err);
          this.$Message.error('网络错误，请重试');
        });
    },
    // 搜索直播
    searchLive() {
      this.pageNum = 1; // 重置为第一页
      this.getLiveList();
    },
    // 重置搜索条件
    resetQuery() {
      this.queryForm = { liveName: '' };
      this.pageNum = 1;
      this.getLiveList();
    },
    // 分页改变
    handlePageChange(page) {
      this.pageNum = page;
      this.getLiveList();
    },
    // 每页条数改变
    handlePageSizeChange(size) {
      this.pageSize = size;
      this.pageNum = 1; // 重置为第一页
      this.getLiveList();
    },
    // 打开创建直播模态框
    createLive() {
      this.createModalVisible = true;
      this.createLiveForm = {
        liveName: '',
        startTime: '',
        coverUrl: ''
      };
    },
    handleDatePicker(time) {
      this.createLiveForm.startTime = time;
      // 手动触发表单验证
      this.$refs.createLiveForm.validateField('startTime');
    },
    // 选择文件
    selectFile() {
      this.$refs.fileInput.click();
    },
    // 处理文件选择
    handleFileSelect(event) {
      const file = event.target.files[0];
      if (!file) return;

      // 校验文件类型
      const isJPG = file.type === 'image/jpeg' || file.type === 'image/png';
      if (!isJPG) {
        this.$message.error('请上传JPG或PNG格式的图片');
        return;
      }

      // 校验文件大小（10M）
      const isLt10M = file.size / 1024 / 1024 <= 10;
      if (!isLt10M) {
        this.$message.error('图片大小不能超过10M');
        return;
      }

      // 调用上传接口
      this.uploadFile(file);

      // 清空 input，允许重复选择同一文件
      event.target.value = '';
    },
    // 上传文件
    uploadFile(file) {
      this.uploading = true;

      const formData = new FormData();
      formData.append('file', file);

      this.$api.upload(formData)
        .then(res => {
          if (res.code === 200) {
            this.imgId = res.data.id
            this.createLiveForm.coverUrl = `/api/sysFile/image/${this.imgId}`;
          } else {
            this.$message.error('图片上传失败: ' + (res.message || '未知错误'));
          }
        })
        .catch(err => {
          console.error('上传错误:', err);
          this.$message.error('图片上传失败，请重试');
        })
        .finally(() => {
          this.uploading = false;
        });
    },
    previewImage() {
      if (this.createLiveForm.coverUrl) {
        const image = new Image();
        image.src = this.createLiveForm.coverUrl;

        // 创建一个模态框来显示图片
        this.$Modal.info({
          title: '图片预览',
          render: (h) => {
            return h('div', {
              style: {
                textAlign: 'center',
                padding: '20px'
              }
            }, [
              h('img', {
                attrs: {
                  src: this.createLiveForm.coverUrl,
                  alt: '预览'
                },
                style: {
                  maxWidth: '100%',
                  maxHeight: '60vh',
                  display: 'block',
                  margin: '0 auto'
                }
              })
            ]);
          },
          width: '60%',
          closable: true,
          maskClosable: true
        });
      }
    },
    // 删除已上传的图片
    removeCoverImage() {
      this.createLiveForm.coverUrl = '';
      this.imgId = '';
      // 如果需要同时删除服务器上的文件，可以调用删除接口
      this.$api.delete(this.imgId);
    },
    // 取消创建直播
    handleCreateCancel() {
      this.createModalVisible = false;
      this.$refs.createLiveForm.resetFields();
      // 清空上传的图片
      this.createLiveForm.coverUrl = '';
      this.imgId = '';
      this.uploading = false;
    },
    // 提交创建直播表单
    handleCreateSubmit() {
      console.log('出发了')
      // this.$refs.createLiveForm.validate(valid => {
        if (this.createLiveForm.liveName && this.createLiveForm.startTime) {
          this.modalLoading = true;
          const param = {
            liveName: this.createLiveForm.liveName,
            startTime: this.createLiveForm.startTime,
            liveCover: this.imgId
          }
          this.$api.addLive(param)
            .then(res => {
              if (res.code === 200) {
                this.$Message.success('创建直播成功');
                this.createModalVisible = false;
                this.getLiveList(); // 刷新列表
              } else {
                this.$Message.error('创建失败：' + res.message);
              }
            })
            .catch(err => {
              console.error('创建直播接口报错：', err);
              this.$Message.error('网络错误，请重试');
            })
            .finally(() => {
              this.modalLoading = false;
            });
        }else {
          this.$Message.error('请填写必填项');
        }
      // });
    },
    // 查看直播详情（待实现）
    viewLive(index) {
      const live = this.tableData[index];
      console.log('查看直播：', live);
      // 可跳转到详情页或打开详情模态框
    },
    // 编辑直播（待实现）
    editLive(index) {
      const live = this.tableData[index];
      console.log('编辑直播：', live);
      // 打开编辑模态框并回显数据
    },
    // 删除直播（待实现）
    deleteLive(index) {
      const live = this.tableData[index];
      this.$Modal.confirm({
        title: '确认删除',
        content: `确定要删除直播「${live.liveName}」吗？此操作不可撤销！`,
        onOk: () => {
          // 调用删除接口（假设接口名为deleteLive）
          this.$api.deleteLive({ id: live.id })
            .then(res => {
              if (res.code === 200) {
                this.$Message.success('删除成功');
                this.getLiveList(); // 刷新列表
              } else {
                this.$Message.error('删除失败：' + res.message);
              }
            })
            .catch(err => {
              console.error('删除直播接口报错：', err);
              this.$Message.error('网络错误，请重试');
            });
        }
      });
    },
    // 显示推流地址详情
    showStreamUrls(row) {
      // 赋值当前直播的推流地址
      this.currentStreamUrls = {
        pullFlvUrl: row.pullFlvUrl || '',
        pullM3u8Url: row.pullM3u8Url || '',
        pullRtmpUrl: row.pullRtmpUrl || '',
        pushRtmpUrl: row.pushRtmpUrl || ''
      };
      // 打开模态框
      this.streamUrlModalVisible = true;
    },
    // 复制到剪贴板
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
    }
  },
  created() {
    // 页面加载时获取直播列表
    this.getLiveList();
  }
};
</script>

<style scoped>
/* 复用角色管理页的搜索区域样式 */
.search-container {
  padding: 15px;
  background: #fff;
  border-radius: 4px;
  margin: 0 0 15px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.search-row {
  align-items: center;
}

.search-input {
  width: 100%;
}

.btn-group {
  text-align: right;
}

/* 修复 iView 按钮选择器 */
.btn-group>>>.ivu-btn {
  margin-left: 8px;
}

.cover-upload {
  display: inline-block;
}

.upload-area {
  width: 200px;
  height: 120px;
  border: 2px dashed #dcdfe6;
  border-radius: 8px;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background-color: #fafbfc;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
}

.upload-area:hover {
  border-color: #409eff;
  background-color: #f0f7ff;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(64, 158, 255, 0.1);
}

.upload-icon {
  margin-bottom: 8px;
}

.upload-icon i {
  font-size: 32px;
  color: #c0c4cc;
  transition: color 0.3s;
}

.upload-area:hover .upload-icon i {
  color: #409eff;
}

.upload-text {
  font-size: 14px;
  color: #606266;
  font-weight: 500;
  margin-bottom: 4px;
}

/* 预览区域样式 */
.preview-area {
  display: inline-block;
}

.preview-wrapper {
  width: 200px;
  height: 120px;
  border-radius: 8px;
  cursor: pointer;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
  position: relative;
}

.preview-wrapper:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
}

.preview-thumb {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.preview-wrapper:hover .delete-icon {
  opacity: 1;
}

.delete-icon {
  position: absolute;
  top: 6px;
  right: 6px;
  width: 24px;
  height: 24px;
  background: rgba(255, 255, 255, 0.9);
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s ease;
  opacity: 0;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
  border: 1px solid #dcdfe6;
}

.delete-icon {
  position: absolute;
  top: 6px;
  right: 6px;
  width: 28px;
  height: 28px;
  background: rgba(255, 255, 255, 0.95);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
  border: 2px solid #f56c6c;
  opacity: 0.9;
}

.delete-icon {
  position: absolute;
  top: 6px;
  right: 6px;
  width: 20px;
  height: 20px;
  background: rgba(255, 255, 255, 0.95);
  border-radius: 50%;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
  border: 2px solid #f56c6c;
  opacity: 0.9;
  display: flex;
  align-items: center;
  justify-content: center;
}

.delete-icon::before,
.delete-icon::after {
  content: '';
  position: absolute;
  width: 14px;
  height: 2px;
  background: #f56c6c;
  border-radius: 1px;
}

.delete-icon::before {
  transform: rotate(45deg);
}

.delete-icon::after {
  transform: rotate(-45deg);
}

.preview-wrapper:hover .delete-icon {
  opacity: 1;
  transform: scale(1.1);
}

.delete-icon:hover {
  background: #f56c6c;
  transform: scale(1.15);
}

.delete-icon:hover::before,
.delete-icon:hover::after {
  background: #fff;
}

.upload-tips {
  margin-top: 12px;
  font-size: 13px;
  color: #909399;
  line-height: 1.5;
  background: #f8f9fa;
  padding: 8px 12px;
  border-radius: 4px;
  border-left: 3px solid #409eff;
}

/* 推流地址模态框样式 */
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
</style>