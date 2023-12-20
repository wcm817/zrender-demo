import colorConfig from '../config/utils/colorConfig';
import { setCatName, setAggrName, RGBAHandler } from '../config/utils/index';

export default ({ sizeName, featuresColor, oldColorList, chartData, tooltipList }) => {
  const type = featuresColor?.dtype || 'CAT';
  let title = type === 'CAT' ? setCatName(featuresColor) : setAggrName(featuresColor);
  // 有下钻时，data.metadata.color[0]与title不一致， 取data.metadata.color[0]
  title = chartData.metadata.color[0] || title || '指标名称';
  let opacity = 100;
  let defaultColorArr = type === 'CAT' ? colorConfig.colorSet.category : colorConfig.colorSet.numeric;
  let oldColorArr = [];
  if (oldColorList.length) {
    const oldColorTitle = oldColorList[0].title || oldColorList[0].name;
    if (oldColorTitle === title) { // 颜色字段不变的情况
      opacity = oldColorList[0].opacity;
      if (Array.isArray(oldColorList[0].list) && !oldColorList[0].list.length) {
        // 兼容旧数据 和 渐变色数据
        oldColorArr = oldColorList[0].list.map((item) => RGBAHandler((item.color || item), opacity));
      } else {
        oldColorArr = Object.values(oldColorList[0].list).map((item) => RGBAHandler(item.color, opacity));
      }
    }
  }
  const featureData = JSON.parse(JSON.stringify(chartData.features_data));
  let list = [];
  if (type === 'CAT') {
    list = featureData
      .reduce((pre, item) => {
        let key = item[title] || sizeName;
        if (Object.keys(pre).includes(key)) return pre;
        const index = Object.keys(pre).length;
        return {
          ...pre,
          [key]: { color: oldColorArr[index] || defaultColorArr[index % defaultColorArr.length] }
        };
      }, {});
  } else {
    const arr = featureData.map((item) => item[title]);
    const min = Math.min.apply(null, arr);
    const max = Math.max.apply(null, arr);
    const colorArr = oldColorArr.length ? oldColorArr : defaultColorArr;
    list = colorArr.map((item, i) => ({
      color: item,
      originValue: i === 0 ? min : max,
      val: i === 0 ? min.toFixed(2) : max.toFixed(2)
    }));
  }

  // tooltip配置中是否修改title
  let matchObj = tooltipList.find(item => item.id === title);
  let originTitle;
  if (matchObj && matchObj.legendCheck) {
    originTitle = title;
    title = matchObj.title;
  }

  return [
    {
      type,
      title,
      originTitle,
      opacity,
      list
    }
  ];
};

