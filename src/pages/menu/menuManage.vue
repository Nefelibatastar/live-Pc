<template>
  <div class="menu-management">
    <!-- 搜索区域 -->
    <div class="search-container">
      <Row :gutter="16" class="search-row">
        <Col :span="30" class="btn-group">
        <i-button type="success" @click="addFirstLevelMenu">
          <Icon type="md-add" />
          新增一级菜单
        </i-button>
        </Col>
      </Row>
    </div>

    <!-- 菜单展示表格 -->
    <div class="menu-table">
      <Table :columns="tableColumns" :data="displayMenuData" :loading="loading" border stripe class="menu-tree-table">
        <!-- 操作列自定义渲染 -->
        <template slot-scope="{ row }" slot="action">
          <div class="action-buttons">
            <!-- 新增按钮（+号） -->
            <Tooltip content="新增子菜单" placement="top">
              <i-button type="primary" size="small" shape="circle" @click="handleAddSubMenu(row)" class="add-btn">
                <Icon type="md-add" />
              </i-button>
            </Tooltip>

            <!-- 编辑按钮 -->
            <Tooltip content="编辑菜单" placement="top">
              <i-button type="info" size="small" shape="circle" @click="handleEditMenu(row)" style="margin-left: 8px;">
                <Icon type="md-create" />
              </i-button>
            </Tooltip>

            <!-- 删除按钮 -->
            <Tooltip content="删除菜单" placement="top">
              <i-button type="error" size="small" shape="circle" @click="handleDeleteMenu(row)"
                style="margin-left: 8px;">
                <Icon type="md-trash" />
              </i-button>
            </Tooltip>
          </div>
        </template>
      </Table>
    </div>

    <!-- 新增/编辑菜单模态框 -->
    <Modal v-model="modalVisible" :title="modalTitle" @on-ok="handleModalSubmit" @on-cancel="handleModalCancel"
      :loading="modalLoading">
      <Form ref="menuForm" :model="menuForm" :rules="menuRules" :label-width="100">
        <FormItem label="菜单名称" prop="programName">
          <Input v-model="menuForm.programName" placeholder="请输入菜单名称" />
        </FormItem>
        <FormItem label="菜单路径" prop="programUrl">
          <Input v-model="menuForm.programUrl" placeholder="请输入菜单路径" />
        </FormItem>
        <FormItem label="上级菜单" prop="parentId" v-if="showParentSelect">
          <Select v-model="menuForm.parentId" placeholder="请选择上级菜单">
            <Option value="">作为一级菜单</Option>
            <Option v-for="menu in parentMenuOptions" :key="menu.id" :value="menu.id">
              {{ menu.programName }}
            </Option>
          </Select>
        </FormItem>
      </Form>
    </Modal>
  </div>
</template>

<script>
export default {
  name: 'MenuManagement',
  data() {
    return {
      // 表格数据
      menuData: [],
      displayMenuData: [], // 用于展示的数据（包含展开的子菜单）
      loading: false,

      // 展开状态记录
      expandedRows: {},

      // 表格列配置
      tableColumns: [
        {
          title: '菜单名称',
          key: 'programName',
          minWidth: 250,
          render: (h, params) => {
            const row = params.row;
            const indent = '  '.repeat(row._level - 1); // 根据层级缩进

            return h('div', {
              class: 'menu-name-cell',
              style: {
                paddingLeft: `${(row._level - 1) * 20 + 10}px`
              }
            }, [
              // 如果有子菜单，显示展开图标
              row.childrenProgramList && row.childrenProgramList.length > 0 ?
                h('Icon', {
                  props: {
                    type: this.expandedRows[row.id] ? 'ios-arrow-down' : 'ios-arrow-forward'
                  },
                  style: {
                    marginRight: '8px',
                    cursor: 'pointer',
                    fontSize: '14px'
                  },
                  on: {
                    click: (e) => {
                      e.stopPropagation();
                      this.toggleExpand(row);
                    }
                  }
                }) :
                h('span', {
                  style: {
                    display: 'inline-block',
                    width: '20px',
                    marginRight: '8px'
                  }
                }),

              // 菜单图标
              h('Icon', {
                props: {
                  type: this.getMenuIcon(row.levelCode)
                },
                style: {
                  marginRight: '8px',
                  color: this.getMenuIconColor(row.levelCode)
                }
              }),

              // 菜单名称
              h('span', {
                style: {
                  marginRight: '8px',
                  fontWeight: row.levelCode === 1 ? 'bold' : 'normal'
                }
              }, row.programName)
            ]);
          }
        },
        {
          title: '层级',
          key: 'levelCode',
          width: 120,
          align: 'center',
          render: (h, params) => {
            const level = params.row.levelCode;
            let text = '';
            let color = '#afb1b5';
            switch (level) {
              case 1:
                text = '一级菜单';
                break;
              case 2:
                text = '二级菜单';
                break;
              case 3:
                text = '三级菜单';
                break;
              default:
                text = '未知';
            }
            return h('Tag', {
              props: {
                color: color
              },
              style: {
                color: '#fff', // 添加白色文字确保可见性
                fontWeight: 'bold'
              }
            }, text);
          }
        },
        {
          title: '菜单路径',
          key: 'programUrl',
          width: 150,
          align: 'center',
          render: (h, params) => {
            return h('span', params.row.programUrl || '-');
          }
        },
        // {
        //   title: '创建时间',
        //   key: 'createTime',
        //   width: 180,
        //   align: 'center',
        //   render: (h, params) => {
        //     return h('span', params.row.createTime || '-');
        //   }
        // },
        {
          title: '操作',
          slot: 'action',
          width: 230,
          align: 'center',
          // fixed: 'right',
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
                  click: () => this.handleAddSubMenu(params.row)
                }
              }, '新增子菜单'),
              h('i-button', {
                props: {
                  type: 'warning',
                  size: 'small'
                },
                style: {
                  marginRight: '5px'
                },
                on: {
                  click: () => this.handleEditMenu(params.row)
                }
              }, '修改菜单'),
              h('i-button', {
                props: {
                  type: 'error',
                  size: 'small'
                },
                on: {
                  click: () => this.handleDeleteMenu(params.row)
                }
              }, '删除')
            ]);
          }
        }
      ],

      // 模态框相关
      modalVisible: false,
      modalTitle: '新增菜单',
      modalLoading: false,
      modalType: 'add', // add, edit
      currentMenu: null,

      // 菜单表单
      menuForm: {
        id: '',
        programName: '',
        programUrl: '',
        parentId: '',
      },

      // 表单验证规则
      menuRules: {
        programName: [
          { required: true, message: '请输入菜单名称', trigger: 'blur' }
        ],
        programUrl: [
          { required: true, message: '请输入菜单路径', trigger: 'blur' }
        ]
      },

      // 上级菜单选项
      parentMenuOptions: [],
      showParentSelect: false
    };
  },
  watch: {
    menuData: {
      handler() {
        this.updateDisplayData();
      },
      deep: true
    },
    expandedRows: {
      handler() {
        this.updateDisplayData();
      },
      deep: true
    }
  },
  computed: {
    // 计算所有可选的父级菜单（用于下拉选择）
    computedParentMenuOptions() {
      const options = [];
      const addMenuToOptions = (menu, level = 0) => {
        // 如果是三级菜单，不能作为父级
        if (menu.levelCode >= 3) return;

        // 过滤掉当前编辑的菜单及其子菜单
        if (this.modalType === 'edit' && (
          menu.id === this.currentMenu.id ||
          this.isDescendant(menu, this.currentMenu)
        )) {
          return;
        }

        const prefix = '─'.repeat(level) + (level > 0 ? ' ' : '');
        options.push({
          ...menu,
          programName: prefix + menu.programName
        });

        // 递归处理子菜单
        if (menu.childrenProgramList && menu.childrenProgramList.length > 0) {
          menu.childrenProgramList.forEach(child => {
            addMenuToOptions(child, level + 1);
          });
        }
      };

      this.menuData.forEach(menu => {
        addMenuToOptions(menu);
      });

      return options;
    }
  },
  methods: {
    // 获取菜单列表
    async getMenuList() {
      this.loading = true;
      try {
        const params = { isOperate: 1 };
        const res = await this.$api.getProgram(params);
        if (res.code === 200) {
          this.menuData = res.data || [];
          // 初始化展开状态：默认展开一级菜单
          const expanded = {};
          this.menuData.forEach(menu => {
            expanded[menu.id] = true;
          });
          this.expandedRows = expanded;
          this.updateDisplayData();
        } else {
          this.$Message.error(res.message || '获取菜单列表失败');
        }
      } catch (error) {
        console.error('获取菜单列表失败:', error);
        this.$Message.error('获取菜单列表失败');
      } finally {
        this.loading = false;
      }
    },

    // 更新显示数据（根据展开状态）
    updateDisplayData() {
      const result = [];

      const processMenu = (menu, level = 1) => {
        // 添加当前菜单
        result.push({
          ...menu,
          _level: level,
          _hasChildren: menu.childrenProgramList && menu.childrenProgramList.length > 0
        });

        // 如果展开状态为true且有子菜单，则添加子菜单
        if (this.expandedRows[menu.id] && menu.childrenProgramList && menu.childrenProgramList.length > 0) {
          menu.childrenProgramList.forEach(child => {
            processMenu(child, level + 1);
          });
        }
      };

      this.menuData.forEach(menu => {
        processMenu(menu, 1);
      });

      this.displayMenuData = result;
    },

    // 添加一级菜单
    addFirstLevelMenu() {
      this.modalType = 'add';
      this.modalTitle = '新增一级菜单';
      this.showParentSelect = false;
      this.menuForm = {
        programName: '',
        programUrl: '',
        parentId: ''
      };
      this.modalVisible = true;
    },

    // 添加子菜单
    handleAddSubMenu(row) {
      this.modalType = 'add';
      this.currentMenu = row;
      this.modalTitle = `新增${this.getLevelText(row.levelCode + 1)}菜单`;
      this.showParentSelect = false; // 不需要显示上级菜单选择，直接使用当前菜单的ID

      this.menuForm = {
        programName: '',
        programUrl: '',
        parentId: row.id, // 直接使用当前菜单的ID作为parentId
      };
      this.modalVisible = true;
    },

    // 编辑菜单
    handleEditMenu(row) {
      this.modalType = 'edit';
      this.currentMenu = row;
      this.modalTitle = '编辑菜单';
      this.showParentSelect = row.levelCode > 1; // 一级菜单不能修改父级

      if (row.levelCode > 1) {
        this.parentMenuOptions = this.computedParentMenuOptions;
      }

      this.menuForm = {
        programName: row.programName,
        programUrl: row.programUrl,
        parentId: row.parentId || '',
        id: row.id
      };
      this.modalVisible = true;
    },

    // 删除菜单
    handleDeleteMenu(row) {
      this.$Modal.confirm({
        title: '确认删除',
        content: `确定要删除菜单「${row.programName}」吗？删除后无法恢复！`,
        onOk: async () => {
          try {
            // 这里调用删除接口
            // const res = await this.$api.deleteMenu({ id: row.id });
            // if (res.code === 200) {
            //   this.$Message.success('删除成功');
            //   this.getMenuList();
            // } else {
            //   this.$Message.error(res.message || '删除失败');
            // }
            this.$Message.success('删除功能待实现');
          } catch (error) {
            this.$Message.error('删除失败');
          }
        }
      });
    },

    // 模态框提交
    async handleModalSubmit() {
      this.$refs.menuForm.validate(async (valid) => {
        if (!valid) return;

        this.modalLoading = true;
        try {
          const params = { ...this.menuForm };

          // 这里调用新增或编辑接口
          if (this.modalType === 'add') {
            console.log('新增参数:', params);
            const res = await this.$api.addProgram(params);
            if (res.code === 200) {
              this.$Message.success('新增成功');
              this.modalVisible = false;
              this.getMenuList();
            } else {
              this.$Message.error(res.message || '新增失败');
            }
          } else {
            console.log('编辑参数:', params);
            const res = await this.$api.updateProgram(params);
            if (res.code === 200) {
              this.$Message.success('编辑成功');
              this.modalVisible = false;
              this.getMenuList();
            } else {
              this.$Message.error(res.message || '编辑失败');
            }
          }
        } catch (error) {
          console.error('操作失败:', error);
          this.$Message.error('操作失败');
        } finally {
          this.modalLoading = false;
        }
      });
    },

    // 模态框取消
    handleModalCancel() {
      this.modalVisible = false;
      this.$refs.menuForm.resetFields();
    },

    // 切换展开状态
    toggleExpand(row) {
      this.$set(this.expandedRows, row.id, !this.expandedRows[row.id]);
    },

    // 获取菜单图标
    getMenuIcon(levelCode) {
      switch (levelCode) {
        case 1: return 'md-apps';
        case 2: return 'md-folder';
        case 3: return 'md-document';
        default: return 'md-document';
      }
    },

    // 获取菜单图标颜色
    getMenuIconColor(levelCode) {
      switch (levelCode) {
        case 1: return '#1890ff';
        case 2: return '#52c41a';
        case 3: return '#faad14';
        default: return '#666';
      }
    },

    // 获取层级文本
    getLevelText(level) {
      switch (level) {
        case 1: return '一级';
        case 2: return '二级';
        case 3: return '三级';
        default: return '';
      }
    },

    // 检查是否为后代菜单
    isDescendant(menu, target) {
      if (!menu.childrenProgramList || menu.childrenProgramList.length === 0) {
        return false;
      }

      for (const child of menu.childrenProgramList) {
        if (child.id === target.id) {
          return true;
        }
        if (this.isDescendant(child, target)) {
          return true;
        }
      }

      return false;
    }
  },
  mounted() {
    this.getMenuList();
  }
};
</script>

<style scoped>
.menu-management {
  padding: 16px;
  background: #fff;
}

.search-container {
  /* padding: 16px;
  background: #fafafa; */
  border-radius: 4px;
  margin-bottom: 16px;
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

.menu-table {
  margin-top: 16px;
}

.menu-tree-table {
  width: 100%;
}

.menu-name-cell {
  display: flex;
  align-items: center;
  padding: 8px 0;
  transition: background-color 0.3s;
}

.menu-name-cell:hover {
  background-color: #fafafa;
}

.action-buttons {
  display: flex;
  justify-content: center;
  align-items: center;
}

.add-btn {
  background: #52c41a;
  border-color: #52c41a;
}

.add-btn:hover {
  background: #73d13d;
  border-color: #73d13d;
}

/* 确保操作列按钮可见 */
.action-buttons .ivu-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
}

/* 确保层级标签文字可见 */
:deep(.ivu-tag-primary) {
  background-color: #1890ff !important;
  border-color: #1890ff !important;
  color: #fff !important;
}

:deep(.ivu-tag-success) {
  background-color: #52c41a !important;
  border-color: #52c41a !important;
  color: #fff !important;
}

:deep(.ivu-tag-warning) {
  background-color: #faad14 !important;
  border-color: #faad14 !important;
  color: #fff !important;
}

:deep(.ivu-tag-default) {
  background-color: #d9d9d9 !important;
  border-color: #d9d9d9 !important;
  color: #fff !important;
}
</style>