import { setAggrName, getLabelFeature, getContainerSize, getColorFeature } from './utils/index';
import getLabels from './index2/getLabels';
import getColorList from './index2/getColorList';
import getTooltipList from './index2/getTooltipList';
import { setToolTipList } from '../treeMap/utils.js';
import axisConfig from './index2/axisConfig';
export default (canvasConfig, chartType) => {
  let getCanvasConfig = JSON.parse(JSON.stringify(canvasConfig));
  const isScatter = chartType === 'scatter';
  const { worksheet_id: id, css, features, features_data, metadata, scopeChange } = getCanvasConfig;
  let tooltipList = [];
  if (chartType === 'pie') {
    tooltipList = setToolTipList(JSON.parse(JSON.stringify(features)), css, 'pie', metadata);
  } else {
    tooltipList = getTooltipList(JSON.parse(JSON.stringify(features)), css, metadata);
  }
  let { labels, color } = fromMetadata(features.labels || [], features.color, features.size, metadata);
  features.labels = labels;
  features.color = color;
  const labelFeature = getLabelFeature(features.labels || []);
  const sizeFeature = setAggrName(features.size || {});
  const colorFeature = getColorFeature(features.color);
  const { width, height } = getContainerSize(id);
  const { oldLabel, newLabel } = getLabels(features.labels, css);

  const { colorList, opacity } = getColorList([features.color], sizeFeature, css, tooltipList);
  // const tooltipList = setToolTipList(features, css, metadata);
  let config = {
    colorFeature: colorFeature,
    colorOpacity: opacity,
    innerRadius: css.innerRadius || undefined,
    hasUnit: true,
    id: `dc_${id}`,
    width: width - 1,
    height: height - 1,
    labelFeature: labelFeature,
    labelsList: newLabel,
    size: css.size / 100 || 0.5,
    tooltipList: tooltipList,
    sizeFeature: {
      feature: sizeFeature
    },
    colorList: colorList
  };
  if (isScatter) {
    const xAxis = getXAxis(features.x || [], css, isScatter);
    const yAxis = getYAxis(features.y || [], css, isScatter);
    config.scopeObj = getScopeObj(css, yAxis[0].key);
    config.xAxis = xAxis[0];
    config.yAxis = yAxis[0];
    let scopeList = [];
    let { yScope, xScope } = getScopeList(css, config, features_data, scopeChange);
    // let yScope = getScopeList(css, yAxis[0].key, 0);
    // let xScope = getScopeList(css, xAxis[0].key, 1);
    scopeList.push(yScope, xScope);
    config.scopeList = scopeList;
  }
  return {
    config,
    data: features_data,
    oldColor: css.colorList || [],
    oldLabel: oldLabel || [],
    orderStyle: css.orderStyle || -1
  };
};

const getXAxis = (xList, css, isScatter) => {
  let list = [];
  let obj = JSON.parse(JSON.stringify(axisConfig));
  let axisStyle = JSON.parse(JSON.stringify(css.axis_style || []));
  let xObj = axisStyle.filter(item => item.axisType === 'x')[0];
  for (let i = 0; i < xList.length; i++) {
    obj.key = setAggrName(xList[i]);
    obj.title.value = obj.key;
    obj.title.feature = obj.key;
    obj.featureName = xList[i] && xList[i].name;
    if (xObj) {
      if (xObj.key === obj.key) {
        xObj.featureName = xList[i] && xList[i].name;
        list.push(xObj);
        break;
      }
      if (xObj.featureName === obj.featureName) {
        obj.grid = xObj.grid;
      }
    }
    list.push(obj);
  }
  return list;
};

const getYAxis = (yList, css, isScatter) => {
  let list = [];
  let obj = JSON.parse(JSON.stringify(axisConfig));
  let axisStyle = JSON.parse(JSON.stringify(css.axis_style || []));
  let yObj = axisStyle.filter(item => item.axisType === 'y')[0];
  obj.axisType = 'y';
  obj.position = 'left';
  for (let i = 0; i < yList.length; i++) {
    obj.featureName = yList[i] && yList[i].name;
    obj.key = setAggrName(yList[i]);
    obj.title.value = obj.key;
    obj.title.feature = obj.key;
    obj.title.axisType = 'y';
    if (yObj) {
      if (yObj.key === obj.key) {
        yObj.featureName = yList[i] && yList[i].name;
        list.push(yObj);
        break;
      }
      if (yObj.featureName === obj.featureName) {
        obj.grid = yObj.grid;
      }
    }
    list.push(obj);
  }
  return list;
};

const getScopeObj = (css, name) => {
  let obj = {
    align: true,
    max: undefined,
    min: undefined,
    num: 12,
    name: name,
    scale: 1,
    select: 0,
    tickRange: [],
    tick_counts: ''
  };
  if (!css.scopeObj) {
    return obj;
  }
  return css.scopeObj;
};

const getScopeList = (css, config, data, scopeChange) => {
  let xName = config.xAxis.key;
  let yName = config.yAxis.key;
  let xData = getMinMaxData(data, xName);
  let yData = getMinMaxData(data, yName);
  // 坐标轴原点预留空间
  let addYValue = (yData[1] - yData[0]) / 9;
  let addYValue2 = (yData[1] - yData[0]) / 20;
  yData[0] = yData[0] - addYValue.toFixed();
  yData[1] = -(0 - yData[1] - addYValue2.toFixed());
  let addXValue = (xData[1] - xData[0]) / 9;
  let addXValue2 = (xData[1] - xData[0]) / 20;
  xData[0] = xData[0] - addXValue.toFixed();
  xData[1] = -(0 - xData[1] - addXValue2.toFixed());
  let yScope = {
    align: true,
    max: yData[1],
    min: yData[0],
    num: 12,
    name: yName,
    scale: 1,
    select: 0,
    tickRange: yData,
    tick_counts: ''
  };
  let xScope = {
    align: true,
    max: xData[1],
    min: xData[0],
    num: 12,
    name: xName,
    scale: 1,
    select: 0,
    tickRange: xData,
    tick_counts: ''
  };
  // if (css.scopeList && css.scopeList.length && css.scopeList.length > 0 && css.scopeList[0].name === yName && css.scopeList[1].name === xName && scopeChange !== 'hasChange') {
  //   yScope = css.scopeList[0] ? css.scopeList[0] : yScope;
  //   xScope = css.scopeList[1] ? css.scopeList[1] : xScope;
  // }
  if (Array.isArray(css.scopeList) && css.scopeList.length > 0) {
    let curScopeList = JSON.parse(JSON.stringify(css.scopeList));
    if (curScopeList[0].select === 1) {
      yScope.select = 1;
      yScope.scale = curScopeList[0].scale;
      xScope.select = 1;
      xScope.scale = curScopeList[0].scale;
    }
    if (curScopeList[0].select === 3) {
      if (scopeChange !== 'hasChange') {
        curScopeList[0].max = yScope.max;
        curScopeList[0].min = yScope.min;
        yScope = curScopeList[0];
        curScopeList[1].max = xScope.max;
        curScopeList[1].min = xScope.min;
        xScope = curScopeList[1];
      } else {
        yScope.select = 3;
        xScope.select = 3;
      }
    }
  }
  return {
    yScope,
    xScope
  };
};

const getMinMaxData = (data, feature) => {
  if (data.length === 1) {
    if (data[0][feature] > 0) {
      return [0, data[0][feature] + 0.1];
    } else {
      return [data[0][feature], 0];
    }
  }
  let getData = JSON.parse(JSON.stringify(data));
  let sortData = getData.sort((a, b) => a[feature] - b[feature]);
  let min = sortData[0][feature];
  let max = sortData[sortData.length - 1][feature];

  return [min.toFixed(), max.toFixed() - (-1)];
};

const fromMetadata = (labels, color, size, metadata) => {
  if (metadata && JSON.stringify(metadata) !== '{}') {
    if (metadata.labels && metadata.labels.length > 0) {
      labels = labels.map((item, index) => {
        item.name = metadata.labels[index] || item.name;
        item.feature_name = metadata.labels[index] || item.name;
        return item;
      });
    }
    if (metadata.color && metadata.color.length > 0) {
      color.name = metadata.color[0] || color.name;
      color.feature_name = metadata.color[0] || color.feature_name;
    }
    if (metadata.size && metadata.size.length > 0) {
      size.name = metadata.size[0] || size.name;
      size.feature_name = metadata.size[0] || size.feature_name;
    }
  }
  return {
    labels,
    size,
    color
  };
};
