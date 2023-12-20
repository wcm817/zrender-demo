import * as zrender from 'zrender';
import { ZRenderType } from 'zrender';
import ResizeGroup, { Direction } from '../../utils/resizeGroupWithDirection';

export interface Config {
  id: string,
  width: number,
  height: number,
  renderer: 'svg' | 'canvas',
  config: any,
}

export interface BaseShape {
  x: number,
  y: number,
  width: number,
  height: number
}

export default class Bar {
  id!: string;
  zr!: ZRenderType;
  width!: number;
  height!: number;
  config!: any;
  leftGroup!: ResizeGroup;
  bottomGroup!: ResizeGroup;
  centerGroup!: ResizeGroup;
  leftGroupShape!: BaseShape;
  bottomGroupShape!: BaseShape;
  centerGroupShape!: BaseShape;

  constructor(config: Config) {
    this.initData(config);
  }

  initData(config: Config) {
    this.id = config.id;
    this.width = config.width;
    this.height = config.height;
    this.config = config.config;
    const dom: HTMLElement | null = document.querySelector(`#${this.id}`);
    this.zr = zrender.init(dom, {
      renderer: config.renderer,
      width: this.width,
      height: this.height
    });

    this.createLeftYAxis();
    this.createBottomXAxis();
    this.createCenterCanvas();
  }

  // 左侧y坐标
  createLeftYAxis() {
    if (this.leftGroup) {
      this.leftGroup.removeAll();
    }
    // y轴区域
    this.leftGroupShape = this.leftGroupShape || {
      x: 0,
      y: 0,
      width: 100,
      height: this.height - 100
    };
    const scopeListObj = this.config.scopeList[0];
    // 坐标轴范围
    const range = scopeListObj.range;
    // 个数
    const count = scopeListObj.counts;
    // 刻度间隔距离
    const intervalDis = (this.leftGroupShape.height - 10) / count;
    // 刻度间隔数
    const intervalDisNum = range[1] / (count - 1);
    // 单位
    const unit = scopeListObj.key;

    this.leftGroup = new ResizeGroup({
      zr: this.zr,
      ...this.leftGroupShape,
      resizeDirection: 'right'
    });
    this.zr.add(this.leftGroup);
    this.handleLeftGroupResize();
    const yLine = new zrender.Line({
      shape: {
        x1: this.leftGroupShape.width,
        y1: 10,
        x2: this.leftGroupShape.width,
        y2: this.leftGroupShape.height
      },
      style: {
        stroke: '#ccc',
        lineWidth: 1
      }
    });
    this.leftGroup.add(yLine);

    // 遍历生成刻度
    for (let i = 0; i < count; i++) {
      let g = new zrender.Group();
      g.setPosition([this.leftGroupShape.width, intervalDis * i + 10]);
      let arc = new zrender.Line({
        shape: {
          x1: -4,
          y1: 0,
          x2: 0,
          y2: 0
        },
        style: {
          stroke: '#ccc',
          lineWidth: 1
        }
      });
      let text = new zrender.Text({
        style: {
          text: `${parseInt(`${intervalDisNum * (count - i)}`)}`,
          fontSize: 12,
          fill: '#666'
        }
      });
      text.setPosition([-30, -6]);
      g.add(arc);
      g.add(text);
      this.leftGroup.add(g);
    }

    // 单位
    let unitText = new zrender.Text({
      style: {
        text: unit,
        fontSize: 12,
        fill: '#666',
        x: this.leftGroupShape.width - 100,
        y: 0
      }
    });

    this.leftGroup.add(unitText);
  }

  // 下侧x坐标
  createBottomXAxis() {
    if (this.bottomGroup) {
      this.bottomGroup.removeAll();
    }
    this.bottomGroupShape = this.bottomGroupShape || {
      x: this.leftGroupShape.width,
      y: this.height - 100,
      width: this.width - this.leftGroupShape.width,
      height: 100
    };
    const key = this.config.xAxis[0].key;
    const data = this.config.yAxis[0][0].data[0];
    // 间隔距离 
    const intervalDis = (this.bottomGroupShape.width - 10) / data.length;

    this.bottomGroup = new ResizeGroup({
      zr: this.zr,
      ...this.bottomGroupShape,
      resizeDirection: 'top'
    });
    this.zr.add(this.bottomGroup);
    this.handleBottomGroupResize();

    const xLine = new zrender.Line({
      shape: {
        x1: this.bottomGroupShape.x,
        y1: this.bottomGroupShape.y,
        x2: this.width,
        y2: this.bottomGroupShape.y
      },
      style: {
        stroke: '#ccc',
        lineWidth: 1
      }
    });
    this.bottomGroup.add(xLine);

    // 遍历生成刻度
    for (let i = 0; i < data.length; i++) {
      let g = new zrender.Group();
      g.setPosition([intervalDis * i + this.leftGroupShape.width + intervalDis - 10, this.bottomGroupShape.y]);
      let arc = new zrender.Line({
        shape: {
          x1: 0,
          y1: 0,
          x2: 0,
          y2: 4
        },
        style: {
          stroke: '#ccc',
          lineWidth: 1
        }
      });
      let text = new zrender.Text({
        style: {
          text: data[i][key],
          fontSize: 12,
          fill: '#666'
        }
      });
      text.setPosition([-intervalDis / 2, 6]);
      g.add(arc);
      g.add(text);
      this.bottomGroup.add(g);
    }
  }

  // 中间图表
  createCenterCanvas() {
    if (this.centerGroup) {
      this.centerGroup.removeAll();
    }
    this.centerGroupShape = this.centerGroupShape || {
      x: this.leftGroupShape.width,
      y: 0,
      width: this.width - this.leftGroupShape.width,
      height: this.height - this.bottomGroupShape.height
    };

    const key = this.config.yAxis[0][0].key;
    const data = this.config.yAxis[0][0].data[0];

    // y轴最大值
    const max = this.config.scopeList[0].range[1];
    // 比例值
    const scale = (this.centerGroupShape.height - 10) / (max + 50);
    // 间隔距离 & 柱子宽
    const intervalDis = (this.centerGroupShape.width - 10) / data.length;

    this.centerGroup = new ResizeGroup({
      zr: this.zr,
      ...this.centerGroupShape
    });
    this.zr.add(this.centerGroup);

    // 遍历生柱子
    for (let i = 0; i < data.length; i++) {
      let g = new zrender.Group();
      const x = intervalDis * i + this.leftGroupShape.width + intervalDis / 2;
      const y = this.centerGroupShape.height - scale * data[i][key];
      g.setPosition([x, y]);
      let rect = new zrender.Rect({
        shape: {
          x: 0,
          y: 0,
          width: intervalDis / 2,
          height: scale * data[i][key]
        },
        style: {
          fill: '#ccc'
        }
      });
      let text = new zrender.Text({
        style: {
          text: data[i][key],
          fontSize: 12,
          fill: '#666'
        }
      });
      text.setPosition([0, -10]);
      g.add(rect);
      g.add(text);
      this.centerGroup.add(g);
    }
  }

  // y坐标拖拽事件函数
  handleLeftGroupResize() {
    this.leftGroup.on('groupresize', (data: BaseShape) => {
      this.leftGroupShape = {
        ...data
      };
      this.bottomGroupShape = {
        x: this.leftGroupShape.width,
        y: this.height - this.bottomGroupShape.height,
        width: this.width - this.leftGroupShape.width,
        height: this.bottomGroupShape.height
      };
      this.centerGroupShape = {
        x: this.leftGroupShape.width,
        y: 0,
        width: this.width - this.leftGroupShape.width,
        height: this.height - this.bottomGroupShape.height
      };

      this.createBottomXAxis();
      this.createCenterCanvas();

    });
  }

  // x坐标拖拽事件函数
  handleBottomGroupResize() {
    this.bottomGroup.on('groupresize', (data: BaseShape) => {
      this.bottomGroupShape = { ...data };
      this.leftGroupShape = {
        ...this.leftGroupShape,
        height: this.height - this.bottomGroupShape.height
      };
      this.centerGroupShape = {
        x: this.leftGroupShape.width,
        y: 0,
        width: this.width - this.leftGroupShape.width,
        height: this.height - this.bottomGroupShape.height
      };

      this.createLeftYAxis();
      this.createCenterCanvas();
    });
  }

}
