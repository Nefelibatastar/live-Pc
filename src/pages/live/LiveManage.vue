<template>
  <div>
    <!-- 查询区域 -->
    <div class="search-container">
      <Row :gutter="16" class="search-row">
        <!-- 直播名称搜索框 -->
        <Col :span="6">
        <i-input v-model="queryForm.liveShowName" placeholder="请输入直播名称" class="search-input"></i-input>
        </Col>
        <!-- 按钮区域 -->
        <Col :span="18" class="btn-group">
        <i-button type="default" @click="resetQuery">清空</i-button>
        <i-button type="primary" @click="searchLive">搜索</i-button>
        <i-button type="success" @click="openCreateModal">创建直播</i-button>
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
    <Modal v-model="liveFormState.createModalVisible" title="创建直播" @on-ok="handleCreateSubmit"
      @on-cancel="handleCreateCancel" :loading="modalLoading">
      <Form ref="createLiveForm" :model="createLiveForm" :rules="createLiveRules" :label-width="100">
        <!-- 直播名称 -->
        <Form-item label="直播名称" prop="liveShowName">
          <Input v-model="createLiveForm.liveShowName" placeholder="请输入直播名称" :maxlength="100" show-word-limit></Input>
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
          <div class="upload-tips">
            开始时间一小时后推流地址失效
          </div>
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
          <!-- 添加报名表勾选框 -->
          <div class="form-checkbox" style="margin-top: 10px;">
            <Checkbox v-model="liveFormState.addEnrollmentForm" @change="handleEnrollmentCheck">
              添加报名表
            </Checkbox>
          </div>

          <!-- 勾选后显示的按钮（如果已有保存的表单，显示"编辑报名表"） -->
          <div v-if="liveFormState.addEnrollmentForm" style="margin-top: 10px;">
            <i-button type="primary" @click="openEnrollmentFormPage">
              {{ enrollmentFormData ? '编辑报名表' : '添加报名表' }}
            </i-button>
          </div>
        </Form-item>
      </Form>
    </Modal>

    <!-- 推流地址详情模态框 -->
    <Modal v-model="streamUrlModalVisible" title="推流地址详情" width="800px">
      <div class="stream-url-container">
        <div class="url-item">
          <label class="url-label">RTMP 推流地址：</label>
          <div class="url-content">
            <span>{{ currentStreamUrls.pushRtmpUrl || '暂无' }}</span>
            <i-button type="text" @click="copyToClipboard(currentStreamUrls.pushRtmpUrl)"
              icon="ivu-icon-ios-copy">复制</i-button>
          </div>
        </div>
      </div>
    </Modal>
    <!-- 播流地址详情 -->
    <Modal v-model="streamUrlModal" title="播流地址详情" width="800px">
      <div class="stream-url-container">
        <div class="url-item">
          <label class="url-label">FLV 播流地址：</label>
          <div class="url-content">
            <span>{{ currentStreamUrls.pullFlvUrl || '暂无' }}</span>
            <i-button type="text" @click="toClipboard(currentId, 'flv')" icon="ivu-icon-ios-copy">跳转</i-button>
          </div>
        </div>
        <div class="url-item">
          <label class="url-label">M3U8 播流地址：</label>
          <div class="url-content">
            <span>{{ currentStreamUrls.pullM3u8Url || '暂无' }}</span>
            <i-button type="text" @click="toClipboard(currentId, 'm3u8')" icon="ivu-icon-ios-copy">跳转</i-button>
          </div>
        </div>

      </div>
    </Modal>
    <!-- 编辑直播模态框 -->
    <Modal v-model="editModalVisible" title="编辑直播" @on-ok="handleEditSubmit" @on-cancel="handleEditCancel"
      :loading="editModalLoading">
      <Form :label-width="100">
        <!-- 直播名称（不可编辑） -->
        <Form-item label="直播名称">
          <Input v-model="editLiveForm.liveShowName" disabled placeholder="直播名称"></Input>
        </Form-item>

        <!-- 直播封面（可编辑） -->
        <Form-item label="直播封面">
          <div class="cover-upload">
            <input type="file" ref="editFileInput" @change="handleEditFileSelect" accept="image/jpeg, image/png"
              style="display: none">

            <div class="upload-area" v-if="!editLiveForm.coverUrl" @click="$refs.editFileInput.click()">
              <div class="upload-icon">
                <i class="el-icon-picture-outline"></i>
              </div>
              <div class="upload-text">选择图片</div>
            </div>

            <div class="preview-area" v-else>
              <div class="preview-wrapper" @click="previewEditImage">
                <img :src="editLiveForm.coverUrl" class="preview-thumb" alt="直播封面">
                <div class="delete-icon" @click.stop="removeEditCoverImage">
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

    <!-- 图片预览模态框 -->
    <Modal v-model="previewModalVisible" title="图片预览" width="800px" class="image-preview-modal">
      <div style="text-align: center; padding: 20px;">
        <img :src="previewImageUrl" style="max-width: 100%; max-height: 60vh; border-radius: 8px;" alt="预览图片">
      </div>
      <div slot="footer">
        <i-button type="primary" @click="previewModalVisible = false">关闭</i-button>
      </div>
    </Modal>
  </div>
</template>

<script>
import { config } from '../../config'
import { mapState, mapMutations, mapActions } from 'vuex';
export default {
  name: 'LiveManage',
  data() {
    // 验证不包含中文的正则表达式
    const noChineseValidator = (rule, value, callback) => {
      // 匹配中文字符的正则表达式
      // const chineseRegex = /[\u4e00-\u9fa5]/;
      // if (chineseRegex.test(value)) {
      //   callback(new Error('直播名称不能包含中文'));
      // } else {
      callback();
      // }
    };
    return {
      self: this,
      uploading: false, // 上传状态
      // 表格数据
      tableData: [],
      currentId: '',
      total: 0,
      // 分页参数
      pageNum: 1,
      pageSize: 10,
      // 查询表单
      queryForm: {
        liveShowName: ''
      },
      imgId: '',
      // 创建直播模态框相关
      createModalVisible: false,
      modalLoading: false,
      // 创建直播表单数据
      createLiveForm: {
        liveShowName: '',       // 直播名称
        startTime: '',      // 开始时间
        coverUrl: ''        // 封面图片URL
      },
      // 推流地址模态框相关
      streamUrlModalVisible: false,
      streamUrlModal: false,
      currentStreamUrls: {
        pullFlvUrl: '',
        pullM3u8Url: '',
        pullRtmpUrl: '',
        pushRtmpUrl: ''
      },
      // 图片预览相关
      previewModalVisible: false,
      previewImageUrl: '',

      // 表单验证规则
      createLiveRules: {
        liveShowName: [
          { required: true, message: '请输入直播名称', trigger: 'blur' },
          { max: 100, message: '直播名称不能超过100个字符', trigger: 'blur' },
          { validator: noChineseValidator, trigger: 'blur' }
        ],
        startTime: [
          { required: true, message: '请选择开始时间', trigger: ['change', 'blur'] }
        ]
      },
      // 表格列配置
      tableColumns: [
        {
          title: '直播名称',
          key: 'liveShowName',
          align: 'center',
          width: 210
        },
        {
          title: '封面图',
          key: 'liveCover',
          align: 'center',
          width: 121,
          render: (h, params) => {
            const coverId = params.row.liveCover;
            if (!coverId) {
              return h('span', '无封面');
            }
            const imgUrl = `/api/sysFile/image/${coverId}`;
            return h('div', [
              h('img', {
                attrs: { src: imgUrl, alt: '封面图' },
                style: {
                  width: '60px',
                  height: '34px',
                  objectFit: 'cover',
                  cursor: 'pointer',
                  borderRadius: '4px'
                },
                on: {
                  click: () => this.previewCoverImage(imgUrl)  // 直接传递当前图片URL
                }
              })
            ]);
          }
        },
        {
          title: '创建时间',
          key: 'createTime',
          align: 'center',
          width: 150,
        },
        {
          title: '开始时间',
          key: 'startTime',
          align: 'center',
          width: 150,
        },
        {
          title: '直播状态',
          key: 'liveStatus',
          align: 'center',
          width: 110,
          render: (h, params) => {
            // 假设状态字段为status，0=未开播，1=已开播
            const status = params.row.liveStatus;
            const text = status == "0" ? "未开播" : status == "1" ? "已开播" : '未知';
            if (status === "0") {
              // 未开播 - 红色背景，白色文字
              return h('Tag', {
                props: {
                  color: 'error'
                },
                style: {
                  backgroundColor: 'rgb(174,174,174)',
                  color: '#fff',
                  borderColor: 'rgb(174,174,174)',
                  fontWeight: 'bold',
                }
              }, text);
            } else if (status === "1") {
              // 已开播 - 绿色背景，白色文字
              return h('Tag', {
                props: {
                  color: 'success'
                },
                style: {
                  backgroundColor: '#52c41a',
                  color: '#fff',
                  borderColor: '#52c41a',
                  fontWeight: 'bold',
                }
              }, text);
            }
          }
        },
        {
          title: '播流地址',
          key: 'streamUrls',
          align: 'center',
          width: 100,
          render: (h, params) => {
            const row = params.row;
            const canShow = this.canShowStreamUrl(row);

            return h('i-button', {
              props: {
                type: canShow ? 'primary' : 'default',
                size: 'small',
                disabled: !canShow
              },
              on: {
                click: () => {
                  if (canShow) {
                    this.showStream(row);
                  } else {
                    this.$Message.warning('播流地址已失效，不可查看');
                  }
                }
              }
            }, canShow ? '查看地址' : '已失效');
          }
        },
        {
          title: '推流地址',
          key: 'streamUrl',
          align: 'center',
          width: 100,
          render: (h, params) => {
            const row = params.row;
            const canShow = this.canShowStreamUrl(row);

            return h('i-button', {
              props: {
                type: canShow ? 'primary' : 'default',
                size: 'small',
                disabled: !canShow
              },
              on: {
                click: () => {
                  if (canShow) {
                    this.showStreamUrls(row);
                  } else {
                    this.$Message.warning('推流地址已失效，不可查看');
                  }
                }
              }
            }, canShow ? '查看地址' : '已失效');
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
      ],
      // 编辑直播模态框相关
      editModalVisible: false,
      editModalLoading: false,
      // 编辑直播表单数据
      editLiveForm: {
        id: '',
        liveShowName: '', // 用于回显，不可修改
        coverUrl: '' // 封面图片URL
      },
      // 编辑时的图片ID
      editImgId: '',
      addEnrollmentForm: false,
      enrollmentFormData: null, // 存储已保存的报名表配置
    };
  },
  computed: {
    ...mapState('live', ['liveFormState'])
  },
  created() {
    // 页面加载时获取直播列表
    this.getLiveList();
    // 页面加载时恢复状态
    if (this.$route.query.hasNewForm === 'true') {
      this.$Message.info('已有新增报名表');
      // 清除参数，避免刷新后重复提示
      this.$router.replace({
        query: { ...this.$route.query, hasNewForm: undefined }
      });
    }
    this.RESTORE_LIVE_FORM_STATE();
  },
  beforeRouteLeave(to, from, next) {
    // 离开页面时保存状态到Vuex和localStorage
    this.saveLiveFormState();
    next();
  },
  methods: {
    ...mapMutations('live', ['UPDATE_LIVE_FORM_STATE', 'RESTORE_LIVE_FORM_STATE']),
    ...mapActions('live', ['saveLiveFormState']),

    // 判断是否可以显示流地址
    canShowStreamUrl(row) {
      // 如果直播已开播，可以查看地址
      if (row.liveStatus === "1") {
        return true;
      }

      // 如果直播未开播，检查时间是否超过开始时间+1小时
      if (row.liveStatus === "0" && row.startTime) {
        const startTime = new Date(row.startTime).getTime();
        const currentTime = new Date().getTime();
        const oneHour = 60 * 60 * 1000; // 1小时的毫秒数

        // 如果当前时间不超过开始时间+1小时，可以查看
        return currentTime <= startTime + oneHour;
      }

      return false;
    },

    // 获取直播列表
    getLiveList() {
      const params = {
        pageNum: this.pageNum,
        pageSize: this.pageSize,
        liveShowName: this.queryForm.liveShowName || ''
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
      this.queryForm = { liveShowName: '' };
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
        liveShowName: '',
        startTime: '',
        coverUrl: ''
      };
      this.imgId = ''

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

    // 通用的图片预览方法
    previewCoverImage(imgUrl) {
      if (!imgUrl) {
        this.$Message.warning('暂无图片可预览');
        return;
      }

      this.previewImageUrl = imgUrl;
      this.previewModalVisible = true;
    },

    // 预览图片 - 创建页面
    previewImage() {
      this.previewCoverImage(this.createLiveForm.coverUrl);
    },

    // 预览图片 - 编辑页面
    previewEditImage() {
      this.previewCoverImage(this.editLiveForm.coverUrl);
    },

    // 删除已上传的图片
    removeCoverImage() {
      this.createLiveForm.coverUrl = '';
      this.imgId = '';
      // 如果需要同时删除服务器上的文件，可以调用删除接口
      this.$api.delete(this.imgId);
    },
    // 打开编辑直播模态框
    editLive(index) {
      const live = this.tableData[index];
      this.editLiveForm = {
        id: live.id,
        liveShowName: live.liveShowName, // 回显直播名称（不可修改）
        coverUrl: live.liveCover ? `/api/sysFile/image/${live.liveCover}` : ''
      };
      // 回显图片ID
      this.editImgId = live.liveCover || '';
      this.editModalVisible = true;
    },

    // 编辑时处理文件选择
    handleEditFileSelect(event) {
      const file = event.target.files[0];
      if (!file) return;

      // 复用创建时的文件校验逻辑
      const isJPG = file.type === 'image/jpeg' || file.type === 'image/png';
      if (!isJPG) {
        this.$message.error('请上传JPG或PNG格式的图片');
        return;
      }

      const isLt10M = file.size / 1024 / 1024 <= 10;
      if (!isLt10M) {
        this.$message.error('图片大小不能超过10M');
        return;
      }

      this.uploadEditFile(file);
      event.target.value = '';
    },
    // 删除直播
    deleteLive(index) {
      const live = this.tableData[index];
      this.$Modal.confirm({
        title: '确认删除',
        content: `确定要删除直播「${live.liveShowName}」吗？此操作不可撤销！`,
        onOk: () => {
          // 调用删除接口，仅传直播id
          this.$api.deleteLive(live.id)
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
    // 上传编辑的图片
    uploadEditFile(file) {
      this.uploading = true;
      const formData = new FormData();
      formData.append('file', file);

      this.$api.upload(formData)
        .then(res => {
          if (res.code === 200) {
            this.editImgId = res.data.id;
            this.editLiveForm.coverUrl = `/api/sysFile/image/${this.editImgId}`;
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

    // 编辑时删除图片
    removeEditCoverImage() {
      this.editLiveForm.coverUrl = '';
      this.editImgId = '';
    },
    // 处理复选框变化
    handleEnrollmentCheck(checked) {
      // 更新Vuex中的状态
      this.UPDATE_LIVE_FORM_STATE({
        addEnrollmentForm: checked
      });
    },
    openEnrollmentFormPage() {
      // 跳转时携带当前直播ID（如果需要关联具体直播）
      this.$router.push({
        path: '/enrollment-form',
        query: { liveId: this.currentLiveId } // 假设当前直播ID为currentLiveId
      });
    },
    // 提交编辑表单
    handleEditSubmit() {
      this.editModalLoading = true;
      const param = {
        id: this.editLiveForm.id,
        liveShowName: this.editLiveForm.liveShowName, // 虽不可编辑但需传给接口
        liveCover: this.editImgId
      };
      this.$api.updateLive(param)
        .then(res => {
          if (res.code === 200) {
            this.$Message.success('编辑直播成功');
            this.editModalVisible = false;
            this.getLiveList(); // 刷新列表
          } else {
            this.$Message.error('编辑失败：' + res.message);
          }
        })
        .catch(err => {
          console.error('编辑直播接口报错：', err);
          this.$Message.error('网络错误，请重试');
        })
        .finally(() => {
          this.editModalLoading = false;
        });
    },

    // 取消编辑
    handleEditCancel() {
      this.editModalVisible = false;
      this.editLiveForm = { id: '', liveShowName: '', coverUrl: '' };
      this.editImgId = '';
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
      this.$refs.createLiveForm.validate(valid => {
        if (valid) {

          if (this.createLiveForm.liveShowName && this.createLiveForm.startTime) {
            const { tableFormat } = this.liveFormState;
            const param = {
              liveShowName: this.createLiveForm.liveShowName,
              startTime: this.createLiveForm.startTime,
              liveCover: this.imgId,      // 原有的直播信息参数
              tableFormat: tableFormat // 新增的表单配置字段
            };
            console.log('打印下', param)
            this.modalLoading = true;
            // this.$api.addLive(param)
            //   .then(res => {
            //     if (res.code === 200) {
            //       this.$Message.success('创建直播成功');
            //       this.createModalVisible = false;
            //       this.getLiveList(); // 刷新列表
            //     } else {
            //       this.$Message.error('创建失败：' + res.message);
            //     }
            //   })
            //   .catch(err => {
            //     console.error('创建直播接口报错：', err);
            //     this.$Message.error('网络错误，请重试');
            //   })
            //   .finally(() => {
            //     this.modalLoading = false;
            //   });
          } else {
            this.$Message.error('请填写必填项');
          }
        } else {
          this.$Message.error('请检查填写项');
        }
      });
    },

    // 显示推流地址详情
    showStreamUrls(row) {
      // 先检查是否可以显示
      if (!this.canShowStreamUrl(row)) {
        this.$Message.warning('推流地址已失效，不可查看');
        return;
      }

      // 赋值当前直播的推流地址
      this.currentStreamUrls = {
        pushRtmpUrl: row.pushRtmpUrl || ''
      };
      // 打开模态框
      this.streamUrlModalVisible = true;
    },
    // 显示播流地址详情
    showStream(row) {
      this.currentId = row.id
      // 先检查是否可以显示
      if (!this.canShowStreamUrl(row)) {
        this.$Message.warning('播流地址已失效，不可查看');
        return;
      }

      // 赋值当前直播的播流地址
      this.currentStreamUrls = {
        pullFlvUrl: row.pullFlvUrl || '',
        pullM3u8Url: row.pullM3u8Url || ''
      };
      // 打开模态框
      this.streamUrlModal = true;
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
    },

    // 跳转播流地址 通过id传入调接口获取
    toClipboard(id, type) {
      // 判断流类型
      // const isM3u8 = streamUrl.includes('.m3u8');
      // const paramName = isM3u8 ? 'm3u8' : 'flv';

      // 构建播放器URL
      const playerUrl = `${config.playerBaseUrl}/?id=${id}&type=${type}`;

      // 在新标签页打开
      window.open(playerUrl, '_blank');
    },
    // 打开创建弹框
    openCreateModal() {
      // 更新Vuex状态，显示弹框
      this.UPDATE_LIVE_FORM_STATE({
        createModalVisible: true
      });
    },

    // 关闭创建弹框
    closeCreateModal() {
      this.UPDATE_LIVE_FORM_STATE({
        createModalVisible: false
      });
    }
  },
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

/* 图片预览模态框样式 */
.image-preview-modal>>>.ivu-modal-body {
  padding: 0;
}
</style>