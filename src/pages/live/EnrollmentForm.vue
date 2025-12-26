<template>
  <div class="enrollment-form">
    <div class="form-header">
      <h2>添加报名表</h2>
      <div>
        <i-button type="default" @click="goBack" style="margin-right: 10px;">
          返回上一页
        </i-button>
        <i-button type="primary" @click="saveForm">保存表单</i-button>
      </div>
    </div>

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
        <div v-for="(field, index) in formFields" :key="index"
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
        <div v-if="formFields.length === 0" class="empty-tip">
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
</template>

<script>
import { mapState, mapMutations, mapActions } from 'vuex';

export default {
  data() {
    return {
      formFields: [],
      currentIndex: -1,
      currentField: {},
      // 性别固定选项值
      genderOptions: {
        male: '男',
        female: '女'
      }
    };
  },
  computed: {
    ...mapState({
      liveFormState: state => state.live.liveFormState
    })
  },
  watch: {
    currentIndex(newVal) {
      if (newVal !== -1) {
        this.currentField = JSON.parse(JSON.stringify(this.formFields[newVal]));
        // 初始化必填状态（防止undefined）
        if (this.currentField.required === undefined) {
          this.currentField.required = true; // 默认必填
        }
      }
    },
    // 实时同步当前编辑字段到列表中
    currentField: {
      handler(newVal) {
        if (this.currentIndex !== -1 && this.formFields[this.currentIndex]) {
          this.formFields[this.currentIndex] = { ...newVal };
        }
      },
      deep: true
    }
  },
  methods: {
    ...mapMutations('live', ['UPDATE_LIVE_FORM_STATE', 'RESTORE_LIVE_FORM_STATE']),
    addField(type) {
      const fieldConfig = {
        name: { type: 'name', name: '姓名', placeholder: '请输入姓名', required: true }, // 默认必填
        phone: { type: 'phone', name: '电话', placeholder: '请输入手机号码', required: true }, // 默认必填
        gender: { type: 'gender', name: '性别', required: true }, // 默认必填（开关禁用但显示星号）
        age: { type: 'age', name: '年龄', placeholder: '请输入年龄', required: true }, // 默认必填
        birthday: { type: 'birthday', name: '出生年月', placeholder: '请选择出生年月', required: true }, // 默认必填
        email: { type: 'email', name: '邮箱', placeholder: '请输入邮箱地址', required: true }, // 默认必填
        idCard: { type: 'idCard', name: '身份证', placeholder: '请输入身份证号', required: true }, // 默认必填
        text: { type: 'text', name: `自定义文本框`, placeholder: '请输入内容', required: true } // 默认必填
      };

      // 联系人组件只能添加一次
      if (type !== 'text') {
        const isExist = this.formFields.some(field => field.type === type);
        if (isExist) {
          this.$Message.warning(`${fieldConfig[type].name}只能添加一次`);
          return;
        }
      }

      this.formFields.push({ ...fieldConfig[type] });
      this.$Message.success('添加成功');
    },

    getCustomTextCount() {
      return this.formFields.filter(field => field.type === 'text').length;
    },

    selectField(index) {
      this.currentIndex = index;
    },

    removeField(index) {
      this.$Modal.confirm({
        title: '确认删除',
        content: `确定要删除【${this.formFields[index].name}】吗？`,
        onOk: () => {
          // 如果删除的是当前选中项，重置编辑状态
          if (this.currentIndex === index) {
            this.currentIndex = -1;
            this.currentField = {};
          } else if (this.currentIndex > index) {
            // 调整选中索引
            this.currentIndex--;
          }
          this.formFields.splice(index, 1);
          this.$Message.success('删除成功');
        }
      });
    },

    // 判断是否为联系人字段（非自定义文本框）
    isContactField(type) {
      return ['name', 'phone', 'gender', 'age', 'birthday', 'email', 'idCard'].includes(type);
    },

    // 必填开关变化事件
    handleRequiredChange(checked) {
      this.currentField.required = checked;
    },

    goBack() {
      this.$router.go(-1);
    },

    saveForm() {
      if (this.formFields.length === 0) {
        this.$Message.warning('请至少添加一个字段');
        return;
      }

      // 1. 将表单配置存入Vuex状态管理
      this.UPDATE_LIVE_FORM_STATE({
        tableFormat: this.formFields
      });
      console.log('当前liveFormState信息：', this.liveFormState);
      this.$Message.success('报名表保存成功');

      // 3. 返回上一页（创建直播弹框所在页面）
      // setTimeout(() => {
      //   this.$router.go(-1);
      // }, 500);
    },
  }
};
</script>

<style scoped>
.enrollment-form {
  padding: 20px;
  background-color: #fff;
  min-height: calc(100vh - 40px);
  padding-bottom: 40px;
  /* 底部增加安全间距 */
  box-sizing: border-box;
  /* 保证padding不会超出视口 */
}

.form-header {
  margin-bottom: 20px;
  border-bottom: 1px solid #eee;
  padding-bottom: 10px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.form-layout {
  height: calc(100vh - 160px);
  /* 减少高度，预留底部安全区域 */
  box-sizing: border-box;
}

.form-column {
  background-color: #f5f7f9;
  border-radius: 4px;
  padding: 15px;
  height: 100%;
  overflow-y: auto;
  /* 确保内容过多时可滚动 */
  box-sizing: border-box;
  padding-bottom: 20px;
  /* 列内部底部安全间距 */
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
  /* 预览列表底部增加安全间距 */
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
  /* 编辑区底部增加间距 */
}

/* 性别选项配置：一行显示两个input */
.gender-option-inputs {
  display: flex;
  gap: 20px;
  align-items: center;
}

.option-item {
  /* display: flex; */
  /* align-items: center; */
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
  /* 占位符底部增加间距 */
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