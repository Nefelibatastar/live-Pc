<template>
  <div>
    <!-- 查询区域 -->
    <div class="search-container">
      <Row :gutter="16" class="search-row">
        <Col :span="6">
        <i-input v-model="queryForm.userName" placeholder="请输入用户姓名" class="search-input"></i-input>
        </Col>
        <Col :span="6">
        <Select v-model="queryForm.roleId" placeholder="请选择角色" clearable>
          <Option v-for="role in roleList" :key="role.id" :value="role.id">{{ role.roleName }}</Option>
        </Select>
        </Col>
        <Col :span="6" class="btn-group">
        <i-button type="default" @click="resetQuery">清空</i-button>
        <i-button type="primary" @click="searchUser">搜索</i-button>
        <i-button type="success" @click="addUser">新增</i-button>
        </Col>
      </Row>
    </div>

    <!-- 用户列表表格 -->
    <Table :context="self" :data="tableData" :columns="tableColumns" stripe border></Table>

    <!-- 分页 -->
    <div style="margin: 10px;overflow: hidden">
      <div style="float: right;">
        <Page :total="total" :current="page" @on-change="changePage" show-total></Page>
      </div>
    </div>

    <!-- 新增用户模态框 -->
    <Modal v-model="addModalVisible" title="新增用户" @on-ok="handleSubmit" @on-cancel="handleCancel"
      :loading="modalLoading">
      <Form ref="addUserForm" :model="addUserForm" :rules="addUserRules" :label-width="100">
        <Form-item label="用户账号" prop="loginName">
          <Input v-model="addUserForm.loginName" placeholder="请输入用户账号"></Input>
        </Form-item>
        <Form-item label="用户姓名" prop="userName">
          <Input v-model="addUserForm.userName" placeholder="请输入用户姓名"></Input>
        </Form-item>
        <Form-item label="密码" prop="password">
          <Input type="password" v-model="addUserForm.password" placeholder="选填，不填则使用默认密码"></Input>
        </Form-item>
        <Form-item label="确认密码" prop="loginPwd">
          <Input type="password" v-model="addUserForm.loginPwd" placeholder="选填，与密码一致"></Input>
        </Form-item>
        <Form-item label="角色" prop="roleId">
          <Select v-model="addUserForm.roleId" placeholder="请选择角色">
            <Option v-for="role in roleList" :key="role.id" :value="role.id">{{ role.roleName }}</Option>
          </Select>
        </Form-item>
      </Form>
    </Modal>

    <!-- 编辑用户模态框 -->
    <Modal v-model="editModalVisible" title="编辑用户" @on-ok="handleEditSubmit" @on-cancel="handleEditCancel"
      :loading="editModalLoading">
      <Form ref="editUserForm" :model="editUserForm" :rules="editUserRules" :label-width="100">
        <Form-item label="用户账号" prop="loginName">
          <Input v-model="editUserForm.loginName" placeholder="请输入用户账号"></Input>
        </Form-item>
        <Form-item label="用户姓名" prop="userName">
          <Input v-model="editUserForm.userName" placeholder="请输入用户姓名"></Input>
        </Form-item>
        <Form-item label="角色" prop="roleId">
          <Select v-model="editUserForm.roleId" placeholder="请选择角色">
            <Option v-for="role in roleList" :key="role.id" :value="role.id">{{ role.roleName }}</Option>
          </Select>
        </Form-item>
        <Form-item label="修改密码" prop="loginPwd">
          <Input type="password" v-model="editUserForm.loginPwd" placeholder="选填，不填则不修改密码"></Input>
        </Form-item>
      </Form>
    </Modal>
  </div>
</template>

<script>
export default {
  data() {
    const validatePassword = (rule, value, callback) => {
      if (value !== '' && this.addUserForm.loginPwd === '') {
        callback(new Error('请输入确认密码'));
      } else if (value !== '' && this.addUserForm.loginPwd !== value) {
        callback(new Error('两次输入密码不一致'));
      } else {
        callback();
      }
    };

    const validateLoginPwd = (rule, value, callback) => {
      if (value !== '' && this.addUserForm.password === '') {
        callback(new Error('请输入密码'));
      } else if (value !== '' && this.addUserForm.password !== value) {
        callback(new Error('两次输入密码不一致'));
      } else {
        callback();
      }
    };

    return {
      self: this,
      tableData: [],
      total: 0,
      page: 1,
      size: 10,
      queryForm: {
        userName: '',
        roleId: ''
      },
      roleList: [],
      addModalVisible: false,
      modalLoading: false,
      addUserForm: {
        loginName: '',
        userName: '',
        password: '',
        loginPwd: '',
        roleId: '',
      },
      editModalVisible: false,
      editModalLoading: false,
      editUserForm: {
        id: '',
        loginName: '',
        userName: '',
        roleId: '',
        loginPwd: '',
      },
      addUserRules: {
        loginName: [
          { required: true, message: '请输入用户账号', trigger: 'blur' }
        ],
        userName: [
          { required: true, message: '请输入用户姓名', trigger: 'blur' }
        ],
        password: [
          { validator: validatePassword, trigger: 'blur' }
        ],
        loginPwd: [
          { validator: validateLoginPwd, trigger: 'blur' }
        ],
        roleId: [
          { required: true, message: '请选择角色', trigger: 'change' }
        ]
      },
      editUserRules: {
        loginName: [
          { required: true, message: '请输入用户账号', trigger: 'blur' }
        ],
        userName: [
          { required: true, message: '请输入用户姓名', trigger: 'blur' }
        ],
        roleId: [
          { required: true, message: '请选择角色', trigger: 'change' }
        ],
        loginPwd: [
          { trigger: 'blur', required: false }
        ]
      },
      tableColumns: [
        {
          title: '用户账号',
          key: 'loginName',
          align: 'center'
        },
        {
          title: '用户姓名',
          key: 'userName',
          align: 'center'
        },
        {
          title: '角色',
          key: 'roleName',
          align: 'center'
        },
        {
          title: '状态',
          key: 'isDel',
          align: 'center',
          render: (h, params) => {
            const isDel = params.row.isDel;
            const text = isDel;
            
            if (isDel === "删除") {
              // 已删除状态 - 红色背景，白色文字
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
            } else {
              // 正常状态 - 绿色背景，白色文字
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
          title: '创建时间',
          key: 'createTime',
          align: 'center'
        },
        {
          title: '操作',
          key: 'action',
          width: 200,
          align: 'center',
          render: (h, params) => {
            const isDel = params.row.isDel;
            // 如果用户已删除，则不显示操作按钮
            if (isDel === '删除') {
              return h('span', {
                style: {
                  color: '#999',
                  fontStyle: 'italic'
                }
              }, '不可操作');
            }
            
            return h('div', [
              h('i-button', {
                props: {
                  type: 'primary',
                  size: 'small'
                },
                style: {
                  marginRight: '5px'
                },
                on: {
                  click: () => this.editUser(params.index)
                }
              }, '编辑'),
              h('i-button', {
                props: {
                  type: 'error',
                  size: 'small'
                },
                on: {
                  click: () => this.deleteUser(params.index)
                }
              }, '删除')
            ]);
          }
        }
      ]
    }
  },
  methods: {
    getUserList() {
      const para = {
        userName: this.queryForm.userName,
        roleId: this.queryForm.roleId || '',
        page: this.page,
        size: this.size
      };
      this.$api.getUserList(para)
        .then(res => {
          if (res.code === 200) {
            this.tableData = res.data.records.map(item => {
              return {
                ...item,
                createTime: item.createTime ? item.createTime.replace('T', ' ') : ''
              }
            })
            this.total = res.data.total;
          } else {
            this.$Message.error('获取失败：' + res.message);
          }
        })
        .catch(err => {
          console.error('获取用户列表接口报错：', err);
          this.$Message.error('接口请求失败');
        });
    },
    getRoleList() {
      const para = {
        page: 1,
        size: 10,
      }
      this.$api.getRoleList(para)
        .then((res) => {
          if (res.code === 200) {
            let roleData = res.data.records
           // roleData.push({ "id": '0', "roleName": '普通用户' })
            this.roleList = roleData
          } else {
            this.$Message.error('获取角色列表失败：' + res.message);
          }
        }).catch(err => {
          console.error('接口请求失败', err);
          this.$Message.error('网络错误，请重试');
        });
    },
    searchUser() {
      this.page = 1;
      this.getUserList();
    },
    resetQuery() {
      this.queryForm = {
        userName: '',
        roleId: ''
      };
      this.page = 1;
      this.getUserList();
    },
    addUser() {
      this.addModalVisible = true;
      this.addUserForm = {
        loginName: '',
        userName: '',
        password: '',
        loginPwd: '',
        roleId: '',
      };
      this.$nextTick(() => {
        this.$refs.addUserForm.resetFields();
      });
    },
    handleCancel() {
      this.addModalVisible = false;
      this.$refs.addUserForm.resetFields();
      this.modalLoading = false;
    },
    handleSubmit() {
      this.modalLoading = true;
      this.$refs.addUserForm.validate(valid => {
        if (valid) {
          const { password, ...submitParams } = this.addUserForm;
          console.log('新增用户传参:', submitParams);
          this.$api.addUser(submitParams)
            .then(res => {
              if (res.code === 200) {
                this.$Message.success('新增用户成功');
                this.addModalVisible = false;
                this.getUserList();
              } else {
                this.$Message.error(res.message || '新增失败');
              }
            })
            .catch(err => {
              console.error('新增接口报错：', err);
              this.$Message.error('网络错误，请重试');
            })
            .finally(() => {
              this.modalLoading = false;
            });
        } else {
          this.$Message.error('表单验证失败，请检查输入');
          this.modalLoading = false;
        }
      });
    },
    editUser(index) {
      const user = this.tableData[index];
      // 根据 roleName 查找对应的 roleId
      let roleId = user.roleId;
      // 如果 roleId 为 null，但 roleName 有值，尝试从角色列表中查找对应的 ID
      if ((roleId === null || roleId === '') && user.roleName) {
        const matchedRole = this.roleList.find(role => role.roleName === user.roleName);
        if (matchedRole) {
          roleId = matchedRole.id;
        }
      }
      this.editUserForm = {
        id: user.id,
        loginName: user.loginName,
        userName: user.userName,
        roleId: roleId,
        loginPwd: '',
      };
      this.editModalVisible = true;
    },
    handleEditCancel() {
      this.editModalVisible = false;
      // 只在取消时重置表单
      this.$refs.editUserForm.resetFields();
      this.editModalLoading = false;
    },
    handleEditSubmit() {
      this.editModalLoading = true;
      this.$refs.editUserForm.validate(valid => {
        if (valid) {
          const submitParams = { ...this.editUserForm };
          console.log('编辑用户传参:', submitParams);
          this.$api.updateUser(submitParams)
            .then(res => {
              if (res.code === 200) {
                this.$Message.success('编辑用户成功');
                this.editModalVisible = false;
                this.getUserList();
              } else {
                this.$Message.error(res.message || '编辑失败');
              }
            })
            .catch(err => {
              console.error('编辑接口报错：', err);
              this.$Message.error('网络错误，请重试');
            })
            .finally(() => {
              this.editModalLoading = false;
            });
        } else {
          this.$Message.error('表单验证失败，请检查输入');
          this.editModalLoading = false;
        }
      });
    },
    deleteUser(index) {
      const user = this.tableData[index];
      this.$Modal.confirm({
        title: '确认删除',
        content: `确定要删除用户「${user.userName}」吗？此操作不可撤销！`,
        loading: true,
        onOk: () => {
          this.$api.deleUser({ id: user.id })
            .then(res => {
              this.$Modal.remove();
              if (res.code === 200) {
                // console.log('删除用户:', user.id);
                this.$Message.success('删除用户成功');
                this.getUserList();
              } else {
                this.$Message.error(res.message || '删除失败');
              }
            })
            .catch(err => {
              this.$Modal.remove();
              // console.error('删除接口报错：', err);
              this.$Message.error('网络错误，请重试');
            });
        },
        onCancel: () => {
          this.$Message.info('已取消删除');
        }
      });
    },
    changePage(page) {
      this.page = page;
      this.getUserList();
    }
  },
  created() {
    this.getRoleList();
    this.getUserList();
  }
}
</script>

<style scoped>
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
  float: right;
}

.btn-group i-button {
  margin-left: 8px;
}
</style>