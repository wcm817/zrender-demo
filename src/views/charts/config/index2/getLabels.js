import labelConfig from '../utils/labelConfig';
import { setAggrName, setCatName } from '../utils/index';
export default (list, canvasCss, type) => {
  console.log('getLabel---------', list);
  const yList = list || [];
  const len = yList.length;
  let labelsList = [];
  for (let i = 0; i < len; i++) {
    if (!yList[i]) continue;
    let obj = {};
    if (type === 'map') {
      obj = labelConfig(yList[i].dtype);
    } else {
      obj = labelConfig(yList[i].dtype, canvasCss.bgCss);
    }
    obj.key = setAggrName(yList[i]);
    if (yList[i].dtype === 'CAT') {
      let featureName = yList[i];
      if (yList[i].name && yList[i].split && yList[i].name.indexOf(yList[i].split) >= 0) {
        featureName = yList[i].name;
      }
      obj.key = setCatName(featureName);
      obj.title = setCatName(featureName);
    } else {
      obj.key = setAggrName(yList[i]);
      obj.title = setAggrName(yList[i]);
    }
    obj.keyId = `${i}-0}`;
    let oldObj = hasLabelObj(obj, canvasCss);
    if (oldObj) {
      labelsList.push(oldObj);
    } else {
      labelsList.push(obj);
    }
  }
  let { checked, originalChecked } = canvasCss;
  let newList = JSON.parse(JSON.stringify(labelsList)) || [];
  if (checked) {
    let obj = JSON.parse(JSON.stringify(newList[0]));
    if (!obj.key.includes(' percent')) {
      obj.key = `${obj.key} percent`;
      obj.format.isPercent = true;
      obj.format.selectFormat = 'percent';
      obj.format.suffix = '%';
    }
    obj.title = obj.key;
    let oldObj = hasLabelObj(obj, canvasCss);
    newList.splice(1, 0, oldObj || obj);
  }
  if (newList.length) {
    if (!originalChecked) {
      newList[0].display = 'none';
    } else {
      newList[0].display = 'auto';
    }
  }
  return {
    oldLabel: labelsList,
    newLabel: newList.filter(item => item.display !== 'none')
  };
};

// 判断已有标签中是否有相同的标签
const hasLabelObj = (obj, canvasCss) => {
  const list = canvasCss.labelsList || [];
  for (let i = 0, len = list.length; i < len; i++) {
    // if (list[i].keyId === obj.keyId && obj.key === list[i].key && list[i].title === obj.title) {
    // 标签个数减少会改变keyid，用keyid判断是否相同会出现错误
    if (obj.key === list[i].key && list[i].title === obj.title) {
      return JSON.parse(JSON.stringify(list[i]));
    }
  }
  return null;
};
