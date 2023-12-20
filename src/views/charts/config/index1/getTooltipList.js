import tooltipConfig from '../utils/tooltipConfig';
import { setCatName, setAggrName } from '../utils/index';
export default (metadata, canvasFeatures, canvasCss, isRotated) => {
  let tooltipList = [];
  setXList(metadata, tooltipList, canvasCss);
  setYList(tooltipList, metadata, canvasFeatures, canvasCss, isRotated);
  return uniqueList(tooltipList);
};

// 收集Y轴下的tooltip
const setYList = (tooltipList, metadata, canvasFeatures, canvasCss, isRotated) => {
  let yList = isRotated ? canvasFeatures.x || [] : canvasFeatures.y || [];
  const len = yList.length;
  for (let i = 0; i < len; i++) {
    if (yList[i].feature) {
      tooltipList.push(...setToolTipList(yList[i].feature, canvasCss));
    } else if (yList[i].left || yList[i].right) {
      let left = yList[i].left;
      let right = yList[i].right;
      setCombinedTooltip(left, tooltipList, canvasCss);
      setCombinedTooltip(right, tooltipList, canvasCss);
    } else if (yList[i].pills) {
      setCombinedTooltip(yList[i].pills, tooltipList, canvasCss);
    } else {
      tooltipList.push(...setToolTipList(yList[i], canvasCss));
    }
  }
};

// 收集X轴下的tooltip
const setXList = (metadata, tooltipList, canvasCss) => {
  const xArr = metadata.x_dimensions || [];
  const yArr = metadata.y_dimensions || [];
  const xList = [...xArr, ...yArr];
  const len = xList.length;
  for (let i = 0; i < len; i++) {
    if (!xList[i]) continue;
    if (xList[i].split instanceof Array) {
      let splitArr = xList[i].split;
      let splitLen = splitArr.length;
      let xListObj = JSON.parse(JSON.stringify(xList[i]));
      if (i === len - 1) {
        delete xListObj.split;
        xListObj.split = splitArr[splitLen - 1];
        splitLen = splitLen - 1;
        tooltipList.push(setTooltipObj(xListObj, canvasCss));
      }
      for (let j = 0; j < splitLen; j++) {
        xListObj.split = splitArr[j];
        tooltipList.push(setTooltipObj(xListObj, canvasCss));
      }
    } else {
      tooltipList.push(setTooltipObj(xList[i], canvasCss));
    }
  }
};

// 设置有标签特征或者颜色特征的tooltip
export const setToolTipList = (featureObj, canvasCss) => {
  let labels = featureObj.labels || [];
  let color = featureObj.color;
  let size = featureObj.size;
  let list = [];
  featureObj.name && list.push(setTooltipObj(featureObj, canvasCss, true));
  if (size) {
    list.push(setTooltipObj(size, canvasCss, !color));
  }
  for (let i = 0, len = labels.length; i < len; i++) {
    list.push(setTooltipObj(labels[i], canvasCss));
  };
  if (color) {
    list.push(setTooltipObj(color, canvasCss));
  }
  return list;
};

// 设置组合特征left跟right特征中的tooltip
const setCombinedTooltip = (list, tooltipList, canvasCss) => {
  for (let j = 0, len = list.length; j < len; j++) {
    tooltipList.push(...setToolTipList(list[j], canvasCss));
  }
};

// 去除同名的tooltip
const uniqueList = (tooltipList) => {
  let list = [];
  let uniqueList = [];
  for (let i = 0; i < tooltipList.length; i++) {
    if (!uniqueList.includes(tooltipList[i].key)) {
      uniqueList.push(tooltipList[i].key);
      list.push(tooltipList[i]);
    }
  }
  return JSON.parse(JSON.stringify(list));
};

// 返回tooltip参数对象
const setTooltipObj = (featureObj, canvasCss, legendCheckFlag) => {
  let obj = null;
  if (typeof featureObj === 'string') {
    obj = tooltipConfig('CAT');
    obj.key = setCatName(featureObj);
  } else {
    obj = tooltipConfig(featureObj.dtype);
    if (featureObj.dtype === 'CAT') {
      obj.key = setCatName(featureObj);
    } else {
      obj.key = setAggrName(featureObj);
    }
  }
  if (legendCheckFlag) {
    obj.hasLegend = true;
  }
  obj.title = obj.key;
  obj.id = obj.key;
  let oldObj = hasTooltipObj(obj, canvasCss);
  if (oldObj) {
    if (legendCheckFlag) {
      oldObj.hasLegend = true;
    } else {
      oldObj.hasLegend = false;
      oldObj.legendCheck = false;
    }
    return oldObj;
  }
  return obj;
};

// 判断已有tooltipList中是否已经有tooltip
const hasTooltipObj = (tooltipObj, canvasCss) => {
  const tooltipList = canvasCss.tooltipList || [];
  for (let i = 0, len = tooltipList.length; i < len; i++) {
    if (tooltipObj.key === tooltipList[i].key) {
      return JSON.parse(JSON.stringify(tooltipList[i]));
    }
  }
  return null;
};
