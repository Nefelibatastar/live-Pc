// import axios from 'axios';
import request from '../utils/request'; // 引入封装好的request（而非直接用axios）

let base = '/api';

// 统一封装所有API接口
const api = {
  // 登录相关
  requestLogin: (params) => request.post(`${base}/user/login`, params),

  // 系统菜单相关
  getProgram: (params) => request.get(`${base}/program/getProgram`, { params }),
  // 新增菜单
  addProgram: (params) => request.post(`${base}/program/addProgram`, params),
  // 修改菜单
  updateProgram: (params) => request.post(`${base}/program/updateProgram`, params),
  // 删除菜单
  deleteProgram: (params) => request.post(`${base}/program/deleteProgram`, params),

  // 角色相关
  // role/getRoleList 后台角色列表
  getRoleList: (params) => request.get(`${base}/role/getRoleList`, { params }),
  // role/addRole 新增角色,并授权菜单
  addRole: (params) => request.post(`${base}/role/addRole`, params),
  // role/getRole 根据id获取角色详情 roleId
  getRole: (params) => request.get(`${base}/role/getRole`, { params }),
  // role/updateRole 修改角色,并修改菜单
  updateRole: (params) => request.post(`${base}/role/updateRole`, params),
  // role/deleteRole 删除角色
  deleteRole: (params) => request.post(`${base}/role/deleteRole`, params),

  // 用户相关
  // user/getUserList 后台用户列表
  getUserList: (params) => request.get(`${base}/user/getUserList`, { params }),
  // user/addUser 用户新增
  addUser: (params) => request.post(`${base}/user/addUser`, params),
  // user/updateUser修改用户
  updateUser: (params) => request.post(`${base}/user/updateUser`, params),
  // user/deleUser 删除用户
  deleUser: (params) => request.post(`${base}/user/deleUser`, params),

  // 直播相关
  // liveStream/list 查询直播创建和推/播流信息
  list: (params) => request.get(`${base}/liveStream/list`, { params }),
  // liveStream/add 新增直播创建和推/播流信息
  addLive: (params) => request.post(`${base}/liveStream/add`, params),
  // liveStream/update 修改直播创建和推/播流信息
  updateLive: (params) => request.put(`${base}/liveStream/update`, params),
  // liveStream/delete/{id}删除直播创建和推/播流信息
  deleteLive: (params) => request.delete(`${base}/liveStream/delete/${params}`),
  // sysFile/upload 文件上传
  upload: (params) => request.post(`${base}/sysFile/upload`, params),
  // sysFile/image/{id}根据ID获取图片
  getImage: (params) => request.get(`${base}/sysFile/image/${params}`),
  // sysFile/delete/{id} 文件删除
  delete: (params) => request.delete(`${base}/sysFile/delete/${params}`),
};

export default api;