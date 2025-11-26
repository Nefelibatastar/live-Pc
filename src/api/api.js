// import axios from 'axios';
import request from '../utils/request'; // 引入封装好的request（而非直接用axios）

// let base = 'http://192.168.3.19:8082';
let base = '/api';

// 统一封装所有API接口
const api = {
  // 登录相关
  requestLogin: (params) => request.post(`${base}/user/login`, params),

  // 系统相关
  getProgram: (params) => request.get(`${base}/program/getProgram`, { params }),

  // 角色相关
  // role/getRoleList 后台角色列表
  getRoleList: (params) => request.get(`${base}/role/getRoleList`, {params}),
  // role/addRole 新增角色,并授权菜单
  addRole: (params) => request.post(`${base}/role/addRole`, params),
  // role/getRole 根据id获取角色详情 roleId
  getRole: (params) => request.get(`${base}/role/getRole`, {params}),
  // role/updateRole 修改角色,并修改菜单
  updateRole: (params) => request.post(`${base}/role/updateRole`, params),
  // role/deleteRole 删除角色
  deleteRole: (params) => request.post(`${base}/role/deleteRole`, params),

  // 用户相关
  // user/getUserList 后台用户列表
  getUserList: (params) => request.get(`${base}/user/getUserList`, {params}),
  // user/addUser 用户新增
  addUser: (params) => request.post(`${base}/user/addUser`, params),
  // user/updateUser修改用户
  updateUser: (params) => request.post(`${base}/user/updateUser`, params),
  // user/deleUser 删除用户
  deleUser: (params) => request.post(`${base}/user/deleUser`, params),
};

export default api;