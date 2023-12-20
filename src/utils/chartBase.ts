import * as zrender from 'zrender';
export default class base {
  canvasCss = { // 画布样式
    padding: 10
  };
  legendCss = { // 图例样式
    padding: 10,
    itemGap: 10, // 图例(icon + text)之间的间距
    titlePadding: 10, // 类目与图例之间的间距
    itemWidth: 20, // 类目图例icon宽度
    itemHeight: 20, // 类目图例icon高度
    radius: 2, // 类目图例icon radius
    barWidth: 80, // 
    barHeight: 8,
    barRadius: 5,
    innerGap: 5, // icon和文本之间的间距
    titleStyle: {
      fontSize: '14px',
      color: '#cccccc'
    },
    fontSize: '14px',
    lineHeight: 14,
    verticalGap: 5
  };

  // 画布的绘制范围
  x0: number;
  x1: number;
  y0: number;
  y1: number;

  // 图表的绘制范围
  chartX0: number = 0;
  chartX1: number = 0;
  chartY0: number = 0;
  chartY1: number = 0;

  // 画布实例
  zrInstance: zrender.ZRenderType;

  commonCtx = document.createElement('canvas').getContext('2d');

  constructor(config) {
    this.commonCtx && (this.commonCtx.font = `${this.legendCss.fontSize} system-ui`);
    this.canvasCss = Object.assign(this.canvasCss, config.canvasCss || {});
    this.legendCss = Object.assign(this.legendCss, config.legendCss || {});
    this.zrInstance = zrender.init(document.getElementById(config.id));

    // 初始化画布的起始位置和结束位置
    let legendPaddingX0 = 0;
    let legendPaddingY0 = 0;
    let legendPaddingX1 = 0;
    let legendPaddingY1 = 0;
    if (this.legendCss.padding) {
      if (Array.isArray(this.legendCss.padding)) {
        legendPaddingX0 = this.legendCss.padding[3] || this.legendCss.padding[1];
        legendPaddingY0 = this.legendCss.padding[0];
        legendPaddingX1 = this.legendCss.padding[1];
        legendPaddingY1 = this.legendCss.padding[2] || this.legendCss.padding[0];
      } else {
        legendPaddingX0 = this.legendCss.padding;
        legendPaddingY0 = this.legendCss.padding;
        legendPaddingX1 = this.legendCss.padding;
        legendPaddingY1 = this.legendCss.padding;
      }
    }
    let canvasPaddingX0 = 0;
    let canvasPaddingY0 = 0;
    let canvasPaddingX1 = 0;
    let canvasPaddingY1 = 0;
    if (this.canvasCss.padding) {
      if (Array.isArray(this.canvasCss.padding)) {
        canvasPaddingX0 = this.canvasCss.padding[3] || this.canvasCss.padding[1];
        canvasPaddingY0 = this.canvasCss.padding[0];
        canvasPaddingX1 = this.canvasCss.padding[1];
        legendPaddingY1 = this.canvasCss.padding[2] || this.canvasCss.padding[0];
      } else {
        canvasPaddingX0 = this.canvasCss.padding;
        canvasPaddingY0 = this.canvasCss.padding;
        canvasPaddingX1 = this.canvasCss.padding;
        canvasPaddingY1 = this.canvasCss.padding;
      }
    }

    let width = this.zrInstance.getWidth();
    let height = this.zrInstance.getHeight();
    this.x0 = legendPaddingX0 + canvasPaddingX0;
    this.y0 = legendPaddingY0 + canvasPaddingY0;
    this.x1 = width - legendPaddingX1 - canvasPaddingX1;
    this.y1 = height - legendPaddingY1 - canvasPaddingY1;

    this.chartX0 = this.x0;
    this.chartX1 = this.x1;
    this.chartY0 = this.y0;
    this.chartY1 = this.y1;

    this.zrInstance.on('click', (event) => {
      if (!event.target) { // 点击空白处
        this.cancelHighlight();
      }
    });
  }
  cancelHighlight() {
    console.log('base-$$$$$$$');
  }
}