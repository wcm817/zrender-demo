import { setAggrName } from '../utils/index';
export default (canvasFeature, canvasCss, isRotated) => {
  const yList = isRotated ? canvasFeature.x || [] : canvasFeature.y || [];
  let aggrIndex = 0;
  let scopeList = [];
  for (let i = 0, len = yList.length; i < len; i++) {
    if (yList[i].feature) {
      if (yList[i].feature.dtype === 'AGGR') {
        scopeList.push(setScopeObj(yList[i].feature, aggrIndex, 0, canvasCss.scopeList));
        aggrIndex++;
      }
    } else if (yList[i].left || yList[i].right) {
      let left = yList[i].left;
      let right = yList[i].right;
      setYAxisList(left, scopeList, 0, aggrIndex, canvasCss);
      setYAxisList(right, scopeList, left.length, aggrIndex, canvasCss);
      aggrIndex++;
    } else if (yList[i].pills) {
      let left = yList[i].pills.filter(item => item.status === 'left');
      let right = yList[i].pills.filter(item => item.status === 'right');
      setYAxisList(left, scopeList, 0, aggrIndex, canvasCss);
      setYAxisList(right, scopeList, left.length, aggrIndex, canvasCss);
      aggrIndex++;
    } else {
      if (yList[i].dtype === 'AGGR') {
        scopeList.push(setScopeObj(yList[i], aggrIndex, 0, canvasCss.scopeList));
        aggrIndex++;
      }
    }
  }
  return scopeList;
};

// 设置组合特征left跟right中的yAxis对象
const setYAxisList = (list, scopeList, start, aggrIndex, canvasCss) => {
  let key = [];
  let keyId = [];
  for (let j = 0, len = list.length; j < len; j++) {
    key.push(setAggrName(list[j]));
    keyId.push(`${aggrIndex}-${start + j}`);
  }
  let scopeObj = {
    key: key,
    keyId: keyId
  };
  scopeObj = getOldScopeObj(canvasCss.scopeList, scopeObj);
  scopeList.push(scopeObj);
};

// 设置scope对象
const setScopeObj = (featureObj, aggrIndex, index, scopeList) => {
  let obj = {
    key: [setAggrName(featureObj)],
    keyId: [`${aggrIndex}-${index}`]
  };
  obj = getOldScopeObj(scopeList, obj);
  return obj;
};

// 判断是否有设定好的样式
const getOldScopeObj = (scopeList, obj) => {
  if (!scopeList) return obj;
  for (let i = 0; i < scopeList.length; i++) {
    const oldKeyStr = JSON.stringify(scopeList[i].key);
    const oldKeyIdStr = JSON.stringify(scopeList[i].keyId);
    const keyStr = JSON.stringify(obj.key);
    const keyIdStr = JSON.stringify(obj.keyId);
    if (oldKeyStr === keyStr && oldKeyIdStr === keyIdStr) {
      return scopeList[i];
    }
  }
  return obj;
};
