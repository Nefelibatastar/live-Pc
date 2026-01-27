<!-- 创建/编辑直播弹框 -->
<!-- LiveManage/components/CreateEditLiveModal.vue -->
<template>
  <Modal v-model="modalVisible" :title="isEditMode ? '修改直播' : '创建直播'" @on-ok="handleFormSubmit"
    @on-cancel="handleCreateCancel" :loading="modalLoading" width="1000">
    <!-- 标签页组件 -->
    <Tabs v-model="activeTab">
      <TabPane name="tab1" label="直播信息"></TabPane>
      <TabPane name="tab2" label="报名表设置" :disabled="!addEnrollmentForm"></TabPane>
    </Tabs>

    <!-- 标签页内容 -->
    <div v-show="activeTab === 'tab1'">
      <Form ref="liveForm" :model="currentLiveForm" :rules="liveRules" :label-width="100">
        <!-- 直播名称 - 允许修改 -->
        <Form-item label="直播名称" prop="liveShowName">
          <Input v-model="currentLiveForm.liveShowName" placeholder="请输入直播名称" :maxlength="100" show-word-limit>
          </Input>
        </Form-item>
        <!-- 开始时间 - 禁止修改 -->
        <Form-item label="开始时间" prop="startTime">
          <DatePicker type="datetime" v-model="currentLiveForm.startTime" placeholder="选择日期和时间"
            format="yyyy-MM-dd HH:mm:ss" value-format="yyyy-MM-dd HH:mm:ss" style="width: 100%" :options="{
              disabledDate(date) {
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
            <input type="file" ref="fileInput" @change="handleFileSelect" accept="image/jpeg, image/png"
              style="display: none" v-if="!isEditMode">
            <input type="file" ref="editFileInput" @change="handleEditFileSelect" accept="image/jpeg, image/png"
              style="display: none" v-if="isEditMode">
            <div class="upload-area" v-if="!currentLiveForm.liveCover"
              @click="$refs[isEditMode ? 'editFileInput' : 'fileInput'].click()">
              <div class="upload-icon">
                <i class="el-icon-picture-outline"></i>
              </div>
              <div class="upload-text">选择图片</div>
            </div>
            <div class="preview-area" v-else>
              <div class="preview-wrapper" @click="$emit('preview-image')">
                <img :src="currentLiveForm.liveCover" class="preview-thumb" alt="直播封面">
                <div class="delete-icon" @click.stop="isEditMode ? removeEditCoverImage : removeCoverImage">
                  <i class="el-icon-close"></i>
                </div>
              </div>
            </div>
          </div>

          <div class="upload-tips">
            推荐图片尺寸为: 1000×562，支持 JPG、PNG 格式，图片大小不超过 10M
          </div>

          <!-- 报名表勾选 - 编辑模式也可修改 -->
          <div class="form-checkbox" style="margin-top: 10px;">
            <Checkbox v-model="addEnrollmentForm" @change="handleEnrollmentCheck">
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
              <span class="required-star" v-if="field.required">*</span>
              <span class="field-number">{{ (index + 1).toString().padStart(2, '0') }}</span>
              <span class="field-name">{{ field.name }}</span>
              <i-button type="error" size="small" @click.stop="removeField(index)" icon="ios-trash"></i-button>
            </div>
            <div class="field-content">
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

            <Form-item label="提示信息" v-if="currentField.type !== 'gender'">
              <Input v-model="currentField.placeholder" placeholder="请输入提示信息"></Input>
            </Form-item>

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
</template>

<script>
import { mapState, mapMutations, mapActions } from 'vuex';

export default {
  name: 'CreateEditLiveModal',
  props: {
    visible: {
      type: Boolean,
      default: false
    },
    isEditMode: {
      type: Boolean,
      default: false
    },
    liveData: {
      type: Object,
      default: () => ({})
    }
  },
  data() {
    const noChineseValidator = (rule, value, callback) => {
      callback();
    };

    return {
      modalVisible: false,
      modalLoading: false,
      activeTab: 'tab1',
      uploading: false,
      imgId: '',
      editImgId: '',
      tableFormat: [],
      currentIndex: -1,
      currentField: {},
      genderOptions: {
        male: '男',
        female: '女'
      },
      currentLiveForm: {
        id: '',
        liveShowName: '',
        startTime: '',
        liveCover: ''
      },
      liveRules: {
        liveShowName: [
          { required: true, message: '请输入直播名称', trigger: 'blur' },
          { max: 100, message: '直播名称不能超过100个字符', trigger: 'blur' },
          { validator: noChineseValidator, trigger: 'blur' }
        ],
        startTime: [
          {
            required: true,
            message: '请选择开始时间',
            trigger: ['change', 'blur'],
            validator: (rule, value, callback) => {
              if (this.isEditMode) {
                callback();
              } else if (value) {
                callback();
              } else {
                callback(new Error('请选择开始时间'));
              }
            }
          }
        ]
      }
    };
  },
  created() {
    // 组件创建时初始化
    this.initData();
  },
  computed: {
    ...mapState('live', ['liveFormState']),
    addEnrollmentForm: {
      get() {
        return this.liveFormState.addEnrollmentForm;
      },
      set(value) {
        this.UPDATE_LIVE_FORM_STATE({ addEnrollmentForm: value });
      }
    }
  },
  watch: {
    visible(val) {
      this.modalVisible = val;
      // 当弹框显示时，根据模式初始化数据
      if (val) {
        this.$nextTick(() => {
          if (this.isEditMode && this.liveData && Object.keys(this.liveData).length > 0) {
            this.setEditData(this.liveData);
          } else if (!this.isEditMode) {
            this.resetForm();
          }
        });
      }
    },
    liveData: {
      handler(val) {
        // 只有当弹框显示且是编辑模式时才设置数据
        if (this.modalVisible && this.isEditMode && val && Object.keys(val).length > 0) {
          this.setEditData(val);
        }
      },
      deep: true,
      immediate: true
    },
    modalVisible(val) {
      this.$emit('update:visible', val);
      if (!val) {
        // 延迟重置，避免影响下一次打开
        setTimeout(() => {
          this.resetForm();
        }, 300);
      }
    },
    currentIndex(newVal) {
      if (newVal !== -1) {
        this.currentField = JSON.parse(JSON.stringify(this.tableFormat[newVal]));
        if (this.currentField.required === undefined) {
          this.currentField.required = true;
        }
      }
    },
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
    initData() {
      // 如果是编辑模式且已有数据，直接设置
      if (this.isEditMode && this.liveData && Object.keys(this.liveData).length > 0) {
        this.setEditData(this.liveData);
      }
    },

    setEditData(live) {
      console.log('设置编辑数据:', live); // 添加日志调试

      if (!live || Object.keys(live).length === 0) {
        console.warn('编辑数据为空');
        return;
      }

      // 重置当前表单状态
      this.currentLiveForm = {
        id: live.id || '',
        liveShowName: live.liveShowName || '',
        startTime: live.startTime || '',
        liveCover: live.liveCover ? `/api/sysFile/image/${live.liveCover}` : ''
      };

      this.editImgId = live.liveCover || '';

      // 重置 Vuex 状态
      this.UPDATE_LIVE_FORM_STATE({
        addEnrollmentForm: live.isEntryFrom === '1'
      });

      // 设置报名表数据
      try {
        if (live.entryFromData) {
          // 确保是数组且深拷贝
          this.tableFormat = Array.isArray(live.entryFromData)
            ? JSON.parse(JSON.stringify(live.entryFromData))
            : [];
        } else {
          this.tableFormat = [];
        }
      } catch (error) {
        console.error('解析报名表数据失败:', error);
        this.tableFormat = [];
      }

      this.currentIndex = -1;
      this.currentField = {};

      console.log('设置后的数据:', this.currentLiveForm, this.tableFormat);
    },
    setEditData(live) {
      this.activeTab = 'tab1';
      this.currentLiveForm = {
        id: live.id,
        liveShowName: live.liveShowName,
        startTime: live.startTime,
        liveCover: live.liveCover ? `/api/sysFile/image/${live.liveCover}` : ''
      };
      this.editImgId = live.liveCover || '';
      this.UPDATE_LIVE_FORM_STATE({ addEnrollmentForm: live.isEntryFrom === '1' });
      this.tableFormat = live.entryFromData && JSON.parse(JSON.stringify(live.entryFromData)) || [];
    },

    resetForm() {
      console.log('重置表单');

      // 只重置必要的数据，保留 Vuex 状态
      this.activeTab = 'tab1';
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

      // 重置表单验证
      if (this.$refs.liveForm) {
        this.$refs.liveForm.resetFields();
      }
    },

    isContactField(type) {
      return ['name', 'phone', 'gender', 'age', 'birthday', 'email', 'idCard'].includes(type);
    },

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

    selectField(index) {
      this.currentIndex = index;
    },

    removeField(index) {
      this.$Modal.confirm({
        title: '确认删除',
        content: `确定要删除【${this.tableFormat[index].name}】吗？`,
        onOk: () => {
          if (this.currentIndex === index) {
            this.currentIndex = -1;
            this.currentField = {};
          } else if (this.currentIndex > index) {
            this.currentIndex--;
          }
          this.tableFormat.splice(index, 1);
          this.$Message.success('删除成功');
        }
      });
    },

    handleRequiredChange(checked) {
      this.currentField.required = checked;
    },

    handleFileSelect(event) {
      const file = event.target.files[0];
      if (!file) return;

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

      this.uploadFile(file);
      event.target.value = '';
    },

    uploadFile(file) {
      this.uploading = true;
      const formData = new FormData();
      formData.append('file', file);

      this.$api.upload(formData)
        .then(res => {
          if (res.code === 200) {
            this.imgId = res.data.id;
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

    handleEditFileSelect(event) {
      const file = event.target.files[0];
      if (!file) return;

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

    removeCoverImage() {
      this.currentLiveForm.liveCover = '';
      this.imgId = '';
      this.$api.delete(this.imgId);
    },

    removeEditCoverImage() {
      this.currentLiveForm.liveCover = '';
      this.editImgId = '';
    },

    handleEnrollmentCheck(checked) {
      this.UPDATE_LIVE_FORM_STATE({ addEnrollmentForm: checked });
      if (!checked) {
        this.tableFormat = [];
        this.currentIndex = -1;
        this.currentField = {};
      } else if (this.tableFormat.length === 0) {
        this.addField('name');
      }
    },

    handleFormSubmit() {
      this.$refs.liveForm.validate(valid => {
        if (valid) {
          if (!this.currentLiveForm.startTime) {
            this.$Message.error('请选择开始时间');
            return;
          }

          // 添加时间验证 - 不能选择当前时间之前的时间
          if (!this.isEditMode) {
            const selectedTime = new Date(this.currentLiveForm.startTime).getTime();
            const currentTime = new Date().getTime();

            if (selectedTime < currentTime) {
              this.$Message.error('开始时间不能早于当前时间');
              return;
            }
          }

          if (this.addEnrollmentForm && this.tableFormat.length === 0) {
            this.$Message.warning('报名表请至少添加一个字段');
            return;
          }

          this.modalLoading = true;

          const formatStartTime = (time) => {
            if (time instanceof Date) {
              const year = time.getFullYear();
              const month = String(time.getMonth() + 1).padStart(2, '0');
              const day = String(time.getDate()).padStart(2, '0');
              const hours = String(time.getHours()).padStart(2, '0');
              const minutes = String(time.getMinutes()).padStart(2, '0');
              const seconds = String(time.getSeconds()).padStart(2, '0');
              return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
            }
            return time;
          };

          let processedLiveForm;
          if (this.isEditMode) {
            processedLiveForm = {
              ...this.currentLiveForm,
              startTime: formatStartTime(this.currentLiveForm.startTime)
            };
          } else {
            const { id, ...rest } = this.currentLiveForm;
            processedLiveForm = {
              ...rest,
              startTime: formatStartTime(rest.startTime)
            };
          }

          const submitData = {
            ...processedLiveForm,
            liveCover: this.isEditMode ? this.editImgId : this.imgId,
            isEntryFrom: this.addEnrollmentForm ? '1' : '0',
            tableFormat: this.addEnrollmentForm ? this.tableFormat : []
          };

          this.$emit('submit', submitData, this.isEditMode);
        } else {
          this.$Message.error('请检查填写项');
        }
      });
    },

    handleCreateCancel() {
      this.$emit('cancel');
      this.UPDATE_LIVE_FORM_STATE({ createModalVisible: false });
      this.resetForm();
    }
  }
};
</script>

<style scoped>
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

.enrollment-form {
  padding: 10px 0;
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