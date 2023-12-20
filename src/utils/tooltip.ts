class Tooltip {
  tooltipGroup: Element;
  constructor() {
    this._createGroup();
  }

  show(e) {
    let { left, top } = this._setPosition(e);
    this.tooltipGroup.style.left = `${left}px`;
    this.tooltipGroup.style.top = `${top}px`;
    this.tooltipGroup.style.visibility = 'visible';
    this.tooltipGroup.style.opacity = 1;
    this._createContent(e.data || {});
  }

  move(e) {
    let { left, top } = this._setPosition(e);
    this.tooltipGroup.style.left = `${left}px`;
    this.tooltipGroup.style.top = `${top}px`;
  }

  hide() {
    this.tooltipGroup.style.visibility = 'hidden';
    this.tooltipGroup.style.opacity = 0;
  }

  /* 
    逻辑待完善
  */
  private _createContent(data) {
    let item = '';
    for (let key in data) {
      item += `
        <div style="display:flex;align-items:center;justify-content: start;font-size:${data[key].style && data[key].style.fontSize || '14px'};min-height: 32px;color: ${data[key].style && data[key].style.fontColor}">
          <span style="width: 8px;height: 8px;border-radius: 50%;background: ${data[key].color};margin-right: 10px;"></span>
          <span style="margin-right: 4px">${data[key].title || key}:</span>
          <span>${data[key].value || data[key]}</span>
        </div>
      `;
    }
    this.tooltipGroup.innerHTML = item;
  }

  // 创建tooltip容器
  private _createGroup() {
    this.tooltipGroup = document.createElement('div');
    const initStyle = {
      position: 'absolute',
      visibility: 'hidden',
      backgroundColor: 'white',
      zIndex: 999999,
      border: '1px solid white',
      borderRadius: '4px',
      left: '0px',
      top: '0px',
      opacity: 0,
      transition: 'opacity left top 0.2s',
      transform: 'translateX(-50%)',
      boxShadow: 'rgba(0, 0, 0, 0.2) 1px 2px 10px',
      padding: '8px'
    };
    for (let key in initStyle) {
      this.tooltipGroup.style[key] = initStyle[key];
    }
    document.body.append(this.tooltipGroup);
  }

  // 计算tooltip坐标
  private _setPosition(e) {
    const parentRight = document.body.getBoundingClientRect().right;
    const parentLeft = document.body.getBoundingClientRect().left;
    const parentTop = document.body.getBoundingClientRect().top;
    const parentBottom = document.body.getBoundingClientRect().bottom;
    // let clientLeft = e.offsetX; // e.offsetX貌似为画布内的距离
    // let clientTop = e.offsetY;
    let clientLeft = e.event.clientX;
    let clientTop = e.event.clientY;
    let left: number = clientLeft - parentLeft;
    let top: number = clientTop - parentTop;
    /*
    鼠标位置小于父元素高度的一半时，tooltip显示在鼠标下方
    鼠标位置大于父元素高度的一半时, tooltip显示在鼠标上方
  */
    if (clientTop < parentBottom / 2) {
      top = top + 20;
    } else {
      top = top - this.tooltipGroup.clientHeight - 10;
    }
    /*
      鼠标位置靠近父元素左边位置100px时，tooltip显示在鼠标右边
      鼠标位置靠近父元素右边位置100px时, tooltip显示在鼠标的左边
    */
    if (clientLeft < parentLeft + 100) {
      left = left + this.tooltipGroup.clientWidth / 2 + 10;
    } else if (clientLeft > parentRight - 100) {
      left = left - this.tooltipGroup.clientWidth / 2 - 10;
    } else {
      left = left;
    }
    return {
      left,
      top
    };
  }

}

export default Tooltip;