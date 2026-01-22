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
              <div class="stat-label">实时在线人数</div>
              <div class="stat-value">{{ statsData.currentOnlineCount || 0 }}</div>
            </div>
          </Card>
          </Col>
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
        <Card title="数据统计图表">
          <div v-if="hasData" class="chart-container">
            <!-- 图表切换标签 -->
            <div class="chart-tabs">
              <RadioGroup v-model="activeChart" type="button" @on-change="handleChartChange">
                <Radio label="bar">指标对比图</Radio>
                <!-- <Radio label="pie">数据分布图</Radio> -->
                <Radio label="line">趋势分析图</Radio>
              </RadioGroup>
            </div>
            
            <!-- ECharts 图表容器 -->
            <div ref="chartContainer" class="chart-wrapper" style="height: 400px;"></div>
            
            <!-- 数据说明 -->
            <div class="data-notes" v-if="activeChart === 'line'">
              <p class="note-text">注：趋势分析图基于当前数据模拟生成，展示核心指标的变化趋势。</p>
            </div>
          </div>
          <div v-else class="no-data">
            暂无统计数据
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
      activeChart: 'bar', // 当前激活的图表类型: bar-柱状图, pie-饼图, line-折线图
      chartInstance: null, // ECharts 实例
      resizeObserver: null // 用于监听容器大小变化
    };
  },
  computed: {
    // 判断是否有数据
    hasData() {
      return this.statsData && Object.keys(this.statsData).length > 0;
    },
    
    // 柱状图和饼图数据 - 完整6项数据
    fullChartData() {
      if (!this.hasData) return [];
      
      return [
        {
          name: '实时在线人数',
          value: this.statsData.currentOnlineCount || 0,
          unit: '人',
          desc: '当前正在观看直播的人数'
        },
        {
          name: '最高同时在线人数',
          value: this.statsData.maxOnlineCount || 0,
          unit: '人',
          desc: '直播期间同时在线人数的峰值'
        },
        {
          name: '报名人数',
          value: this.statsData.registrationCount || 0,
          unit: '人',
          desc: '通过报名表参与直播的人数'
        },
        {
          name: '评论条数',
          value: this.statsData.commentCount || 0,
          unit: '条',
          desc: '直播期间产生的评论总数'
        },
        {
          name: '人均观看时长',
          value: this.statsData.avgWatchDuration || 0,
          unit: '分钟',
          desc: '观众平均观看直播的时长'
        },
        {
          name: '流量消耗',
          value: this.statsData.trafficConsumptionGb || 0,
          unit: 'GB',
          desc: '直播消耗的总流量'
        }
      ];
    },
    
    // 折线图数据 - 只包含3项核心数据
    lineChartData() {
      if (!this.hasData) return [];
      
      return [
        {
          name: '实时在线人数',
          value: this.statsData.currentOnlineCount || 0,
          unit: '人',
          desc: '当前正在观看直播的人数'
        },
        {
          name: '最高同时在线人数',
          value: this.statsData.maxOnlineCount || 0,
          unit: '人',
          desc: '直播期间同时在线人数的峰值'
        },
        {
          name: '报名人数',
          value: this.statsData.registrationCount || 0,
          unit: '人',
          desc: '通过报名表参与直播的人数'
        }
      ];
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
      if (!this.hasData) {
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
      this.renderChart();
      
      // 监听容器大小变化
      this.setupResizeObserver();
    },
    
    // 渲染图表
    renderChart() {
      if (!this.chartInstance || !this.hasData) {
        return;
      }
      
      // 根据当前激活的图表类型设置不同的图表
      switch (this.activeChart) {
        case 'bar':
          this.renderBarChart();
          break;
        case 'pie':
          this.renderPieChart();
          break;
        case 'line':
          this.renderLineChart();
          break;
        default:
          this.renderBarChart();
      }
    },
    
    // 渲染柱状图 - 使用完整6项数据
    renderBarChart() {
      const data = this.fullChartData;
      
      // 提取指标名称和数值
      const indicators = data.map(item => item.name);
      const values = data.map(item => item.value);
      
      // 设置颜色数组 - 6个颜色对应6个指标
      const colors = ['#5470c6', '#91cc75', '#fac858', '#ee6666', '#73c0de', '#3ba272'];
      
      // 完全清除之前的配置
      this.chartInstance.clear();
      
      const option = {
        tooltip: {
          trigger: 'axis',
          axisPointer: {
            type: 'shadow'
          },
          formatter: (params) => {
            const param = params[0];
            const dataItem = data[param.dataIndex];
            return `
              <div style="font-weight:bold;margin-bottom:5px;">${param.name}</div>
              <div>数值: ${param.value} ${dataItem.unit}</div>
              <div style="color:#999;font-size:12px;">${dataItem.desc}</div>
            `;
          }
        },
        grid: {
          left: '3%',
          right: '4%',
          bottom: '10%',
          top: '10%',
          containLabel: true
        },
        xAxis: {
          type: 'category',
          data: indicators,
          axisLabel: {
            interval: 0,
            rotate: 30,
            fontSize: 12
          }
        },
        yAxis: {
          type: 'value',
          name: '数值',
          axisLabel: {
            formatter: (value) => {
              return value;
            }
          }
        },
        series: [
          {
            name: '指标值',
            type: 'bar',
            data: values.map((value, index) => ({
              value: value,
              itemStyle: {
                color: colors[index % colors.length]
              }
            })),
            barWidth: '40%',
            label: {
              show: true,
              position: 'top',
              formatter: '{c}'
            },
            emphasis: {
              focus: 'series',
              itemStyle: {
                shadowBlur: 10,
                shadowColor: 'rgba(0, 0, 0, 0.5)'
              }
            }
          }
        ]
      };
      
      this.chartInstance.setOption(option, true); // true 表示不合并配置
    },
    
    // 渲染饼图 - 使用完整6项数据
    renderPieChart() {
      const data = this.fullChartData;
      
      // 过滤掉数值为0的项
      const filteredData = data.filter(item => item.value > 0);
      
      // 完全清除之前的配置
      this.chartInstance.clear();
      
      if (filteredData.length === 0) {
        // 如果所有数据都是0，显示提示
        this.chartInstance.setOption({
          title: {
            text: '暂无有效数据',
            left: 'center',
            top: 'center',
            textStyle: {
              fontSize: 16,
              color: '#999'
            }
          }
        }, true);
        return;
      }
      
      // 设置颜色数组 - 6个颜色对应6个指标
      const colors = ['#5470c6', '#91cc75', '#fac858', '#ee6666', '#73c0de', '#3ba272'];
      
      const option = {
        tooltip: {
          trigger: 'item',
          formatter: (params) => {
            const dataItem = params.data;
            return `
              <div style="font-weight:bold;margin-bottom:5px;">${params.name}</div>
              <div>数值: ${params.value} ${dataItem.unit}</div>
              <div>占比: ${params.percent}%</div>
              <div style="color:#999;font-size:12px;">${dataItem.desc}</div>
            `;
          }
        },
        legend: {
          orient: 'vertical',
          left: 'left',
          top: 'center'
        },
        series: [
          {
            name: '数据分布',
            type: 'pie',
            radius: ['40%', '70%'],
            center: ['60%', '50%'],
            avoidLabelOverlap: false,
            itemStyle: {
              borderRadius: 10,
              borderColor: '#fff',
              borderWidth: 2
            },
            label: {
              show: false,
              position: 'center'
            },
            emphasis: {
              label: {
                show: true,
                fontSize: 16,
                fontWeight: 'bold'
              },
              itemStyle: {
                shadowBlur: 10,
                shadowOffsetX: 0,
                shadowColor: 'rgba(0, 0, 0, 0.5)'
              }
            },
            labelLine: {
              show: false
            },
            data: filteredData.map((item, index) => ({
              name: item.name,
              value: item.value,
              unit: item.unit,
              desc: item.desc,
              itemStyle: {
                color: colors[index % colors.length]
              }
            }))
          }
        ]
      };
      
      this.chartInstance.setOption(option, true); // true 表示不合并配置
    },
    
    // 渲染折线图 - 只使用3项核心数据
    renderLineChart() {
      const data = this.lineChartData;
      
      // 为每个指标生成模拟的时间序列数据
      const indicators = data.map(item => item.name);
      const timeLabels = ['开始', '1/4', '1/2', '3/4', '结束'];
      
      // 生成模拟数据：基于当前值生成趋势
      const generateTrendData = (baseValue) => {
        if (baseValue === 0) return [0, 0, 0, 0, 0];
        
        const trend = [];
        
        for (let i = 0; i < 5; i++) {
          // 模拟增长趋势
          const progress = i / 4;
          let value;
          
          if (i === 0) {
            value = baseValue * 0.1; // 开始为10%
          } else if (i === 4) {
            value = baseValue; // 结束为当前值
          } else {
            // 中间有波动
            const base = baseValue * (0.1 + progress * 0.8);
            const randomFactor = 0.8 + Math.random() * 0.4; // 0.8-1.2的随机因子
            value = Math.max(0, base * randomFactor);
          }
          
          trend.push(Math.round(value));
        }
        
        return trend;
      };
      
      // 设置颜色数组 - 只使用3个颜色
      const colors = ['#5470c6', '#91cc75', '#fac858'];
      
      const series = indicators.map((indicator, index) => {
        const dataItem = data[index];
        return {
          name: indicator,
          type: 'line',
          data: generateTrendData(dataItem.value),
          smooth: true,
          lineStyle: {
            width: 3
          },
          itemStyle: {
            color: colors[index % colors.length]
          },
          emphasis: {
            focus: 'series'
          },
          markPoint: {
            data: [
              { type: 'max', name: '最大值' },
              { type: 'min', name: '最小值' }
            ]
          }
        };
      });
      
      // 完全清除之前的配置
      this.chartInstance.clear();
      
      const option = {
        tooltip: {
          trigger: 'axis',
          axisPointer: {
            type: 'cross',
            label: {
              backgroundColor: '#6a7985'
            }
          }
        },
        legend: {
          data: indicators,
          top: 10
        },
        grid: {
          left: '3%',
          right: '4%',
          bottom: '3%',
          top: '15%',
          containLabel: true
        },
        xAxis: {
          type: 'category',
          boundaryGap: false,
          data: timeLabels
        },
        yAxis: {
          type: 'value',
          name: '数值'
        },
        series: series
      };
      
      this.chartInstance.setOption(option, true); // true 表示不合并配置
    },
    
    // 处理图表类型切换
    handleChartChange() {
      if (this.chartInstance) {
        this.renderChart();
      }
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

.chart-tabs {
  position: absolute;
  top: 10px;
  right: 20px;
  z-index: 10;
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