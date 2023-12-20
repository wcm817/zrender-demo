/**
 * @description: 获取下钻的特征
 * @param {string} type 类型： row 行 | column 列
 * @param {*} metadata chartData中的metadata
 * @param {array} catList cat特征数组
 * @return {*}
 */
export default (type, metadata, catList) => {
  let x = (metadata && metadata.x_dimensions) ? metadata.x_dimensions : [];
  let y = (metadata && metadata.y_dimensions) ? metadata.y_dimensions : [];
  let xy = [...x, ...y];
  let filterResult = [];
  let getGroups = getGroup(catList);
  for (let i = 0; i < getGroups.length; i++) {
    let filterFeature;
    let curGroupLength = getGroups[i].groups.length;
    for (let j = 0; j < getGroups[i].groups.length; j++) {
      if (xy.indexOf(getGroups[i].groups[j].feature_name) >= 0 && j < curGroupLength - 1) {
        filterFeature = getGroups[i].groups[j];
      }
    }
    filterFeature && filterResult.push(filterFeature);
  }
  let result = [];
  if (type === 'column') {
    result = filterResult.filter(item => x.indexOf(item.feature_name) >= 0);
  } else {
    result = filterResult.filter(item => y.indexOf(item.feature_name) >= 0);
  }
  return result.map((item) => item?.feature_name);
};

let getGroup = (catList) => {
  let groupList = catList.filter((item) => {
    return item?.groups;
  });
  return groupList;
};