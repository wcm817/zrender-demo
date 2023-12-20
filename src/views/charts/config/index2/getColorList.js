
import { setAggrName, setCatName, colorTemp, hexToRgba, rgbToHex } from '../utils/index';
export default (list, sizeFeature, css, tooltipList) => {
  const yList = list || [];
  let colorList = [];
  for (let i = 0, len = yList.length; i < len; i++) {
    if (!yList[i]) continue;
    if (yList[i].feature) {
      colorList.push(...setColorObj(yList[i].feature, css, tooltipList));
    } else {
      colorList.push(...setColorObj(yList[i], css, tooltipList));
    }
  }
  if (!colorList.length) {
    return getOneColor(sizeFeature, css, tooltipList);
  }
  if (colorList[0].list && colorList[0].list.length) {
    return {
      colorList: colorList[0].list,
      opacity: colorList[0].opacity
    };
  }
  return {
    colorList: colorTemp,
    opacity: 100
  };
};

const getOneColor = (sizeFeature, css) => {
  let temp = JSON.parse(JSON.stringify(colorTemp));
  let list = css.colorList || [];
  // 首次画图没有colorList时
  if (!list.length) {
    return {
      colorList: temp,
      opacity: 100
    };
  }
  let keyName = list[0].keyName;
  // keyName默认为颜色，有keyName指的是没有拖颜色特征时的colorList
  if (keyName) {
    let color = list[0].color;
    let opacity = list[0].opacity || 100;
    // 如果key默认指大小特征，大小特征不相等时，重新取颜色画图
    if (list[0].key !== sizeFeature && sizeFeature) {
      return {
        colorList: temp,
        opacity: 100
      };
    }
    // color如果是hex，需要转成rgba
    if (color.includes('#')) {
      color = hexToRgba(color, opacity);
    } else {
      color = rgbToHex(color);
      color = hexToRgba(color, opacity);
    }
    temp.splice(0, 1, color);
    return {
      colorList: temp,
      opacity: opacity
    };
  }
  // 如果有拖颜色特征，则直接返回colorList中的颜色
  return {
    colorList: colorTemp,
    opacity: 100
  };
};

// 设置颜色
const setColorObj = (featureObj, css, tooltipList) => {
  let list = [];

  let key = setAggrName(featureObj);
  let matchObj = tooltipList.find(item => item.id === key);
  if (matchObj && matchObj.legendCheck) {
    key = matchObj.title;
  }
  // 颜色列表的数据结构
  let colorObj = {
    colored_type: 'none', // ordinal 分类 linear // 线性 none
    key, // 对应行列颜色的特征名
    list: [],
    opacity: 100 // 颜色透明度
  };
  if (featureObj.dtype === 'CAT') {
    colorObj.colored_type = 'ordinal';
    colorObj.key = setAggrName(featureObj); // 对应行列颜色的特征名
  } else {
    colorObj.colored_type = 'linear';
    colorObj.key = setCatName(featureObj); //
  }
  let oldObj = hasColorObj(featureObj, css);
  if (oldObj) {
    list.push(oldObj);
  } else {
    list.push(colorObj);
  }
  return list;
};

const hasColorObj = (obj, css) => {
  const list = JSON.parse(JSON.stringify(css.colorList || []));
  if (!obj) return null;
  let name = setAggrName(obj);
  if (obj.dtype === 'CAT') {
    name = setCatName(obj);
  }
  for (let i = 0, len = list.length; i < len; i++) {
    if (!list[i].key) continue;
    let tempName = list[i].key.feature || list[i].name;
    if (name === tempName) {
      let colorObj = JSON.parse(JSON.stringify(list[i]));
      return colorObj;
    }
  }
  return null;
};
