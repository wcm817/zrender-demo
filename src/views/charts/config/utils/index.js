export const setCatName = (feature) => {
  if (!feature) return null;
  let name = feature.name || feature;
  if (feature.split) {
    if (feature.split instanceof Array) {
      let arr = [];
      let list = feature.split;
      for (let i = 0; i < list.length; i++) {
        arr.push(
          `${name}${' '}${list[i]
            .split(',')
            .join('-')
            .toLocaleLowerCase()}``${name.split(' ')[0]}${' '}${list[i]
              .split(',')
              .join('-')}`
        );
      }
      return arr;
    } else {
      if (typeof (feature) !== 'string') {
        name = `${name}${' '}${feature.split}`;
        // name = `${name}${' '}${feature.split
        //   .split(',')
        //   .join('-')
        //   .toLocaleLowerCase()}`;
        // name = `${name.split(' ')[0]}${' '}${feature.split
        //   .split(',')
        //   .join('-')}`;
      }
    }
  }
  return name;
};

export const setAggrName = (feature) => {
  if (!feature) return null;
  let name = feature.name;
  if (feature.legend && feature.formula_type !== 'AGGR') {
    name = `${feature.legend.toLocaleLowerCase()}(${feature.name})`;
    if (feature.legend === 'PERCENTILE') {
      name = `${feature.legend.toLocaleLowerCase()}${feature.probability}(${feature.name})`;
    }
  }
  if (feature.split) {
    name = `${name} ${feature.split}`;
  }
  return aggrName(feature.rate, name);
  // } else {
  //   return aggrName(feature.rate, feature.name);
  // }
};

const aggrName = (rate, newName) => {
  if (rate) {
    let { type, growth } = rate;
    if (growth) {
      newName = `${type === 'RING' ? 'Last Period' : 'Same Period'} Growth ${newName}`;
    } else {
      newName = `${type === 'RING' ? 'Last Period' : 'Same Period'} ${newName}`;
    }
  }
  return newName;
};

export const getContainer = (dom) => {
  return {
    width: dom.clientWidth,
    height: dom.clientHeight
  };
};

export const getSize = (dom, fitModel) => {
  let size = {};
  let width = dom.clientWidth;
  let height = dom.clientHeight;
  if (fitModel === 'full') {
    size = {
      width: width,
      height: height
    };
  } else if (fitModel === 'fitWidth') {
    size = {
      width: width
    };
  } else if (fitModel === 'fitHeight') {
    size = {
      height: height
    };
  }
  return size;
};

export const colorTemp = [
  '#4284F5',
  '#03B98C',
  '#FACC14',
  '#F5282D',
  '#8543E0',
  '#3FAECC',
  '#3110D0',
  '#E88F00',
  '#DE2393',
  '#91BA38',
  '#99B4BF',
  '#216A58',
  '#AB9438',
  '#F4999B',
  '#C9BFE1',
  '#055166',
  '#1F135A',
  '#43140A',
  '#96005A',
  '#8D8D8D'
];

export const getContainerSize = (id) => {
  let dom = document.querySelector(`#dc_${id}`);
  return {
    width: dom.clientWidth,
    height: dom.clientHeight
  };
};

export const getLabelFeature = (labels, metadataLabels) => {
  let list = [];
  for (let i = 0; i < labels.length; i++) {
    let labelsItem = null;
    if (metadataLabels && metadataLabels.length > 0 && metadataLabels[i]) {
      labelsItem = metadataLabels[i];
    }
    let obj = {};
    if (!labels[i]) continue;
    if (labels[i].dtype === 'CAT') {
      obj.feature = labelsItem || labels[i].name;
      obj.type = 'ordinal';
    } else {
      obj.feature = labelsItem || setAggrName(labels[i]);
      obj.type = 'linear';
    }
    list.push(obj);
  }
  return list;
};

export const getColorFeature = (featureObj, metadataColor) => {
  if (metadataColor && metadataColor.length > 0 && metadataColor[0]) {
    featureObj.name = metadataColor[0];
  }
  let featureName = (featureObj && featureObj.name) || featureObj;
  let obj = {
    feature: setCatName(featureName),
    stacked: true,
    type: 'ordinal'
  };
  if (!featureObj) return obj;
  if (featureObj.dtype === 'AGGR') {
    obj.stacked = false;
    obj.type = 'linear';
    obj.feature = setAggrName(featureObj);
  }
  return obj;
};

export const hexToRgba = (hex, opacity) => {
  if (typeof hex === 'object') hex = hex.background;
  if (hex === '#fff') hex = '#ffffff';
  if (hex === '#000') hex = '#000000';
  if (!opacity && opacity !== 0) opacity = 100;
  if (!hex) return 'rbga(255,255,255,0)';
  let r = parseInt('0x' + hex.slice(1, 3));
  let g = parseInt('0x' + hex.slice(3, 5));
  let b = parseInt('0x' + hex.slice(5, 7));
  if (opacity < 1 && opacity > 0) {
    return `rgba(${r}, ${g}, ${b}, ${opacity})`;
  }
  let a = opacity / 100;
  return `rgba(${r}, ${g}, ${b}, ${a})`;
};

export const rgbaToHex = (color) => {
  let values = color.replace(/rgba?\(/, '').replace(/\)/, '').replace(/[\s+]/g, '').split(',');
  let a = parseFloat(values[3] || 1);
  let r = Math.floor(a * parseInt(values[0]) + (1 - a) * 255);
  let g = Math.floor(a * parseInt(values[1]) + (1 - a) * 255);
  let b = Math.floor(a * parseInt(values[2]) + (1 - a) * 255);
  return `#${('0' + r.toString(16)).slice(-2)}${('0' + g.toString(16)).slice(-2)}${('0' + b.toString(16)).slice(-2)}`;
};

export const rgbToHex = (color) => {
  let values = color.replace(/rgba?\(/, '').replace(/\)/, '').replace(/[\s+]/g, '').split(',');
  let r = Math.floor(parseInt(values[0]));
  let g = Math.floor(parseInt(values[1]));
  let b = Math.floor(parseInt(values[2]));
  return `#${('0' + r.toString(16)).slice(-2)}${('0' + g.toString(16)).slice(-2)}${('0' + b.toString(16)).slice(-2)}`;
};

export const notEmpty = (o) => {
  return !isEmpty(o);
};

// 对象是否为空
const isEmpty = o => (
  isUndefined(o) || o === null || (isString(o) && o.length === 0) || (isObjectType(o) && Object.keys(o).length === 0)
);

// 是否是对象
const isObjectType = v => typeof v === 'object';

// 是否是字符
const isString = v => typeof v === 'string';

// 是否为undefined
const isUndefined = v => typeof v === 'undefined';


// 将颜色格式都转换为rgba
export const RGBAHandler = (color, opacity) => {
  if (!color) return 'rgba(0, 0, 0, 1)';
  if (opacity && opacity > 1) {
    opacity = opacity / 100;
  }
  if (color.startsWith('rgb')) {
    let rgba = color.match(/(\d(\.\d+)?)+/g);
    return `rgba(${rgba[0]}, ${rgba[1]}, ${rgba[2]}, ${opacity || rgba[3]})`;
  };
  let r = 0;
  let g = 0;
  let b = 0;
  if (color.startsWith('#')) {
    let str = color.substring(1, color.length);
    if (str.length > 3) {
      r = parseInt(str.substring(0, 2), 16);
      g = parseInt(str.substring(2, 4), 16);
      b = parseInt(str.substring(4, 6), 16);
    } else {
      r = parseInt(str[0] + str[0], 16);
      g = parseInt(str[1] + str[1], 16);
      b = parseInt(str[2] + str[2], 16);
    }
  } else if (color.startsWith('rgb')) {
  }
  return `rgba(${r}, ${g}, ${b}, ${opacity || 1})`;
};
