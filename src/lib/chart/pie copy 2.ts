import * as d3 from 'd3';
import * as zrender from 'zrender';
import { getTxtWidth, dataProcess } from '../../utils/utils';
import Tooltip from '../../utils/tooltip';

const defaultColor = {
  category: [
    '#4284F5',
    '#03B98C',
    '#FACC14',
    '#F5282D',
    '#8543E0',
    '#3FAECC',
    '#3110D0',
    '#E88F00',
    '#DE2393',
    '#91BA38',
    '#99B4BF',
    '#216A58',
    '#AB9438',
    '#F4999B',
    '#C9BFE1',
    '#055166',
    '#1F135A',
    '#43140A',
    '#96005A',
    '#8D8D8D'
  ]
};

export interface Options {
  config: Record<string, any>// 饼图样式配置信息
  data: Record<string, any> // 饼图数据
}

export interface Animation {
  show: boolean // 是否有动画
  duration: number// 动画时长
  easing: any // 动画曲线
}


export default class Pie {
  data: Array<Record<string, any>>; // 画布数据
  config: Record<string, any>; // 画布配置信息
  width: number; // 画布宽
  height: number; // 画布高
  zr!: zrender.ZRenderType;
  group!: zrender.Group;
  size: number; // 图表大小 0 ~ 100
  features: Record<string, any>; // 特征信息
  colorList: Array<Record<string, any>>; // 颜色列表
  labelsList: Array<Record<string, any>>; // 标签列表
  cx: number; // 圆心坐标x
  cy: number; // 圆心坐标y
  radius: number; // 半径
  innerRadius: number; // 环形内圆半径
  animation: Animation; // 动画配置
  spider: boolean;// 是否使用蜘蛛引导线
  tooltip: Tooltip; // 提示组件
  tooltipList: Array<Record<string, any>>; // tooltip信息列


  constructor(opts: Options) {
    const { data, config } = opts;
    this.data = data.features_data;
    this.config = config;
    const dom: HTMLElement | null = document.getElementById(config.id);
    this.width = dom?.offsetWidth || 860;
    this.height = dom?.offsetHeight || 540;
    this.size = config.css.size || 50;
    this.features = config.features;
    this.colorList = config.css.colorList;
    this.labelsList = config.css.labelsList;
    this.cx = this.width / 2;
    this.cy = this.height / 2;
    const radius = this.width > this.height ? this.height / 2 : this.width / 2;
    this.radius = radius * this.size / 100;
    this.animation = config.animation || { show: true, duration: 300, easing: 'linear' };
    const innerRadius = config.css.innerRadius ? this.radius / 3 : 0;
    this.innerRadius = innerRadius * this.size / 50;
    this.spider = config.css.spider || true;
    this.tooltipList = config.css.tooltipList
      .filter((item: any) => item.display !== 'none')

    this.zr = zrender.init(dom, {
      renderer: 'svg',
      width: this.width,
      height: this.height
    });
    this.group = new zrender.Group();
    this.zr.add(this.group);
    this.tooltip = new Tooltip();

  }

  render(): void {
    // 设置饼图画图所需数据
    this.setPieData();
    // 画图
    this.drawCanvas();
  }

  setPieData(): void {
    const sizeKey = `${this.features.size.legend.toLocaleLowerCase()}(${this.features.size.name})`;
    const colorKey = this.features.color.dtype === 'AGGR' ? `${this.features.color.legend.toLocaleLowerCase()}(${this.features.color.name})` : this.features.color.name;
    const coloredType = this.colorList[0].colored_type;
    if (coloredType === 'linear') {
      // pie数据转成pie的弧度数据
      // 图例颜色为渐变色时， 饼图先按照颜色对应的标签值排序
      this.data = d3.pie()
        .sort((a: any, b: any) => a[colorKey] - b[colorKey])
        .value((d: Record<string, any>) => d[sizeKey])(this.data);
    } else {
      // pie数据转成pie的弧度数据
      this.data = d3.pie().value((d: Record<string, any>) => d[sizeKey])(this.data);
    }

    this.data = this.data
      .sort((a: any, b: any) => a.sortValue - b.sortValue) //按颜色对应的标签数据进行排序
      .map((item: Record<string, any>, i: number) => {
        // 设置饼图颜色
        this.setColor(coloredType, colorKey, item, i);
        // 设置蜘蛛引导线 和 标签 的坐标点
        this.setPolylineAndLabelPoints(item);
        // 设置标签 格式化后的数据
        this.setLabelData(item);
        return item;
      });

    if (this.spider) {
      this.setPolineLabelShow();
    }
  }

  /**
   * 设置饼图颜色 color 
   * @param coloredType 颜色类型   ordinal: 默认   linear： 渐变色
   * @param colorKey 获取颜色的键
   * @param itemData 每项数据
   * @param index 索引
   */
  setColor(coloredType: string, colorKey: string, itemData: Record<string, any>, index: number): void {
    const cList = this.colorList[0].list;
    if (coloredType === 'linear') {
      const rg = /rgb\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*\)$/;
      const minColor = cList.find((cItem: any) => cItem.rangeType === 'min').color;
      const minColorMatch = rg.exec(minColor) || [];
      const maxColor = cList.find((cItem: any) => cItem.rangeType === 'max').color;
      const maxColorMatch = rg.exec(maxColor) || [];

      const min = d3.rgb(minColorMatch[1], minColorMatch[2], minColorMatch[3]);
      const max = d3.rgb(maxColorMatch[1], maxColorMatch[2], maxColorMatch[3]);
      const compute = d3.interpolate(min, max);
      let linear = d3.scaleLinear()
        .domain([this.colorList[0].dataRange[0], this.colorList[0].dataRange[1]])
        .range([0, 1]);
      const linearValue = itemData.data[colorKey];
      itemData.sortValue = linearValue; //按颜色对应的标签数据进行排序
      itemData.color = compute(linear(linearValue));

    } else {
      const colorKeyMap = cList.reduce((pre: any, item: any) => ({ ...pre, [item.val]: item.color }), {});
      itemData.color = colorKeyMap[itemData.data[colorKey]] || defaultColor.category[index % defaultColor.category.length];
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
    // 图表中可以写入label的最大宽度
    const maxWidth = itemData.point2[0] > this.cx ? this.width - itemData.point2[0] : itemData.point2[0];
    for (let i = 0; i < itemData.labelList.length; i++) {
      const labelItem = itemData.labelList[i];
      const textStyle = labelItem.text;
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

      g.on('mouseover', (e) => {
        this.handleHoverSector(e, sector, item.data);
      });
      g.on('mouseout', () => {
        this.handleMouseoutSector(sector);
      });
      g.on('mousemove', (e) => {
        this.tooltip.move(e);
      });
    });
  }

  handleHoverSector(event: any, sector: zrender.Sector, currentData: any) {
    // 鼠标移入 扇形面积放大
    if (this.animation.show) {
      sector.animateTo({ shape: { r: this.radius + 10 } }, { duration: this.animation.duration });
    } else {
      sector.attr({ shape: { r: this.radius + 10 } });
    }
    // tooltip
    const tooltipData = this.tooltipList
      .reduce((pre: any, item: any) => ({
        ...pre,
        [item.key]: dataProcess(currentData[item.key], item.format)
      }), {});
    this.tooltip.show({ ...event, data: tooltipData });
  }

  handleMouseoutSector(sector: zrender.Sector) {
    // 鼠标移出 扇形面积恢复默认
    if (this.animation.show) {
      sector.animateTo({ shape: { r: this.radius } }, { duration: this.animation.duration });
    } else {
      sector.attr({ shape: { r: this.radius } });
    }
    this.tooltip.hide();
  }
}