<!-- 评论列表弹框 -->
 <!-- LiveManage/components/CommentModal.vue -->
<template>
  <Modal v-model="modalVisible" title="评论列表" width="80%" :styles="{ top: '40px' }">
    <div class="comment-modal-content">
      <!-- 评论查询条件 -->
      <div class="search-container" style="margin-bottom: 20px;">
        <Row :gutter="16" class="search-row">
          <Col :span="8">
          <i-input v-model="query.userName" placeholder="请输入用户名搜索" clearable @on-clear="handleSearch"
            @on-enter="handleSearch" class="search-input">
            <Icon type="ios-person" slot="prefix" />
          </i-input>
          </Col>
          <Col :span="8">
          <i-input v-model="query.comment" placeholder="请输入评论内容搜索" clearable @on-clear="handleSearch"
            @on-enter="handleSearch" class="search-input">
            <Icon type="ios-search" slot="prefix" />
          </i-input>
          </Col>
          <Col :span="8" class="btn-group">
          <i-button type="default" @click="resetQuery">重置</i-button>
          <i-button type="primary" @click="handleSearch">搜索</i-button>
          </Col>
        </Row>
      </div>

      <!-- 评论列表表格 -->
      <Table :data="tableData" :columns="columns" stripe border></Table>

      <!-- 评论分页 -->
      <div style="margin: 10px; overflow: hidden; text-align: right;">
        <Page :total="total" :current="pageNum" :page-size="pageSize"
          @on-change="handlePageChange" show-total show-elevator></Page>
      </div>
    </div>
  </Modal>
</template>

<script>
export default {
  name: 'CommentModal',
  props: {
    visible: {
      type: Boolean,
      default: false
    },
    liveStreamId: {
      type: String,
      default: ''
    },
    liveName: {
      type: String,
      default: '直播'
    }
  },
  data() {
    return {
      modalVisible: false,
      loading: false,
      tableData: [],
      total: 0,
      pageNum: 1,
      pageSize: 10,
      query: {
        comment: '',
        userName: ''
      },
      columns: [
        {
          title: '用户名',
          key: 'userInfo',
          align: 'center',
          width: 180,
          render: (h, params) => {
            const comment = params.row;
            return h('div', [
              h('div', {
                style: {
                  fontWeight: 'bold',
                  marginBottom: '5px',
                  color: '#515a6e'
                }
              }, comment.userName || '匿名用户')
            ]);
          }
        },
        {
          title: '评论内容（回车符号表示回复其他人评论）',
          key: 'content',
          align: 'left',
          minWidth: 200,
          render: (h, params) => {
            const comment = params.row;
            const content = comment.content;
            const isReply = comment.parentId && comment.parentId !== '';

            return h('div', {
              style: {
                padding: isReply ? '8px 12px 8px 30px' : '8px 12px',
                backgroundColor: isReply ? '#f8f9fa' : 'transparent',
                borderLeft: isReply ? '3px solid #e8eaec' : 'none',
                borderRadius: '4px',
                position: 'relative',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                webkitBoxOrient: 'vertical'
              }
            }, [
              isReply ? h('div', {
                style: {
                  position: 'absolute',
                  left: '8px',
                  top: '8px',
                  fontSize: '12px',
                  color: '#808695',
                  fontWeight: 'bold'
                }
              }, '↳') : null,
              h('span', {
                style: {
                  lineHeight: '1.5',
                  wordBreak: 'break-word'
                }
              }, content || '无内容')
            ]);
          }
        },
        {
          title: '评论时间',
          key: 'createTime',
          align: 'center',
          width: 180,
          render: (h, params) => {
            const time = params.row.createTime;
            if (!time) return h('span', '-');

            const formatTime = time.includes('T') ? time.replace('T', ' ') : time;
            return h('div', [
              h('div', {
                style: {
                  fontWeight: '500',
                  color: '#17233d'
                }
              }, formatTime)
            ]);
          }
        },
        {
          title: '操作',
          key: 'action',
          align: 'center',
          width: 120,
          render: (h, params) => {
            const comment = params.row;
            const isDeleted = comment.status === '1';

            return h('div', [
              h('i-button', {
                props: {
                  type: 'error',
                  size: 'small',
                  icon: 'ios-trash',
                  disabled: isDeleted
                },
                style: {
                  margin: '0 auto'
                },
                on: {
                  click: () => this.deleteComment(comment)
                }
              }, isDeleted ? '已删除' : '删除')
            ]);
          }
        }
      ]
    };
  },
  watch: {
    visible(val) {
      this.modalVisible = val;
      if (val && this.liveStreamId) {
        this.pageNum = 1;
        this.query = {
          comment: '',
          userName: ''
        };
        this.getCommentList();
      }
    },
    modalVisible(val) {
      this.$emit('update:visible', val);
    }
  },
  methods: {
    getCommentList() {
      if (!this.liveStreamId) {
        this.$Message.error('请先选择直播');
        return;
      }

      this.loading = true;
      const params = {
        liveStreamId: this.liveStreamId,
        pageNum: this.pageNum,
        pageSize: this.pageSize,
        ...this.query
      };
      this.$api.listWithPaging(params)
        .then(res => {
          if (res.code === 200) {
            this.tableData = res.data.records || [];
            this.total = res.data.total || 0;
          } else {
            this.$Message.error('获取评论列表失败：' + res.message);
          }
        })
        .catch(err => {
          console.error('获取评论列表接口报错：', err);
          this.$Message.error('接口请求失败');
        })
        .finally(() => {
          this.loading = false;
        });
    },

    handleSearch() {
      this.pageNum = 1;
      this.getCommentList();
    },

    handlePageChange(page) {
      this.pageNum = page;
      this.getCommentList();
    },

    resetQuery() {
      this.query = {
        comment: '',
        userName: ''
      };
      this.pageNum = 1;
      this.getCommentList();
    },

    deleteComment(comment) {
      if (!comment || !comment.id) {
        this.$Message.error('无效的评论信息');
        return;
      }

      this.$Modal.confirm({
        title: '确认删除',
        content: `确定要删除用户「${comment.userName || '匿名用户'}」的评论吗？`,
        onOk: () => {
          this.$api.deleteComment({ commentId: comment.id })
            .then(res => {
              if (res.code === 200) {
                this.$Message.success('评论删除成功');
                this.getCommentList();
              } else {
                this.$Message.error('删除失败：' + res.message);
              }
            })
            .catch(err => {
              console.error('删除评论接口报错：', err);
              this.$Message.error('删除失败，请重试');
            });
        }
      });
    }
  }
};
</script>

<style scoped>
.comment-modal-content {
  max-height: 75vh;
  overflow-y: auto;
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

.btn-group >>> .ivu-btn {
  margin-left: 8px;
}
</style>