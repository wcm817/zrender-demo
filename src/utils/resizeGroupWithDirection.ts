import { Group, Line, Rect, ZRenderType } from 'zrender';

export type Direction = "top" | "right" | "bottom" | "left"

export interface ResizeGroupOpts {
  zr: ZRenderType, // zr实例
  x: number, // 组x坐标
  y: number, // 组y坐标
  width: number, // 组的宽
  height: number, // 组的高
  resizeDirection?: Direction, // 组大小变化的方向
  lineColor?: string, // 拖拽线颜色
}

export interface DragData {
  drag: boolean, // 是否允许拖拽
  pos: Array<number>, // 线移动位置
  group: any, // 当前组
  target: any, // 拖拽目标(线)
}

class ResizeGroup extends Group {
  line: Line;
  lineShape: Record<string, any> | any;
  rect: Rect;
  rectShape: ResizeGroupOpts | any;
  dragData: DragData;
  resizeDirection: Direction | undefined;


  constructor(opts: ResizeGroupOpts) {
    super();
    this.lineShape = null;
    this.resizeDirection = opts.resizeDirection;
    this.dragData = {
      drag: false,
      pos: [0, 0],
      group: null,
      target: null
    };

    // 拖拽线
    this.line = new Line({
      style: {
        stroke: opts.lineColor || '#999',
        lineWidth: 1
      }
    });

    // 撑开group的矩形
    this.rectShape = {
      x: opts.x,
      y: opts.y,
      width: opts.width,
      height: opts.height
    };
    this.rect = new Rect({
      shape: this.rectShape,
      cursor: 'default',
      style: {
        fill: 'transparent'
      }
    });

    this.add(this.line);
    this.add(this.rect);

    if (!this.resizeDirection) return;
    // group事件
    this.selfEvent(opts);
    // 线事件
    this.lineEvent();
    // zr事件
    this.zrEvent(opts);
  }

  selfEvent(opts: ResizeGroupOpts): void {
    this.on('click', () => {
      const { x, y, width, height, resizeDirection } = opts;
      if (!resizeDirection) return;
      const lineShapeMap = {
        top: {
          x1: x,
          y1: y,
          x2: x + width,
          y2: y
        },
        right: {
          x1: x + width,
          y1: y,
          x2: x + width,
          y2: y + height
        },
        bottom: {
          x1: x,
          y1: y + height,
          x2: x + width,
          y2: y + height
        },
        left: {
          x1: x,
          y1: y,
          x2: x,
          y2: y + height
        }
      };
      type ObjectKey = keyof typeof lineShapeMap
      const keyName: ObjectKey = resizeDirection;
      // 线的配置
      this.lineShape = this.lineShape || lineShapeMap[keyName];
      // 显示线
      this.line.attr({
        shape: this.lineShape,
        zlevel: 99
      }).show();

      // 记录操作的group
      this.dragData.group = this;

    });
  }

  lineEvent(): void {
    if (!this.resizeDirection) return;
    const cursorStyle = ['right', 'left'].includes(this.resizeDirection) ? 'col-resize' : 'row-resize';

    this.line.on('mouseover', () => {
      this.line.attr({ cursor: cursorStyle });
    });

    this.line.on('mousedown', (e) => {
      this.line.attr({
        cursor: cursorStyle,
        zlevel: 99
      });
      // 画布拖拽的起始位置
      this.dragData.pos = [e.event.zrX, e.event.zrY];
      // 画布的拖拽目标
      this.dragData.target = e.target;
      if (e.target === undefined) {
        this.dragData.drag = false;
      } else if (e.target.parent && e.target.parent.type === 'group') {
        this.dragData.drag = true;
      }
    });

    // 鼠标抬起，关闭拖拽 将拖拽目标元素设置为空
    this.line.on('mouseup', () => {
      this.dragData.drag = false;
      this.line.hide();
      this.trigger('groupresize', this.rect.getBoundingRect());
      this.line.show();
    });
  }

  zrEvent(opts: ResizeGroupOpts): void {
    // 鼠标移动
    opts.zr.on('mousemove', (e: any) => {
      if (!this.resizeDirection) return;
      if (!this.dragData.drag) return;
      let newPos = [e.event.zrX, e.event.zrY];

      if (this.dragData.target !== null) {
        // 移动的临界值
        const flag1 = this.resizeDirection === 'right' && ((e.event.zrX + 2 >= opts.zr.getWidth()) || (e.event.zrX - 50 <= opts.x));
        const flag2 = this.resizeDirection === 'bottom' && ((e.event.zrY + 2 >= opts.zr.getHeight()) || (e.event.zrY - 50 <= opts.y));
        const flag3 = this.resizeDirection === 'left' && ((e.event.zrY + 50 >= opts.zr.getWidth()) || (e.event.zrX - 2 <= 0));
        const flag4 = this.resizeDirection === 'top' && ((e.event.zrY + 50 >= opts.zr.getHeight()) || (e.event.zrY - 2 <= 0));
        if (flag1 || flag2 || flag3 || flag4) {
          this.trigger('groupresize', this.rect.getBoundingRect());
          this.dragData.drag = false;
          return;
        }

        let pos = [
          newPos[0] - this.dragData.pos[0],
          newPos[1] - this.dragData.pos[1]
        ];
        const groupChildren = this.dragData.group.children();
        // 设置目标移动线的位置 与 组内rect宽高
        if (['right', 'left'].includes(this.resizeDirection)) {
          // 水平方向
          this.dragData.target.position[0] += pos[0];
          for (let i = 2; i < groupChildren.length; i++) {
            groupChildren[i].position[0] += pos[0];
          }
          if (this.resizeDirection === 'left') {
            this.rectShape.x = this.rectShape.x + pos[0];
            this.rectShape.width -= pos[0];
          } else {
            this.rectShape.width += pos[0];
          }
        } else {
          // 垂直方向
          this.dragData.target.position[1] += pos[1];
          for (let i = 2; i < groupChildren.length; i++) {
            groupChildren[i].position[1] += pos[1];
          }
          if (this.resizeDirection === 'top') {
            this.rectShape.y = this.rectShape.y + pos[1];
            this.rectShape.height -= pos[1];
          } else {
            this.rectShape.height += pos[1];
          }
        }

        // 设置范围矩形位置与大小
        this.rect.attr({
          shape: {
            x: this.rectShape.x,
            y: this.rectShape.y,
            width: this.rectShape.width,
            height: this.rectShape.height
          }
        });
      }
      this.dragData.pos = [e.event.zrX, e.event.zrY];
    });

    // 点击group以外的范围，隐藏拖拽线
    opts.zr.on('click', (e: any) => {
      let x = e.event.zrX;
      let y = e.event.zrY;
      const group = this.dragData.group || {};
      if (this.id === group.id) {
        if (!this.getBoundingRect().contain(x, y)) {
          this.line.attr({
            zlevel: 0
          }).hide();
          this.dragData.group = null;
          this.dragData.target = null;
        }
      }

    });
  }

  // 更改大小
  resize(params: ResizeGroupOpts): Group {
    this.lineShape = {
      x1: params.x + params.width + 2,
      y1: params.y,
      x2: params.x + params.width + 2,
      y2: params.height
    };
    this.rectShape = {
      x: params.x,
      y: params.y,
      width: params.width,
      height: params.height
    };
    this.trigger('groupresize', params);
    return this;
  }
}

export default ResizeGroup;
