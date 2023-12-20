import { setAggrName } from '../config/utils/index';
import colorConfig from '../config/utils/colorConfig';

export default ({ features, oldColorList, featureData, tooltipList }) => {
  let title = features.color && setAggrName(features.color);
  if (!title) {
    return [];
  }
  const defaultColorArr = colorConfig.colorSet.numeric;
  const dataArr = featureData.map((item) => item[title]);

  // tooltip配置中是否修改title
  let matchObj = tooltipList.find(item => item.id === title);
  let originTitle;
  if (matchObj && matchObj.legendCheck) {
    originTitle = title;
    title = matchObj.title;
  }

  let opacity = 100;
  let oldColorArr = [];
  if (oldColorList.length) {
    const oldColorTitle = oldColorList[0].title || oldColorList[0].name;
    if (oldColorTitle === title) { // 颜色字段不变的情况
      return oldColorList.map((item) => ({
        type: 'AGGR',
        title,
        originTitle,
        opacity: item.opacity,
        list: item.list
      }));
    }
  }

  const min = Math.min.apply(null, dataArr);
  const max = Math.max.apply(null, dataArr);
  const colorArr = oldColorArr.length ? oldColorArr : defaultColorArr;
  let list = colorArr.map((item, i) => ({
    color: item,
    originValue: i === 0 ? min : max,
    val: i === 0 ? min.toFixed(2) : max.toFixed(2)
  }));



  return [
    {
      type: 'AGGR',
      title,
      originTitle,
      opacity,
      list
    }
  ]
}