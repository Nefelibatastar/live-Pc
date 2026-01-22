<!-- 报名表查看弹框 -->
 <!-- LiveManage/components/RegistrationModal.vue -->
<template>
  <Modal v-model="modalVisible" title="直播报名表" :loading="loading" width="80%">
    <!-- 查询部分 -->
    <div class="search-container" style="margin-bottom: 10px;">
      <Row :gutter="16" class="search-row">
        <Col :span="8">
        <i-input v-model="query.userName" placeholder="请输入内容搜索" clearable
          @on-clear="handleSearch" @on-enter="handleSearch" class="search-input">
          <Icon type="ios-search" slot="prefix" />
        </i-input>
        </Col>
        <Col :span="16" class="btn-group">
        <i-button type="default" @click="resetQuery">重置</i-button>
        <i-button type="primary" @click="handleSearch">搜索</i-button>
        <i-button type="success" @click="exportExcel" :loading="exportLoading">
          <Icon type="ios-download-outline" />导出Excel
        </i-button>
        </Col>
      </Row>
    </div>

    <!-- 报名表列表 -->
    <Table :data="tableData" :columns="dynamicColumns" stripe border></Table>

    <!-- 分页 -->
    <div style="margin: 10px; overflow: hidden; text-align: right;">
      <Page :total="total" :current="pageNum" :page-size="pageSize"
        @on-change="handlePageChange" show-total></Page>
    </div>
  </Modal>
</template>

<script>
export default {
  name: 'RegistrationModal',
  props: {
    visible: {
      type: Boolean,
      default: false
    },
    liveId: {
      type: String,
      default: ''
    },
    entryFromData: {
      type: Array,
      default: () => []
    },
    liveName: {
      type: String,
      default: '直播报名表'
    }
  },
  data() {
    return {
      modalVisible: false,
      loading: false,
      exportLoading: false,
      tableData: [],
      total: 0,
      pageNum: 1,
      pageSize: 10,
      query: {
        userName: ''
      },
      dynamicColumns: []
    };
  },
  watch: {
    visible(val) {
      this.modalVisible = val;
      if (val && this.liveId) {
        this.pageNum = 1;
        this.query.userName = '';
        this.generateDynamicColumns();
        this.getRegistrationList();
      }
    },
    modalVisible(val) {
      this.$emit('update:visible', val);
    }
  },
  methods: {
    generateDynamicColumns() {
      if (!this.entryFromData || this.entryFromData.length === 0) {
        this.dynamicColumns = [
          {
            title: '报名内容',
            key: 'formContent',
            align: 'center',
            render: (h, params) => {
              const content = params.row;
              let html = '';
              Object.keys(content).forEach(key => {
                if (key !== 'id' && key !== 'createTime') {
                  html += `${key}：${content[key]}<br/>`;
                }
              });
              return h('div', {
                domProps: {
                  innerHTML: html
                }
              });
            }
          }
        ];
        return;
      }

      const columns = this.entryFromData.map(field => {
        return {
          title: field.name + (field.required ? ' *' : ''),
          key: field.name,
          align: 'center',
          minWidth: 120,
          render: (h, params) => {
            const value = params.row[field.name] || '-';
            return h('span', value);
          }
        };
      });

      this.dynamicColumns = columns;
    },

    getRegistrationList() {
      this.loading = true;
      const params = {
        liveId: this.liveId,
        userName: this.query.userName.trim() || undefined,
        pageNum: this.pageNum,
        pageSize: this.pageSize
      };
      this.$api.getRegistrationList(params)
        .then(res => {
          if (res.code === 200) {
            this.tableData = this.processRegistrationData(res.data.records || []);
            this.total = res.data.total || 0;
          } else {
            this.$Message.error('获取报名表失败：' + res.message);
          }
        })
        .catch(err => {
          console.error('获取报名表接口报错：', err);
          this.$Message.error('接口请求失败');
        })
        .finally(() => {
          this.loading = false;
        });
    },

    handleSearch() {
      this.pageNum = 1;
      this.getRegistrationList();
    },

    handlePageChange(page) {
      this.pageNum = page;
      this.getRegistrationList();
    },

    resetQuery() {
      this.query.userName = '';
      this.pageNum = 1;
      this.getRegistrationList();
    },

    processRegistrationData(data) {
      if (!this.entryFromData || this.entryFromData.length === 0) {
        return data;
      }

      return data.map(item => {
        const processedItem = { ...item };
        this.entryFromData.forEach(field => {
          if (processedItem[field.name] === undefined) {
            processedItem[field.name] = '';
          }
        });
        return processedItem;
      });
    },

    exportExcel() {
      if (!this.entryFromData || this.entryFromData.length === 0) {
        this.$Message.warning('暂无报名表数据可导出');
        return;
      }

      if (this.tableData.length === 0) {
        this.$Message.warning('没有可导出的数据');
        return;
      }

      this.exportLoading = true;

      import('xlsx').then(XLSX => {
        const params = {
          liveId: this.liveId,
          userName: this.query.userName.trim() || undefined,
          pageNum: 1,
          pageSize: 10000
        };

        return this.$api.getRegistrationList(params)
          .then(res => {
            if (res.code === 200) {
              const allData = res.data.records || [];
              if (allData.length === 0) {
                this.$Message.warning('没有可导出的数据');
                return;
              }

              const processedData = this.processRegistrationData(allData);
              return this.generateExcelWithXLSX(XLSX, processedData);
            } else {
              this.$Message.error('获取导出数据失败：' + res.message);
            }
          });
      })
        .catch(err => {
          console.error('加载Excel库失败:', err);
          this.$Message.error('导出功能加载失败');
        })
        .finally(() => {
          this.exportLoading = false;
        });
    },

    generateExcelWithXLSX(XLSX, data) {
      try {
        const headers = [];
        const headerKeys = [];

        this.entryFromData.forEach(field => {
          headers.push(field.name + (field.required ? '*' : ''));
          headerKeys.push(field.name);
        });

        const dataRows = data.map(item => {
          const row = {};
          headerKeys.forEach(key => {
            row[key] = item[key] || '';
          });
          return row;
        });

        const worksheet = XLSX.utils.json_to_sheet(dataRows, {
          header: headerKeys
        });

        const range = XLSX.utils.decode_range(worksheet['!ref']);
        for (let C = range.s.c; C <= range.e.c; ++C) {
          const address = XLSX.utils.encode_cell({ r: 0, c: C });
          if (!worksheet[address]) {
            worksheet[address] = {};
          }
          worksheet[address].v = headers[C];
          worksheet[address].t = 's';
        }

        const colWidths = headers.map(header => ({
          wch: Math.max(header.length, 10)
        }));
        worksheet['!cols'] = colWidths;

        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, '报名表');

        const safeFileName = (this.liveName || '直播').replace(/[\/\\:*?"<>|]/g, '_');
        const fileName = `${safeFileName}_报名表_${this.formatDate(new Date())}.xlsx`;

        XLSX.writeFile(workbook, fileName);
        this.$Message.success('导出成功');

      } catch (error) {
        console.error('导出Excel失败:', error);
        console.error('错误堆栈:', error.stack);
        this.$Message.error('导出失败：' + error.message);
      }
    },

    formatDate(date) {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      const seconds = String(date.getSeconds()).padStart(2, '0');
      return `${year}${month}${day}_${hours}${minutes}${seconds}`;
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