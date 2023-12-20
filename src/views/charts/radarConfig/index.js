import getLabelsList from '../config/index1/getLabelsList';
import getTooltipList from '../config/index1/getTooltipList';
import getColorList from './getColorList';

export default (config, chartData) => {
  const { css, metadata, features, features_data: featuresData } = JSON.parse(JSON.stringify({ ...config, ...chartData }));
  const tooltipList = getTooltipList(metadata, features, css);
  const labelsList = getLabelsList(features, css);
  let colorList = getColorList({
    features,
    oldColorList: css.colorList,
    tooltipList,
    featuresData
  });

  return {
    hasLegend: css?.legendCss?.isShow || true,
    legendOption: {
      position: css?.legendCss?.position.toLocaleUpperCase() || 'UP',
      data: JSON.parse(JSON.stringify(colorList))
    },
    size: css.size || 50, // 大小
    textColor: css.bgCss?.color || '#6b6b6b',  // 背景版对应的文字颜色
    tickNum: css.tickNum || 5,  // 刻度分隔数
    hasUnit: css.hasUnit || 'auto',  // 刻度值格式化方式
    lineSize: css.lineSize || 50, // 多边形线宽
    lineStyle: css.lineStyle || 'circle', // 多边形拐点样式
    isArea: css.isArea,  // 显示模式(线图|面积图)
    // 坐标轴配置
    coordinateConfig: {
      show: css.hasScale,
      axisColor: css.axisColor || '#eaeced',
      axisDash: css.axisDash || 'line',
      axisWidth: css.axisWidth || 1
    },
    // 隔线配置
    gapConfig: {
      show: css.hasGap,
      gapColor: css.gapColor || "#eaeced",
      gapDash: css.gapDash || 'line',
      gapWidth: css.gapWidth || 1
    },

    features,
    tooltipList: tooltipList,
    labelsList: JSON.parse(JSON.stringify(labelsList)),
    colorList: JSON.parse(JSON.stringify(colorList)),
    animation: css.animation || { show: true, duration: 300, easing: 'linear' },
  };
};
