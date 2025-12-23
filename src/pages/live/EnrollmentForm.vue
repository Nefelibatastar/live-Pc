<template>
  <div class="enrollment-form-container">
    <div class="form-header">
      <h2>添加报名表</h2>
      <div>
        <i-button type="default" @click="goBack" style="margin-right: 10px;">
          返回上一页
        </i-button>
        <i-button type="primary" @click="saveForm">保存表单</i-button>
      </div>
    </div>

    <div class="form-body">
      <!-- 左侧组件区域 -->
      <div class="form-components">
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

        <h3 style="margin-top: 20px;">自定义组件</h3>
        <div class="component-list">
          <i-button type="default" @click="addField('text')">文本框</i-button>
        </div>
      </div>

      <!-- 中间预览区域 -->
      <div class="form-preview">
        <h3>表单预览</h3>
        <div class="preview-content">
          <div v-for="(field, index) in formFields" :key="field.id" class="preview-field">
            <div class="field-header">
              <span class="field-index">
                {{ (index + 1).toString().padStart(2, '0') }}
                <span v-if="field.required" class="required">*</span>
              </span>
              <span class="field-name">{{ field.label }}</span>
              <i-button type="text" size="small" class="delete-btn" @click="removeField(index)">
                删除
              </i-button>
            </div>
            <div class="field-input">
              <Input :placeholder="field.placeholder" :disabled="true" v-if="field.type !== 'gender'"></Input>

              <Select v-if="field.type === 'gender'" disabled placeholder="请选择">
                <Option value="male">男</Option>
                <Option value="female">女</Option>
              </Select>
            </div>
          </div>
        </div>
      </div>

      <!-- 右侧编辑区域 -->
      <div class="form-editor" v-if="selectedField">
        <h3>编辑控件</h3>
        <Form :model="selectedField" :label-width="80">
          <Form-item label="控件名称">
            <Input v-model="selectedField.label"></Input>
          </Form-item>
          <Form-item label="提示信息">
            <Input v-model="selectedField.placeholder"></Input>
          </Form-item>
          <Form-item label="必填项">
            <Switch v-model="selectedField.required"></Switch>
          </Form-item>
        </Form>
      </div>
    </div>
  </div>
</template>

<script>
const generateId = () => {
  // 时间戳（毫秒） + 8位随机字符串
  const randomStr = Math.random().toString(36).substr(2, 8);
  return Date.now() + '-' + randomStr;
};

export default {
  data() {
    return {
      formFields: [],
      selectedField: null,
      fieldTypes: {
        name: { label: '姓名', placeholder: '请输入姓名', type: 'text', required: false },
        phone: { label: '电话', placeholder: '请输入电话', type: 'text', required: false },
        gender: { label: '性别', placeholder: '请选择性别', type: 'gender', required: false },
        age: { label: '年龄', placeholder: '请输入年龄', type: 'text', required: false },
        birthday: { label: '出生年月', placeholder: '请选择出生年月', type: 'date', required: false },
        email: { label: '邮箱', placeholder: '请输入邮箱', type: 'text', required: false },
        idCard: { label: '身份证', placeholder: '请输入身份证号', type: 'text', required: false },
        text: { label: '文本框', placeholder: '请输入内容', type: 'text', required: false }
      }
    };
  },
  created() {
    // 加载已保存的表单数据（如果有）
    const savedForm = localStorage.getItem('liveEnrollmentForm');
    if (savedForm) {
      this.formFields = JSON.parse(savedForm);
    }
  },
  methods: {

    // 添加字段
    addField(type) {
      const newField = {
        id: generateId(),
        ...this.fieldTypes[type]
      };
      this.formFields.push(newField);
      this.selectedField = newField;
    },

    // 移除字段
    removeField(index) {
      this.formFields.splice(index, 1);
      if (this.formFields.length > 0) {
        this.selectedField = this.formFields[0];
      } else {
        this.selectedField = null;
      }
    },

    goBack() {
      // 使用路由历史返回，确保触发上一页的beforeRouteEnter钩子
      this.$router.go(-1);
    },
    saveForm() {
      // 保存表单后返回
      localStorage.setItem('liveEnrollmentForm', JSON.stringify(this.formFields));
      this.$Message.success('保存成功');
      this.goBack();
    }
  },
  beforeRouteLeave(to, from, next) {
    // 离开页面时自动保存草稿（可选）
    // if (this.formFields.length > 0) {
    //   localStorage.setItem('liveEnrollmentForm', JSON.stringify(this.formFields));
    // }
    next();
  }
}
</script>

<style scoped>
.enrollment-form-container {
  padding: 20px;
}

.form-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 10px;
  border-bottom: 1px solid #eee;
}

.form-body {
  display: flex;
  gap: 20px;
}

.form-components,
.form-preview,
.form-editor {
  flex: 1;
  padding: 15px;
  border: 1px solid #eee;
  border-radius: 4px;
}

.component-list {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 10px;
}

.preview-field {
  margin-bottom: 15px;
  padding: 10px;
  border: 1px solid #eee;
  border-radius: 4px;
}

.field-header {
  display: flex;
  align-items: center;
  margin-bottom: 8px;
}

.field-index {
  margin-right: 10px;
  font-weight: bold;
}

.required {
  color: #ff4d4f;
  margin-left: 3px;
}

.delete-btn {
  margin-left: auto;
  color: #ff4d4f;
}

.field-input {
  width: 80%;
}
</style>