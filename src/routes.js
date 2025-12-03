import Login from './pages/Login.vue'
import NotFound from './pages/404.vue'
import Home from './pages/Home.vue'
import Main from './pages/Main.vue'
import Table from './pages/nav1/Table.vue'
import Form from './pages/nav1/Form.vue'
import user from './pages/nav1/user.vue'
import Page4 from './pages/nav2/Page4.vue'
import Page5 from './pages/nav2/Page5.vue'
import Page6 from './pages/nav3/Page6.vue'
import echarts from './pages/charts/echarts.vue'
import RoleManage from './pages/role/RoleManage.vue'
import UserManage from './pages/user/UserManage.vue'
import LiveManage from './pages/live/LiveManage.vue'
import MenuManage from './pages/menu/menuManage.vue'
let routes = [
    {
        path: '/login',
        component: Login,
        name: '',
        hidden: true
    },
    {
        path: '/404',
        component: NotFound,
        name: '',
        hidden: true
    },
    // 唯一父布局：Home组件（所有页面都嵌套在Home中）
    {
        path: '/',
        component: Home,
        hidden: false,
        // 移除静态菜单配置（name、iconCls等，菜单由接口动态生成）
        children: [
            { path: '', redirect: '/welcome', hidden: false },
            // 子页面路由（对应接口返回的programUrl）
            {
                path: '/role', // 这就是programUrl，用于跳转的路径
                component: RoleManage,
                name: '角色管理', // 菜单显示的名称
                hidden: false // 设为false，确保菜单显示
            },
            {
                path: '/user', // 
                component: UserManage,
                name: '用户管理', // 菜单显示的名称
                hidden: false // 设为false，确保菜单显示
            },
            {
                path: '/caidanguanli',
                component: MenuManage,
                name: '菜单管理',
                hidden: false
            },
            {
                path: '/zhiboxiangmu', // 
                component: LiveManage,
                name: '直播项目', // 菜单显示的名称
                hidden: false // 设为false，确保菜单显示
            },
            { path: '/main', component: Main, name: '主页', hidden: true },
            { path: '/table', component: Table, name: '表格' },
            { path: '/form', component: Form, name: '表单' },
            { path: '/user', component: user, name: '列表' },
            { path: '/page4', component: Page4, name: '页面4' },
            { path: '/page5', component: Page5, name: '页面5' },
            { path: '/welcome', component: Page6, name: '欢迎使用' },
            { path: '/echarts', component: echarts, name: 'echarts' }

        ]
    },
    {
        path: '*',
        hidden: true,
        redirect: { path: '/404' }
    }
];

export default routes;