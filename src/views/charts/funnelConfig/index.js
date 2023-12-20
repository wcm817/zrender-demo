
import getTooltipList from '../config/index2/getTooltipList';
import getLabels from '../config/index2/getLabels';
import getColorList from './getColorList';

export default (config, chartData) => {
  const { features, css, metadata } = JSON.parse(JSON.stringify({ ...config, ...chartData }));
  let customFeatures = JSON.parse(JSON.stringify(features));
  let customCss = JSON.parse(JSON.stringify(css));
  const colorName = features.color?.name;
  const sizeName = (() => {
    let size = features.size;
    if (size.legend && !size.formula_type) {
      return size.legend.toLowerCase() + '(' + size.name + ')';
    }
    return size.name;
  })();

  const tooltipList = getTooltipList(features, css, metadata);
  const colorList = getColorList({
    colorName,
    sizeName,
    oldColorList: css.colorList || [],
    chartData,
    tooltipList
  });

  const { oldLabel } = getLabels(customFeatures.labels, customCss);

  return {
    hasLegend: css?.legendCss?.isShow || true,
    legendOption: {
      position: css?.legendCss?.position.toLocaleUpperCase() || 'UP',
      data: colorList
    },
    size: css.size || 50,
    features: {
      colorName,
      sizeName,
      label: features.labels
    },
    labelsList: oldLabel,
    tooltipList,
    colorList
  };
};
