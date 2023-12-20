import getTooltipList from '../config/index2/getTooltipList';
import getLabels from '../config/index2/getLabels';
import getColorList from './getColorList';
import getTableTitleData from './getTableTitleData';
import getXYFeature from './getXYFeature';

const getTableLabels = (features) => {
  let curList = JSON.parse(JSON.stringify(features));
  let curLabel = curList.labels || curList.text || [];
  let x = curList.row || [];
  let y = curList.col || [];
  x.forEach(item => {
    if (item.dtype === 'AGGR') {
      curLabel.push(item);
    }
  });
  y.forEach(item => {
    if (item.dtype === 'AGGR') {
      curLabel.push(item);
    }
  });
  return curLabel;
};

export default (config, chartData, catList) => {
  const { features, css, metadata, features_data: featureData } = JSON.parse(JSON.stringify({ ...config, ...chartData }));
  const tableLabels = getTableLabels(features);
  const { oldLabel } = getLabels(tableLabels, css);
  const tooltipList = getTooltipList(features, css, metadata);
  const colorList = getColorList({
    features,
    oldColorList: css.colorList,
    featureData,
    tooltipList
  });
  const tableTitleData = getTableTitleData(features, css);
  const columnDrillFeature = getXYFeature('column', metadata, catList);
  const rowDrillFeature = getXYFeature('row', metadata, catList);

  return {
    hasLegend: colorList.length && (css?.legendCss?.isShow || true),
    legendOption: {
      position: css?.legendCss?.position.toLocaleUpperCase() || 'UP',
      data: colorList
    },
    fitModel: css.fitModel || 'standard',
    tableSetting: {
      // 表格外边框
      outter: css.tableSetting?.outter || { color: '#C2C9D1', width: 1 },
      // 表格内边框
      inner: css.tableSetting?.inner || { color: '#C2C9D1', width: 1 },
      // 单元格
      cell: css.tableSetting?.cell || { width: 100 },
      // 内边距
      padding: css.tableSetting?.padding || {
        top: 0,
        left: 3,
        bottom: 0,
        right: 3
      }
    },
    // 表头数据 和 样式集合
    tableTitleData,
    features,
    labelsList: oldLabel,
    tooltipList,
    colorList,
    columnDrillFeature,
    rowDrillFeature
  };
};
