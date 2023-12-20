
import * as zrender from 'zrender';
import * as d3 from 'd3';
import ResizeGroup from '../../utils/resizeGroupWithDirection';
import { setXAxisList, setYAxisList, getXAxisData } from './radar/radarConfigUtils';
import { getPolygonPoints, getOuterTextAlign, getMaxValue, getMinValue } from './radar/radarMapUtils';
import { getTxtWidth } from '../../utils/utils';


export interface Options {
  config: Record<string, any>// 饼图样式配置信息
  data: Record<string, any> // 饼图数据
}

export default class Radar {
  data: Array<Record<string, any>>; // 画布数据
  config: Record<string, any>; // 画布配置信息
  width: number; // 画布宽
  height: number; // 画布高
  zr: zrender.ZRenderType;
  group: ResizeGroup;
  radius: number; // 半径
  rx: number; // 圆心x 
  ry: number; // 圆心y
  coordinateAxis: Record<string, any>; // 坐标轴配置
  xAxis: Array<Record<string, any>>; // 分类CAT
  yAxis: Array<Record<string, any>>; // 数据AGGR
  xAxisData: Array<string>;
  textColor: string; // 背景版对应的文字颜色
  tickNum: number; // 分隔数


  constructor(opts: Options) {
    const { data, config } = opts;
    this.data = data.features_data;
    this.config = config;
    const dom: HTMLElement | null = document.getElementById(config.id);
    this.width = dom?.offsetWidth || 680;
    this.height = dom?.offsetHeight || 600;
    this.radius = Math.floor(Math.min(this.width, this.height) / 2.8);
    this.rx = this.width / 2;
    this.ry = this.height / 2;
    this.coordinateAxis = {
      show: config.css.hasScale,
      axisColor: config.css.axisColor,
      axisDash: config.css.axisDash,
      axisWidth: config.css.axisWidth
    }
    this.xAxis = setXAxisList(config.features, data.metadata);
    this.yAxis = setYAxisList(config.features, data.features_data);
    this.xAxisData = getXAxisData(this.yAxis, this.xAxis);
    this.textColor = config.css.bgCss.color || '#6b6b6b';
    this.tickNum = config.css.tickNum;

    console.log('xAxis:::', this.xAxis);
    console.log('yAxis:::', this.yAxis);
    console.log("this.xAxisData:::", this.xAxisData);

    this.zr = zrender.init(dom, {
      renderer: 'svg',
      width: this.width,
      height: this.height
    });
    this.group = new ResizeGroup({
      zr: this.zr,
      x: 0,
      y: 0,
      width: this.width,
      height: this.height
    });
    this.zr.add(this.group);
  }

  render() {
    // 雷达地图
    this.drawRadarMap();
  }

  // 画雷达背景地图
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
        outerRadius: this.radius,
        tickNum: this.tickNum,
        rx: this.rx,
        ry: this.ry
      });
      // 雷达地图
      radarAllPoints.forEach((item: any) => {
        let polygon = new zrender.Polygon({
          shape: {
            points: item
          },
          style: {
            stroke: '#ccc',
            fill: 'transparent'
          }
        });
        this.group.add(polygon);
      });
      outerPolygonPoints = radarAllPoints[0];
    }
    // 坐标体系(对角线)
    this.drawCoordinateAxis(outerPolygonPoints);
    // 顶点标签
    this.drawMapOuterLabel(outerPolygonPoints);
  }

  // 画坐标体系 (对角线)
  drawCoordinateAxis(outerPolygonPoints: Array<Array<number>>) {
    // 坐标轴
    if (this.coordinateAxis.show) {
      const { axisColor, axisWidth, axisDash } = this.coordinateAxis;
      outerPolygonPoints.forEach((item: any,) => {
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
            lineDash: axisDash,
          }
        });
        this.group.add(line);

      });
      this.drawMapInnerLabel()
    }
  }

  // 顶点标签
  drawMapOuterLabel(outerPolygonPoints: Array<Array<number>>) {
    let preLabel: any;
    for (let pointIndex = 0; pointIndex < outerPolygonPoints.length; pointIndex++) {
      const point = outerPolygonPoints[pointIndex];
      let align = getOuterTextAlign(point[0], this.rx);
      const dist = 5;
      const fontSize = 12;
      const xMap: any = {
        center: point[0],
        left: point[0] + dist,
        right: point[0] - dist
      };

      const yMap: any = {
        center: point[1] < this.ry ? point[1] - fontSize - dist : point[1] + dist,
        left: point[1] - (fontSize / 2),
        right: point[1] - (fontSize / 2)
      }
      // 图表中可以写入label的最大宽度
      const maxWidth = point[0] > this.rx ? this.width - point[0] : point[0];
      const textWidth = getTxtWidth(this.xAxisData[pointIndex], 12)
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

      if (!preLabel || (align === 'center')) {
        this.group.add(text);
        preLabel = text;
        continue;
      }

      const { y: preY, height: preHeight } = preLabel.getBoundingRect();
      const { y, height } = text.getBoundingRect();
      // 显示标签的判断
      const isRight = point[0] > this.rx;
      const flag1 = isRight && ((preY + preHeight) < y); // 右侧： 前一项的下y坐标小于 当前项的上y坐标
      const flag2 = !isRight && (preY > (y + height)); // 左侧: 前一项的上y坐标大于 当前项的下y标签
      if (flag1 || flag2) {
        this.group.add(text);
        preLabel = text;
      } else {
        text = preLabel;
      }
    }
  }
  // 间距标签
  drawMapInnerLabel() {
    const maxValue = getMaxValue(this.yAxis);
    const minValue = getMinValue(this.yAxis);

    const scaleRadius = d3.scaleLinear()
      .domain([minValue, maxValue])
      .range([0, this.radius]);

    const yAxis = scaleRadius.ticks(5);
    const lastNum = yAxis[yAxis.length - 1];
    const step = lastNum / (this.tickNum - 1);

    for (let i = 0; i < this.tickNum; i++) {
      let text = new zrender.Text({
        style: {
          x: this.rx,
          y: this.ry - this.radius / this.tickNum * i,
          text: i * step + ''
        }
      });
      this.group.add(text);
    }
  }

  showOuterLabel() {

  }
}