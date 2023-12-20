import { setCatName, setAggrName } from '../utils/index';
import axisConfig from './axisConfig';
export default (metadata, features, css, isRotated) => {
  const yList = isRotated ? features.x || [] : features.y || [];
  const metaYList = metadata.y_dimensions || [];
  let aggrIndex = 0;
  let yAxis = [];
  let yAxisPart = [];
  for (let i = 0; i < yList.length; i++) {
    if (yList[i].feature) {
      if (yList[i].feature.dtype === 'CAT') {
        yAxisPart.push(setPartObj(metaYList[i] || yList[i].feature, aggrIndex, i, css));
      } else {
        yAxis.push([setYAxisObj(yList[i].feature, 'left', aggrIndex, 0, css)]);
        aggrIndex++;
      }
    } else if (yList[i].left || yList[i].right) {
      let left = yList[i].left;
      let right = yList[i].right;
      let list = [];
      setYAxisList(left, 'left', list, 0, aggrIndex, css);
      setYAxisList(right, 'right', list, left.length, aggrIndex, css);
      aggrIndex++;
      yAxis.push(list);
    } else if (yList[i].pills) {
      let left = yList[i].pills.filter(item => item.status === 'left');
      let right = yList[i].pills.filter(item => item.status === 'right');
      let list = [];
      setYAxisList(left, 'left', list, 0, aggrIndex, css);
      setYAxisList(right, 'right', list, left.length, aggrIndex, css);
      aggrIndex++;
      yAxis.push(list);
    } else {
      if (yList[i].dtype === 'CAT') {
        yAxisPart.push(setPartObj(metaYList[i], aggrIndex, i, css));
      } else {
        yAxis.push([setYAxisObj(yList[i], 'left', aggrIndex, 0, css)]);
        aggrIndex++;
      }
    }
  }
  return {
    yAxis,
    yAxisPart,
  };
};

// 设置组合特征left跟right中的yAxis对象
const setYAxisList = (list, position, arr, start, aggrIndex, css) => {
  let obj = axisConfig(css.bgCss);
  obj.position = position;
  obj.key = [];
  obj.keyId = [];
  obj.type = [];
  for (let j = 0; j < list.length; j++) {
    obj.key.push(setAggrName(list[j]));
    obj.keyId.push(`${aggrIndex}-${start + j}`);
    obj.type.push(list[j].type || 'bar');
  }
  obj.title.value = obj.key.join('&');
  arr.push(hasYAxisObj(obj, css));
};

// 设置yAxis对象
const setYAxisObj = (featureObj, position, aggrIndex, index, css) => {
  let obj = axisConfig(css.bgCss);
  obj.position = position;
  obj.key = [setAggrName(featureObj)];
  obj.type = [featureObj.type || 'bar'];
  obj.title.value = obj.key.join('&');
  obj.keyId = [`${aggrIndex}-${index}`];
  return hasYAxisObj(obj, css);
};

// 设置yAxisPart对象
const setPartObj = (featureObj, aggrIndex, index, css) => {
  let obj = axisConfig(css.bgCss);
  obj.position = 'left-part';
  obj.key = [setCatName(featureObj)];
  obj.keyId = `${aggrIndex}-${index}`;
  return hasYAxisObj(obj, css);
};

const hasYAxisObj = (obj, css) => {
  let list = css.axis_style || [];
  let yAxis = list.filter(item => item.axisType === 'y');
  const objKeyIdStr = JSON.stringify(obj.keyId);
  const keyStr = JSON.stringify(obj.key);
  for (let i = 0, len = yAxis.length; i < len; i++) {
    const yAxisKeyIdStr = JSON.stringify(yAxis[i].keyId);
    const yAxisKeyStr = JSON.stringify(yAxis[i].key);
    if (objKeyIdStr === yAxisKeyIdStr && yAxisKeyStr === keyStr) {
      let yAxisObj = JSON.parse(JSON.stringify(yAxis[i]));
      yAxisObj.axisType = 'y';
      yAxisObj.key = JSON.parse(JSON.stringify(obj.key));
      yAxisObj.type = JSON.parse(JSON.stringify(obj.type || []));
      // yAxisObj.title.value = obj.title.value;
      return yAxisObj;
    }
  }
  obj.axisType = 'y';
  if (yAxis.length) {
    obj.grid = yAxis[0].grid;
    obj.line = yAxis[0].line;
    obj.title.style = yAxis[0].title.style;
  }
  return JSON.parse(JSON.stringify(obj));
};
