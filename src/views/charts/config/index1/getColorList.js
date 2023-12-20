import { setAggrName, setCatName } from '../utils/index';
export default (canvasFeature, canvasCss, isRotated, tooltipList) => {
  const yList = isRotated ? canvasFeature.x || [] : canvasFeature.y || [];
  let aggrIndex = 0;
  let colorList = [];
  for (let i = 0, len = yList.length; i < len; i++) {
    if (yList[i].feature) {
      if (yList[i].feature.dtype === 'AGGR') {
        colorList.push(...setColorObj(yList[i].feature, aggrIndex, 0, canvasCss, tooltipList));
        aggrIndex++;
      }
    } else if (yList[i].left || yList[i].right) {
      let left = yList[i].left;
      let right = yList[i].right;
      setYAxisList(left, colorList, 0, aggrIndex, canvasCss, tooltipList);
      setYAxisList(right, colorList, left.length, aggrIndex, canvasCss, tooltipList);
      aggrIndex++;
    } else if (yList[i].pills) {
      let left = yList[i].pills.filter(item => item.status === 'left');
      let right = yList[i].pills.filter(item => item.status === 'right');
      setYAxisList(left, colorList, 0, aggrIndex, canvasCss, tooltipList);
      setYAxisList(right, colorList, left.length, aggrIndex, canvasCss, tooltipList);
      aggrIndex++;
    } else {
      if (yList[i].dtype === 'AGGR') {
        colorList.push(...setColorObj(yList[i], aggrIndex, 0, canvasCss, tooltipList));
        aggrIndex++;
      }
    }
  }
  return colorList;
};

// 设置组合特征left跟right中的yAxis对象
const setYAxisList = (list, colorList, start, aggrIndex, canvasCss, tooltipList) => {
  for (let j = 0, len = list.length; j < len; j++) {
    colorList.push(...setColorObj(list[j], aggrIndex, start + j, canvasCss, tooltipList));
  }
};

// 设置颜色
const setColorObj = (featureObj, index, num, canvasCss, tooltipList) => {
  let list = [];
  let keyId = '';
  if (isNaN(num)) {
    keyId = `${index}`;
  } else {
    keyId = `${index}-${num}`;
  }
  let key = setAggrName(featureObj);
  let originalKey = key;
  let matchObj = tooltipList.find(item => item.id === key);
  if (matchObj && matchObj.legendCheck) {
    key = matchObj.title;
  }
  // 颜色列表的数据结构
  let colorObj = {
    feature: '', // 对应的颜色特征名
    type: 'none', // ordinal 分类 linear // 线性 none
    // key: setAggrName(featureObj), // 对应行列颜色的特征名
    key, // 对应行列颜色的特征名
    originalKey,
    color: '#4284f5', // 没有颜色特征时的默认颜色
    list: [],
    canvasType: featureObj.type || 'bar',
    fillType: 'fill', // 填充类型
    opacity: 100, // 颜色透明度
    keyId: keyId, // 匹配颜色标记
    keyName: featureObj.name, // 匹配名称
  };
  if (featureObj.color) {
    if (featureObj.color.dtype === 'CAT') {
      colorObj.type = 'ordinal';
      colorObj.feature = setCatName(featureObj.color);
    } else {
      colorObj.type = 'linear';
      colorObj.feature = setAggrName(featureObj.color);
    }
  }
  let oldObj = hasColorObj(colorObj, canvasCss);
  if (oldObj) {
    list.push(oldObj);
  } else {
    list.push(colorObj);
  }
  return list;
};

const hasColorObj = (obj, canvasCss) => {
  const list = canvasCss.colorList || [];
  for (let i = 0, len = list.length; i < len; i++) {
    if (obj.keyId === list[i].keyId) {
      let colorObj = JSON.parse(JSON.stringify(list[i]));
      colorObj.type = obj.type;
      colorObj.keyName = obj.keyName;
      colorObj.key = obj.key;
      colorObj.originalKey = obj.originalKey || obj.key;
      colorObj.canvasType = obj.canvasType;
      if (obj.feature !== colorObj.feature) {
        colorObj.list = [];
        colorObj.fillType = 'fill';
      }
      colorObj.feature = obj.feature;
      return colorObj;
    }
  }
  return null;
};
