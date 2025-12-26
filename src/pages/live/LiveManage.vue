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

    <!-- 创建/编辑直播模态框 - 改造为标签页形式 -->
    <Modal v-model="liveFormState.createModalVisible" :title="isEditMode ? '修改直播' : '创建直播'" @on-ok="handleFormSubmit"
      @on-cancel="handleCreateCancel" :loading="modalLoading" width="1000">
      <!-- 标签页组件 -->
      <Tabs v-model="activeTab">
        <TabPane name="tab1" label="直播信息"></TabPane>
        <TabPane name="tab2" label="报名表设置" :disabled="liveFormState.addEnrollmentForm ? false : true"></TabPane>
      </Tabs>
      <!-- 标签页内容 -->
      <div v-show="activeTab === 'tab1'">
        <Form ref="liveForm" :model="currentLiveForm" :rules="createLiveRules" :label-width="100">
          <!-- 直播名称 -->
          <Form-item label="直播名称" prop="liveShowName">
            <Input v-model="currentLiveForm.liveShowName" placeholder="请输入直播名称" :maxlength="100" show-word-limit
              :disabled="isEditMode"></Input>
          </Form-item>
          <!-- 开始时间 -->
          <Form-item label="开始时间" prop="startTime">
            <DatePicker type="datetime" v-model="currentLiveForm.startTime" placeholder="选择日期和时间"
              @on-change="handleDatePicker" format="yyyy-MM-dd HH:mm:ss" style="width: 100%" :options="{
                disabledDate(date) {
                  // 禁止选择过去的时间
                  return date && date.valueOf() < Date.now() - 86400000;
                }
              }" :disabled="isEditMode">
            </DatePicker>
            <div class="upload-tips">
              开始时间一小时后推流地址失效
            </div>
          </Form-item>

          <!-- 直播封面 -->
          <Form-item label="直播封面" prop="liveCover">
            <div class="cover-upload">
              <!-- 手动文件选择 -->
              <!-- <input type="file" :ref="isEditMode ? 'editFileInput' : 'fileInput'"
                @change="isEditMode ? handleEditFileSelect : handleFileSelect" accept="image/jpeg, image/png"
                style="display: none"> -->
              <input type="file" ref="fileInput" @change="handleFileSelect" accept="image/jpeg, image/png"
                style="display: none" v-if="!isEditMode">
              <!-- 编辑模式的文件输入框 -->
              <input type="file" ref="editFileInput" @change="handleEditFileSelect" accept="image/jpeg, image/png"
                style="display: none" v-if="isEditMode">
              <!-- 上传区域：有图片时显示缩略图，无图片时显示上传图标 -->
              <div class="upload-area" v-if="!currentLiveForm.liveCover"
                @click="$refs[isEditMode ? 'editFileInput' : 'fileInput'].click()">
                <div class="upload-icon">
                  <i class="el-icon-picture-outline"></i>
                </div>
                <div class="upload-text">选择图片</div>
              </div>
              <!-- 预览区域：有图片时显示 -->
              <div class="preview-area" v-else>
                <div class="preview-wrapper" @click="previewImage">
                  <img :src="currentLiveForm.liveCover" class="preview-thumb" alt="直播封面">
                  <!-- 删除图标 -->
                  <div class="delete-icon" @click.stop="isEditMode ? removeEditCoverImage : removeCoverImage">
                    <i class="el-icon-close"></i>
                  </div>
                </div>
              </div>
            </div>

            <div class="upload-tips">
              推荐图片尺寸为: 1000×562，支持 JPG、PNG 格式，图片大小不超过 10M
            </div>

            <!-- 添加报名表勾选框 -->
            <div class="form-checkbox" style="margin-top: 10px;" v-if="!isEditMode">
              <Checkbox v-model="liveFormState.addEnrollmentForm" @change="handleEnrollmentCheck">
                添加报名表
              </Checkbox>
            </div>
          </Form-item>
        </Form>
      </div>
      <!-- 报名表设置标签页内容 -->
      <div v-show="activeTab === 'tab2'" class="enrollment-form">
        <!-- 左中右三栏布局 -->
        <Row :gutter="20" class="form-layout">
          <!-- 左侧：组件添加区 -->
          <Col :span="6" class="form-column">
          <div class="column-title">添加组件</div>
          <div class="component-group">
            <h3>联系人组件</h3>
            <div class="component-list">
              <i-button type="default" @click="addField('name')">姓名</i-button>
              <i-button type="default" @click="addField('phone')">电话</i-button>
              <i-button type="default" @click="addField('gender')">性别</i-button>
              <i-button type="default" @click="addField('age')">年龄</i-button>
              <i-button type="default" @click="addField('birthday')">出生年月</i-button>
              <i-button type="default" @click="addField('email')">邮箱</i-button>
              <i-button type="default" @click="addField('idCard')">身份证</i-button>
            </div>
          </div>
          <div class="component-group">
            <h3>自定义组件</h3>
            <div class="component-list">
              <i-button type="default" @click="addField('text')">文本框</i-button>
            </div>
          </div>
          </Col>
          <!-- 中间：已选字段与预览区 -->
          <Col :span="8" class="form-column">
          <div class="column-title">已选字段预览</div>
          <div class="preview-list">
            <div v-for="(field, index) in tableFormat" :key="index"
              :class="['preview-item', { 'active': currentIndex === index }]" @click="selectField(index)">
              <div class="field-header">
                <!-- 必填星号 + 纯文本序号 -->
                <span class="required-star" v-if="field.required">*</span>
                <span class="field-number">{{ (index + 1).toString().padStart(2, '0') }}</span>
                <span class="field-name">{{ field.name }}</span>
                <i-button type="error" size="small" @click.stop="removeField(index)" icon="ios-trash"></i-button>
              </div>
              <div class="field-content">
                <!-- 性别预览：禁用的单选框，一行显示 -->
                <template v-if="field.type === 'gender'">
                  <Radio-group class="gender-radio-group">
                    <Radio label="male" disabled>男</Radio>
                    <Radio label="female" disabled>女</Radio>
                  </Radio-group>
                </template>
                <template v-else-if="field.type === 'birthday'">
                  <Date-picker type="date" :placeholder="field.placeholder" disabled></Date-picker>
                </template>
                <template v-else>
                  <Input :placeholder="field.placeholder" disabled></Input>
                </template>
              </div>
            </div>
            <div v-if="tableFormat.length === 0" class="empty-tip">
              暂无字段，请从左侧添加
            </div>
          </div>
          </Col>

          <!-- 右侧：编辑区 -->
          <Col :span="10" class="form-column">
          <div class="column-title">字段属性配置</div>

          <div class="edit-section" v-if="currentIndex !== -1">
            <Form :model="currentField" :label-width="75" class="edit-form">
              <Form-item label="控件名称">
                <Input v-model="currentField.name" :disabled="isContactField(currentField.type)"
                  placeholder="请输入控件名称"></Input>
              </Form-item>

              <!-- 非性别字段：提示信息输入框 -->
              <Form-item label="提示信息" v-if="currentField.type !== 'gender'">
                <Input v-model="currentField.placeholder" placeholder="请输入提示信息"></Input>
              </Form-item>

              <!-- 性别字段：选项配置（一行显示禁用的input） -->
              <Form-item label="选项配置" v-if="currentField.type === 'gender'">
                <div class="gender-option-inputs">
                  <div class="option-item">
                    <span>选项A：</span>
                    <Input v-model="genderOptions.male" disabled :readonly="true" style="width: 80px;" />
                  </div>
                  <div class="option-item">
                    <span>选项B：</span>
                    <Input v-model="genderOptions.female" disabled :readonly="true" style="width: 80px;" />
                  </div>
                </div>
              </Form-item>

              <!-- 是否必填：改用i-switch，开关在前+文字“必填” -->
              <Form-item label="必填设置">
                <div class="required-switch-wrap">
                  <i-switch v-model="currentField.required" @on-change="handleRequiredChange"></i-switch>
                  <span class="required-text">必填</span>
                </div>
              </Form-item>
            </Form>
          </div>
          <div v-else class="edit-placeholder">
            请从中间选择一个字段进行配置
          </div>
          </Col>
        </Row>
      </div>
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
      callback();
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
      // 标签页状态
      activeTab: 'tab1',
      isEditMode: false,
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
      modalLoading: false,
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
                  click: () => this.previewCoverImage(imgUrl)
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
            const status = params.row.liveStatus;
            const text = status == "0" ? "未开播" : status == "1" ? "已开播" : '未知';
            if (status === "0") {
              return h('Tag', {
                props: { color: 'error' },
                style: {
                  backgroundColor: 'rgb(174,174,174)',
                  color: '#fff',
                  borderColor: 'rgb(174,174,174)',
                  fontWeight: 'bold',
                }
              }, text);
            } else if (status === "1") {
              return h('Tag', {
                props: { color: 'success' },
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
      // 直播表单数据 (创建和编辑共用)
      currentLiveForm: {
        id: '',
        liveShowName: '',
        startTime: '',
        liveCover: ''
      },
      // 编辑时的图片ID
      editImgId: '',
      // 报名表相关数据
      tableFormat: [],
      currentIndex: -1,
      currentField: {},
      genderOptions: {
        male: '男',
        female: '女'
      }
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
  watch: {
    currentIndex(newVal) {
      if (newVal !== -1) {
        this.currentField = JSON.parse(JSON.stringify(this.tableFormat[newVal]));
        // 初始化必填状态（防止undefined）
        if (this.currentField.required === undefined) {
          this.currentField.required = true; // 默认必填
        }
      }
    },
    // 实时同步当前编辑字段到列表中
    currentField: {
      handler(newVal) {
        if (this.currentIndex !== -1 && this.tableFormat[this.currentIndex]) {
          this.tableFormat[this.currentIndex] = { ...newVal };
        }
      },
      deep: true
    }
  },
  methods: {
    ...mapMutations('live', ['UPDATE_LIVE_FORM_STATE', 'RESTORE_LIVE_FORM_STATE']),
    ...mapActions('live', ['saveLiveFormState']),

    // 判断是否为联系人字段（非自定义文本框）
    isContactField(type) {
      return ['name', 'phone', 'gender', 'age', 'birthday', 'email', 'idCard'].includes(type);
    },

    // 添加表单字段
    addField(type) {
      const fieldConfig = {
        name: { type: 'name', name: '姓名', placeholder: '请输入姓名', required: true },
        phone: { type: 'phone', name: '电话', placeholder: '请输入手机号码', required: true },
        gender: { type: 'gender', name: '性别', required: true },
        age: { type: 'age', name: '年龄', placeholder: '请输入年龄', required: true },
        birthday: { type: 'birthday', name: '出生年月', placeholder: '请选择出生年月', required: true },
        email: { type: 'email', name: '邮箱', placeholder: '请输入邮箱地址', required: true },
        idCard: { type: 'idCard', name: '身份证', placeholder: '请输入身份证号', required: true },
        text: { type: 'text', name: `自定义文本框`, placeholder: '请输入内容', required: true }
      };

      // 联系人组件只能添加一次
      if (type !== 'text') {
        const isExist = this.tableFormat.some(field => field.type === type);
        if (isExist) {
          this.$Message.warning(`${fieldConfig[type].name}只能添加一次`);
          return;
        }
      }

      this.tableFormat.push({ ...fieldConfig[type] });
      this.$Message.success('添加成功');
    },

    // 选择字段
    selectField(index) {
      this.currentIndex = index;
    },

    // 移除字段
    removeField(index) {
      this.$Modal.confirm({
        title: '确认删除',
        content: `确定要删除【${this.tableFormat[index].name}】吗？`,
        onOk: () => {
          // 如果删除的是当前选中项，重置编辑状态
          if (this.currentIndex === index) {
            this.currentIndex = -1;
            this.currentField = {};
          } else if (this.currentIndex > index) {
            // 调整选中索引
            this.currentIndex--;
          }
          this.tableFormat.splice(index, 1);
          this.$Message.success('删除成功');
        }
      });
    },

    // 必填开关变化事件
    handleRequiredChange(checked) {
      this.currentField.required = checked;
    },

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
    // 处理日期选择
    handleDatePicker(time) {
      this.currentLiveForm.startTime = time;
      // 手动触发表单验证
      this.$refs.liveForm.validateField('startTime');
    },
    // 处理文件选择
    handleFileSelect(event) {
      const file = event.target.files[0];
      if (!file) return;

      // 校验文件类型
      const isJPG = file.type === 'image/jpeg' || file.type === 'image/png';
      if (!isJPG) {
        this.$Message.error('请上传JPG或PNG格式的图片');
        return;
      }

      // 校验文件大小（10M）
      const isLt10M = file.size / 1024 / 1024 <= 10;
      if (!isLt10M) {
        this.$Message.error('图片大小不能超过10M');
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
            this.currentLiveForm.liveCover = `/api/sysFile/image/${this.imgId}`;
          } else {
            this.$Message.error('图片上传失败: ' + (res.message || '未知错误'));
          }
        })
        .catch(err => {
          console.error('上传错误:', err);
          this.$Message.error('图片上传失败，请重试');
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

    // 预览图片
    previewImage() {
      this.previewCoverImage(this.currentLiveForm.liveCover);
    },

    // 删除已上传的图片
    removeCoverImage() {
      this.currentLiveForm.liveCover = '';
      this.imgId = '';
      // 如果需要同时删除服务器上的文件，可以调用删除接口
      this.$api.delete(this.imgId);
    },

    // 编辑时删除图片
    removeEditCoverImage() {
      this.currentLiveForm.liveCover = '';
      this.editImgId = '';
    },

    // 打开编辑直播模态框
    editLive(index) {
      const live = this.tableData[index];
      this.isEditMode = true;
      this.activeTab = 'tab1';
      this.currentLiveForm = {
        id: live.id,
        liveShowName: live.liveShowName,
        startTime: live.startTime,
        liveCover: live.liveCover ? `/api/sysFile/image/${live.liveCover}` : ''
      };
      // 回显图片ID
      this.editImgId = live.liveCover || '';
      // 回显报名表数据
      this.liveFormState.addEnrollmentForm = live.hasEnrollment || false;
      this.tableFormat = live.enrollmentForm && live.enrollmentForm.tableFormat || [];
      // 打开模态框
      this.UPDATE_LIVE_FORM_STATE({
        createModalVisible: true
      });
    },

    // 编辑时处理文件选择
    handleEditFileSelect(event) {
      const file = event.target.files[0];
      if (!file) return;

      // 复用创建时的文件校验逻辑
      const isJPG = file.type === 'image/jpeg' || file.type === 'image/png';
      if (!isJPG) {
        this.$Message.error('请上传JPG或PNG格式的图片');
        return;
      }

      const isLt10M = file.size / 1024 / 1024 <= 10;
      if (!isLt10M) {
        this.$Message.error('图片大小不能超过10M');
        return;
      }

      this.uploadEditFile(file);
      event.target.value = '';
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
            this.currentLiveForm.liveCover = `/api/sysFile/image/${this.editImgId}`;
          } else {
            this.$Message.error('图片上传失败: ' + (res.message || '未知错误'));
          }
        })
        .catch(err => {
          console.error('上传错误:', err);
          this.$Message.error('图片上传失败，请重试');
        })
        .finally(() => {
          this.uploading = false;
        });
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

    // 处理复选框变化
    handleEnrollmentCheck(checked) {
      // 更新Vuex中的状态
      this.UPDATE_LIVE_FORM_STATE({
        addEnrollmentForm: checked
      });
      if (checked && this.tableFormat.length === 0) {
        // 默认添加一个字段
        this.addField('name');
      }
    },

    // 表单提交处理（创建和编辑共用）
    handleFormSubmit() {
      this.$refs.liveForm.validate(valid => {
        if (valid) {
          this.modalLoading = true;
          if (this.liveFormState.addEnrollmentForm && this.tableFormat.length === 0) {
            this.$Message.warning('报名表请至少添加一个字段');
            return;
          }
          // 准备提交的数据
          const { id, ...currentLiveFormWithoutId } = this.currentLiveForm;
          const submitData = {
            ...currentLiveFormWithoutId,
            liveCover: this.isEditMode ? this.editImgId : this.imgId,
            hasEnrollment: this.liveFormState.addEnrollmentForm,
            tableFormat: this.tableFormat
          };
          console.log('submit', submitData)
          // 调用API保存数据
          const apiMethod = this.isEditMode ? this.$api.updateLive : this.$api.addLive;
          console.log('接口', apiMethod)
          // apiMethod(submitData)
          //   .then(res => {
          //     if (res.code === 200) {
          //       this.$Message.success(this.isEditMode ? '修改成功' : '创建成功');
          //       this.UPDATE_LIVE_FORM_STATE({
          //         createModalVisible: false
          //       });
          //       this.getLiveList(); // 重新加载列表
          //     } else {
          //       this.$Message.error(res.message || '操作失败');
          //     }
          //   })
          //   .catch(err => {
          //     console.error('操作失败', err);
          //     this.$Message.error('网络错误，请重试');
          //   })
          //   .finally(() => {
          //     this.modalLoading = false;
          //   });
        } else {
          this.$Message.error('请检查填写项');
        }
      });
    },

    // 取消创建/编辑
    handleCreateCancel() {
      this.UPDATE_LIVE_FORM_STATE({
        createModalVisible: false
      });
      this.isEditMode = false;
      this.activeTab = 'tab1';
      this.$refs.liveForm && this.$refs.liveForm.resetFields();
      // 清空表单数据
      this.currentLiveForm = {
        id: '',
        liveShowName: '',
        startTime: '',
        liveCover: ''
      };
      this.imgId = '';
      this.editImgId = '';
      this.tableFormat = [];
      this.currentIndex = -1;
      this.currentField = {};
      this.uploading = false;
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
      // 构建播放器URL
      const playerUrl = `${config.playerBaseUrl}/?id=${id}&type=${type}`;
      // 在新标签页打开
      window.open(playerUrl, '_blank');
    },

    // 打开创建弹框
    openCreateModal() {
      this.isEditMode = false;
      this.activeTab = 'tab1';
      // 重置表单数据
      this.currentLiveForm = {
        id: '',
        liveShowName: '',
        startTime: '',
        liveCover: ''
      };
      this.imgId = '';
      this.tableFormat = [];
      this.currentIndex = -1;
      this.currentField = {};
      // 更新Vuex状态，显示弹框
      this.UPDATE_LIVE_FORM_STATE({
        createModalVisible: true,
        addEnrollmentForm: false
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

/* 
::v-deep .ivu-modal {
  top: 50% !important;
  transform: translateY(-50%) !important;
  margin-top: 0 !important;
} */

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

/* 报名表样式 */
.enrollment-form {
  padding: 10px 0;
}

.form-header {
  margin-bottom: 15px;
  border-bottom: 1px solid #eee;
  padding-bottom: 10px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.form-layout {
  height: 450px;
  box-sizing: border-box;
}

.form-column {
  background-color: #f5f7f9;
  border-radius: 4px;
  padding: 15px;
  height: 100%;
  overflow-y: auto;
  box-sizing: border-box;
  padding-bottom: 20px;
}

.column-title {
  font-size: 16px;
  font-weight: bold;
  margin-bottom: 15px;
  padding-bottom: 8px;
  border-bottom: 1px solid #e9e9e9;
}

.component-group {
  margin-bottom: 25px;
}

.component-list {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  margin-top: 10px;
}

.preview-list {
  margin-top: 10px;
  padding-bottom: 30px;
}

.preview-item {
  background-color: #fff;
  border-radius: 4px;
  margin-bottom: 15px;
  padding: 15px;
  cursor: pointer;
  transition: all 0.2s;
  position: relative;
  border: 1px solid transparent;
}

.preview-item.active {
  border-color: #2d8cf0;
  background-color: #f0f7ff;
}

.field-header {
  display: flex;
  align-items: center;
  margin-bottom: 10px;
}

/* 必填星号样式 */
.required-star {
  color: #f5222d;
  font-weight: bold;
  margin-right: 2px;
  font-size: 16px;
}

.field-number {
  margin-right: 10px;
  font-size: 14px;
  color: #333;
}

.field-name {
  flex: 1;
  font-weight: 500;
}

.field-content {
  padding-left: 24px;
}

/* 性别预览单选框样式（一行显示） */
.gender-radio-group {
  display: flex;
  gap: 20px;
  align-items: center;
}

.empty-tip {
  text-align: center;
  padding: 40px 15px;
  color: #888;
  font-size: 14px;
  background-color: #fff;
  border-radius: 4px;
}

.edit-section {
  background-color: #fff;
  padding: 15px;
  border-radius: 4px;
  margin-top: 10px;
  margin-bottom: 20px;
}

/* 性别选项配置：一行显示两个input */
.gender-option-inputs {
  display: flex;
  gap: 20px;
  align-items: center;
}

.option-item {
  display: flex;
  align-items: center;
  gap: 5px;
}

/* 必填开关样式：开关在前 + 文字对齐 */
.required-switch-wrap {
  display: flex;
  align-items: center;
  gap: 10px;
}

.required-text {
  font-size: 14px;
  color: #333;
}

.edit-placeholder {
  background-color: #fff;
  padding: 80px 15px;
  border-radius: 4px;
  margin-top: 10px;
  text-align: center;
  color: #888;
  margin-bottom: 20px;
}

.edit-form {
  margin-top: 10px;
}

/* 滚动条优化，避免遮挡 */
::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}

::-webkit-scrollbar-thumb {
  border-radius: 3px;
  background: #ccc;
}

::-webkit-scrollbar-track {
  background: #f5f7f9;
}
</style>