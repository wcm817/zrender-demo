
import * as zrender from 'zrender';
import * as d3 from 'd3';
const { format } = d3;
import Base from '../../utils/chartBase';
import Legend from '../../utils/legend/legend';
import { setXAxisList, setYAxisList, getXAxisData, getScaleRadiusInfo } from './radar/radarConfigUtils';
import { getPolygonPoints, getOuterTextAlign } from './radar/radarMapUtils';
import { getTxtWidth } from '../../utils/utils';

export default class RadarMap extends Base {
  data: Array<Record<string, any>>; // 画布数据
  hasLegend: Boolean; // 是否显示图例
  legendOption: Record<string, any>; // 图例配置信息&颜色信息
  legendIns!: Legend; // 图例实例
  width: number; // 画布宽
  height: number; // 画布高
  group: zrender.Group;
  coordinateConfig: Record<string, any>; // 坐标轴配置
  gapConfig: Record<string, any>; // 隔线设置
  xAxis: Array<Record<string, any>>; // CAT分类
  yAxis: Array<Record<string, any>>; // AGGR数据
  xAxisData: Array<string>;
  rx: number; // 圆心x 
  ry: number; // 圆心y
  radius: number; // 半径
  scaleRadius: any; // 半径比例尺
  maxScaleRadiusNum: number; // 半径比例尺最大的映射值
  textColor: string; // 背景版对应的文字颜色
  tickNum: number; // 刻度分隔数
  format: any; // 刻度值格式化方式
  allInnerLabelGroup: zrender.Group; // 雷达图所有标签组

  constructor(config: any) {
    super(config);
    this.data = JSON.parse(JSON.stringify(config.chartData.features_data));
    // 有图例先画图例
    this.hasLegend = config.hasLegend;
    this.legendOption = config.legendOption;
    if (this.hasLegend) {
      let legendOpt: any = Object.assign({
        x0: this.x0, // 来自chartBase的x0
        y0: this.y0,
        x1: this.x1,
        y1: this.y1,
        zrInstance: this.zrInstance, // 来自chartBase的zrInstance
        id: config.id, // 用于定义对应的事件
        legendCss: this.legendCss // 来自chartBase的this.legendCss
      }, this.legendOption);
      this.legendIns = new Legend(legendOpt);
    }

    // 图表 的宽 高 圆点x 圆点y
    this.width = this.hasLegend ? this.legendIns.chartX1 - this.legendIns.chartX0 : this.zrInstance.getWidth();
    this.height = this.hasLegend ? this.legendIns.chartY1 - this.legendIns.chartY0 : this.zrInstance.getHeight();
    this.rx = this.hasLegend ? this.width / 2 + this.legendIns.chartX0 : this.width / 2;
    this.ry = this.hasLegend ? this.height / 2 + this.legendIns.chartY0 : this.height / 2;

    this.coordinateConfig = config.coordinateConfig; // 坐标轴配置
    this.gapConfig = config.gapConfig;  // 隔线设置

    this.xAxis = setXAxisList(config.features, config.chartData.metadata);
    this.yAxis = setYAxisList(config.features, config.chartData.features_data);
    this.xAxisData = getXAxisData(this.yAxis, this.xAxis);
    this.radius = Math.floor(Math.min(this.width, this.height) / 2.8);
    this.textColor = config.textColor;
    this.tickNum = config.tickNum;
    this.format = config.hasUnit === 'auto' ? format('.3s') : format('.3r');

    const { maxScaleRadiusNum, scaleRadius } = getScaleRadiusInfo(this.yAxis, this.tickNum, this.radius);
    this.scaleRadius = scaleRadius;
    this.maxScaleRadiusNum = maxScaleRadiusNum;

    this.group = new zrender.Group();
    this.allInnerLabelGroup = new zrender.Group();
    this.group.add(this.allInnerLabelGroup);
    // 雷达背景地图
    this.drawRadarMap();
  }

  /* 画雷达背景地图 */
  drawRadarMap() {
    if (!this.xAxisData.length) return;
    let outerPolygonPoints: Array<Array<number>> = [];
    if (this.xAxisData.length === 1) {
      outerPolygonPoints = [[this.rx, this.ry - this.radius]];
    } else if (this.xAxisData.length === 2) {
      outerPolygonPoints = [[this.rx, this.ry - this.radius], [this.rx, this.ry + this.radius]];
    } else {
      const radarAllPoints = getPolygonPoints({
        vertexNum: this.xAxisData.length,
        radius: this.radius,
        tickNum: this.tickNum,
        rx: this.rx,
        ry: this.ry
      });
      // 顶层坐标组
      outerPolygonPoints = radarAllPoints[0];
      // 每层分隔线
      if (!this.gapConfig.show) return;
      const { gapColor, gapWidth, gapDash } = this.gapConfig;
      radarAllPoints.forEach((item: any) => {
        let polyline = new zrender.Polyline({
          shape: {
            points: [...item, [item[0][0], item[0][1]]]
          },
          style: {
            stroke: gapColor,
            lineWidth: gapWidth,
            lineDash: gapDash === 'line' ? [0, 0] : [3, 3]
          }
        });
        this.group.add(polyline);
      });
    }
    // 坐标体系(对角线)
    this.drawcoordinateConfig(outerPolygonPoints);
    // 顶点标签
    this.drawMapOuterLabel(outerPolygonPoints);
    this.zrInstance.add(this.group);
  }

  /**
   * 画坐标体系 (对角线)
   * @param outerPolygonPoints 雷达地图最外层的顶点坐标数组
   */
  drawcoordinateConfig(outerPolygonPoints: Array<Array<number>>) {
    if (!this.coordinateConfig.show) return;
    const { axisColor, axisWidth, axisDash } = this.coordinateConfig;
    outerPolygonPoints.forEach((item: any,) => {
      // 坐标轴对角线
      let line = new zrender.Line({
        shape: {
          x1: this.rx,
          y1: this.ry,
          x2: item[0],
          y2: item[1]
        },
        style: {
          stroke: axisColor,
          lineWidth: axisWidth,
          lineDash: axisDash === 'line' ? [0, 0] : [3, 3]
        }
      });
      this.group.add(line);

    });
    // 刻度标签
    this.drawMapInnerLabel();
  }

  /**
   * 画顶点标签
   * @param outerPolygonPoints 雷达地图最外层的顶点坐标数组
   */
  drawMapOuterLabel(outerPolygonPoints: Array<Array<number>>) {
    for (let pointIndex = 0; pointIndex < outerPolygonPoints.length; pointIndex++) {
      const point = outerPolygonPoints[pointIndex];
      let align = getOuterTextAlign(point[0], this.rx);

      const dist = 5;
      const fontSize = 12;

      const xMap: any = {
        center: point[0],
        left: point[1] < this.ry ? point[0] + dist : point[0],
        right: point[1] < this.ry ? point[0] - dist : point[0]
      };

      const yMap: any = {
        center: point[1] < this.ry ? point[1] - fontSize - dist : point[1] + dist,
        left: point[1] < this.ry ? point[1] - fontSize / 2 : point[1],
        right: point[1] < this.ry ? point[1] - fontSize / 2 : point[1]
      };

      // 图表中可以写入label的最大宽度
      const maxWidth = point[0] > this.rx ? this.width - point[0] : point[0];
      // label宽度
      const textWidth = getTxtWidth(this.xAxisData[pointIndex], fontSize) + dist;

      let text = new zrender.Text({
        style: {
          x: xMap[align],
          y: yMap[align],
          text: this.xAxisData[pointIndex],
          fontSize: fontSize,
          fill: this.textColor,
          align,
          width: maxWidth > textWidth ? textWidth : maxWidth,
          overflow: 'truncate',
          lineOverflow: 'truncate',
          ellipsis: maxWidth > textWidth ? '' : '...'
        }
      });
      this.allInnerLabelGroup.add(text);
    }
  }

  /* 画刻度标签 */
  drawMapInnerLabel() {
    const step = this.maxScaleRadiusNum / this.tickNum;
    for (let i = 0; i < this.tickNum + 1; i++) {
      let text = new zrender.Text({
        style: {
          x: this.rx + 6,
          y: this.ry - this.radius / this.tickNum * i - 6,
          text: this.format((i - 1) * step),
          fill: this.textColor
        }
      });
      this.allInnerLabelGroup.add(text);
    }
  }
}