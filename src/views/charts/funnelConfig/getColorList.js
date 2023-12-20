import colorConfig from '../config/utils/colorConfig';
import { RGBAHandler } from '../config/utils/index';

export default ({ colorName, sizeName, oldColorList, chartData, tooltipList }) => {
  // 有下钻时，data.metadata.color[0]与 colorName不一致， 取data.metadata.color[0]
  let title = chartData.metadata.color[0] || colorName || '指标名称';
  let opacity = 100;
  let defaultColorArr = colorConfig.colorSet.category;
  let oldColorArr = [];
  if (oldColorList.length) {
    const oldColorTitle = oldColorList[0].title || oldColorList[0].name;
    if (oldColorTitle === title) { // 颜色字段不变的情况
      opacity = oldColorList[0].opacity;
      if (Array.isArray(oldColorList[0].list)) {
        // 兼容旧数据
        oldColorArr = oldColorList[0].list.map((item) => RGBAHandler(item.color, opacity));
      } else {
        oldColorArr = Object.values(oldColorList[0].list).map((item) => RGBAHandler(item.color, opacity));
      }
    }
  }

  const featureData = JSON.parse(JSON.stringify(chartData.features_data));
  let list = featureData
    .reduce((pre, item) => {
      const key = item[title] || sizeName;
      // 如果颜色对象中该键key已存在  无需再设置颜色
      if (Object.keys(pre).includes(key)) return pre;
      const index = Object.keys(pre).length;
      return {
        ...pre,
        [key]: { color: oldColorArr[index] || defaultColorArr[index % defaultColorArr.length] }
      };
    }, {});

  // tooltip配置中是否修改title
  let matchObj = tooltipList.find(item => item.id === title);
  let originTitle;
  if (matchObj && matchObj.legendCheck) {
    originTitle = title;
    title = matchObj.title;
  }

  return [
    {
      type: 'CAT',
      title,
      originTitle,
      opacity,
      list
    }
  ];
};
