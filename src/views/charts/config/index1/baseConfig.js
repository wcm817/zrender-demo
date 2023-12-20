export default {
  fitModel: 'standard', // 画布视图
  id: '', // 画布绑定的元素id
  click: (d) => { // 点击事件
    if (d) {
      sessionStorage.setItem('userClickItem', JSON.stringify(d));
    }
  },
  isCombined: false, // 是否合并坐标轴
  size: 50, // 柱类图柱子粗细
  lineSize: 50, // 线类图线的粗细
  lineStyle: 'circle', // 线类图点形状
  isArea: '', // 是否是面积图
  xAxis: null, // x轴
  yAxis: null, // y轴
  xAxisPart: null, // 多个x轴
  yAxisPart: null, // 多个Y轴
  labelsList: null, // 标签样式
  tooltipList: null, // tooltip样式
  scopeList: null, // 刻度值
  colorList: null // 颜色
};
