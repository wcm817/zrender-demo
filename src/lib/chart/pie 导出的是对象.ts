import * as d3 from 'd3';
import * as zrender from 'zrender';
import ResizeGroup from '../../utils/resizeGroup';
import {
  InitParams,
  PieDataParams,
  PieDataColorParams,
  PolylineDataPParams,
  LabelDataParams,
  DrawPieParams,
  PieDataItem
} from '../../interface/pie';
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
export default {
  init(opts: InitParams): void {

    const { data, config } = opts;
    const id = config.id;
    const dom: HTMLElement | null = document.getElementById(id);
    const width = dom?.offsetWidth || 600;
    const height = dom?.offsetHeight || 480;
    const radius = width > height ? height / 4 : width / 4;
    const cx = width / 2;
    const cy = height / 2;

    const zr = zrender.init(dom, {
      renderer: 'svg',
      width: width,
      height: height
    });

    const group = new ResizeGroup({
      zr: zr,
      x: 0,
      y: 0,
      width: width,
      height: width
    });
    zr.add(group);


    // 设置数据
    const pieData = this.setPieData({ data, config, radius, cx, cy });

    // 画图
    this.drawCanvas({
      data: pieData,
      radius,
      cx,
      cy,
      innerRadius: config.css.innerRadius,
      group
    });
  },

  setPieData({ data, config, radius, cx, cy }: PieDataParams): Array<PieDataItem> {
    const features = config.features;
    // 设置每项数据的颜色
    let newData = this.setPieDataColor({
      data: data.features_data,
      features,
      colorList: config.css.colorList
    });
    // 设置蜘蛛引导线数据
    newData = this.setPolylineData({ data: newData, radius, cx, cy });

    // 设置label标签数据
    newData = this.setLabelData({ data: newData, labelsList: config.css.labelsList, cx });

    return newData;
  },

  // 设置饼图颜色数据
  setPieDataColor({ data, features, colorList }: PieDataColorParams): Array<Record<string, any>> {
    const sizeKey = `${features.size.legend.toLocaleLowerCase()}(${features.size.name})`;
    const colorKey = features.color.dtype === 'AGGR' ? `${features.color.legend.toLocaleLowerCase()}(${features.color.name})` : features.color.name;
    const coloredType = colorList[0].colored_type;
    const cList = colorList[0].list;

    if (coloredType === 'linear') {
      const rg = /rgb\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*\)$/;
      const minColor = cList.find((item: any) => item.rangeType === 'min').color;
      const minColorMatch = rg.exec(minColor) || [];
      const maxColor = cList.find((item: any) => item.rangeType === 'max').color;
      const maxColorMatch = rg.exec(maxColor) || [];

      const min = d3.rgb(minColorMatch[1], minColorMatch[2], minColorMatch[3]);
      const max = d3.rgb(maxColorMatch[1], maxColorMatch[2], maxColorMatch[3]);
      const compute = d3.interpolate(min, max);
      let linear = d3.scaleLinear()
        .domain([colorList[0].dataRange[0], colorList[0].dataRange[1]])
        .range([0, 1]);

      // pie数据转成pie的弧度数据
      // 图例颜色为渐变色时， 饼图先按照颜色对应的标签值排序
      let newData = d3.pie()
        .sort((a: any, b: any) => a[colorKey] - b[colorKey])
        .value((d: Record<string, any>) => d[sizeKey])(data);

      return newData.map((item: any) => {
        const linearValue = item.data[colorKey];
        return {
          ...item,
          sortValue: linearValue,
          color: compute(linear(linearValue))
        };
      });
    } else {
      const colorKeyMap = cList.reduce((pre: any, item: any) => ({ ...pre, [item.val]: item.color }), {});
      // pie数据转成pie的弧度数据
      let newData = d3.pie().value((d: Record<string, any>) => d[sizeKey])(data);
      newData = newData.map((item: any, i: number) => {
        return {
          ...item,
          color: colorKeyMap[colorKey] || defaultColor.category[i]
        }
      });
      return newData;
    }

  },
  // 设置引导线数据
  setPolylineData({ data, radius, cx, cy }: PolylineDataPParams): Array<Record<string, any>> {
    // 角度区域， 0度从正上方开始与画扇形的开始位置一致(顺时针)
    const angleMap = {
      rightTop: [0, 90],
      rightBottom: [90, 180],
      leftBottom: [180, 270],
      leftTop: [270, 360]
    };
    const newData = data.map((item: Record<string, any>, i: number) => {
      const startAngle = item.startAngle * 180 / Math.PI;
      const endAngle = item.endAngle * 180 / Math.PI;
      const centerAngle = (endAngle - startAngle) / 2 + startAngle;
      // 找到扇形中线所在的区域
      let index = Object.values(angleMap).findIndex((a: Array<number>) => {
        return (centerAngle > a[0]) && (centerAngle <= a[1]);
      });

      let point0: Array<number> = []; // 折线始点坐标[x,y]
      let point1: Array<number> = []; // 折线拐点坐标[x,y]
      let point2: Array<number> = []; // 折线终点坐标[x,y]
      const point2X = radius + 40;// 终点固定x方向的距离

      // 计算每个扇形中线与前一邻近坐标轴的夹角弧度
      const radian = (centerAngle - index * 90) * Math.PI / 180;
      // console.log('centerAngle：：：', centerAngle, centerAngle - index * 90)
      // 根据斜边(半径) 获取 中线夹角的对边
      const sinLine = Math.sin(radian) * radius;
      const sinLineStep = Math.sin(radian) * (radius + 20);
      // 根据斜边(半径) 获取 中线夹角的邻边
      const cosLine = Math.cos(radian) * radius;
      const cosLineStep = Math.cos(radian) * (radius + 20);

      // 根据不同方位获取折线坐标点
      const keyArr = Object.keys(angleMap);
      switch (keyArr[index]) {
        case 'rightTop':
          point0 = [cx + sinLine, cy - cosLine];
          point1 = [cx + sinLineStep, cy - cosLineStep];
          point2 = [cx + point2X, point1[1]];
          break;
        case 'rightBottom':
          point0 = [cx + cosLine, cy + sinLine];
          point1 = [cx + cosLineStep, cy + sinLineStep];
          point2 = [cx + point2X, point1[1]];
          break;
        case 'leftBottom':
          point0 = [cx - sinLine, cy + cosLine];
          point1 = [cx - sinLineStep, cy + cosLineStep];
          point2 = [cx - point2X, point1[1]];
          break;
        case 'leftTop':
          point0 = [cx - cosLine, cy - sinLine];
          point1 = [cx - cosLineStep, cy - sinLineStep];
          point2 = [cx - point2X, point1[1]];
          break;
        default:
          break;
      }
      item.point0 = point0.map(item => Math.ceil(item));
      item.point1 = point1.map(item => Math.ceil(item));
      item.point2 = point2.map(item => Math.ceil(item));
      item.value = item.value;
      return item;
    });
    return newData;
  },
  // 设置标签数据
  setLabelData({ data, labelsList, cx }: LabelDataParams): Array<PieDataItem | Record<string, any>> {
    // 累计索引
    let temp = 0;
    let sortData = data.sort((a, b) => a.sortValue - b.sortValue);
    const newData = sortData.map((item: Record<string, any>, i: number) => {
      item.formatLabelsList = [];
      item.maxLabelWidth = 0;
      // 设置最长label项的宽度 maxLabelWidth
      for (let i = 0; i < labelsList.length; i++) {
        const labelItem = labelsList[i];
        const value = dataProcess(item.data[labelItem.key], labelItem.format);
        item.formatLabelsList.push({
          ...labelItem,
          value
        });

        if (item.maxLabelWidth < getTxtWidth(value, labelItem.text.fontSize)) {
          item.maxLabelWidth = getTxtWidth(value, labelItem.text.fontSize);
        }
      }

      // 是否展示标签 showLabel
      item.showLabel = Boolean(labelsList.length);
      if (i !== 0) {
        const allLabelHeight = labelsList.length * (labelsList[0].text.fontSize + 4);
        const flag = (Math.abs(item.point2[1] - data[temp].point2[1])) > allLabelHeight;
        item.showLabel = flag;
        temp = flag ? i : temp;
        if ((item.point2[0] < cx) && (data[i - 1].point2[0] > cx)) {
          // 左侧第一项
          item.showLabel = true;
        }
      }
      return item;
    });
    return newData;
  },
  // 画图
  drawCanvas({ data, radius, cx, cy, innerRadius, group }: DrawPieParams): void {
    const isAnnular = Boolean(innerRadius); // 是否是环形
    const r0 = isAnnular ? radius / 3 : 0;
    data.forEach((item: PieDataItem) => {
      // 扇形
      let sector = new zrender.Sector({
        shape: {
          cx: cx,
          cy: cy,
          r: radius,
          r0,
          startAngle: item.startAngle - 90 * Math.PI / 180,
          endAngle: item.endAngle - 90 * Math.PI / 180
        },
        style: {
          fill: item.color,
          stroke: '#fefefe',
          lineWidth: 0.2
        }
      });

      group.add(sector);

      if (item.showLabel) {
        // 引导折线
        let pline = new zrender.Polyline({
          shape: {
            points: [item.point0, item.point1, item.point2]
          },
          style: {
            stroke: item.color
          }
        });
        group.add(pline);

        // 标签
        let tx = item.point2[0] > cx ? item.point2[0] : item.point2[0] - item.maxLabelWidth;
        let ty = item.point2[1] - (item.formatLabelsList.length * item.formatLabelsList[0].text.fontSize / 2);
        for (let i = 0; i < item.formatLabelsList.length; i++) {
          const labelItem = item.formatLabelsList[i];
          const textStyle = labelItem.text;
          let text = new zrender.Text({
            x: tx,
            y: ty + i * (textStyle.fontSize + 4),
            style: {
              width: item.maxLabelWidth,
              text: labelItem.value,
              fill: textStyle.fontColor,
              fontSize: textStyle.fontSize,
              fontStyle: textStyle.fontStyle,
              align: textStyle.align
            }
          });
          group.add(text);
        };
      }

    });
  }
};