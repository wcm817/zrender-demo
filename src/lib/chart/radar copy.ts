
import * as zrender from 'zrender';
import * as d3 from 'd3';
import ResizeGroup from '../../utils/resizeGroupWithDirection';
import { setXAxisList, setYAxisList, getXAxisData, getScaleRadiusInfo } from './radar/radarConfigUtils';
import { getPolygonPoints, getOuterTextAlign, handleYAxisData, getSymbolSvgPath, collision } from './radar/radarMapUtils';
import { getTxtWidth, dataProcess } from '../../utils/utils';
const { format } = d3;

export interface Options {
  config: Record<string, any>// 样式配置信息
  data: Record<string, any> // 数据
}

export interface Animation {
  show: boolean // 是否有动画
  duration: number// 动画时长
  easing: any // 动画曲线
}

export default class Radar {
  data: Array<Record<string, any>>; // 画布数据
  config: Record<string, any>; // 画布配置信息
  width: number; // 画布宽
  height: number; // 画布高
  zr: zrender.ZRenderType;
  group: ResizeGroup;
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
  colorList: Array<Record<string, any>>; // 图例 颜色列表
  labelsList: Array<Record<string, any>>; // 标签列表
  lineSize: number; // 多边形线宽
  lineStyle: string; // 多边形拐点样式
  isArea: boolean; // 显示模式(线图|面积图)
  allInnerLabelGroup: zrender.Group; // 雷达图内部所有标签组
  animation: Animation; // 动画配置
  originOpacity!: number; // 数据初始颜色的透明度
  allDataSvgs: Array<any>;

  constructor(opts: Options) {
    const { data, config } = opts;
    this.data = data.features_data;
    this.config = config;
    const dom: HTMLElement | null = document.getElementById(config.id);
    this.width = dom?.offsetWidth || 800;
    this.height = dom?.offsetHeight || 600;
    this.coordinateConfig = {
      show: config.css.hasScale,
      axisColor: config.css.axisColor || '#eaeced',
      axisDash: config.css.axisDash || 'line',
      axisWidth: config.css.axisWidth || 1
    };
    this.gapConfig = {
      show: config.css.hasGap,
      gapColor: config.css.gapColor || "#eaeced",
      gapDash: config.css.gapDash || 'line',
      gapWidth: config.css.gapWidth || 1
    };
    this.xAxis = setXAxisList(config.features, data.metadata);
    this.yAxis = setYAxisList(config.features, data.features_data);
    this.xAxisData = getXAxisData(this.yAxis, this.xAxis);
    this.radius = Math.floor(Math.min(this.width, this.height) / 2.8);
    this.rx = this.width / 2;
    this.ry = this.height / 2;
    this.textColor = config.css.bgCss.color || '#6b6b6b';
    this.tickNum = config.css.tickNum || 5;
    this.format = config.css.hasUnit === 'auto' ? format('.3s') : format('.3r');
    this.colorList = config.css.colorList;
    this.labelsList = config.css.labelsList;
    this.lineSize = config.css.lineSize || 50;
    this.lineStyle = config.css.lineStyle || 'circle';
    this.isArea = config.css.isArea;
    const { maxScaleRadiusNum, scaleRadius } = getScaleRadiusInfo(this.yAxis, this.tickNum, this.radius);
    this.scaleRadius = scaleRadius;
    this.maxScaleRadiusNum = maxScaleRadiusNum;

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
    this.allInnerLabelGroup = new zrender.Group();
    this.group.add(this.allInnerLabelGroup);
    this.zr.add(this.group);

    this.animation = config.animation || { show: true, duration: 300, easing: 'linear' };
    this.allDataSvgs = [];
  }

  render() {
    // 雷达地图
    this.drawRadarMap();
    // 数据雷达
    this.drawRadar();
    this.zr.on('click', this.handleZrClick.bind(this));
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
      // 坐标体系(对角线)
      this.drawcoordinateConfig(outerPolygonPoints);
      // 顶点标签
      this.drawMapOuterLabel(outerPolygonPoints);
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
        left: point[0] + dist,
        right: point[0] - dist
      };

      const yMap: any = {
        center: point[1] < this.ry ? point[1] - fontSize - dist : point[1] + dist,
        left: point[1] - (fontSize / 2),
        right: point[1] - (fontSize / 2)
      };
      // 图表中可以写入label的最大宽度
      const maxWidth = point[0] > this.rx ? this.width - point[0] : point[0];
      const textWidth = getTxtWidth(this.xAxisData[pointIndex], 12) + 6;
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
    for (let i = 0; i < this.tickNum; i++) {
      let text = new zrender.Text({
        style: {
          x: this.rx + 6,
          y: this.ry - this.radius / this.tickNum * i - 6,
          text: this.format(i * step),
          fill: this.textColor
        }
      });
      this.allInnerLabelGroup.add(text);
    }
  }

  /* 画雷达图 */
  drawRadar() {
    const yAxisData = handleYAxisData({
      xAxis: this.xAxis,
      xAxisData: this.xAxisData,
      yAxis: this.yAxis,
      colorList: this.colorList,
      rx: this.rx,
      ry: this.ry,
      scaleRadius: this.scaleRadius
    });
    this.originOpacity = yAxisData[0].opacity;
    yAxisData.forEach((item: any) => {
      // 多边形
      this.drawDataPolygon(item);
      // label标签
      this.drawDataLabel(item);
    });

    // 移除重叠标签
    this.filterLabel();
  }

  /**
   * 画数据多边形
   * @param itemData yAxisData的一项数据
   */
  drawDataPolygon(itemData: any) {
    let originPoints = itemData.data.map(() => [this.rx, this.ry]);
    let targetPoints = itemData.data.map((m: any) => m.point);
    let polygon;
    if (this.isArea) {
      polygon = new zrender.Polygon({
        shape: { points: this.animation.show ? originPoints : targetPoints },
        style: {
          lineWidth: this.lineSize / 20,
          fill: itemData.color,
          opacity: itemData.opacity * 0.3
        }
      });
      this.group.add(polygon);
      this.allDataSvgs.push(polygon);
    }
    const polyline = new zrender.Polyline({
      shape: { points: this.animation.show ? originPoints : targetPoints },
      style: {
        stroke: itemData.color,
        lineWidth: this.lineSize / 20,
        opacity: itemData.opacity
      }
    });

    this.group.add(polyline);
    this.allDataSvgs.push(polyline);

    // 增加动画
    if (this.animation.show) {
      const animateParam1 = { shape: { points: targetPoints } };
      const animateParam2 = {
        duration: this.animation.duration,
        easing: this.animation.easing
      };
      polygon?.animateTo(animateParam1, animateParam2);
      polyline.animateTo(animateParam1, animateParam2);
    }
  }

  /**
   * 画数据标签
   * @param itemData yAxisData的一项数据
   */
  drawDataLabel(itemData: any) {
    const arr = itemData.data;
    arr.forEach((subItem: any) => {
      // 标签
      let tg = new zrender.Group();
      for (let k = 0; k < this.labelsList.length; k++) {
        const { key, text: textStyle, format: textFormat } = this.labelsList[k];
        const label = dataProcess(subItem.data[key], textFormat);
        const text = new zrender.Text({
          zlevel: 2,
          style: {
            x: subItem.point[0],
            y: subItem.point[1] + k * textStyle.lineHeight,
            text: label,
            align: 'center',
            fontSize: textStyle.fontSize,
            fill: textStyle.fontColor
          }
        });
        this.allDataSvgs.push(text);
        tg.add(text);
      }
      this.allInnerLabelGroup.add(tg);

      // 顶点符号
      const path = getSymbolSvgPath(this.lineStyle, this.lineSize);
      const rotateMap: any = {
        cross45: { rotation: 45 * Math.PI / 180 },
        triangle180: { rotation: 180 * Math.PI / 180 }
      };
      const zSymbol = new (zrender.path.createFromString as any)(path, {
        ...(rotateMap[this.lineStyle] ? rotateMap[this.lineStyle] : {}),
        x: this.animation.show ? this.rx : subItem.point[0],
        y: this.animation.show ? this.ry : subItem.point[1],
        zlevel: 3,
        style: {
          fill: itemData.color,
          opacity: itemData.opacity
        }
      });
      this.allDataSvgs.push(zSymbol);
      this.group.add(zSymbol);

      // 增加动画
      if (this.animation.show) {
        zSymbol.animateTo(
          { x: subItem.point[0], y: subItem.point[1] },
          {
            duration: this.animation.duration,
            easing: this.animation.easing
          }
        );
      }

      // 点击事件
      zSymbol.on('click', this.handleSymbolClick.bind(this));
    });
  }

  /* 移除重叠的数据标签 */
  filterLabel() {
    let zTextList = this.allInnerLabelGroup.children();
    let length = zTextList.length;
    for (let i = 0; i < zTextList.length; i++) {
      const currentRect = zTextList[i].getBoundingRect();
      const list = zTextList.slice(0, i);
      for (let k = 0; k < list.length; k++) {
        if (collision(currentRect, list[k].getBoundingRect())) {
          this.allInnerLabelGroup.remove(zTextList[i]);
          zTextList = this.allInnerLabelGroup.children();
          break;
        }
      }
      if (length > zTextList.length) {
        i--;
        length = zTextList.length;
      }
    }
  }

  /**
   * 符号点点击事件处理函数
   * @param event 事件对象
   */
  handleSymbolClick(event: any) {
    this.allDataSvgs.forEach((item: any) => {
      item.attr({
        style: {
          opacity: 0.1
        }
      })
    });
    event.target.attr({
      style: {
        opacity: this.originOpacity
      }
    })
  }

  /**
   * 画布点击事件处理函数
   * @param event 事件对象
   */
  handleZrClick(event: any) {
    const flag = this.allDataSvgs.some((item: any) => item.id === event.target.id);
    if (!flag) {
      this.allDataSvgs.forEach((item: any) => {
        const opacity = item.shape?.constructor.name.includes('Polygon') ? this.originOpacity * 0.3 : this.originOpacity;
        item.attr({
          style: { opacity }
        })
      })
    }
  }
}