<template>
  <div>
    <!-- 查询区域 -->
    <div class="search-container">
      <Row :gutter="16" class="search-row">
        <!-- 角色名称输入框 -->
        <Col :span="6">
        <i-input v-model="queryForm.roleName" placeholder="请输入角色名称" class="search-input"></i-input>
        </Col>
        <!-- 角色备注输入框 -->
        <Col :span="6">
        <i-input v-model="queryForm.remark" placeholder="请输入角色备注" class="search-input"></i-input>
        </Col>
        <!-- 按钮区域 -->
        <Col :span="12" class="btn-group">
        <i-button type="default" @click="resetQuery">清空</i-button>
        <i-button type="primary" @click="searchRole">搜索</i-button>
        <i-button type="success" @click="addRole">新增</i-button>
        </Col>
      </Row>
    </div>
    <Table :context="self" :data="tableData" :columns="tableColumns" stripe border></Table>
    <div style="margin: 10px;overflow: hidden">
      <div style="float: right;">
        <Page :total="total" :current="page" @on-change="changePage" show-total></Page>
      </div>
    </div>
    <!-- 新增角色模态框 -->
    <Modal v-model="addModalVisible" title="新增角色" @on-ok="handleSubmit" @on-cancel="handleCancel"
      :loading="modalLoading">
      <Form ref="addRoleForm" :model="addRoleForm" :rules="addRoleRules" :label-width="100">
        <Form-item label="角色名称" prop="roleName">
          <Input v-model="addRoleForm.roleName" placeholder="请输入角色名称"></Input>
        </Form-item>
        <Form-item label="角色备注" prop="remark">
          <Input v-model="addRoleForm.remark" placeholder="请输入角色备注"></Input>
        </Form-item>
        <Form-item label="权限菜单" prop="menuIds">
          <!-- 使用 Element UI 的树形控件 -->
          <div
            style="max-height: 300px; overflow-y: auto; border: 1px solid #dcdee2; padding: 10px; border-radius: 4px;">
            <el-tree ref="menuTree" :data="allMenus" show-checkbox node-key="id" :props="{
              children: 'childrenProgramList',
              label: 'programName'
            }" :default-expand-all="true" @check="handleMenuCheck" :check-strictly="false">
            </el-tree>
          </div>
        </Form-item>
      </Form>
    </Modal>
    <!-- 查看/修改权限 -->
    <Modal v-model="showPermissionVisible" :title="isEditing ? '修改角色权限' : '查看角色权限'" @on-cancel="handlePermissionCancel"
      :loading="permissionModalLoading">
      <Form ref="permissionForm" :model="permissionForm" :rules="permissionRules" :label-width="100">
        <Form-item label="角色名称" prop="roleName">
          <Input v-model="permissionForm.roleName" :disabled="!isEditing" placeholder="请输入角色名称"></Input>
        </Form-item>
        <Form-item label="角色备注" prop="remark">
          <Input v-model="permissionForm.remark" :disabled="!isEditing" placeholder="请输入角色备注"></Input>
        </Form-item>
        <Form-item label="权限菜单" prop="menuIds">
          <div :style="treeContainerStyle">
            <el-tree ref="viewMenuTree" :data="allMenus" show-checkbox node-key="id" :props="{
              children: 'childrenProgramList',
              label: 'programName'
            }" :default-expand-all="true" :check-strictly="false" @check="handlePermissionMenuCheck">
            </el-tree>
            <!-- 查看状态下添加遮罩层，完全禁用树形控件 -->
            <div v-if="!isEditing" class="tree-mask"></div>
          </div>
        </Form-item>
      </Form>
      <div slot="footer">
        <i-button type="default" @click="handlePermissionCancel">取消</i-button>
        <i-button v-if="!isEditing" type="primary" @click="startEdit">修改</i-button>
        <i-button v-if="isEditing" type="primary" @click="handlePermissionSubmit">保存</i-button>
      </div>
    </Modal>
  </div>
</template>
<script>
export default {
  data() {
    return {
      self: this,
      tableData: [],
      total: 0,
      page: 1,
      size: 10,
      // 查询表单数据
      queryForm: {
        roleName: '',
        remark: ''
      },
      isOperate: 0,
      // 新增角色相关
      addModalVisible: false,
      modalLoading: false,
      addRoleForm: {
        roleName: '',
        remark: '',
        menuIds: []
      },
      // 查看/修改权限相关
      showPermissionVisible: false,
      permissionModalLoading: false,
      isEditing: false, // 是否处于编辑状态
      permissionForm: {
        roleId: '',
        roleName: '',
        remark: '',
        menuIds: []
      },
      // 表单验证规则
      addRoleRules: {
        roleName: [
          { required: true, message: '请输入角色名称', trigger: 'blur' }
        ],
        menuIds: [
          {
            required: true,
            message: '请至少选择一个菜单',
            trigger: 'change',
            validator: (rule, value, callback) => {
              if (this.$refs.menuTree) {
                const checkedKeys = this.$refs.menuTree.getCheckedKeys();
                if (checkedKeys.length > 0) {
                  callback();
                } else {
                  callback(new Error('请至少选择一个菜单'));
                }
              } else {
                callback(new Error('菜单数据加载中，请稍后'));
              }
            }
          }
        ]
      },
      permissionRules: {
        roleName: [
          { required: true, message: '请输入角色名称', trigger: 'blur' }
        ],
        menuIds: [
          {
            required: true,
            message: '请至少选择一个菜单',
            trigger: 'change',
            validator: (rule, value, callback) => {
              if (this.$refs.viewMenuTree) {
                const checkedKeys = this.$refs.viewMenuTree.getCheckedKeys();
                if (checkedKeys.length > 0) {
                  callback();
                } else {
                  callback(new Error('请至少选择一个菜单'));
                }
              } else {
                callback(new Error('菜单数据加载中，请稍后'));
              }
            }
          }
        ]
      },
      allMenus: [],
      tableColumns: [
        {
          title: '角色名称',
          key: 'roleName',
          align: 'center'
        },
        {
          title: '角色备注',
          key: 'remark',
          align: 'center'
        },
        {
          title: '操作',
          key: 'action',
          width: 220,
          align: 'center',
          render: (h, params) => {
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
                  click: () => this.showPermission(params.index)
                }
              }, '查看权限'),
              h('i-button', {
                props: {
                  type: 'error',
                  size: 'small'
                },
                on: {
                  click: () => this.deleteRole(params.index)
                }
              }, '删除')
            ]);
          }
        }
      ]
    }
  },
  computed: {
    treeContainerStyle() {
      return {
        maxHeight: '300px',
        overflowY: 'auto',
        border: '1px solid #dcdee2',
        padding: '10px',
        borderRadius: '4px',
        position: 'relative' // 添加相对定位，为遮罩层做准备
      };
    }
  },
  methods: {
    getRoleList() {
      const para = {
        page: this.page,
        size: this.size,
        roleName: this.queryForm.roleName,
        remark: this.queryForm.remark
      }
      this.$api.getRoleList(para)
        .then((res) => {
          if (res.code === 200) {
            this.tableData = res.data.records;
            this.total = res.data.total;
          } else {
            this.$Message.error('获取角色列表失败：' + res.message);
          }
        }).catch(err => {
          console.error('接口请求失败', err);
          this.$Message.error('网络错误，请重试');
        });
    },
    searchRole() {
      this.page = 1;
      this.getRoleList();
    },
    resetQuery() {
      this.queryForm = {
        roleName: '',
        remark: ''
      };
      this.page = 1;
      this.getRoleList();
    },
    addRole() {
      this.addModalVisible = true;
      this.addRoleForm = { roleName: '', remark: '', menuIds: [] };
      this.isOperate = 1
      this.getAllMenus().then(() => {
        this.$nextTick(() => {
          if (this.$refs.menuTree) {
            this.$refs.menuTree.setCheckedKeys([]);
          }
          this.isOperate = 0
        });
      });
    },
    deleteRole(index) {
      const user = this.tableData[index];
      console.log(index,user)
      this.$Modal.confirm({
        title: '确认删除',
        content: `确定要删除用户「${user.roleName}」吗？此操作不可撤销！`,
        loading: true,
        onOk: () => {
          this.$api.deleteRole({ id: user.id })
            .then(res => {
              this.$Modal.remove();
              if (res.code === 200) {
                // console.log('删除用户:', user.id);
                this.$Message.success('删除用户成功');
                this.getRoleList();
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
    handleCancel() {
      this.addRoleForm = { roleName: '', remark: '', menuIds: [] };
      this.$refs.addRoleForm.resetFields();
      if (this.$refs.menuTree) {
        this.$refs.menuTree.setCheckedKeys([]);
      }
      this.modalLoading = false;
    },
    handleMenuCheck(checkedNode, checkedKeys) {
      this.addRoleForm.menuIds = checkedKeys.checkedKeys;
    },
    handlePermissionCancel() {
      this.showPermissionVisible = false;
      this.isEditing = false;
      if (this.$refs.viewMenuTree) {
        this.$refs.viewMenuTree.setCheckedKeys([]);
      }
      this.$refs.permissionForm.resetFields();
    },
    getAllMenus() {
      return new Promise((resolve, reject) => {
        const para = { isOperate: this.isOperate };
        this.$api.getProgram(para)
          .then(res => {
            if (res.code === 200) {
              this.allMenus = res.data;
              resolve();
            } else {
              this.$Message.error('获取菜单失败：' + res.message);
              reject();
            }
          })
          .catch(err => {
            console.error('获取菜单接口报错：', err);
            this.$Message.error('接口请求失败');
            reject();
          });
      });
    },
    handleSubmit() {
      this.modalLoading = true;
      this.submitAddRole()
        .finally(() => {
          this.modalLoading = false;
        });
    },
    submitAddRole() {
      return new Promise((resolve, reject) => {
        this.$refs.addRoleForm.validate(valid => {
          if (!valid) {
            this.$Message.error('表单验证失败，请检查输入');
            return reject();
          }

          try {
            const menuTree = this.$refs.menuTree;
            const checkedKeys = menuTree.getCheckedKeys();
            // 获取所有需要提交的菜单ID，包括选中的二级菜单及其对应的一级菜单
            const allMenuIds = this.getAllRequiredMenuIdsWithParents(checkedKeys);
            const programList = allMenuIds.map(programId => ({ programId }));
            const params = {
              roleName: this.addRoleForm.roleName,
              remark: this.addRoleForm.remark,
              programList: programList
            };
            this.$api.addRole(params)
              .then(res => {
                if (res.code === 200) {
                  this.$Message.success('新增角色成功');
                  this.addModalVisible = false;
                  this.getRoleList();
                  resolve();
                } else {
                  this.$Message.error(res.message || '新增失败');
                  reject();
                }
              })
          } catch (error) {
            console.error('处理菜单数据时出错:', error);
            this.$Message.error('处理菜单数据失败');
            reject();
          }
        });
      });
    },
    // 获取所有需要提交的菜单ID，包括选中的二级菜单及其对应的一级菜单
    getAllRequiredMenuIdsWithParents(checkedKeys) {
      const menuIds = new Set();
      // 首先添加所有直接选中的菜单
      checkedKeys.forEach(id => {
        menuIds.add(id);
      });
      // 然后为每个选中的二级菜单添加对应的一级菜单
      this.allMenus.forEach(firstLevelMenu => {
        const firstLevelId = firstLevelMenu.id;
        const secondLevelMenus = firstLevelMenu.childrenProgramList || [];
        // 检查该一级菜单下是否有被选中的二级菜单
        const hasSelectedSecondLevel = secondLevelMenus.some(menu =>
          checkedKeys.includes(menu.id)
        );
        // 如果有选中的二级菜单，则添加对应的一级菜单
        if (hasSelectedSecondLevel) {
          menuIds.add(firstLevelId);
        }
      });
      return Array.from(menuIds);
    },

    // 查看权限
    showPermission(index) {
      const role = this.tableData[index];
      this.permissionForm.roleId = role.id || '';
      this.permissionForm.roleName = role.roleName || '';
      this.permissionForm.remark = role.remark || '';
      this.isEditing = false;

      this.showPermissionVisible = true;
      this.isOperate = 1
      this.getAllMenus().then(() => {
        this.getRolePermission(this.permissionForm.roleId);
        this.isOperate = 0
      });
    },

    // 获取角色权限并正确设置树形控件选中状态
    getRolePermission(roleId) {
      const para = { roleId };
      this.$api.getRole(para)
        .then(res => {
          if (res.code === 200) {
            const roleData = res.data;

            if (roleData.programList && roleData.programList.length > 0) {
              const menuIds = roleData.programList.map(item => item.programId);

              // 根据菜单结构和实际权限计算应该显示的选中状态
              const displayMenuIds = this.calculateCorrectDisplayMenuIds(menuIds);

              this.$nextTick(() => {
                if (this.$refs.viewMenuTree) {
                  // 先清空所有选中状态
                  this.$refs.viewMenuTree.setCheckedKeys([]);

                  // 设置计算后的选中状态
                  this.$refs.viewMenuTree.setCheckedKeys(displayMenuIds);

                  // 更新表单中的menuIds
                  this.permissionForm.menuIds = displayMenuIds;
                }
              });
            } else {
              this.$nextTick(() => {
                if (this.$refs.viewMenuTree) {
                  this.$refs.viewMenuTree.setCheckedKeys([]);
                  this.permissionForm.menuIds = [];
                }
              });
            }
          } else {
            this.$Message.error('获取角色权限失败：' + res.message);
          }
        })
        .catch(err => {
          console.error('获取角色权限接口请求失败', err);
          this.$Message.error('网络错误，请重试');
        });
    },

    // 根据菜单结构和实际权限计算正确的显示状态
    calculateCorrectDisplayMenuIds(menuIds) {
      const displayMenuIds = new Set();

      // 遍历所有一级菜单
      this.allMenus.forEach(firstLevelMenu => {
        const firstLevelId = firstLevelMenu.id;
        const secondLevelMenus = firstLevelMenu.childrenProgramList || [];

        // 获取该一级菜单下所有的二级菜单ID
        const allSecondLevelIds = secondLevelMenus.map(menu => menu.id);

        // 检查该一级菜单下的二级菜单在权限中的情况
        const hasSecondLevelIds = menuIds.filter(id => allSecondLevelIds.includes(id));

        // 如果该一级菜单下的所有二级菜单都在权限中，则显示一级菜单为选中状态
        // 否则不显示一级菜单为选中状态（让树形控件自动处理半选状态）
        if (hasSecondLevelIds.length === allSecondLevelIds.length && allSecondLevelIds.length > 0) {
          displayMenuIds.add(firstLevelId);
        }

        // 添加所有在权限中的二级菜单
        hasSecondLevelIds.forEach(id => displayMenuIds.add(id));

        // 如果一级菜单本身在权限中，也添加（但这种情况应该由上面的逻辑处理）
        if (menuIds.includes(firstLevelId)) {
          // 只有当一级菜单下没有二级菜单，或者所有二级菜单都被选中时，才添加一级菜单
          if (allSecondLevelIds.length === 0 || hasSecondLevelIds.length === allSecondLevelIds.length) {
            displayMenuIds.add(firstLevelId);
          }
        }
      });

      return Array.from(displayMenuIds);
    },

    // 开始编辑
    startEdit() {
      this.isEditing = true;
      // 重新设置树形控件的选中状态，确保数据同步
      this.$nextTick(() => {
        if (this.$refs.viewMenuTree) {
          this.$refs.viewMenuTree.setCheckedKeys(this.permissionForm.menuIds);
        }
      });
    },

    // 处理权限菜单勾选
    handlePermissionMenuCheck(checkedNode, checkedKeys) {
      this.permissionForm.menuIds = checkedKeys.checkedKeys;
    },

    // 提交权限修改
    handlePermissionSubmit() {
      this.permissionModalLoading = true;
      this.submitUpdateRole()
        .finally(() => {
          this.permissionModalLoading = false;
        });
    },

    // 提交修改角色
    submitUpdateRole() {
      return new Promise((resolve, reject) => {
        this.$refs.permissionForm.validate(valid => {
          if (!valid) {
            this.$Message.error('表单验证失败，请检查输入');
            return reject();
          }

          try {
            const menuTree = this.$refs.viewMenuTree;
            const checkedKeys = menuTree.getCheckedKeys();

            // 获取所有需要提交的菜单ID，包括选中的二级菜单及其对应的一级菜单
            const allMenuIds = this.getAllRequiredMenuIdsWithParents(checkedKeys);

            // 构造 programList，包含 roleId
            const programList = allMenuIds.map(programId => ({
              programId,
              roleId: this.permissionForm.roleId
            }));

            const params = {
              id: this.permissionForm.roleId,
              roleName: this.permissionForm.roleName,
              remark: this.permissionForm.remark,
              programList: programList
            };

            this.$api.updateRole(params)
              .then(res => {
                if (res.code === 200) {
                  this.$Message.success('修改角色成功');
                  this.showPermissionVisible = false;
                  this.isEditing = false;
                  this.getRoleList();
                  resolve();
                } else {
                  this.$Message.error(res.message || '修改失败');
                  reject();
                }
              })
          } catch (error) {
            console.error('处理菜单数据时出错:', error);
            this.$Message.error('处理菜单数据失败');
            reject();
          }
        });
      });
    },

    changePage(row) {
      this.page = row;
      this.getRoleList();
    }
  },
  created() {
    this.getRoleList();
    this.getAllMenus();
  }
}
</script>
<style scoped>
/* 样式保持不变 */
h2 {
  padding: 20px;
  text-align: center;
}

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

.btn-group i-button {
  margin-left: 8px;
}

.menu-item {
  margin-bottom: 10px;
  padding-left: 10px;
}

.submenu-item {
  margin-left: 20px;
  padding-left: 10px;
  border-left: 1px dashed #ccc;
  margin-top: 5px;
  margin-bottom: 5px;
}

.el-checkbox-group {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.menu-item {
  margin-bottom: 8px;
  padding-left: 5px;
}

.submenu-item {
  margin-left: 25px;
  padding-left: 10px;
  border-left: 1px dashed #ccc;
  margin-top: 5px;
  margin-bottom: 5px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.el-checkbox {
  align-items: center;
  cursor: pointer;
}

/* 树形控件遮罩层样式 */
.tree-mask {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: transparent;
  z-index: 10;
  cursor: not-allowed;
}
</style>