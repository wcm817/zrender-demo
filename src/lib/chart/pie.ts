import * as d3 from 'd3';
import * as zrender from 'zrender';
import Base from '../../utils/chartBase';
import Legend from '../../utils/legend/legend';
import Tooltip from '../../utils/tooltip';
import { getTxtWidth, dataProcess } from '../../utils/utils';

export interface Animation {
  show: boolean // 是否有动画
  duration: number// 动画时长
  easing: any // 动画曲线
}

export default class Pie extends Base {
  id: string; // 图表容器id
  data: Array<Record<string, any>>; // 画布数据
  width: number; // 画布宽
  height: number; // 画布高
  group!: zrender.Group;
  size: number; // 图表大小 0 ~ 100
  sizeKey: string; // 饼图大小分布对应的键
  labelsList: Array<Record<string, any>>; // 标签列表
  cx: number; // 圆心坐标x
  cy: number; // 圆心坐标y
  radius: number; // 半径
  innerRadius: number; // 环形内圆半径
  animation: Animation; // 动画配置
  spider: boolean;// 是否使用蜘蛛引导线
  tooltip: Tooltip; // 提示组件
  tooltipList: Array<Record<string, any>>; // tooltip信息列
  hasLegend: Boolean; // 是否显示图例
  legendOption!: Record<string, any>; // 图例配置信息&颜色信息
  legendIns!: Legend; // 图例实例
  groupStore: { [propName: string]: zrender.Group } = {}; // 每一组数据图形集合
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
      let legendOpt = Object.assign({
        x0: this.x0, // 来自chartBase的x0
        y0: this.y0,
        x1: this.x1,
        y1: this.y1,
        zrInstance: this.zrInstance, // 来自chartBase的zrInstance
        id: this.id, // 用于定义对应的事件
        legendCss: this.legendCss // 来自chartBase的this.legendCss
      }, this.legendOption);
      // @ts-ignore
      this.legendIns = new Legend(legendOpt);
      // 监听图例点击事件
      document.addEventListener('legendSelect_' + this.id, (e: any) => {
        let { key } = e.detail;
        this.showHighlight({ colorLabel: key });
      });
    }
    // 图表 的宽 高 圆点x 圆点y
    this.width = this.hasLegend ? this.legendIns.chartX1 - this.legendIns.chartX0 : this.zrInstance.getWidth();
    this.height = this.hasLegend ? this.legendIns.chartY1 - this.legendIns.chartY0 : this.zrInstance.getHeight();
    this.cx = this.hasLegend ? this.width / 2 + this.legendIns.chartX0 : this.width / 2;
    this.cy = this.hasLegend ? this.height / 2 + this.legendIns.chartY0 : this.height / 2;

    this.size = config.size || 50;
    this.sizeKey = config.features.sizeName;
    this.labelsList = config.labelsList;
    this.radius = Math.min(this.height / 2, this.width / 2) * this.size / 100;
    const innerRadius = config.innerRadius ? this.radius / 3 : 0;
    this.innerRadius = innerRadius * this.size / 50;
    this.spider = config.spider || true;
    this.tooltipList = config.tooltipList
      .filter((item: any) => item.display !== 'none');

    this.group = new zrender.Group();
    this.tooltip = new Tooltip();

    this.animation = config.animation || { show: true, duration: 300, easing: 'linear' };
    this.actionClick = config.actionClick;
  }

  render(): void {
    // 设置饼图画图所需数据
    this.setPieData();
    // 画图前清空画布
    this.zrInstance.remove(this.group);
    this.group.removeAll();
    this.groupStore = {};
    // 画图
    this.drawCanvas();
  }

  setPieData(): void {
    const colorType = this.legendOption.data[0]?.type;
    const colorTitle = this.legendOption.data[0]?.originTitle || this.legendOption.data[0]?.title;
    const colorLabelMap = this.legendOption.data[0]?.list;
    if (colorType === 'CAT') {
      // pie数据转成pie的弧度数据
      this.data = d3.pie().value((d: Record<string, any>) => d[this.sizeKey])(this.data)
        .map((item: any) => {
          item.colorLabel = item.data[colorTitle] || this.sizeKey;
          item.color = colorLabelMap[item.colorLabel]?.color;
          // 设置蜘蛛引导线 和 标签 的坐标点
          this.setPolylineAndLabelPoints(item);
          // 设置标签 格式化后的数据
          this.setLabelData(item);
          return item;
        });
    } else {
      const rg = /(\d(\.\d+)?)+/g;
      const { color: minColor, originValue: minOriginVal } = colorLabelMap[0];
      const { color: maxColor, originValue: maxOriginVal } = colorLabelMap[1];

      const minColorMatch = minColor.match(rg) || [];
      const maxColorMatch = maxColor.match(rg) || [];
      const min = d3.rgb(minColorMatch[0], minColorMatch[1], minColorMatch[2]);
      const max = d3.rgb(maxColorMatch[0], maxColorMatch[1], maxColorMatch[2]);
      const compute = d3.interpolate(min, max);
      const linear = d3.scaleLinear()
        .domain([minOriginVal, maxOriginVal])
        .range([0, 1]);

      // pie数据转成pie的弧度数据
      // 图例颜色为渐变色时， 饼图先按照颜色对应的标签值排序从浅到深
      this.data = d3.shape.pie()
        .sort((a: any, b: any) => a[colorTitle] - b[colorTitle])
        .value((d: Record<string, any>) => d[this.sizeKey])(this.data)
        .map((item: any) => {
          item.colorLabel = item.data[colorTitle];
          item.sortValue = item.colorLabel;//按颜色对应的标签数据进行排序
          item.color = compute(linear(item.colorLabel));
          // 设置蜘蛛引导线 和 标签 的坐标点
          this.setPolylineAndLabelPoints(item);
          // 设置标签 格式化后的数据
          this.setLabelData(item);
          return item;
        })
        .sort((a: any, b: any) => a.sortValue - b.sortValue); //按颜色对应的标签数据进行排序(否则蜘蛛线标签无法正常判断显隐)
    }

    if (this.spider) {
      this.setPolineLabelShow();
    }
  }

  /**
   * 设置蜘蛛线的坐标点  point0  point1  point2
   * 内部标签的坐标点    labelPoint
   * @param itemData  每项数据
   */
  setPolylineAndLabelPoints(itemData: Record<string, any>): void {
    const centerAngle = (itemData.endAngle - itemData.startAngle) / 2 + itemData.startAngle;
    // 折线始点坐标[x,y]
    let point0: Array<number> = [
      this.cx + Math.sin(centerAngle) * this.radius,
      this.cy - Math.cos(centerAngle) * this.radius
    ];
    // 折线拐点坐标[x,y]
    let point1: Array<number> = [
      this.cx + Math.sin(centerAngle) * (this.radius + 15),
      this.cy - Math.cos(centerAngle) * (this.radius + 15)
    ];
    // 折线终点坐标[x,y]
    let point2: Array<number> = [
      point1[0] > this.cx ? this.cx + (this.radius + 30) : this.cx - (this.radius + 30),
      point1[1]
    ];

    // 内部标签矩形的开始坐标点
    const labelR = this.radius - (this.radius - this.innerRadius) / 3;
    let labelPoint: Array<number> = [this.cx + Math.sin(centerAngle) * labelR, this.cy - Math.cos(centerAngle) * labelR];

    itemData.point0 = point0.map(item => Math.ceil(item));
    itemData.point1 = point1.map(item => Math.ceil(item));
    itemData.point2 = point2.map(item => Math.ceil(item));
    itemData.labelPoint = labelPoint.map(item => Math.ceil(item));
    itemData.value = itemData.value;
  }

  /**
   * 设置格式化后的标签列表 labelList
   * 设置标签最长宽度       maxLabelWidth
   * 设置标签累计总高度     allLabelHeight
   * @param itemData 
   */
  setLabelData(itemData: Record<string, any>): void {
    itemData.labelList = [];
    itemData.maxLabelWidth = 0;
    // 设置最长label项的宽度 maxLabelWidth
    for (let i = 0; i < this.labelsList.length; i++) {
      const labelItem = this.labelsList[i];
      const value = dataProcess(itemData.data[labelItem.key], labelItem.format);
      const curLabelWidth = getTxtWidth(value, labelItem.text.fontSize);
      if (itemData.maxLabelWidth < curLabelWidth) {
        itemData.maxLabelWidth = curLabelWidth;
      }
      itemData.labelList.push({
        ...labelItem,
        labelWidth: curLabelWidth,
        value
      });
    }
    itemData.allLabelHeight = this.labelsList.length * (this.labelsList[0].text.fontSize + 4);
  }

  /**
   * 设置蜘蛛线标签是否显示的标记  showLabel
   */
  setPolineLabelShow(): void {
    // 累计索引
    let temp = 0;
    this.data = this.data.map((item: Record<string, any>, i: number) => {
      // 是否展示标签 showLabel
      item.showLabel = Boolean(this.labelsList.length);
      // 蜘蛛线标签
      if (i !== 0) {
        const flag = (Math.abs(item.point2[1] - this.data[temp].point2[1])) > item.allLabelHeight;
        item.showLabel = flag;
        temp = flag ? i : temp;
        if ((item.point2[0] < this.cx) && (this.data[i - 1].point2[0] > this.cx)) {
          // 左侧第一项
          item.showLabel = true;
        }
      }
      return item;
    });
  }



  /**
   * 画普通内部标签
   * @param group 每项扇形组
   * @param itemData 每项数据
   * @param preTg 上一次作画的标签组
   * @returns 当前作画的标签
   */
  drawLabel(group: zrender.Group, itemData: Record<string, any>, preTg: any) {
    const isRight = itemData.point0[0] > this.cx;
    const maxWidth = itemData.maxLabelWidth;
    const tx = itemData.labelPoint[0];
    // 向上平移一半
    const ty = itemData.labelPoint[1] - (itemData.allLabelHeight / 2);
    let tg = new zrender.Group();
    for (let i = 0; i < itemData.labelList.length; i++) {
      const labelItem = itemData.labelList[i];
      const textStyle = labelItem.text;
      //            宽度小的label以宽度最大的label为中心平移   整体(向右|向左)平移一半的最宽label值
      const xStep = (maxWidth - labelItem.labelWidth) / 2 - maxWidth / 2;
      // 创建文字
      let text = new zrender.Text({
        x: isRight ? tx - xStep : tx + xStep,
        y: ty + i * (textStyle.fontSize + 4),
        z: 1,
        style: {
          text: labelItem.value,
          fill: textStyle.fontColor,
          fontSize: textStyle.fontSize,
          fontStyle: textStyle.fontStyle,
          align: isRight ? 'right' : 'left'
        }
      });
      tg.add(text);
    };

    if (!preTg) { // 第一项
      group.add(tg);
      return tg;
    }

    const { x: preX, y: preY, height: preHeight } = preTg.getBoundingRect();
    const { y, height } = tg.getBoundingRect();
    // 显示标签的判断
    const flag1 = isRight && ((preY + preHeight) < y); // 右侧： 前一项的下y坐标小于 当前项的上y坐标
    const flag2 = !isRight && (preY > (y + height)); // 左侧: 前一项的上y坐标大于 当前项的下y标签
    const flag3 = !isRight && preX > this.cx; // 左侧第一项
    if (flag1 || flag2 || flag3) {
      group.add(tg);
    } else {
      tg = preTg;
    }
    return tg;
  }

  /**
   * 画蜘蛛线标签
   * @param group 每项扇形组
   * @param itemData 每项数据
   */
  drawSpiderLabel(group: zrender.Group, itemData: Record<string, any>): void {
    // 引导折线
    let pline = new zrender.Polyline({
      shape: {
        points: [itemData.point0, itemData.point1, itemData.point2]
      },
      style: {
        stroke: itemData.color
      }
    });
    group.add(pline);

    // 标签
    let tx = itemData.point2[0];
    let ty = itemData.point2[1] - (itemData.labelList.length * itemData.labelList[0].text.fontSize / 2);

    for (let i = 0; i < itemData.labelList.length; i++) {
      const labelItem = itemData.labelList[i];
      const textStyle = labelItem.text;
      // 图表中可以写入label的最大宽度
      const maxWidth = itemData.point2[0] > this.cx ? this.width - itemData.point2[0] : itemData.point2[0];
      // 创建文字
      let text = new zrender.Text({
        x: tx,
        y: ty + i * (textStyle.fontSize + 4),
        style: {
          text: labelItem.value,
          fill: textStyle.fontColor,
          fontSize: textStyle.fontSize,
          fontStyle: textStyle.fontStyle,
          align: itemData.point2[0] > this.cx ? 'left' : 'right',
          width: maxWidth > itemData.maxLabelWidth ? itemData.maxLabelWidth : maxWidth,
          overflow: 'truncate',
          lineOverflow: 'truncate',
          ellipsis: maxWidth > itemData.maxLabelWidth ? '' : '...'
        }
      });
      group.add(text);
    };
  }

  /**
 * 画图
 */
  drawCanvas(): void {
    let tg: any;
    this.data.forEach((item: Record<string, any>) => {
      const g = new zrender.Group();
      // 扇形
      const angleObj = this.animation.show ?
        {
          startAngle: item.startAngle - 90 * Math.PI / 180, // 以12点钟方向为0度
          endAngle: item.startAngle - 90 * Math.PI / 180
        }
        :
        {
          startAngle: item.startAngle - 90 * Math.PI / 180,
          endAngle: item.endAngle - 90 * Math.PI / 180
        };
      let sector = new zrender.Sector({
        shape: {
          cx: this.cx,
          cy: this.cy,
          r: this.radius,
          r0: this.innerRadius,
          ...angleObj
        },
        style: {
          fill: item.color,
          stroke: '#fefefe',
          lineWidth: 0.2
        }
      });
      g.add(sector);

      // 增加动画
      if (this.animation.show) {
        sector.animateTo(
          {
            shape: { endAngle: item.endAngle - 90 * Math.PI / 180 }
          },
          {
            duration: this.animation.duration,
            easing: this.animation.easing
          }
        );
      }
      // 标签
      if (!this.spider && ((item.endAngle - item.startAngle) * 1000) > 200) {
        // 内部标签  角度大于10的才添加标签
        if (this.animation.show) {
          setTimeout(() => {
            tg = this.drawLabel(g, item, tg);
          }, this.animation.duration);
        } else {
          tg = this.drawLabel(g, item, tg);
        }
      } else if (item.showLabel) {
        // 蜘蛛线标签
        this.drawSpiderLabel(g, item);
      }

      this.group.add(g);
      this.groupStore[`${g.id}_${item.colorLabel}`] = g;
      g.on('mouseover', (e) => {
        this.handleHoverSector(e, sector, item);
      });
      g.on('mouseout', () => {
        this.handleMouseoutSector(sector);
      });
      g.on('mousemove', (e) => {
        this.tooltip.move(e);
      });
      g.on('click', (e) => {
        this.actionClick && this.actionClick(item, e);
        this.handleClickSector(g.id, item);
      });
    });
    this.zrInstance.add(this.group);
  }

  // 鼠标点击
  handleClickSector(groupId: number, currentItem: any) {
    this.showHighlight({ groupId });
    // 与图例联动
    if (this.hasLegend) {
      const detail = {
        title: this.legendOption.data[0]?.title,
        key: currentItem.colorLabel
      };
      let moveEvent = new CustomEvent('blockSelect_' + this.id, { detail });
      document.dispatchEvent(moveEvent);
    }
  }

  // 鼠标移入 扇形面积放大
  handleHoverSector(event: any, sector: zrender.Sector, currentItem: any) {
    if (this.animation.show) {
      sector.animateTo({ shape: { r: this.radius + 10 } }, { duration: this.animation.duration });
    } else {
      sector.attr({ shape: { r: this.radius + 10 } });
    }
    // tooltip
    const tooltipData = this.tooltipList
      .reduce((pre: any, item: any) => ({
        ...pre,
        [item.key]: {
          title: item.title,
          value: dataProcess(currentItem.data[item.key], item.format),
          style: item.text,
          color: currentItem.color
        }
      }), {});
    this.tooltip.show({ ...event, data: tooltipData });
  }

  // 鼠标移出 扇形面积恢复默认
  handleMouseoutSector(sector: zrender.Sector) {
    if (this.animation.show) {
      sector.animateTo({ shape: { r: this.radius } }, { duration: this.animation.duration });
    } else {
      sector.attr({ shape: { r: this.radius } });
    }
    this.tooltip.hide();
  }

  // 高亮显示
  showHighlight({ groupId, colorLabel }: any) {
    Object.keys(this.groupStore).forEach((item: string) => {
      this.groupStore[item].children().forEach((c: any) => c.setStyle({ opacity: 0.2 }));
    });

    const includesFlag = colorLabel || groupId.toString();
    Object.keys(this.groupStore)
      .filter((f: any) => f.split('_').some((s: any) => s === includesFlag))
      .forEach((item: any) => {
        this.groupStore[item].children().forEach((c: any) => c.setStyle({ opacity: 1 }));
      });
  }

  // 取消高亮
  cancelHighlight() {
    Object.keys(this.groupStore).forEach(groupName => {
      this.groupStore[groupName].children().forEach((c: any) => c.setStyle({ opacity: 1 }));
    });
    // 与图例联动
    if (this.hasLegend) {
      let moveEvent = new CustomEvent('cancelHighligh_' + this.id, { 'detail': { title: this.legendOption.data[0]?.title } });
      document.dispatchEvent(moveEvent);
    }
  }
}