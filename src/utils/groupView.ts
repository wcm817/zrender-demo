import * as zrender from 'zrender';
/* 
 * 创建一个滚动区域类GroupView,
 * 当maxWidth大于viewWidth时出现横向滚动条
 * 当maxHeight大于viewHeight时出现纵向滚动条
*/
class GroupView extends zrender.Group {
  private startObj: Object = {
    x: 0,
    y: 0,
    isBar: false // 是否是拖动滚动条
  };
  private opt: Object = {
    zr: zrender,
    left: 0,
    top: 0,
    viewWidth: 0,
    viewHeight: 0,
    maxWidth: 0,
    maxHeight: 0
  };
  private groupCenter: zrender.Group = new zrender.Group; // 显示区域
  private groupContent: zrender.Group = new zrender.Group; // 内容区域
  private horBar: zrender.Rect = new zrender.Rect; // 横向滚动条对象
  private verBar: zrender.Rect = new zrender.Rect; // 纵向滚动条对象
  private barHeight: number = 12; // 滚动条高度
  private horWidth: number = 100; // 横向滚动条宽度
  private verHeight: number = 100; // 纵向滚动条长度
  private hasVerScroll: Boolean = false; // 是否有纵向滚动
  private hasHorScroll: Boolean = false; // 是否有横向滚动
  // private eventHander: Function | undefined; // 滚动事件
  /* 
    * @param {Object} opt 参数描述
    * @param {zrender} opt.zr zrender实例化对象
    * @param {number} opt.left 创建区域左侧X坐标
    * @param {number} opt.top 创建区域顶部Y坐标
    * @param {number} opt.viewWidth 可视区域宽度
    * @param {number} opt.viewHeight 可视区域高度
    * @param {number} opt.maxWidth 可选参数，创建区域最大宽度
    * @param {number} opt.maxHeight 可选参数，创建区域最大高度
  */
  constructor(opt: any) {
    super();
    this.opt = opt;
    this.hasHorScroll = false;
    this.hasVerScroll = false;
    // 创建容器
    this._createGroup();
    if (opt.maxWidth > opt.viewWidth) {
      this.hasHorScroll = true;
      // 创建横向滚动条
      this._createHorBar();
      // 创建滚动事件
      this._createScroll();
    }
    if (opt.maxHeight > opt.viewHeight) {
      this.hasVerScroll = true;
      // 创建纵向滚动条
      this._createVerBar();
      // 创建滚动事件
      this._createScroll();

    }
    this.opt.zr.add(this.groupCenter);
  }

  addView(target: zrender.Element<zrender.ElementProps>) {
    this.groupContent.add(target);
  }

  // 创建容器
  private _createGroup() {
    const contentRect = new zrender.Rect({
      shape: {
        x: this.opt.left,
        y: this.opt.top,
        width: this.opt.viewWidth,
        height: this.opt.viewHeight
      }
    });
    // 裁剪显示区域
    this.groupCenter.setClipPath(contentRect);
    this.groupCenter.add(this.groupContent);
  }

  private _createHorBar() {
    const barHeight = this.barHeight;
    this.horWidth = (this.opt.viewWidth / this.opt.maxWidth) * this.opt.viewWidth;
    const horBarBg = new zrender.Rect({
      shape: {
        x: this.opt.left,
        y: this.opt.viewHeight - barHeight,
        width: this.opt.viewWidth,
        height: barHeight
      },
      style: {
        fill: '#e0e0e0',
        stroke: '#e0e0e0'
      }
    });
    this.horBar = new zrender.Rect({
      shape: {
        x: this.opt.left,
        y: this.opt.viewHeight - barHeight,
        r: 20,
        width: this.horWidth,
        height: barHeight
      },
      style: {
        fill: 'white',
        stroke: 'white'
      },
      z: 1
    });
    this.groupCenter.add(this.horBar);
    this.horBar.on('mousedown', (e: { offsetX: number; offsetY: number; }) => {
      this.startObj.x = e.offsetX;
      this.startObj.y = e.offsetY;
      setTimeout(() => {
        this.startObj.isBar = true;
      });
    }, false);
    this.groupCenter.add(horBarBg);
  }

  private _createVerBar() {
    const barHeight = this.barHeight;
    this.verHeight = (this.opt.viewHeight / this.opt.maxHeight) * this.opt.viewHeight;
    const verBarBg = new zrender.Rect({
      shape: {
        x: this.opt.left + this.opt.viewWidth - barHeight,
        y: 0,
        width: barHeight,
        height: this.opt.viewHeight
      },
      style: {
        fill: '#e0e0e0',
        stroke: '#e0e0e0'
      }
    });
    this.groupCenter.add(verBarBg);
    this.verBar = new zrender.Rect({
      shape: {
        x: this.opt.left + this.opt.viewWidth - 12,
        y: 0,
        r: 20,
        width: barHeight,
        height: this.verHeight
      },
      style: {
        fill: 'white',
        stroke: 'white'
      },
      z: 1
    });
    this.groupCenter.add(this.verBar);
    this.verBar.on('mousedown', (e: { offsetX: number; offsetY: number; }) => {
      this.startObj.x = e.offsetX;
      this.startObj.y = e.offsetY;
      setTimeout(() => {
        this.startObj.isBar = true;
      });
    }, false);
  }

  private _createScroll() {
    this.opt.zr.on('mousedown', (e: { offsetX: number; offsetY: number; }) => {
      this.startObj.x = e.offsetX;
      this.startObj.y = e.offsetY;
      this.startObj.isBar = false;
      document.addEventListener('mousemove', eventHander, false);
    });
    this.opt.zr.on('mouseup', () => {
      document.removeEventListener('mousemove', eventHander, false);
    });
    document.addEventListener('mousewheel', (e) => {
      const moveX = e.deltaX;
      const moveY = e.deltaY;
      this._scrollGroup(-moveX, moveY);
    }, false);
    const eventHander = (e: { offsetX: number; offsetY: number; }) => {
      const moveX = e.offsetX - this.startObj.x;
      const moveY = e.offsetY - this.startObj.y;
      this._scrollGroup(moveX, moveY);
      this.startObj.y = e.offsetY;
      this.startObj.x = e.offsetX;
    };
  }

  private _scrollGroup(moveX: number, moveY: number) {
    let isVertical = true;
    if (Math.abs(moveX) > Math.abs(moveY)) isVertical = false;
    const pos0 = this.groupContent.position[0];
    const pos1 = this.groupContent.position[1];
    if (isVertical) {
      if (!this.hasVerScroll) return;
      if (this.startObj.isBar) {
        this._moveContentY(-moveY, pos0, pos1);
        this._moveBarY(moveY);
      } else {
        this._moveContentY(moveY, pos0, pos1);
        this._moveBarY(-moveY);
      }
    } else {
      if (!this.hasHorScroll) return;
      if (this.startObj.isBar) {
        this._moveContentX(-moveX, pos0, pos1);
        this._moveBarX(moveX);
      } else {
        this._moveContentX(moveX, pos0, pos1);
        this._moveBarX(-moveX);
      }
    }
  };

  private _moveContentY(moveY: number, pos0: number, pos1: number) {
    let posY = pos1 + moveY;
    if (this.startObj.isBar) {
      posY = pos1 + moveY * this.opt.maxHeight / this.opt.viewHeight;
    }
    if (moveY < 0) {
      const bottomY = -this.opt.maxHeight + this.opt.viewHeight + this.opt.top;
      posY = Math.max(posY, bottomY);
    } else {
      posY = Math.min(posY, 0);
    }
    let moveEvent = new CustomEvent('moveY', { 'detail': { moveY, posY } });
    document.dispatchEvent(moveEvent);
    this.groupContent.attr('position', [pos0, posY]);
  }

  private _moveBarY(moveY: number) {
    if (!this.verBar) return;
    let posY = this.verBar.position[1] + moveY;
    if (moveY < 0) {
      posY = Math.max(posY, 0);
    } else {
      const rightY = this.opt.viewHeight - this.verHeight;
      posY = Math.min(posY, rightY);
    }
    this.verBar.position[1] = posY;
  }

  private _moveContentX(moveX: number, pos0: number, pos1: number) {
    let posX = pos0 + moveX;
    if (this.startObj.isBar) {
      posX = pos0 + moveX * this.opt.maxWidth / this.opt.viewWidth;
    }
    if (moveX < 0) {
      const rightX = -this.opt.maxWidth + this.opt.viewWidth;
      posX = Math.max(posX, rightX);
    } else {
      posX = Math.min(posX, 0);
    }
    this.groupContent.attr('position', [posX, pos1]);
  }

  private _moveBarX(moveX: number) {
    if (!this.horBar) return;
    let posX = this.horBar.position[0] + moveX;
    if (!this.startObj.isBar) {
      posX = this.horBar.position[0] + moveX * this.opt.viewWidth / this.opt.maxWidth;
    }
    if (moveX < 0) {
      posX = Math.max(posX, 0);
    } else {
      const rightX = this.opt.viewWidth - this.horWidth;
      posX = Math.min(posX, rightX);
    }
    this.horBar.position[0] = posX;
  }
}

export default GroupView;