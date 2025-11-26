<template>
    <i-form ref="formLogin" :model="formLogin" :rules="formLoginRules" class="card-box">
        <Form-item class="formLogin-title">
            <h3>后台管理系统登录</h3>
        </Form-item>

        <Form-item prop="loginName">
            <i-input size="large" type="text" v-model="formLogin.loginName" placeholder="用户名">
                <Icon type="ios-person-outline" slot="prepend"></Icon>
            </i-input>
        </Form-item>
        <Form-item prop="password">
            <i-input size="large" type="password" v-model="formLogin.password" placeholder="密码">
                <Icon type="ios-locked-outline" slot="prepend"></Icon>
            </i-input>
        </Form-item>
        <Form-item class="login-no-bottom">
            <Row>
                <i-col :xs="{ span: 4, offset: 6 }">
                    <i-button type="primary" @click="handleSubmit('formLogin')">登录</i-button>
                </i-col>
                <i-col :xs="{ span: 4, offset: 6 }">
                    <i-button type="primary" @click="formLoginReset('formLogin')">重置</i-button>
                </i-col>
            </Row>
        </Form-item>
    </i-form>
</template>
<script>
export default {
    data() {
        return {
            formLogin: {
                loginName: 'superadmin',
                password: '000000'
            },
            formLoginRules: {
                loginName: [
                    { required: true, message: '请填写用户名', trigger: 'blur' }
                ],
                password: [
                    { required: true, message: '请填写密码', trigger: 'blur' },
                    { type: 'string', message: '', trigger: 'blur' }
                ]
            }
        }
    },
    methods: {
        handleSubmit(name) {
            this.$refs[name].validate((valid) => {
                if (valid) {
                    // 直接通过 this.$api 调用
                    this.$api.requestLogin(this.formLogin)
                        .then(res => {
                            if (res.code === 200) {
                                // 1. 存储 token 到 localStorage（供请求头 Authorization 使用）
                                const token = res.data.token;
                                if (token) {
                                    localStorage.setItem('admin_token', token);
                                }
                                const userInfo = res.data.user;
                                if (userInfo) {
                                    localStorage.setItem('userInfo', JSON.stringify(userInfo));
                                    // 可单独存储常用字段（如用户名用于显示）
                                    localStorage.setItem('userName', userInfo.userName);
                                }
                                this.$Message.success('登录成功!');
                                // 跳转首页
                                this.$router.push('/welcome');
                            } else {
                                this.$Message.error(res.msg || '登录失败');
                            }
                        })
                        .catch(err => {
                            console.error('登录失败:', err);
                        });
                }
            });
        },
        formLoginReset(name) {
            this.$refs[name].resetFields();
        }
    },
    mounted() {
        if (localStorage.getItem('loginName')) {
            this.formLogin.loginName = JSON.parse(localStorage.getItem('loginName'));
        }
        if (localStorage.getItem('password')) {
            this.formLogin.password = JSON.parse(localStorage.getItem('password'));
        }
    }
}
</script>


<style scoped>
.card-box {
    padding: 20px;
    /*box-shadow: 0 0px 8px 0 rgba(0, 0, 0, 0.06), 0 1px 0px 0 rgba(0, 0, 0, 0.02);*/
    -webkit-border-radius: 5px;
    border-radius: 5px;
    -moz-border-radius: 5px;
    background-clip: padding-box;
    margin-bottom: 20px;
    background-color: #F9FAFC;
    margin: 180px auto;
    width: 400px;
    /* border: 2px solid #8492A6;*/
}

.title {
    margin: 0px auto 40px auto;
    text-align: center;
    color: #505458;
}

.formLogin-title {
    text-align: center;
    font-size: 28px;
}

.formLogin-title h3 {
    font-size: 18px;
}

.login-no-bottom {
    margin-bottom: 10px;
}
</style>