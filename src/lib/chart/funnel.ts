import * as zrender from 'zrender';
import * as d3 from 'd3';
import Base from '../../utils/chartBase';
import Legend from '../../utils/legend/legend';
import Tooltip from '../../utils/tooltip';
import { getTxtWidth, dataProcess } from '../../utils/utils';

export interface Animation {
  show: boolean // 是否有动画
  duration: number// 动画时长
  easing: any // 动画曲线
}

export default class Funnel extends Base {
  id: string; // 图表容器id
  data: Array<Record<string, any>>; // 画布数据
  hasLegend: Boolean; // 是否显示图例
  legendOption: Record<string, any>; // 图例配置信息&颜色信息
  legendIns!: Legend; // 图例实例
  width: number; // 画布宽
  height: number; // 画布高
  group!: zrender.Group;
  size: number; // 图表大小 0 ~ 100
  sizeKey: string; // 饼图大小分布对应的键
  labelsList: Array<Record<string, any>>; // 标签列表
  animation: Animation; // 动画配置
  tooltip: Tooltip; // 提示组件
  tooltipList: Array<Record<string, any>>; // tooltip信息列
  groupStore: { [propName: string]: Array<any> } = {}; // 每一组数据图形集合
  actionClick: Function; // 下钻回调事件处理

  constructor(config: any) {
    super(config);
    const { id, chartData } = config;
    this.id = id;
    this.data = JSON.parse(JSON.stringify(chartData.features_data));
    // 有图例先画图例
    this.hasLegend = config.hasLegend;
    this.legendOption = config.legendOption;
    if (this.hasLegend) {
      let lengenOpt = Object.assign({
        x0: this.x0, // 来自chartBase的x0
        y0: this.y0,
        x1: this.x1,
        y1: this.y1,
        zrInstance: this.zrInstance, // 来自chartBase的zrInstance
        id: this.id, // 用于定义对应的事件
        legendCss: this.legendCss // 来自chartBase的this.legendCss
      }, this.legendOption);
      // @ts-ignore
      this.legendIns = new Legend(lengenOpt);
      // 监听图例点击事件
      document.addEventListener('legendSelect_' + this.id, (e: any) => {
        let { key } = e.detail;
        console.log('e.detail::::', e.detail);
        this.showHighlight({ colorLabel: key });
      });
    }

    this.width = this.hasLegend ? this.legendIns.chartX1 - this.legendIns.chartX0 : this.zrInstance.getWidth();
    this.height = this.hasLegend ? this.legendIns.chartY1 - this.legendIns.chartY0 : this.zrInstance.getHeight();
    this.size = config.size || 50;
    this.sizeKey = config.features.sizeName;
    this.labelsList = config.labelsList;
    this.animation = config.animation || { show: true, duration: 300, easing: 'linear' };
    this.tooltipList = config.tooltipList
      .filter((item: any) => item.display !== 'none');
    this.tooltip = new Tooltip();
    this.group = new zrender.Group();
    this.actionClick = config.actionClick;
  }

  render() {
    // 设置漏斗数据
    this.setFunnelData();
    // 画图
    this.drawCanvas();
  }

  setFunnelData() {
    // 按大小排序（降序）
    this.data = this.data.sort((a, b) => b[this.sizeKey] - a[this.sizeKey]);
    // 最大值
    const maxData = this.data[0][this.sizeKey];
    // 根据最大值 与 最大宽度 获取比例尺
    const compute = d3.scaleLinear()
      .domain([0, maxData])
      .range([0, this.width * this.size / 100]);
    // 颜色配置
    const colorTitle = this.legendOption.data[0].originTitle || this.legendOption.data[0].title;
    const colorLabelMap = this.legendOption.data[0].list;
    // 平均分配每项高度
    const itemHeight = this.height / this.data.length;
    this.data = this.data.map((item: Record<string, any>, i: number) => {
      item.colorLabel = item[colorTitle];
      item.color = colorLabelMap[item.colorLabel].color;
      item.height = itemHeight;
      // 设置梯形坐标点
      this.setFunnelPoints(item, i, compute);
      // 设置标签格式化标签数据
      this.setLabelData(item);
      return item;
    });

  }

  /**
   * 设置梯形坐标点 左上角开始顺时针 points[[x0,y0], ... [x3,y3]]
   * @param currentItem 当前数据项
   * @param index 索引
   * @param compute 比例尺函数
   */
  setFunnelPoints(currentItem: Record<string, any>, index: number, compute: Function): void {
    const topWidth = compute(currentItem[this.sizeKey]);
    const bottomWidth = (index + 1) < this.data.length ? compute(this.data[index + 1][this.sizeKey]) : topWidth;
    const itemHeight = currentItem.height;
    const offsetY = this.legendIns.chartY0;
    currentItem.points = [];
    currentItem.points.push([(this.width - topWidth) / 2, index * itemHeight + offsetY]);
    currentItem.points.push([(this.width - topWidth) / 2 + topWidth, index * itemHeight + offsetY]);
    currentItem.points.push([(this.width - bottomWidth) / 2 + bottomWidth, (index + 1) * itemHeight + offsetY]);
    currentItem.points.push([(this.width - bottomWidth) / 2, (index + 1) * itemHeight + offsetY]);
  }

  /**
   * 设置标签数据 showLabel labelList labelsHeight maxLabelWidth 
   * @param currentItem 当前数据项
   */
  setLabelData(currentItem: Record<string, any>): void {
    currentItem.showLabel = Boolean(this.labelsList.length); // 是否显示标签
    currentItem.labelList = []; // 标签列表
    currentItem.labelsHeight = 0; // 标签累计高度
    currentItem.maxLabelWidth = 0; // 最长的标签宽度
    for (let i = 0; i < this.labelsList.length; i++) {
      const labelItem = this.labelsList[i];
      currentItem.labelsHeight += (labelItem.text.fontSize + 4);
      const value = dataProcess(currentItem[labelItem.key], labelItem.format);
      const curLabelWidth = getTxtWidth(value, labelItem.text.fontSize);
      if (currentItem.maxLabelWidth < curLabelWidth) {
        currentItem.maxLabelWidth = curLabelWidth;
      }
      currentItem.labelList.push({
        ...labelItem,
        labelWidth: curLabelWidth,
        value
      });
    }
    currentItem.showLabel = currentItem.height > currentItem.labelsHeight;
  }

  /**
   * 画标签
   * @param currentItem 当前数据项
   * @param pGroup 梯形组
   * @returns 终止
   */
  drawLabel(currentItem: Record<string, any>, tGroup: zrender.Group): void {
    if (!currentItem.showLabel) return;
    const tg = new zrender.Group();
    tGroup.add(tg);
    const sx = this.width / 2 - currentItem.maxLabelWidth / 2;
    const sy = currentItem.points[3][1] - currentItem.height / 2 - currentItem.labelsHeight / 2;
    tg.setPosition([sx, sy]);

    for (let k = 0; k < currentItem.labelList.length; k++) {
      const labelItem = currentItem.labelList[k];
      const textStyle = labelItem.text;
      //  宽度小的label以宽度最大的label为中心平移  
      const xStep = (currentItem.maxLabelWidth - labelItem.labelWidth) / 2;
      const text = new zrender.Text({
        x: xStep,
        y: k * (textStyle.fontSize + 4),
        style: {
          text: labelItem.value,
          fill: textStyle.fontColor,
          fontSize: textStyle.fontSize
        }
      });
      tg.add(text);
      this.groupStore[`${tGroup.id}_${currentItem.colorLabel}`].push(text);
    }
  }

  // 画图
  drawCanvas() {
    this.data.forEach((item: any) => {
      const tGroup = new zrender.Group();
      this.group.add(tGroup);
      this.groupStore[`${tGroup.id}_${item.colorLabel}`] = [];
      // 梯形
      const trapezoid = new zrender.Polygon({
        shape: {
          points: item.points
        },
        style: {
          fill: item.color
        }
      });
      tGroup.add(trapezoid);
      this.groupStore[`${tGroup.id}_${item.colorLabel}`].push(trapezoid);
      // 标签
      this.drawLabel(item, tGroup);

      // 添加动画
      if (this.animation.show) {
        trapezoid.animate('shape', false)
          .when(0, { points: item.points.map((pointItem: any) => ([this.width / 2, pointItem[1]])) })
          .when(this.animation.duration, { points: item.points })
          .start();
      }

      // 添加事件
      this.addEvent(tGroup, trapezoid, item);
    });
    this.zrInstance.add(this.group);
  }

  /**
   * 添加事件
   * @param tGroup 每项梯形组
   * @param trapezoid 梯形
   * @param currentItem 当前项数据
   */
  addEvent(tGroup: zrender.Group, trapezoid: zrender.Polygon, currentItem: any) {
    const color = currentItem.color;
    const overStyle = {
      shadowBlur: 10,
      shadowColor: '#999',
      fill: zrender.color.lift(color, 0.1)
    };

    const outStyle = {
      shadowBlur: 0,
      shadowColor: 'transparent',
      fill: color
    };

    tGroup.on('mouseover', (event) => {
      if (this.animation.show) {
        trapezoid.animate('style', false)
          .when(this.animation.duration, overStyle)
          .start();
      } else {
        trapezoid.attr({ style: overStyle });
      }
      // tooltip 显示
      const tooltipData = this.tooltipList
        .reduce((pre: any, item: any) => ({
          ...pre,
          [item.key]: {
            title: item.title,
            value: dataProcess(currentItem[item.key], item.format),
            style: item.text,
            color: currentItem.color
          }
        }), {});
      this.tooltip.show({ ...event, data: tooltipData });
    });

    tGroup.on('mouseout', () => {
      if (this.animation.show) {
        trapezoid.animate('style', false)
          .when(this.animation.duration, outStyle)
          .start();
      } else {
        trapezoid.attr({ style: outStyle });
      }
      // tooltip 隐藏
      this.tooltip.hide();
    });

    tGroup.on('mousemove', (event) => {
      // tooltip 移动
      this.tooltip.move(event);
    });

    tGroup.on('click', (e) => {
      this.showHighlight({ groupId: tGroup.id });
      console.log('currentItem:::', currentItem);
      this.actionClick && this.actionClick(currentItem, e);
      // 与图例联动
      if (this.hasLegend) {
        const detail = {
          title: this.legendOption.data[0].title,
          key: currentItem.colorLabel
        };
        let moveEvent = new CustomEvent('blockSelect_' + this.id, { detail });
        document.dispatchEvent(moveEvent);
      }
    });
  }

  // 高亮显示
  showHighlight({ groupId, colorLabel }: any) {
    Object.keys(this.groupStore).forEach((item: string) => {
      this.groupStore[item].forEach((c: any) => c.setStyle({ opacity: 0.2 }));
    });

    const includesFlag = colorLabel || groupId.toString();
    Object.keys(this.groupStore)
      .filter((f: any) => f.split('_').some((s: any) => s === includesFlag))
      .forEach((item: any) => {
        this.groupStore[item].forEach((c: any) => c.setStyle({ opacity: 1 }));
      });
  }

  // 取消高亮
  cancelHighlight() {
    Object.keys(this.groupStore).forEach(groupName => {
      this.groupStore[groupName].forEach((c: any) => c.setStyle({ opacity: 1 }));
    });
    // 与图例联动
    if (this.hasLegend) {
      let moveEvent = new CustomEvent('cancelHighligh_' + this.id, { 'detail': { title: this.legendOption.data[0].title } });
      document.dispatchEvent(moveEvent);
    }
  }
};
