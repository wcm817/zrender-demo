import colorConfig from '../config/utils/colorConfig';
import { RGBAHandler } from '../config/utils/index';
import { setAggrName, setCatName } from '../config/utils/index';

export default ({ features, colorList, tooltipList, featuresData }) => {
  const oldColorList = JSON.parse(JSON.stringify(colorList || []));
  let defaultColorArr = colorConfig.colorSet.category;
  // 颜色根据 行数据 来设置
  const yList = features.y || [];
  let newColorList = [];
  for (let i = 0, len = yList.length; i < len; i++) {
    let obj = { type: 'CAT' };
    if (yList[i].feature && !yList[i].feature.color) {
      let key = setAggrName(yList[i].feature);
      let oldKeyColor = getOldColorInfos(key, oldColorList).oldKeyColor;
      let oldOpacity = getOldColorInfos(key, oldColorList).oldOpacity;

      let matchObj = tooltipList.find(item => item.id === key);
      if (matchObj && matchObj.legendCheck) {
        obj.originTitle = key;
        key = matchObj.title;
      }
      obj.title = '指标名称';
      obj.opacity = oldOpacity || 100;
      obj.list = { [key]: { color: oldKeyColor || "rgba(66, 132, 245, 1)" } }; // 默认颜色
    } else {
      let feature = setCatName(yList[i].feature.color);
      let oldOpacity = '';
      let list = featuresData[i].feature
        .reduce((pre, item) => {
          const key = item[feature];
          // 如果颜色对象中该键key已存在  无需再设置颜色
          if (Object.keys(pre).includes(key)) return pre;
          const index = Object.keys(pre).length;
          let oldKeyColor = getOldColorInfos(key, oldColorList).oldKeyColor;
          oldOpacity = getOldColorInfos(key, oldColorList).oldOpacity;
          return {
            ...pre,
            [key]: { color: oldKeyColor || defaultColorArr[index % defaultColorArr.length] }
          };
        }, {});
      let title = setAggrName(yList[i].feature);
      let matchObj = tooltipList.find(item => item.id === title);
      if (matchObj && matchObj.legendCheck) {
        title = matchObj.title;
      }
      obj.title = title;
      obj.feature = feature;
      obj.opacity = oldOpacity || 100;
      obj.list = list;
    }
    newColorList.push(obj);
  }
  return newColorList;
};


const getOldColorInfos = (key, oldColorList) => {
  let oldKeyColor = '';
  let oldOpacity = '';
  for (let k = 0; k < oldColorList.length; k++) {
    oldKeyColor = oldColorList[k].color; // 兼容旧数据
    oldOpacity = oldColorList[k].opacity; // 兼容旧数据
    if (oldColorList[k].list[key]) {
      oldOpacity = oldColorList[k].opacity;
      oldKeyColor = RGBAHandler(oldColorList[k].list[key], oldOpacity);
      break;
    }
  };

  return {
    oldKeyColor,
    oldOpacity
  };
};
