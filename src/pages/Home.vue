<template>
    <div class="layout" :class="{ 'layout-hide-text': spanLeft < 5 }">
        <Row type="flex">
            <!-- 左侧菜单栏 -->
            <i-col :span="spanLeft" class="layout-menu-left">
                <Menu :mode="modeType" theme="dark" width="auto" :active-name="activeName" :open-names="openNames"
                    @on-select="menuSelect" accordion>
                    <!-- logo区域 -->
                    <div class="layout-logo-left">
                        <Icon type="paper-airplane" :size="logoSize" v-show="logoIsDisplay"></Icon>
                        <span class="layout-text"> Admin 管理系统</span>
                    </div>

                    <!-- 使用递归菜单组件渲染多级菜单 -->
                    <template v-if="spanLeft >= 5">
                        <RecursiveMenu :menuList="menuList" :iconSize="iconSize" />
                    </template>
                </Menu>
            </i-col>

            <!-- 右侧内容区 -->
            <i-col :span="spanRight">
                <div class="layout-header">
                    <i-button type="text" @click="toggleClick">
                        <Icon type="navicon" size="32"></Icon>
                    </i-button>
                    <div class="userinfo">
                        <Dropdown placement="bottom-end">
                            <span class="head-img">
                                {{ curUserName }}
                                <img src="../assets/user.jpg" />
                            </span>
                            <Dropdown-menu slot="list">
                                <Dropdown-item @click.native="modifyPassWord()">修改密码</Dropdown-item>
                                <Dropdown-item @click.native="logout()" divided>退出</Dropdown-item>
                            </Dropdown-menu>
                        </Dropdown>
                    </div>
                </div>

                <div class="layout-breadcrumb">
                    <Breadcrumb>
                        <Breadcrumb-item href="/welcome">应用中心</Breadcrumb-item>
                        <Breadcrumb-item>{{ $route.name }}</Breadcrumb-item>
                    </Breadcrumb>
                </div>

                <div class="layout-content">
                    <div class="layout-content-main">
                        <router-view></router-view>
                    </div>
                </div>
            </i-col>
        </Row>

        <!-- 修改密码模态框 -->
        <Modal v-model="modal1" title="修改密码" @on-ok.prevent="confirmModifyPS" @on-cancel="cancel">
            <Form ref="formValidate" :model="formValidate" :rules="ruleValidate" :label-width="100">
                <Form-item label="原密码" prop="oldPassword">
                    <Input v-model="formValidate.oldPassword" placeholder="请输入原始密码"></Input>
                </Form-item>
                <Form-item label="新密码" prop="newPassword">
                    <Input v-model="formValidate.newPassword" placeholder="请输入新密码"></Input>
                </Form-item>
                <Form-item label="确认新密码" prop="resetPassword">
                    <Input v-model="formValidate.resetPassword" placeholder="请再次输入新密码"></Input>
                </Form-item>
            </Form>
        </Modal>
    </div>
</template>

<script>
import RecursiveMenu from './menu/RecursiveMenu.vue'; // 根据实际路径调整

export default {
    components: {
        RecursiveMenu
    },
    data() {
        return {
            openNames: [], // 存储需要展开的菜单项 name (programUrl)
            activeName: '', // 当前选中的菜单项 name (programUrl)
            isOperate: 0,
            curUserName: localStorage.getItem('userName') && localStorage.getItem('userName').replace(/\"/g, '') || '',
            modeType: 'vertical',
            spanLeft: 5,
            spanRight: 19,
            logoIsDisplay: false,
            loading: true,
            modal1: false,
            formValidate: {
                oldPassword: '',
                newPassword: '',
                resetPassword: ''
            },
            ruleValidate: {
                oldPassword: [{ required: true, message: '密码不能为空', trigger: 'blur' }],
                newPassword: [{ required: true, message: '密码不能为空', trigger: 'blur' }],
                resetPassword: [{ required: true, message: '密码不能为空', trigger: 'blur' }]
            },
            menuList: [] // 存储菜单数据
        };
    },
    computed: {
        // 菜单图标大小，根据左侧栏宽度变化
        iconSize() {
            return this.spanLeft === 5 ? 14 : 24;
        },
        // logo 图标大小，同时控制文字是否显示
        logoSize() {
            if (this.spanLeft !== 5) {
                this.logoIsDisplay = true;
                return 50;
            } else {
                this.logoIsDisplay = false;
                return 0;
            }
        }
    },
    created() {
        this.getMenuList();
    },
    methods: {
        // 获取菜单列表
        getMenuList() {
            const para = { isOperate: this.isOperate };
            this.$api
                .getProgram(para)
                .then((res) => {
                    if (res.code === 200) {
                        this.menuList = res.data;
                        // 菜单加载完成后，根据当前路由设置展开项和高亮项
                        this.$nextTick(() => {
                            this.setOpenNamesByCurrentRoute();
                            this.setActiveNameByCurrentRoute();
                        });
                    } else {
                        this.$Message.error('获取菜单失败：' + res.message);
                        this.$router.push('/login');
                    }
                })
                .catch((err) => {
                    console.error('获取菜单接口报错：', err);
                    this.$Message.error('接口请求失败，请稍后重试');
                });
        },

        // 根据当前路由路径设置 openNames（自动展开对应父级）
        setOpenNamesByCurrentRoute() {
            const currentPath = this.$route.path;
            const openNames = this.findParentUrls(this.menuList, currentPath);
            this.openNames = openNames || [];
        },

        // 根据当前路由路径设置 activeName
        setActiveNameByCurrentRoute() {
            const currentPath = this.$route.path;
            // 如果当前路径在菜单中存在，则高亮；否则保持默认（或清空）
            if (this.findMenuByUrl(this.menuList, currentPath)) {
                this.activeName = currentPath;
            } else {
                this.activeName = '';
            }
        },

        // 递归查找某个 url 的所有父级 url（用于 openNames）
        findParentUrls(menuList, targetUrl, parents = []) {
            for (const menu of menuList) {
                if (menu.programUrl === targetUrl) {
                    return parents; // 找到目标，返回所有祖先
                }
                if (menu.childrenProgramList && menu.childrenProgramList.length) {
                    const result = this.findParentUrls(menu.childrenProgramList, targetUrl, [
                        ...parents,
                        menu.programUrl
                    ]);
                    if (result) return result;
                }
            }
            return null;
        },

        // 根据 url 查找菜单项是否存在（用于验证）
        findMenuByUrl(menuList, targetUrl) {
            for (const menu of menuList) {
                if (menu.programUrl === targetUrl) return true;
                if (menu.childrenProgramList && menu.childrenProgramList.length) {
                    if (this.findMenuByUrl(menu.childrenProgramList, targetUrl)) return true;
                }
            }
            return false;
        },

        // 切换左侧菜单折叠
        toggleClick() {
            if (this.spanLeft === 5) {
                this.spanLeft = 1;
                this.spanRight = 23;
            } else {
                this.spanLeft = 5;
                this.spanRight = 19;
            }
        },

        // 打开修改密码模态框
        modifyPassWord() {
            this.modal1 = true;
        },

        // 退出登录
        logout() {
            localStorage.removeItem('admin_token');
            localStorage.removeItem('userInfo');
            localStorage.removeItem('userName');
            this.$router.push('/login');
        },

        // 确认修改密码
        confirmModifyPS() {
            this.$refs.formValidate.validate((valid) => {
                if (valid) {
                    // 此处应调用修改密码接口，示例仅为提示
                    this.$Message.success('修改成功');
                    this.modal1 = false;
                    this.$refs.formValidate.resetFields();
                } else {
                    this.$Message.error('表单验证失败');
                }
            });
        },

        // 取消修改密码
        cancel() {
            this.modal1 = false;
            this.$refs.formValidate.resetFields();
        },

        // 菜单选中事件
        menuSelect(name) {
            // name 对应菜单项的 programUrl
            const fullPath = name.startsWith('/') ? name : '/' + name;
            this.activeName = fullPath; // 更新高亮

            // 根据新选中的菜单，更新 openNames 以展开其父级
            const openNames = this.findParentUrls(this.menuList, fullPath);
            this.openNames = openNames || [];

            // 路由跳转
            this.$router.push({ path: fullPath });
        },

        // 下拉菜单选项（原代码中的方法，可能未使用）
        dropDown(name) {
            this.$router.push({ path: name });
            console.log(name);
        }
    }
};
</script>

<style scoped>
.layout {
    background: #f5f7f9;
    position: relative;
    overflow: hidden;
    height: 100%;
}

.layout-breadcrumb {
    padding: 10px 15px 0;
}

.layout-content {
    min-height: 220px;
    margin: 15px;
    overflow: auto;
    background: #fff;
    border-radius: 4px;
}

.layout-content-main {
    padding: 10px;
}

.layout-copy {
    text-align: center;
    padding: 10px 0 20px;
    color: #9ea7b4;
}

.layout-menu-left {
    background: #464c5b;
}

.layout-header {
    height: 60px;
    background: #fff;
}

.layout-logo-left {
    width: 90%;
    height: 60px;
    line-height: 60px;
    font-size: 28px;
    text-align: center;
}

.layout-ceiling-main a {
    color: #9ba7b5;
}

.layout-hide-text .layout-text {
    display: none;
}

.ivu-col {
    transition: width 0.2s ease-in-out;
}

.ivu-row-flex {
    height: 100%;
}

.userinfo {
    display: inline-block;
    float: right;
}

.userinfo .ivu-dropdown {
    margin-top: 50px;
}

.ivu-dropdown {
    margin-right: 25px;
    margin-top: 22px;
}

.ivu-menu-submenu-title {
    padding: 14px;
}

.head-img {
    width: 100%;
    height: 60px;
    line-height: 60px;
    float: right;
    margin-top: -50px;
}

.head-img img {
    border-radius: 20px;
    margin: 10px 0px 10px 10px;
    width: 40px;
    height: 40px;
    float: right;
}
</style>

<style scoped>
.ivu-select-dropdown .ivu-dropdown {
    margin: 0px 12px 0px 0px;
}

._dropdownList {
    /*  width: 100%;
    text-align: center; */
}

._iconCls {
    width: 56px;
    text-align: center;
}
</style>