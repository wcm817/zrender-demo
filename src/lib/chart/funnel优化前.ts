import * as zrender from 'zrender';
import * as d3 from 'd3';
import { ZRenderType } from 'zrender';
import ResizeGroup from '../../utils/resizeGroupWithDirection';
import { getTxtWidth, dataProcess } from '../../utils/utils';

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
  config: Record<string, any>// 漏斗样式配置信息
  data: Record<string, any> // 漏斗图数据
}

export default class Funnel {
  data: Array<Record<string, any>>; // 画布数据
  width: number; // 画布宽
  height: number; // 画布高
  id: string; // id
  zr!: zrender.ZRenderType;
  group!: ResizeGroup;
  size: number; // 图表大小 0 ~ 100
  features: Record<string, any>; // 分类信息
  colorList: Array<Record<string, any>>; // 颜色列表
  labelsList: Array<Record<string, any>>; // 标签列表


  constructor(opts: Options) {
    const { data, config } = opts;
    this.data = data.features_data;
    this.id = config.id;
    const dom: HTMLElement | null = document.getElementById(this.id);
    this.width = dom?.offsetWidth || 680;
    this.height = dom?.offsetHeight || 400;
    this.size = config.size || 50;
    this.features = config.features;
    this.colorList = config.css.colorList;
    this.labelsList = config.css.labelsList;

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
    // 设置漏斗数据
    this.setFunnelData();
    // 设置标签数据
    this.setLabelData();
    // 设置颜色
    this.setDataColor();
    // 画图
    this.drawCavans();
  }

  setFunnelData() {
    const sizeKey = `${this.features.size.legend.toLocaleLowerCase()}(${this.features.size.name})`;
    // 按大小排序（降序）
    this.data = this.data.sort((a, b) => b[sizeKey] - a[sizeKey]);
    // 最大值
    const maxData = this.data[0][sizeKey];
    // 根据最大值 与 最大宽度 获取比例尺
    const compute = d3.scaleLinear()
      .domain([0, maxData])
      .range([0, this.width * this.size / 100]);
    const itemHeight = this.height / this.data.length;
    // 构造梯形坐标点
    this.data = this.data.map((item: any, i: number) => {
      const topWidth = compute(item[sizeKey]);
      const bottomWidth = (i + 1) < this.data.length ? compute(this.data[i + 1][sizeKey]) : topWidth;
      item.point0 = [(this.width - topWidth) / 2, i * itemHeight];
      item.point1 = [(this.width - topWidth) / 2 + topWidth, i * itemHeight];
      item.point2 = [(this.width - bottomWidth) / 2 + bottomWidth, (i + 1) * itemHeight];
      item.point3 = [(this.width - bottomWidth) / 2, (i + 1) * itemHeight];
      item.height = itemHeight;
      return item;
    });

  }


  setLabelData(): void {
    this.data = this.data.map((item: any) => {
      item.labelList = []; // 标签列表
      item.labelsHeight = 0; // 标签累计高度
      item.maxLabelWidth = 0; // 最长的标签宽度
      item.showLabel = Boolean(this.labelsList.length); // 是否显示标签
      for (let i = 0; i < this.labelsList.length; i++) {
        const labelItem = this.labelsList[i];
        item.labelsHeight += (labelItem.text.fontSize + 4);
        const value = dataProcess(item[labelItem.key], labelItem.format);
        const curLabelWidth = getTxtWidth(value, labelItem.text.fontSize);
        if (item.maxLabelWidth < curLabelWidth) {
          item.maxLabelWidth = curLabelWidth;
        }
        item.labelList.push({
          ...labelItem,
          labelWidth: curLabelWidth,
          value
        });
      }
      item.showLabel = item.height > item.labelsHeight;
      return item;
    });
  }

  setDataColor(): void {
    const colorFeatures = this.features.color;
    const colorKey = colorFeatures.dtype === 'AGGR' ? `${colorFeatures.legend.toLocaleLowerCase()}(${colorFeatures.name})` : colorFeatures.name;
    const cList = this.colorList[0].list;
    const coloredType = this.colorList[0].colored_type;
    if (coloredType === 'linear') {
      // 渐变色
    } else {
      // 颜色列表数组 转成 颜色对象，以分类为键，值为颜色
      const colorKeyMap = cList.reduce((pre: any, item: any) => ({
        ...pre,
        [item.val]: pre[item.val] ? pre[item.val] : item.color
      }), {});
      this.data = this.data.map((item: any, i: number) => {
        return {
          ...item,
          color: colorKeyMap[item[colorKey]] || defaultColor.category[i % defaultColor.category.length]
        };
      });
    }
  }

  drawCavans() {
    this.data.forEach((item: any, i: number) => {
      // 梯形
      const polygon = new zrender.Polygon({
        shape: {
          points: [item.point0, item.point1, item.point2, item.point3]
        },
        style: {
          fill: item.color
        }
      });
      this.group.add(polygon);

      // 标签
      if (!item.showLabel) return;
      const tg = new zrender.Group();
      this.group.add(tg);
      const sx = this.width / 2 - item.maxLabelWidth / 2;
      const sy = (i + 1) * item.height - item.height / 2 - item.labelsHeight / 2;
      tg.setPosition([sx, sy]);

      for (let k = 0; k < item.labelList.length; k++) {
        const labelItem = item.labelList[k];
        const textStyle = labelItem.text;
        //  宽度小的label以宽度最大的label为中心平移  
        const xStep = (item.maxLabelWidth - labelItem.labelWidth) / 2;
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
      }

    });
  }

};
