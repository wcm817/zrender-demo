import { Group, Line, Rect, ZRenderType } from 'zrender';

interface ResizeGroupOpts {
  zr: ZRenderType, // zr实例
  x: number, // 组x坐标
  y: number, // 组y坐标
  width: number, // 组的宽
  height: number, // 组的高
}

interface DragData {
  drag: boolean, // 是否允许拖拽
  pos: Array<number>, // 线移动位置
  group: any, // 当前组
  target: any, // 拖拽目标(线)
}

class ResizeGroup extends Group {
  line: Line;
  lineShape: any;
  rect: Rect;
  rectShape: ResizeGroupOpts | any;
  dragData: DragData;


  constructor(opts: ResizeGroupOpts) {
    super();
    this.lineShape = null;
    this.dragData = {
      drag: false,
      pos: [0, 0],
      group: null,
      target: null,
    }

    // 拖拽线
    this.line = new Line({
      style: {
        stroke: 'red',
        lineWidth: 4
      },
    })

    // 撑开group的矩形
    this.rectShape = {
      x: opts.x,
      y: opts.y,
      width: opts.width,
      height: opts.height
    }
    this.rect = new Rect({
      shape: this.rectShape,
      style: {
        fill: 'transparent'
      }
    })

    this.add(this.line)
    this.add(this.rect)

    // group事件
    this.selfEvent(opts);
    // 线事件
    this.lineEvent();
    // zr事件
    this.zrEvent(opts);
  }

  selfEvent(opts: ResizeGroupOpts) {
    this.on('click', () => {
      const { x, y, width, height } = opts;
      // const lineShapeMap = {
      //   top: {
      //     x1: x,
      //     y1: y + 2,
      //     x2: x + width,
      //     y2: y + 2
      //   },
      //   right: {
      //     x1: x + width + 2,
      //     y1: y,
      //     x2: x + width + 2,
      //     y2: y + height
      //   },
      //   bottom: {
      //     x1: x,
      //     y1: y + height + 2,
      //     x2: x + width,
      //     y2: y + height + 2
      //   },
      //   left: {
      //     x1: x - 2,
      //     y1: y,
      //     x2: x - 2,
      //     y2: y + height
      //   },
      // }
      // 线的配置
      this.lineShape = this.lineShape || {
        x1: x + width + 2,
        y1: y,
        x2: x + width + 2,
        y2: y + height
      };

      // 显示线
      this.line.attr({
        shape: this.lineShape,
        zlevel: 99
      }).show();

      // 记录操作的group
      this.dragData.group = this;

    })
  }

  lineEvent() {
    this.line.on('mouseover', () => {
      this.line.attr({ cursor: 'col-resize' })
    })

    this.line.on('mousedown', (e) => {
      this.line.attr({
        cursor: 'col-resize',
        zlevel: 99
      })
      // 画布拖拽的起始位置
      this.dragData.pos = [e.event.zrX, e.event.zrY]
      // 画布的拖拽目标
      this.dragData.target = e.target;
      if (e.target === undefined) {
        this.dragData.drag = false
      } else if (e.target.parent && e.target.parent.type === 'group') {
        this.dragData.drag = true;
      }
    })

    // 鼠标抬起，关闭拖拽 将拖拽目标元素设置为空
    this.line.on('mouseup', () => {
      this.dragData.drag = false;
      this.line.hide();
      this.trigger('groupresize', this.rect.getBoundingRect())
      this.line.show();
    })
  }

  zrEvent(opts: ResizeGroupOpts) {
    // 鼠标移动
    opts.zr.on('mousemove', (e) => {
      if (!this.dragData.drag) return;
      let new_pos = [e.event.zrX, e.event.zrY];

      if (this.dragData.target !== null) {
        if (e.event.zrX + 2 >= opts.zr.getWidth()) {
          this.trigger('groupresize', this.rect.getBoundingRect())
          this.dragData.drag = false;
          return;
        }

        if (e.event.zrX - 50 <= opts.x) {
          this.dragData.drag = false;
          this.trigger('groupresize', this.rect.getBoundingRect())
          return;
        }
        let pos = [
          new_pos[0] - this.dragData.pos[0],
          new_pos[1] - this.dragData.pos[1]
        ]
        // 设置目标移动线的位置
        this.dragData.target.position[0] += pos[0]
        this.dragData.target.position[1] += pos[1]

        // 设置范围矩形位置与大小
        this.rectShape.width += pos[0]
        this.rect.attr({
          shape: {
            x: this.rectShape.x,
            y: this.rectShape.y,
            width: this.rectShape.width,
            height: this.rectShape.height
          },
        })
      }
      this.dragData.pos = [e.event.zrX, e.event.zrY]
    })

    // 点击group以外的范围，隐藏拖拽线
    opts.zr.on('click', (e) => {
      let x = e.event.zrX;
      let y = e.event.zrY;
      const group = this.dragData.group || {}
      if (this.id === group.id) {
        if (!this.getBoundingRect().contain(x, y)) {
          this.line.attr({
            zlevel: 0
          }).hide()
          this.dragData.group = null;
          this.dragData.target = null;
        }
      }

    })
  }

  // 更改大小
  resize(params: ResizeGroupOpts): void {
    this.lineShape = {
      x1: params.x + params.width + 2,
      y1: params.y,
      x2: params.x + params.width + 2,
      y2: params.height
    }
    this.rectShape = {
      x: params.x,
      y: params.y,
      width: params.width,
      height: params.height
    }
    this.trigger('groupresize', params)
  }
}

export default ResizeGroup;
