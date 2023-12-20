import * as d3 from 'd3';
const { scaleLinear } = d3;

/**
 * 获取分类（CAT）列表 xAxis 
 * @param canvasFeatures 特征features
 * @param metadata 数据data里面的metadata
 * @returns 分类（CAT）列表 xAxis
 */
export const setXAxisList = (canvasFeatures: any, metadata: any) => {
  let xAxis: Array<Record<string, any>> = [];
  let xList = metadata.x_dimensions.length ? metadata.x_dimensions : canvasFeatures.x;
  for (let i = 0; i < xList.length; i++) {
    xAxis.push({ key: xList[i] });
  }
  return xAxis;
};


/**
 * 获取数据 (AGGR) 列表 yAxis
 * @param canvasFeatures  特征features
 * @param canvasData  数据data里面的features_data
 * @returns 数据 (AGGR) 列表 yAxis
 */
export const setYAxisList = (canvasFeatures: any, canvasData: any) => {
  let yList = canvasFeatures.y;
  let yAxis: Array<Record<string, any>> = [];
  for (let i = 0; i < yList.length; i++) {
    let obj = {
      key: setAggrName(yList[i].feature),
      keyId: `${i}-0`,
      data: canvasData[i].feature
    };
    yAxis.push(obj);
  }
  return yAxis;
};

/**
 * 获取分类数据 xAxisData (雷达顶点标签信息)
 * @param yAxis 
 * @param xAxis 
 * @returns xAxisData
 */
export const getXAxisData = (yAxis: any, xAxis: any) => {
  let totalData: Array<string> = [];
  let key = xAxis[0].key;
  for (let i = 0; i < yAxis.length; i++) {
    let data = yAxis[i].data;
    for (let j = 0; j < data.length; j++) {
      totalData.push(data[j][key]);
    }
  }
  return [...new Set(totalData)];
};


export const setAggrName = (feature: any) => {
  if (!feature) return null;
  if (feature.legend && feature.formulaType !== 'AGGR') {
    let name = `${feature.legend.toLocaleLowerCase()}(${feature.name})`;
    if (feature.legend === 'PERCENTILE') {
      name = `${feature.legend.toLocaleLowerCase()}${feature.probability}(${feature.name})`;
    }
    return aggrName(feature.rate, name);
  } else {
    return aggrName(feature.rate, feature.name);
  }
};

const aggrName = (rate: any, newName: any) => {
  if (rate) {
    let { type, growth } = rate;
    if (growth) {
      newName = `${type === 'RING' ? 'Last Period' : 'Same Period'} Growth ${newName}`;
    } else {
      newName = `${type === 'RING' ? 'Last Period' : 'Same Period'} ${newName}`;
    }
  }
  return newName;
};

/**
 * 获取数据最大值
 * @param yAxis AGGR数据数组
 * @returns 最大值
 */
export const getMaxValue = (yAxis: Array<Record<string, any>>) => {
  let maxValue = 0;
  for (let i = 0; i < yAxis.length; i++) {
    let key = yAxis[i].key;
    let max = Math.max.apply(null, yAxis[i].data.map((item: any) => (item[key] || 0)));
    if (maxValue < max) maxValue = max;
  }
  return maxValue;
};

/**
 * 获取数据最小值
 * @param yAxis AGGR数据数组
 * @returns 最小值
 */
export const getMinValue = (yAxis: Array<Record<string, any>>) => {
  let minValue = 0;
  for (let i = 0; i < yAxis.length; i++) {
    let key = yAxis[i].key;
    let min = Math.min.apply(null, yAxis[i].data.map((item: any) => (item[key] || 0)));
    if (minValue > min) minValue = min;
  }
  return minValue;
};

/**
 * 获取最大刻度值 和 半径比例尺 
 * @param yAxis AGGR数据数组
 * @param tickNum 刻度分隔数
 * @param r 最大半径
 * @returns 
 */
export const getScaleRadiusInfo = (yAxis: Array<Record<string, any>>, tickNum: number, r: number) => {
  const maxValue = getMaxValue(yAxis);
  const minValue = getMinValue(yAxis);
  // 初始半径刻度比例
  const scale = scaleLinear()
    .domain([minValue, maxValue])
    .range([0, r]);

  const tickArr = scale.ticks(tickNum);
  const dis = tickArr[1] - tickArr[0];
  const maxScaleRadiusNum = tickArr[tickArr.length - 1] + dis;
  // 半径比例尺
  const scaleRadius = scaleLinear()
    .domain([0, maxScaleRadiusNum])
    .range([r / tickNum, r + (r / tickNum)]);
  // 数值坐标的最小刻度留多一个刻度的空间, 数值0映射的是r / tickNum， 最大值也多一个刻度， 保持总映射半径长度不变
  return {
    maxScaleRadiusNum,
    scaleRadius
  };
};
