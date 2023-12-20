
import * as zrender from 'zrender';
import Tooltip from '../../utils/tooltip';
import RadarMap from './radarMap';
import { handleYAxisData, getSymbolSvgPath, collision } from './radar/radarMapUtils';
import { dataProcess } from '../../utils/utils';

export interface Animation {
  show: boolean // 是否有动画
  duration: number// 动画时长
  easing: any // 动画曲线
}

export default class Radar extends RadarMap {
  id: string; // 图表id
  labelsList: Array<Record<string, any>>; // 标签列表
  lineSize: number; // 多边形线宽
  lineStyle: string; // 多边形拐点样式
  isArea: boolean; // 显示模式(线图|面积图)
  animation: Animation; // 动画配置
  originOpacity!: number; // 数据初始颜色的透明度
  groupStore: { [propName: string]: Array<any> } = {}; // 每一组数据图形集合
  cancelHightlightTile!: string; // 取消高亮的图例标题
  tooltip: Tooltip; // 提示组件
  tooltipList: Array<Record<string, any>>; // tooltip信息列

  constructor(config: any) {
    super(config);
    this.id = config.id;
    this.labelsList = config.labelsList;
    this.lineSize = config.lineSize;
    this.lineStyle = config.lineStyle;
    this.isArea = config.isArea;
    this.animation = config.animation;
    this.tooltipList = config.tooltipList
      .filter((item: any) => item.display !== 'none');
    this.tooltip = new Tooltip();
  }

  render() {
    // 数据雷达
    this.drawRadar();
    if (this.hasLegend) {
      // 监听图例点击事件
      document.addEventListener('legendSelect_' + this.id, (e: any) => {
        let { key, title } = e.detail;
        this.showHighlight({ colorLabel: key });
        this.cancelHightlightTile = title;
      });
    }
  }
  /* 画雷达图 */
  drawRadar() {
    const yAxisData = handleYAxisData({
      xAxis: this.xAxis,
      xAxisData: this.xAxisData,
      yAxis: this.yAxis,
      colorList: this.legendOption.data,
      rx: this.rx,
      ry: this.ry,
      scaleRadius: this.scaleRadius
    });
    this.originOpacity = yAxisData[0].opacity;
    yAxisData.forEach((item: any,) => {
      const g = new zrender.Group();
      this.groupStore[`${g.id}_${item.colorLabel}`] = [];
      // 多边形
      this.drawDataPolygon(item, g);
      // label标签
      this.drawDataLabel(item, g);
      this.group.add(g);

    });

    // 移除重叠标签
    this.filterLabel();
  }

  /**
   * 画数据多边形
   * @param itemData yAxisData的一项数据
   * @param sGroup 数据图形集合
   */
  drawDataPolygon(itemData: any, sGroup: zrender.Group) {
    const dataArr = itemData.data.filter((f: any) => f.point);   // 过滤掉point数值为null 的数据
    let originPoints = dataArr.map(() => [this.rx, this.ry]);
    let targetPoints = dataArr.map((m: any) => m.point);
    let lineTargetPoints = [...targetPoints, ...[targetPoints.length && [targetPoints[0][0], targetPoints[0][1]]]];
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
      sGroup.add(polygon);
    }
    const polyline = new zrender.Polyline({
      shape: { points: this.animation.show ? originPoints : lineTargetPoints },
      style: {
        stroke: itemData.color,
        lineWidth: this.lineSize / 20,
        opacity: itemData.opacity
      }
    });
    sGroup.add(polyline);
    this.groupStore[`${sGroup.id}_${itemData.colorLabel}`].push(polyline);

    // 增加动画
    if (this.animation.show) {
      const animateParam1 = { shape: { points: targetPoints } };
      const animateParam2 = {
        duration: this.animation.duration,
        easing: this.animation.easing
      };
      polygon?.animateTo(animateParam1, animateParam2);
      polyline.animateTo({ shape: { points: lineTargetPoints } }, animateParam2);
    }
  }

  /**
   * 画数据标签
   * @param itemData yAxisData的一项数据
   * @param sGroup 数据图形集合
   */
  drawDataLabel(itemData: any, sGroup: zrender.Group) {
    // 过滤掉point数值为null 的数据
    const arr = itemData.data.filter((f: any) => f.point);
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
            // @ts-ignore
            text: label,
            align: 'center',
            fontSize: textStyle.fontSize,
            fill: textStyle.fontColor
          }
        });
        tg.add(text);
        this.groupStore[`${sGroup.id}_${itemData.colorLabel}`].push(text);
      }
      this.allInnerLabelGroup.add(tg);
      // 画顶点符号
      const symbolData = {
        ...subItem,
        color: itemData.color,
        opacity: itemData.opacity,
        colorLabel: itemData.colorLabel,
        colorTitle: itemData.colorTitle
      };
      this.drawSymbol(symbolData, sGroup, [...tg.children().map((c: any) => c.id)]);

    });
  }
  /**
   * 画顶点符号
   * @param symbolItem 每一项顶点数据
   * @param sGroup 数据图形集合
   * @param textIds 文本id集合
   */
  drawSymbol(symbolItem: any, sGroup: zrender.Group, textIds: Array<number>) {
    const path = getSymbolSvgPath(this.lineStyle, this.lineSize);
    const rotateMap: any = {
      cross45: { rotation: 45 * Math.PI / 180 },
      triangle180: { rotation: 180 * Math.PI / 180 }
    };
    const zSymbol = new (zrender.path.createFromString as any)(path, {
      ...(rotateMap[this.lineStyle] ? rotateMap[this.lineStyle] : {}),
      x: this.animation.show ? this.rx : symbolItem.point[0],
      y: this.animation.show ? this.ry : symbolItem.point[1],
      zlevel: 3,
      style: {
        fill: symbolItem.color,
        opacity: symbolItem.opacity
      }
    });
    this.groupStore[`${sGroup.id}_${symbolItem.colorLabel}`].push(zSymbol);
    sGroup.add(zSymbol);

    // 增加动画
    if (this.animation.show) {
      zSymbol.animateTo(
        { x: symbolItem.point[0], y: symbolItem.point[1] },
        {
          duration: this.animation.duration,
          easing: this.animation.easing
        }
      );
    }

    // 点击符号点
    zSymbol.on('click', (event: any) => {
      this.showHighlight({ groupId: sGroup.id, hightIds: [event.target.id, ...textIds] });
      this.cancelHightlightTile = symbolItem.colorTitle;
      // 与图例联动
      if (this.hasLegend) {
        const detail = {
          title: symbolItem.colorTitle,
          key: symbolItem.colorLabel
        };
        let moveEvent = new CustomEvent('blockSelect_' + this.id, { detail });
        document.dispatchEvent(moveEvent);
      }
    });

    // 鼠标移入符号点
    zSymbol.on('mouseover', (e: any) => {
      const dataKeys = Object.keys(symbolItem.data);
      // tooltip
      const tooltipData = this.tooltipList
        .filter((f: any) => dataKeys.includes(f.key))
        .reduce((pre: any, item: any) => ({
          ...pre,
          [item.title]: {
            title: item.title,
            value: dataProcess(symbolItem.data[item.key], item.format),
            style: item.text,
            color: symbolItem.color
          }
        }), {});
      this.tooltip.show({ ...e, data: tooltipData });
    });

    zSymbol.on('mousemove', (e: any) => {
      this.tooltip.move(e);
    });

    // 鼠标移出符号点
    zSymbol.on('mouseout', () => {
      this.tooltip.hide();
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

  // 高亮显示
  showHighlight({ groupId, colorLabel, hightIds }: any) {
    Object.keys(this.groupStore).forEach((item: string) => {
      this.groupStore[item].forEach((c: any) => c.setStyle({ opacity: 0.2 }));
    });
    const includesFlag = colorLabel || groupId.toString();
    Object.keys(this.groupStore)
      .filter((f: any) => f.split('_').some((s: any) => s === includesFlag))
      .forEach((item: any) => {
        this.groupStore[item].forEach((c: any) => {
          if (!hightIds) {
            c.setStyle({ opacity: 1 });
          } else if (hightIds.includes(c.id)) {
            c.setStyle({ opacity: 1 });
          }
        });
      });
  }

  // 取消高亮
  cancelHighlight() {
    Object.keys(this.groupStore).forEach(groupName => {
      this.groupStore[groupName].forEach((c: any) => c.setStyle({ opacity: 1 }));
    });
    // 与图例联动
    if (this.hasLegend) {
      let moveEvent = new CustomEvent('cancelHighligh_' + this.id, { 'detail': { title: this.cancelHightlightTile } });
      document.dispatchEvent(moveEvent);
    }
  }
}