<!-- LiveManage/index.vue -->
<template>
  <div>
    <!-- 查询区域 -->
    <div class="search-container">
      <Row :gutter="16" class="search-row">
        <!-- 直播名称搜索框 -->
        <Col :span="6">
        <i-input v-model="queryForm.liveShowName" placeholder="请输入直播名称" class="search-input"></i-input>
        </Col>
        <!-- 按钮区域 -->
        <Col :span="18" class="btn-group">
        <i-button type="default" @click="resetQuery">清空</i-button>
        <i-button type="primary" @click="searchLive">搜索</i-button>
        <i-button type="success" @click="openCreateModal">创建直播</i-button>
        </Col>
      </Row>
    </div>

    <!-- 直播列表表格 -->
    <Table :context="self" :data="tableData" :columns="tableColumns" stripe border></Table>

    <!-- 分页控件 -->
    <div style="margin: 10px; overflow: hidden">
      <div style="float: right;">
        <Page :total="total" :current="pageNum" :page-size="pageSize" @on-change="handlePageChange"
          @on-page-size-change="handlePageSizeChange" show-total show-size-changer></Page>
      </div>
    </div>

    <!-- 导入所有弹框组件 -->
    <CreateEditLiveModal
      :visible="createEditModalVisible"
      :isEditMode="isEditMode"
      :liveData="selectedLive"
      @update:visible="val => createEditModalVisible = val"
      @submit="handleLiveSubmit"
      @cancel="handleCreateCancel"
      @preview-image="previewCoverImage"
    />
    
    <StreamUrlModal
      :visible="streamUrlModalVisible"
      type="push"
      :streamUrls="currentStreamUrls"
      @update:visible="val => streamUrlModalVisible = val"
    />
    
    <StreamUrlModal
      :visible="streamUrlModal"
      type="pull"
      :streamUrls="currentStreamUrls"
      :liveId="currentId"
      @update:visible="val => streamUrlModal = val"
    />
    
    <ImagePreviewModal
      :visible="previewModalVisible"
      :imageUrl="previewImageUrl"
      @update:visible="val => previewModalVisible = val"
    />
    
    <RegistrationModal
      :visible="registrationModalVisible"
      :liveId="currentLiveId"
      :entryFromData="currentLiveEntryData"
      :liveName="currentLiveName"
      @update:visible="val => registrationModalVisible = val"
    />
    
    <CommentModal
      :visible="commentModalVisible"
      :liveStreamId="currentCommentLiveId"
      :liveName="currentCommentLiveName"
      @update:visible="val => commentModalVisible = val"
    />
    
    <LiveStats 
      :visible="statsModalVisible" 
      :liveStreamId="currentLiveId"
      @update:visible="val => statsModalVisible = val"
    />
  </div>
</template>

<script>
// import { config } from '../../config'
import { mapState, mapActions } from 'vuex';

// 导入弹框组件
import CreateEditLiveModal from './CreateEditLiveModal.vue'
import StreamUrlModal from './StreamUrlModal.vue'
import ImagePreviewModal from './ImagePreviewModal.vue'
import RegistrationModal from './RegistrationModal.vue'
import CommentModal from './CommentModal.vue'
import LiveStats from './liveStats.vue'

export default {
  name: 'LiveManage',
  components: {
    CreateEditLiveModal,
    StreamUrlModal,
    ImagePreviewModal,
    RegistrationModal,
    CommentModal,
    LiveStats
  },
  data() {
    return {
      self: this,
      tableData: [],
      currentId: '',
      total: 0,
      pageNum: 1,
      pageSize: 10,
      queryForm: {
        liveShowName: ''
      },
      
      // 弹框显示状态
      createEditModalVisible: false,
      streamUrlModalVisible: false,
      streamUrlModal: false,
      previewModalVisible: false,
      registrationModalVisible: false,
      commentModalVisible: false,
      statsModalVisible: false,
      
      // 弹框数据
      isEditMode: false,
      selectedLive: {},
      currentStreamUrls: {
        pullFlvUrl: '',
        pullM3u8Url: '',
        pullRtmpUrl: '',
        pushRtmpUrl: ''
      },
      previewImageUrl: '',
      currentLiveId: '',
      currentLiveEntryData: null,
      currentLiveName: '',
      currentCommentLiveId: '',
      currentCommentLiveName: '',
      
      // 表格列配置
      tableColumns: [
        {
          title: '直播名称',
          key: 'liveShowName',
          align: 'center',
          width: 210
        },
        {
          title: '封面图',
          key: 'liveCover',
          align: 'center',
          width: 121,
          render: (h, params) => {
            const coverId = params.row.liveCover;
            if (!coverId) {
              return h('span', '无封面');
            }
            const imgUrl = `/api/sysFile/image/${coverId}`;
            return h('div', [
              h('img', {
                attrs: { src: imgUrl, alt: '封面图' },
                style: {
                  width: '60px',
                  height: '34px',
                  objectFit: 'cover',
                  cursor: 'pointer',
                  borderRadius: '4px'
                },
                on: {
                  click: () => this.previewCoverImage(imgUrl)
                }
              })
            ]);
          }
        },
        {
          title: '创建时间',
          key: 'createTime',
          align: 'center',
          width: 150,
        },
        {
          title: '开始时间',
          key: 'startTime',
          align: 'center',
          width: 150,
        },
        {
          title: '直播状态',
          key: 'liveStatus',
          align: 'center',
          width: 110,
          render: (h, params) => {
            const status = params.row.liveStatus;
            const text = status == "0" ? "未开播" : status == "1" ? "已开播" : '未知';
            if (status === "0") {
              return h('Tag', {
                props: { color: 'error' },
                style: {
                  backgroundColor: 'rgb(174,174,174)',
                  color: '#fff',
                  borderColor: 'rgb(174,174,174)',
                  fontWeight: 'bold',
                }
              }, text);
            } else if (status === "1") {
              return h('Tag', {
                props: { color: 'success' },
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
          title: '播流地址',
          key: 'streamUrls',
          align: 'center',
          width: 100,
          render: (h, params) => {
            const row = params.row;
            const canShow = this.canShowStreamUrl(row);

            return h('i-button', {
              props: {
                type: canShow ? 'primary' : 'default',
                size: 'small',
                disabled: !canShow
              },
              on: {
                click: () => {
                  if (canShow) {
                    this.showStream(row);
                  } else {
                    this.$Message.warning('播流地址已失效，不可查看');
                  }
                }
              }
            }, canShow ? '查看地址' : '已失效');
          }
        },
        {
          title: '推流地址',
          key: 'streamUrl',
          align: 'center',
          width: 100,
          render: (h, params) => {
            const row = params.row;
            const canShow = this.canShowStreamUrl(row);

            return h('i-button', {
              props: {
                type: canShow ? 'primary' : 'default',
                size: 'small',
                disabled: !canShow
              },
              on: {
                click: () => {
                  if (canShow) {
                    this.showStreamUrls(row);
                  } else {
                    this.$Message.warning('推流地址已失效，不可查看');
                  }
                }
              }
            }, canShow ? '查看地址' : '已失效');
          }
        },
        {
          title: '用户报名表',
          key: 'registration',
          align: 'center',
          width: 100,
          render: (h, params) => {
            const row = params.row;
            const canViewRegistration = row.isEntryFrom === '1' && row.entryFromData && row.entryFromData.length > 0;

            return h('i-button', {
              props: {
                type: canViewRegistration ? 'primary' : 'default',
                size: 'small',
                disabled: !canViewRegistration
              },
              style: {
                marginRight: '0'
              },
              on: {
                click: () => {
                  if (canViewRegistration) {
                    this.openRegistrationModal(row);
                  } else {
                    this.$Message.warning('该直播暂无报名表，不可查看');
                  }
                }
              }
            }, canViewRegistration ? '查看' : '暂无');
          }
        },
        {
          title: '操作',
          key: 'action',
          width: 280,
          align: 'center',
          render: (h, params) => {
            return h('div', [
              h('i-button', {
                props: {
                  type: 'info',
                  size: 'small',
                  icon: 'ios-stats'
                },
                style: { marginRight: '5px' },
                on: {
                  click: () => this.openStatsModal(params.row)
                }
              }, '数据统计'),
              h('i-button', {
                props: {
                  type: 'info',
                  size: 'small',
                  icon: 'ios-chatbubbles'
                },
                style: { marginRight: '5px' },
                on: {
                  click: () => this.openCommentModal(params.row)
                }
              }, '评论列表'),
              h('i-button', {
                props: { type: 'warning', size: 'small' },
                style: { marginRight: '5px' },
                on: { click: () => this.editLive(params.index) }
              }, '编辑'),
              h('i-button', {
                props: { type: 'error', size: 'small' },
                on: { click: () => this.deleteLive(params.index) }
              }, '删除')
            ]);
          }
        }
      ]
    };
  },
  computed: {
    ...mapState('live', ['liveFormState'])
  },
  created() {
    this.getLiveList();
    if (this.$route.query.hasNewForm === 'true') {
      this.$Message.info('已有新增报名表');
      this.$router.replace({
        query: { ...this.$route.query, hasNewForm: undefined }
      });
    }
    this.RESTORE_LIVE_FORM_STATE();
  },
  beforeRouteLeave(to, from, next) {
    this.saveLiveFormState();
    next();
  },
  methods: {
    ...mapActions('live', ['saveLiveFormState', 'RESTORE_LIVE_FORM_STATE']),

    canShowStreamUrl(row) {
      if (row.liveStatus === "1") {
        return true;
      }

      if (row.liveStatus === "0" && row.startTime) {
        const startTime = new Date(row.startTime).getTime();
        const currentTime = new Date().getTime();
        const oneHour = 60 * 60 * 1000;

        return currentTime <= startTime + oneHour;
      }

      return false;
    },

    getLiveList() {
      const params = {
        pageNum: this.pageNum,
        pageSize: this.pageSize,
        liveShowName: this.queryForm.liveShowName || ''
      };
      this.$api.list(params)
        .then(res => {
          if (res.code === 200) {
            this.tableData = res.data.records || [];
            this.total = res.data.total || 0;
          } else {
            this.$Message.error('获取直播列表失败：' + res.message);
          }
        })
        .catch(err => {
          console.error('获取直播列表接口报错：', err);
          this.$Message.error('网络错误，请重试');
        });
    },

    searchLive() {
      this.pageNum = 1;
      this.getLiveList();
    },

    resetQuery() {
      this.queryForm = { liveShowName: '' };
      this.pageNum = 1;
      this.getLiveList();
    },

    handlePageChange(page) {
      this.pageNum = page;
      this.getLiveList();
    },

    handlePageSizeChange(size) {
      this.pageSize = size;
      this.pageNum = 1;
      this.getLiveList();
    },

    previewCoverImage(imgUrl) {
      if (!imgUrl) {
        this.$Message.warning('暂无图片可预览');
        return;
      }
      this.previewImageUrl = imgUrl;
      this.previewModalVisible = true;
    },

    // 编辑直播
    editLive(index) {
      const live = this.tableData[index];
      this.isEditMode = true;
      this.selectedLive = live;
      this.createEditModalVisible = true;
    },

    // 打开创建直播弹框
    openCreateModal() {
      this.isEditMode = false;
      this.selectedLive = {};
      this.createEditModalVisible = true;
    },

    // 处理直播表单提交
    handleLiveSubmit(submitData, isEditMode) {
      const apiMethod = isEditMode ? this.$api.updateLive : this.$api.addLive;
      apiMethod(submitData)
        .then(res => {
          if (res.code === 200) {
            this.$Message.success(isEditMode ? '修改成功' : '创建成功');
            this.createEditModalVisible = false;
            setTimeout(() => {
              this.getLiveList();
            }, 500);
          } else {
            this.$Message.error(res.message || '操作失败');
          }
        })
        .catch(err => {
          console.error('操作失败', err);
          this.$Message.error('网络错误，请重试');
        });
    },

    // 处理取消
    handleCreateCancel() {
      this.createEditModalVisible = false;
    },

    // 删除直播
    deleteLive(index) {
      const live = this.tableData[index];
      this.$Modal.confirm({
        title: '确认删除',
        content: `确定要删除直播「${live.liveShowName}」吗？此操作不可撤销！`,
        onOk: () => {
          this.$api.deleteLive(live.id)
            .then(res => {
              if (res.code === 200) {
                this.$Message.success('删除成功');
                this.getLiveList();
              } else {
                this.$Message.error('删除失败：' + res.message);
              }
            })
            .catch(err => {
              console.error('删除直播接口报错：', err);
              this.$Message.error('网络错误，请重试');
            });
        }
      });
    },

    // 显示推流地址
    showStreamUrls(row) {
      if (!this.canShowStreamUrl(row)) {
        this.$Message.warning('推流地址已失效，不可查看');
        return;
      }

      this.currentStreamUrls = {
        pushRtmpUrl: row.pushRtmpUrl || ''
      };
      this.streamUrlModalVisible = true;
    },

    // 显示播流地址
    showStream(row) {
      this.currentId = row.id;
      if (!this.canShowStreamUrl(row)) {
        this.$Message.warning('播流地址已失效，不可查看');
        return;
      }

      this.currentStreamUrls = {
        pullFlvUrl: row.pullFlvUrl || '',
        pullM3u8Url: row.pullM3u8Url || ''
      };
      this.streamUrlModal = true;
    },

    // 打开报名表弹框
    openRegistrationModal(row) {
      if (!row) {
        this.$Message.error('暂无报名信息');
        return;
      }

      this.currentLiveEntryData = row.entryFromData || [];
      this.currentLiveId = row.id;
      this.currentLiveName = row.liveShowName || '直播报名表';
      this.registrationModalVisible = true;
    },

    // 打开评论弹框
    openCommentModal(row) {
      if (!row || !row.id) {
        this.$Message.error('无效的直播信息');
        return;
      }

      this.currentCommentLiveId = row.id;
      this.currentCommentLiveName = row.liveShowName || '直播';
      this.commentModalVisible = true;
    },

    // 打开数据统计弹框
    openStatsModal(row) {
      if (!row || !row.id) {
        this.$Message.error('无效的直播信息');
        return;
      }

      this.currentLiveId = row.id;
      this.statsModalVisible = true;
    }
  }
};
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
}

.btn-group >>> .ivu-btn {
  margin-left: 8px;
}
</style>