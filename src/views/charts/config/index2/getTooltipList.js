import tooltipConfig from '../utils/tooltipConfig';
import { setCatName, setAggrName } from '../utils/index';
export default (canvasFeatures, css, metadata) => {
  let sizeList = setList([canvasFeatures.size], css, metadata && metadata.size, !canvasFeatures.color);
  let colorList = setList([canvasFeatures.color], css, metadata && metadata.color, true);
  let labelList = setList(canvasFeatures.labels || [], css, metadata && metadata.labels);
  let xList = setList(canvasFeatures.x || [], css, metadata && metadata.x);
  let yList = setList(canvasFeatures.y || [], css, metadata && metadata.y);
  let labels = setList(canvasFeatures.text || [canvasFeatures.label], css, metadata && metadata.text);
  let area = setList(canvasFeatures.area || [], css, metadata && metadata.area);
  let row = setList(canvasFeatures.row || [], css, metadata && (metadata.row || metadata.y_dimensions));
  let col = setList(canvasFeatures.col || [], css, metadata && (metadata.col || metadata.x_dimensions));
  let tooltipList = [...colorList, ...xList, ...yList, ...sizeList, ...labelList, ...labels, ...area, ...row, ...col];
  return uniqueList(tooltipList);
};

const setList = (list, css, metadataData, legendCheckFlag) => {
  let arr = [];
  let oldColor = null;
  if (legendCheckFlag && list && list[0]) {
    oldColor = JSON.parse(JSON.stringify(list[0]));
  }
  if (metadataData && metadataData.length > 0) {
    if (Array.isArray(list)) {
      metadataData.forEach((item, index) => {
        if (metadataData[index]) {
          // metadata.color[0] !== color.name && (color.isDrilled = true);
          legendCheckFlag && metadataData[index] !== (list[index].split ? `${list[index].name} ${list[index].split}` : list[index].name) && (list[index].isDrilled = true);
          list[index].name = metadataData[index];
        }
      });
    } else {
      if (metadataData[0]) {
        list.name = metadataData[0];
      }
    }
  }
  for (let i = 0; i < list.length; i++) {
    if (!list[i]) return arr;
    if (list[i].feature) {
      arr.push(...setToolTipList(list[i].feature, css, legendCheckFlag));
    } else {
      arr.push(...setToolTipList(list[i], css, legendCheckFlag && !list[i].isDrilled));
    }
  }
  if (oldColor) {
    let obj = setToolTipList(oldColor, css, legendCheckFlag)[0];
    obj.display = 'hidden';
    arr.push(obj);
  }
  return arr;
};

// 设置有标签特征或者颜色特征的tooltip
const setToolTipList = (featureObj, canvasCss, legendCheckFlag) => {
  let labels = featureObj.labels || [];
  let color = featureObj.color;
  let list = [];
  list.push(setTooltipObj(featureObj, canvasCss, legendCheckFlag));
  for (let i = 0, len = labels.length; i < len; i++) {
    list.push(setTooltipObj(labels[i], canvasCss, legendCheckFlag));
  };
  if (color) {
    list.push(setTooltipObj(color, canvasCss, true));
  }
  return list;
};

// 去除同名的tooltip
const uniqueList = (tooltipList) => {
  let list = [];
  let uniqueList = [];
  for (let i = 0; i < tooltipList.length; i++) {
    let keyValue = tooltipList[i].key;
    if (keyValue.split(' ').length > 1) {
      keyValue = keyValue.split(' ')[0];
    }
    if (!uniqueList.includes(keyValue)) {
      uniqueList.push(keyValue);
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
      let featureName = (featureObj && featureObj.name) || featureObj;
      obj.key = setCatName(featureName);
    } else {
      obj.key = setAggrName(featureObj);
    }
    if (featureObj.isDrilled) {
      obj.isDrilled = true;
    }
  }
  obj.title = obj.key;
  obj.id = obj.key;
  obj.display = 'auto';
  let oldObj = hasTooltipObj(obj, canvasCss);
  if (oldObj) {
    // legendCheckFlag && (oldObj.hasLegend = legendCheckFlag);
    if (legendCheckFlag) {
      oldObj.hasLegend = true;
    } else {
      oldObj.hasLegend = false;
      oldObj.legendCheck = false;
    }
    // oldObj.display = 'auto';
    return oldObj;
  }
  if (legendCheckFlag) {
    obj.hasLegend = true;
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
