import * as d3 from 'd3';
import * as zrender from 'zrender';
import { ZRenderType } from 'zrender';
import ResizeGroup from '../../utils/resizeGroupWithDirection';
import { getTxtWidth, dataProcess } from '../../utils/utils';


export interface Options {
  config: Record<string, any>
  data: Record<string, any>,
  width: number,
  height: number
}


export default class Pie {
  zr!: ZRenderType;
  width: number;
  height: number;
  config: Record<string, any>;
  data: any;
  colorList: Array<Record<string, any>>;
  group!: ResizeGroup;
  css: Record<string, any>;
  radius: number; // 半径
  cx: number; // 圆心坐标x
  cy: number; // 圆心坐标y


  constructor(opts: Options) {
    this.config = opts.config;
    this.css = this.config.css || {};
    this.width = opts.width;
    this.height = opts.height;
    // 颜色列表
    this.colorList = this.css.colorList[0].list
    this.data = opts.data;
    // 半径
    this.radius = this.width > this.height ? this.height / 4 : this.width / 4;
    // 圆心坐标 x y
    this.cx = this.width / 2;
    this.cy = this.height / 2;
    this.init();
  }

  init(): void {
    const dom: HTMLElement | null = document.querySelector(`#id_${this.config.worksheet_id}`);
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
      height: this.width
    })
    this.zr.add(this.group);
    this.render();
  }

  render(): void {
    // 设置扇形图数据
    this.setPieData();
    // 设置蜘蛛引导线数据
    this.setPolylineData();
    // 设置label标签数据
    this.setLabelData();
    // 画图
    this.drawCanvas();
  }

  setPieData(): void {
    // 数据大小对应的键
    const key = this.css.labelsList[0].key;
    this.data = d3.pie().value((d: Record<string, any>) => d[key])(this.data.features_data)
  }

  setPolylineData(): void {
    // 角度区域， 0度从正上方开始与画扇形的开始位置一致(顺时针)
    const angleMap = {
      rightTop: [0, 90],
      rightBottom: [90, 180],
      leftBottom: [180, 270],
      leftTop: [270, 360]
    }
    this.data.map((item: Record<string, any>, i: number) => {
      const startAngle = item.startAngle * 180 / Math.PI;
      const endAngle = item.endAngle * 180 / Math.PI
      const centerAngle = (endAngle - startAngle) / 2 + startAngle
      // 找到扇形中线所在的区域
      let index = Object.values(angleMap).findIndex((a: Array<number>) => {
        return (centerAngle > a[0]) && (centerAngle <= a[1]);
      })

      let point0: Array<number> = []; // 折线始点坐标[x,y]
      let point1: Array<number> = []; // 折线拐点坐标[x,y]
      let point2: Array<number> = []; // 折线终点坐标[x,y]
      const point2X = this.radius + 40// 终点固定x方向的距离

      // 计算每个扇形中线与前一邻近坐标轴的夹角弧度
      const radian = (centerAngle - index * 90) * Math.PI / 180
      // console.log('centerAngle：：：', centerAngle, centerAngle - index * 90)
      // 根据斜边(半径) 获取 中线夹角的对边
      const sinLine = Math.sin(radian) * this.radius;
      const sinLineStep = Math.sin(radian) * (this.radius + 20);
      // 根据斜边(半径) 获取 中线夹角的邻边
      const cosLine = Math.cos(radian) * this.radius;
      const cosLineStep = Math.cos(radian) * (this.radius + 20);

      // 根据不同方位获取折线坐标点
      const keyArr = Object.keys(angleMap);
      switch (keyArr[index]) {
        case 'rightTop':
          point0 = [this.cx + sinLine, this.cy - cosLine];
          point1 = [this.cx + sinLineStep, this.cy - cosLineStep];
          point2 = [this.cx + point2X, point1[1]];
          break;
        case 'rightBottom':
          point0 = [this.cx + cosLine, this.cy + sinLine];
          point1 = [this.cx + cosLineStep, this.cy + sinLineStep];
          point2 = [this.cx + point2X, point1[1]];
          break;
        case 'leftBottom':
          point0 = [this.cx - sinLine, this.cy + cosLine];
          point1 = [this.cx - sinLineStep, this.cy + cosLineStep];
          point2 = [this.cx - point2X, point1[1]];
          break;
        case 'leftTop':
          point0 = [this.cx - cosLine, this.cy - sinLine];
          point1 = [this.cx - cosLineStep, this.cy - sinLineStep];
          point2 = [this.cx - point2X, point1[1]];
          break;
        default:
          break;
      }
      item.point0 = point0.map(item => Math.ceil(item));
      item.point1 = point1.map(item => Math.ceil(item));
      item.point2 = point2.map(item => Math.ceil(item));
      item.color = this.colorList[i]?.color;
      item.value = item.value;
    });
  }

  setLabelData(): void {
    const labelsList = this.css.labelsList;

    // 累计索引
    let temp = 0;
    this.data.forEach((item: Record<string, any>, i: number) => {
      item.labelList = [];
      item.maxLabelWidth = 0;
      // 设置最长label项的宽度 maxLabelWidth
      for (let i = 0; i < labelsList.length; i++) {
        const labelItem = labelsList[i];
        const value = dataProcess(item.data[labelItem.key], labelItem.format)
        // if (labelItem.format.isPercent) {
        //   value = (value * 100).toFixed(2) + '%';
        // }
        item.labelList.push({
          ...labelItem,
          value,
        });

        if (item.maxLabelWidth < getTxtWidth(value, labelItem.text.fontSize)) {
          item.maxLabelWidth = getTxtWidth(value, labelItem.text.fontSize)
        }
      }

      // 是否展示标签 showLabel
      item.showLabel = Boolean(labelsList.length);
      if (i !== 0) {
        const allLabelHeight = labelsList.length * (labelsList[0].text.fontSize + 4);
        const flag = (Math.abs(item.point2[1] - this.data[temp].point2[1])) > allLabelHeight;
        item.showLabel = flag;
        temp = flag ? i : temp;
        if ((item.point2[0] < this.cx) && (this.data[i - 1].point2[0] > this.cx)) {
          // 左侧第一项
          item.showLabel = true;
        }
      }
    })
  }

  drawCanvas(): void {
    const isAnnular = Boolean(this.css.innerRadius); // 是否是环形
    const r0 = isAnnular ? this.radius / 3 : 0;
    this.data.forEach((item: Record<string, any>, i: number) => {
      // 扇形
      let sector = new zrender.Sector({
        shape: {
          cx: this.cx,
          cy: this.cy,
          r: this.radius,
          r0,
          startAngle: item.startAngle - 90 * Math.PI / 180,
          endAngle: item.endAngle - 90 * Math.PI / 180,
        },
        style: {
          fill: this.colorList[i]?.color,
          stroke: this.colorList[i]?.color
        }
      })

      this.group.add(sector);

      if (item.showLabel) {
        // 引导折线
        let pline = new zrender.Polyline({
          shape: {
            points: [item.point0, item.point1, item.point2]
          },
          style: {
            stroke: item.color
          },
        });
        this.group.add(pline);

        // 标签
        let tx = item.point2[0] > this.cx ? item.point2[0] : item.point2[0] - item.maxLabelWidth;
        let ty = item.point2[1] - (item.labelList.length * item.labelList[0].text.fontSize / 2);
        for (let i = 0; i < item.labelList.length; i++) {
          const labelItem = item.labelList[i];
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
              align: textStyle.align,
            }
          });
          this.group.add(text);
        };
      }

    });
  }
}