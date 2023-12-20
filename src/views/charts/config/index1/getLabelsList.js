import labelConfig from '../utils/labelConfig';
import { setAggrName, setCatName } from '../utils/index';
export default (canvasFeatures, canvasCss, isRotated) => {
  const yList = isRotated ? canvasFeatures.x || [] : canvasFeatures.y || [];
  const len = yList.length;
  let aggrIndex = 0;
  let labelsList = [];
  for (let i = 0; i < len; i++) {
    if (yList[i].feature) {
      if (yList[i].feature.dtype === 'AGGR') {
        labelsList.push(...setLabelList(yList[i].feature, aggrIndex, 0, canvasCss));
        aggrIndex++;
      }
    } else if (yList[i].left || yList[i].right) {
      let left = yList[i].left;
      let right = yList[i].right;
      setYAxisList(left, labelsList, 0, aggrIndex, canvasCss);
      setYAxisList(right, labelsList, left.length, aggrIndex, canvasCss);
      aggrIndex++;
    } else if (yList[i].pills) {
      let left = yList[i].pills.filter(item => item.status === 'left');
      let right = yList[i].pills.filter(item => item.status === 'right');
      setYAxisList(left, labelsList, 0, aggrIndex, canvasCss);
      setYAxisList(right, labelsList, left.length, aggrIndex, canvasCss);
      aggrIndex++;
    } else {
      if (yList[i].dtype === 'AGGR') {
        labelsList.push(...setLabelList(yList[i], aggrIndex, 0, canvasCss));
        aggrIndex++;
      }
    }
  }
  return labelsList;
};

// 设置组合特征的label
const setYAxisList = (list, labelsList, start, aggrIndex, canvasCss) => {
  for (let j = 0, len = list.length; j < len; j++) {
    labelsList.push(...setLabelList(list[j], aggrIndex, start + j, canvasCss));
  }
};

// 设置标签列表
export const setLabelList = (featureObj, aggrIndex, index, canvasCss) => {
  if (!featureObj.labels) {
    return [];
  }
  let list = [];
  let labels = featureObj.labels;
  for (let i = 0, len = labels.length; i < len; i++) {
    let obj = labelConfig(labels[i].dtype, canvasCss.bgCss);
    obj.key = setAggrName(featureObj);
    if (labels[i].dtype === 'CAT') {
      obj.title = setCatName(labels[i]);
    } else {
      obj.title = setAggrName(labels[i]);
    }
    obj.keyId = `${aggrIndex}-${index}`;
    let oldObj = hasLabelObj(obj, canvasCss);
    if (oldObj) {
      list.push(oldObj);
    } else {
      list.push(obj);
    }
  }
  return list;
};

// 判断已有标签中是否有相同的标签
const hasLabelObj = (obj, canvasCss) => {
  const list = canvasCss.labelsList || [];
  for (let i = 0, len = list.length; i < len; i++) {
    if (list[i].keyId === obj.keyId && obj.key === list[i].key && list[i].title === obj.title) {
      return JSON.parse(JSON.stringify(list[i]));
    }
  }
  return null;
};
