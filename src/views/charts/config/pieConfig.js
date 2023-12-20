import { setCatName, setAggrName, RGBAHandler } from './utils';
import getTooltipList from './index2/getTooltipList';
import getLabels from './index2/getLabels';
import defaultConfig from './defaultConfig';

export default (data, config) => {
  const { features, css, metadata } = JSON.parse(JSON.stringify({ ...data, ...config }));
  let customFeatures = JSON.parse(JSON.stringify(features));
  const { newLabel: labelsList } = getLabels(customFeatures.labels, JSON.parse(JSON.stringify(css)));
  return {
    ...config,
    css: {
      ...config.css,
      size: config.css.size || 50,
      colorList: getColorList(data, config),
      tooltipList: getTooltipList(features, css, metadata),
      labelsList
    }
  }
}

const getColorList = (data, config) => {
  const oldColorList = config.css.colorList || [];
  const colorFeature = config.features.color;
  const type = colorFeature?.dtype || 'CAT';
  let title = type === 'CAT' ? setCatName(colorFeature) : setAggrName(colorFeature);
  // 有下钻时，data.metadata.color[0]与title不一致， 取data.metadata.color[0]
  title = data.metadata.color[0] || title || '指标名称';
  let opacity = 100;
  let colorArr = type === 'CAT' ? defaultConfig.colorSet.category : defaultConfig.colorSet.numeric;
  if (oldColorList.length) {
    const oldColorTitle = oldColorList[0].title || oldColorList[0].name;
    if (oldColorTitle === title) { // 颜色字段不变的情况
      opacity = oldColorList[0].opacity;
      if (Array.isArray(oldColorList[0].list)) {
        // 兼容旧数据
        colorArr = oldColorList[0].list.map((item) => item.color || item);
      } else {
        colorArr = type === 'CAT'
          ? Object.values(oldColorList[0].list).map((item) => RGBAHandler(item.color, opacity))
          : oldColorList[0].list;
      }
    }
  }
  // 把颜色值转成rgba格式 colorArr不是数组时, 使用RGBAHandler处理颜色
  colorArr = Array.isArray(colorArr) ? colorArr.map((item) => RGBAHandler(item, opacity)) : colorArr;
  const featureData = JSON.parse(JSON.stringify(data.features_data));
  let list = type === 'CAT'
    ? featureData
      .reduce((pre, item, i) => {
        const sizeKey = `${config.features.size.legend.toLocaleLowerCase()}(${config.features.size.name})`;
        const key = item[title] || sizeKey;
        return {
          ...pre,
          [key]: { color: colorArr[i % colorArr.length] }
        };
      }, {})
    : colorArr;

  return [
    {
      type,
      title,
      opacity,
      list
    }
  ];
};
