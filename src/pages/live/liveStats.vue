<!-- components/LiveStats.vue -->
<template>
  <Modal v-model="modalVisible" title="直播数据统计" width="1000px" :styles="{ top: '40px' }">
    <div class="stats-modal-content">
      <!-- 统计概览 -->
      <div class="stats-overview">
        <h3 class="stats-title">直播概况</h3>
        <Row :gutter="8">
          <Col :span="6">
          <Card class="stat-card">
            <div class="stat-item">
              <div class="stat-label">最高同时在线人数</div>
              <div class="stat-value">{{ statsData.maxOnlineCount || 0 }}</div>
            </div>
          </Card>
          </Col>
          <Col :span="6">
          <Card class="stat-card">
            <div class="stat-item">
              <div class="stat-label">报名人数</div>
              <div class="stat-value">{{ statsData.registrationCount || 0 }}</div>
            </div>
          </Card>
          </Col>
          <Col :span="6">
          <Card class="stat-card">
            <div class="stat-item">
              <div class="stat-label">评论条数</div>
              <div class="stat-value">{{ statsData.commentCount || 0 }}</div>
            </div>
          </Card>
          </Col>
          <Col :span="6">
          <Card class="stat-card">
            <div class="stat-item">
              <div class="stat-label">人均观看时长（分钟）</div>
              <div class="stat-value">{{ statsData.avgWatchDuration || 0 }}</div>
            </div>
          </Card>
          </Col>
          <Col :span="6">
          <Card class="stat-card">
            <div class="stat-item">
              <div class="stat-label">流量消耗 (GB)</div>
              <div class="stat-value">{{ statsData.trafficConsumptionGb || 0 }}</div>
            </div>
          </Card>
          </Col>
        </Row>
      </div>

      <!-- 数据图表展示 -->
      <div class="stats-chart">
        <Card title="同时在线人数趋势图">
          <div v-if="hasOnlineHistory" class="chart-container">
            <!-- ECharts 图表容器 -->
            <div ref="chartContainer" class="chart-wrapper" style="height: 400px;"></div>

            <!-- 数据说明 -->
            <div class="data-notes">
              <p class="note-text">注：本图展示直播期间同时在线人数随时间的变化趋势。</p>
            </div>
          </div>
          <div v-else class="no-data">
            暂无在线人数统计数据
          </div>
        </Card>
      </div>
    </div>

    <div slot="footer">
      <i-button type="primary" @click="modalVisible = false">关闭</i-button>
      <i-button type="default" @click="refreshData" :loading="loading">刷新</i-button>
    </div>
  </Modal>
</template>

<script>
// 按需引入 ECharts
import * as echarts from 'echarts';

export default {
  name: 'LiveStats',
  props: {
    visible: {
      type: Boolean,
      default: false
    },
    liveStreamId: {
      type: String,
      default: ''
    }
  },
  data() {
    return {
      modalVisible: false,
      statsData: {},
      loading: false,
      chartInstance: null, // ECharts 实例
      resizeObserver: null // 用于监听容器大小变化
    };
  },
  computed: {
    // 判断是否有数据
    hasData() {
      return this.statsData && Object.keys(this.statsData).length > 0;
    },

    // 判断是否有在线历史数据
    hasOnlineHistory() {
      return this.statsData.onlineHistory && Object.keys(this.statsData.onlineHistory).length > 0;
    },

    // 格式化在线历史数据为折线图需要的格式
    formattedOnlineHistory() {
      if (!this.hasOnlineHistory) return [];

      const history = this.statsData.onlineHistory;

      // 将对象转换为数组并排序
      const historyArray = Object.entries(history)
        .map(([time, count]) => ({
          time,
          count
        }))
        .sort((a, b) => {
          // 按时间排序
          return new Date(a.time) - new Date(b.time);
        });

      return historyArray;
    },

    // 获取折线图的时间轴数据（完整的日期时间字符串）
    lineChartTimeData() {
      return this.formattedOnlineHistory.map(item => item.time);
    },

    // 获取折线图的在线人数数据
    lineChartCountData() {
      return this.formattedOnlineHistory.map(item => item.count);
    }
  },
  watch: {
    visible(val) {
      this.modalVisible = val;
      if (val && this.liveStreamId) {
        this.loadStats();
      } else {
        // 模态框关闭时销毁图表
        this.destroyChart();
      }
    },
    modalVisible(val) {
      this.$emit('update:visible', val);
      if (!val) {
        // 模态框关闭时销毁图表
        this.destroyChart();
      }
    }
  },
  mounted() {
    // 监听窗口大小变化
    window.addEventListener('resize', this.handleResize);
  },
  beforeDestroy() {
    // 组件销毁前移除事件监听并销毁图表
    window.removeEventListener('resize', this.handleResize);
    this.destroyChart();

    // 清除 resizeObserver
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
      this.resizeObserver = null;
    }
  },
  methods: {
    async loadStats() {
      this.loading = true;
      try {
        const res = await this.$api.getDetailedStats({ liveStreamId: this.liveStreamId });
        if (res.code === 200) {
          this.statsData = res.data || {};
          // 数据加载完成后，等待DOM更新后初始化图表
          this.$nextTick(() => {
            this.initChart();
          });
        } else {
          this.$Message.error('获取数据统计失败：' + res.message);
        }
      } catch (err) {
        console.error('获取数据统计接口报错：', err);
        this.$Message.error('接口请求失败');
      } finally {
        this.loading = false;
      }
    },

    // 刷新数据
    refreshData() {
      this.loadStats();
    },

    // 初始化图表
    initChart() {
      if (!this.hasOnlineHistory) {
        return;
      }

      // 销毁之前的图表实例
      this.destroyChart();

      // 获取图表容器
      const chartDom = this.$refs.chartContainer;
      if (!chartDom) {
        console.error('图表容器未找到');
        return;
      }

      // 初始化 ECharts 实例
      this.chartInstance = echarts.init(chartDom);

      // 设置图表配置
      this.renderLineChart();

      // 监听容器大小变化
      this.setupResizeObserver();
    },

    // 渲染折线图 - 展示同时在线人数随时间变化
    renderLineChart() {
      if (!this.chartInstance || !this.hasOnlineHistory) {
        return;
      }

      const timeData = this.lineChartTimeData;
      const countData = this.lineChartCountData;

      // 完全清除之前的配置
      this.chartInstance.clear();

      // 计算数据点数量，用于调整X轴标签显示策略
      const dataCount = timeData.length;

      const option = {
        tooltip: {
          trigger: 'axis',
          axisPointer: {
            type: 'line',
            label: {
              backgroundColor: '#6a7985'
            }
          },
          formatter: (params) => {
            const param = params[0];
            return `
              <div style="font-weight:bold;margin-bottom:5px;">${param.name}</div>
              <div>同时在线人数: ${param.value} 人</div>
            `;
          }
        },
        grid: {
          left: '3%',
          right: '4%',
          bottom: '15%', // 增加底部间距以便显示时间标签
          top: '10%',
          containLabel: true
        },
        xAxis: {
          type: 'category',
          boundaryGap: false,
          data: timeData,
          axisLabel: {
            // 根据数据点数量调整显示策略
            rotate: dataCount > 5 ? 45 : 0, // 数据点多于5个时旋转45度
            fontSize: 12,
            margin: 10, // 增加标签与轴线的间距
            formatter: function (value) {
              // 保持完整的日期时间格式显示
              return value;
            }
          },
          axisTick: {
            alignWithLabel: true // 刻度线与标签对齐
          },
          name: '时间',
          nameLocation: 'middle',
          nameGap: 35,
          nameTextStyle: {
            fontSize: 14,
            fontWeight: 'bold'
          }
        },
        yAxis: {
          type: 'value',
          name: '在线人数',
          axisLabel: {
            formatter: '{value} 人'
          },
          nameTextStyle: {
            fontSize: 14,
            fontWeight: 'bold'
          }
        },
        series: [
          {
            name: '同时在线人数',
            type: 'line',
            data: countData,
            smooth: false, // 设置为false，使用直线连接
            lineStyle: {
              width: 3,
              color: '#2d8cf0'
            },
            itemStyle: {
              color: '#2d8cf0'
            },
            areaStyle: {
              color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                {
                  offset: 0,
                  color: 'rgba(45, 140, 240, 0.3)'
                },
                {
                  offset: 1,
                  color: 'rgba(45, 140, 240, 0.05)'
                }
              ])
            },
            emphasis: {
              focus: 'series',
              itemStyle: {
                borderWidth: 2,
                borderColor: '#fff',
                shadowBlur: 10,
                shadowColor: 'rgba(0, 0, 0, 0.5)'
              }
            },
            markPoint: {
              data: [
                { type: 'max', name: '最高在线', symbolSize: 60 },
                { type: 'min', name: '最低在线', symbolSize: 60 }
              ],
              label: {
                formatter: '{b}: {c}人'
              }
            },
            markLine: {
              data: [
                { type: 'average', name: '平均在线' }
              ],
              label: {
                formatter: '平均: {c}人'
              }
            }
          }
        ]
      };

      this.chartInstance.setOption(option, true); // true 表示不合并配置
    },

    // 处理窗口大小变化
    handleResize() {
      if (this.chartInstance) {
        this.chartInstance.resize();
      }
    },

    // 设置容器大小变化观察器
    setupResizeObserver() {
      // 如果浏览器支持 ResizeObserver，使用它来监听容器大小变化
      if ('ResizeObserver' in window) {
        this.resizeObserver = new ResizeObserver(() => {
          if (this.chartInstance) {
            this.chartInstance.resize();
          }
        });

        const chartDom = this.$refs.chartContainer;
        if (chartDom) {
          this.resizeObserver.observe(chartDom);
        }
      }
    },

    // 销毁图表实例
    destroyChart() {
      if (this.chartInstance) {
        this.chartInstance.dispose();
        this.chartInstance = null;
      }
    }
  }
};
</script>

<style scoped>
.stats-modal-content {
  max-height: 75vh;
  overflow-y: auto;
  padding: 5px;
}

.stats-overview {
  margin-bottom: 20px;
}

.stat-card {
  text-align: center;
  padding: 20px 10px;
  margin-bottom: 8px;
}

.stats-title {
  padding: 0 0 10px;
  font-weight: 600;
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.stat-label {
  font-size: 14px;
  color: #515a6e;
  margin-bottom: 8px;
}

.stat-value {
  font-size: 28px;
  font-weight: bold;
  color: #2d8cf0;
}

.stats-chart {
  margin-bottom: 10px;
}

.chart-container {
  position: relative;
  padding: 10px 0;
}

.chart-wrapper {
  width: 100%;
  margin-top: 20px;
}

.no-data {
  text-align: center;
  padding: 40px 0;
  color: #999;
  font-size: 14px;
}

.data-notes {
  margin-top: 10px;
  padding: 10px;
  background-color: #f8f9fa;
  border-radius: 4px;
}

.note-text {
  margin: 0;
  font-size: 12px;
  color: #999;
  text-align: center;
}
</style>