import * as zrender from 'zrender';
import Pagination from './legendPagination';
import GroupView from './../groupView';

export default class legend {
  legendCss = {}; // 图例样式
  private aggrLegends: legendListBase<'AGGR'>[] = []; // 数值类型图例数据
  private catLegends: legendListBase<'CAT'>[] = []; // 分类类型图例数据
  private legendGroup = new zrender.Group;
  private x: number = 0; // 记录图例绘制的x值
  private y: number = 0; // 记录图例绘制的y值
  private position: legendPosition = 'UP'; // 图例位置

  private offsetY: number = 14; // 图例每行间距

  private titleEls: Object[] = []; // 记录图例分组的y值和标题信息
  private titleGroups: zrender.Group[] = [];
  private calcX: number = 0; // 左右位置时，记录图例占用位置的x值
  private scrollView: GroupView | null = null;
  private paginations = [];

  options = {};
  commonCtx = document.createElement('canvas').getContext('2d');
  // 画布的绘制范围
  x0: number;
  x1: number;
  y0: number;
  y1: number;

  // 图表的绘制范围
  chartX0: number = 0;
  chartX1: number = 0;
  chartY0: number = 0;
  chartY1: number = 0;
  zrInstance: zrender.ZRenderType;

  legendStore: {
    [propName: string]: []
  } = {};

  constructor(options: legendOptions) {
    this.options = options;
    this.legendCss = options.legendCss || {};
    this.position = options.position;
    this.commonCtx && (this.commonCtx.font = `${this.legendCss?.fontSize || '14px'} system-ui`);

    this.x0 = options.x0;
    this.x1 = options.x1;
    this.y0 = options.y0;
    this.y1 = options.y1;

    this.chartX0 = this.x0;
    this.chartX1 = this.x1;
    this.chartY0 = this.y0;
    this.chartY1 = this.y1;

    this.zrInstance = options.zrInstance;

    this.offsetY = (this.legendCss.lineHeight || 14) + (this.legendCss.padding && Array.isArray(this.legendCss.padding) ? this.legendCss.padding[0] : this.legendCss.padding || 0);
    this.dataHandler(options.data);
    this.render();

    document.addEventListener('blockSelect_' + this.options.id, (e) => {
      let { key, title } = e.detail;
      this.showHighlight(title, key);
    });

    document.addEventListener('cancelHighligh_' + this.options.id, (e) => {
      let { title } = e.detail;
      this.showHighlight(title, '');
    });
  }

  dataHandler(data) {
    data.forEach(item => {
      if (item.type === 'AGGR') {
        this.aggrLegends.push(item);
      } else {
        item.listProcessed = Object.keys(item.list).map(key => {
          return { label: key, data: item.list[key] };
        });
        this.catLegends.push(item);
      }
    });
    this.catLegends.sort((a, b): number => Object.keys(a.list).length - Object.keys(b.list).length);
  }
  render() {
    this.scrollView?.remove();
    this.legendGroup.removeAll();
    this.zrInstance.remove(this.legendGroup);
    this.legendStore = {};

    this.titleEls = [];
    this.x = this.x0;
    this.y = this.y0;
    switch (this.position) {
      case 'UP':
        this.renderHorizontal();
        this.chartY0 = this.y;
        break;
      case 'DOWN':
        this.renderHorizontal();
        this.x = this.x0;
        this.y = this.y1 - this.y;
        this.chartY1 = this.y;
        this.legendGroup.removeAll();
        this.legendStore = {};
        this.renderHorizontal();
        break;
      case 'LEFT':
        this.renderVertical();
        this.chartX0 = this.calcX + 25; // todo 还要加上滚动条的位置
        break;
      case 'RIGHT':
        this.renderVertical();
        this.x = this.x1 - this.calcX;
        this.chartX1 = this.x;
        this.y = this.y0;
        this.legendGroup.removeAll();
        this.legendStore = {};
        this.renderVertical();
    }
  }
  rerender(p) {
    if (this.position === p) return;
    this.position = p;
    this.render();
  }
  renderVertical() {
    this.titleGroups.forEach(group => {
      this.zrInstance.remove(group);
    });
    this.titleGroups = [];
    this.scrollView?.remove();
    this.renderAggrVertical();
    this.renderCatVertical();
    this.scrollView = new GroupView({
      zr: this.zrInstance,
      left: this.x0,
      top: this.y0,
      viewWidth: this.position === 'LEFT' ? this.calcX : this.x1,
      viewHeight: this.y1 - this.y0,
      maxWidth: this.position === 'LEFT' ? this.calcX : this.x1,
      maxHeight: this.y
    });
    this.scrollView.addView(this.legendGroup);

    this.titleEls.forEach(item => {
      let group = new zrender.Group;
      let back = new zrender.Rect({
        shape: {
          x: this.x,
          y: item.y0,
          width: this.position === 'LEFT' ? this.calcX - this.x : this.calcX,
          height: this.legendCss.lineHeight
        },
        style: {
          fill: this.options.bgColor || 'rgba(255, 255, 255, 1)' // TODO
        },
        zlevel: 2
      });
      let text = new zrender.Text({
        x: this.x,
        y: item.y0,
        style: {
          fontSize: this.legendCss.fontSize,
          text: item.text
        },
        zlevel: 2
      });
      group.add(back);
      group.add(text);
      this.zrInstance.add(group);
      this.titleGroups.push(group);
    });

    document.addEventListener('moveY', (e) => {
      let y = e.detail;
      for (let i = 0; i < this.titleEls.length; i++) {
        let item = this.titleEls[i];
        if (item.y0 < Math.abs(y.posY) + this.y0 && item.y1 > Math.abs(y.posY) + this.y0) {
          this.titleGroups[i].attr('position', [0, -item.y0 + this.y0]);
        } else {
          this.titleGroups[i].attr('position', [0, y.posY]);
        }
      }
    });
  }
  renderAggrVertical() {
    this.aggrLegends.forEach(item => {
      let text = this.commonCtx?.measureText(item.title);
      let legendTitle = new zrender.Text({
        x: this.x,
        y: this.y,
        style: {
          fontSize: this.legendCss.fontSize,
          text: item.title
        }
      });

      let rectY = this.y; // 记录一个大类的y值，用于滚动时计算置顶标题
      this.legendGroup.add(legendTitle);
      this.calcX = Math.max(this.x0 + (text?.width || 0), this.calcX);
      this.y += this.legendCss.lineHeight;

      let barColor = new zrender.LinearGradient(0, 0, 1, 1, [{
        offset: 0,
        color: item.list[0].color || ''
      }, {
        offset: 1,
        color: item.list[1].color || ''
      }]);
      let legendItem = new zrender.Rect({
        shape: {
          x: this.x + this.legendCss.innerGap,
          y: this.y + (this.legendCss.lineHeight - this.legendCss.barHeight) / 2,
          width: this.legendCss.barWidth,
          height: this.legendCss.barHeight,
          r: this.legendCss.barRadius
        },
        style: {
          fill: barColor
        }
      });
      this.legendGroup.add(legendItem);
      this.y += this.offsetY;
      this.calcX = Math.max(this.x0 + this.legendCss.innerGap + this.legendCss.barWidth, this.calcX);

      this.titleEls.push({
        y0: rectY,
        y1: this.y,
        text: item.title
      });
    });
  }
  renderCatVertical() {
    this.catLegends.forEach((item, index) => {
      let titleEl = this.commonCtx?.measureText(item.title);
      let rectY = this.y;
      // 记录
      this.legendStore[item.title] = [];
      let legendTitle = new zrender.Text({
        x: this.x,
        y: this.y,
        style: {
          fontSize: this.legendCss.titleStyle.fontSize,
          text: item.title
        }
      });
      this.legendGroup.add(legendTitle);
      this.y += this.legendCss.lineHeight + this.legendCss.verticalGap;
      this.calcX = Math.max(this.x0 + (titleEl?.width || 0), this.calcX);

      item.listProcessed.forEach(legend => {
        let catItemGroup = new zrender.Group;
        let legendItem = new zrender.Rect({
          shape: {
            x: this.x,
            y: this.y + (this.legendCss.lineHeight - this.legendCss.itemHeight) / 2,
            width: this.legendCss.itemWidth,
            height: this.legendCss.itemHeight,
            r: this.legendCss.radius
          },
          style: {
            fill: legend.data.color
          }
        });
        catItemGroup.add(legendItem);

        // 记录cat legend
        this.legendStore[item.title].push({
          legendRect: legendItem,
          label: legend.label
        });

        let textEl = this.commonCtx?.measureText(legend.label);
        let legendText = new zrender.Text({
          x: this.x + this.legendCss.itemWidth + this.legendCss.innerGap,
          y: this.y,
          style: {
            fontSize: this.legendCss.fontSize,
            text: legend.label
          }
        });
        catItemGroup.add(legendText);
        catItemGroup.onclick = (e) => {
          this.dispatchEvent(item.title, legend.label);
        };
        this.legendGroup.add(catItemGroup);
        this.y += this.legendCss.itemHeight + this.legendCss.verticalGap;
        this.calcX = Math.max(this.calcX, this.x0 + this.legendCss.itemWidth + this.legendCss.innerGap + (textEl?.width || 0));
      });

      this.titleEls.push({
        y0: rectY,
        y1: this.y,
        text: item.title
      });
    });
  }
  renderHorizontal() {
    this.renderAggrHorizontal();
    this.renderCatHorizontal();
    this.zrInstance.add(this.legendGroup);
  }
  renderAggrHorizontal() {
    // 绘制数值类型图例
    let aggrGroup = new zrender.Group;
    this.aggrLegends.forEach(item => {
      let text = this.commonCtx?.measureText(item.title);
      if (this.x1 - this.x < (text?.width || 0) + this.legendCss.innerGap + this.legendCss.barWidth) { // 换行
        this.y = this.y + this.offsetY;
        this.x = this.x0;
      }
      let legendTitle = new zrender.Text({
        x: this.x,
        y: this.y,
        style: {
          fontSize: this.legendCss.fontSize,
          text: item.title
        }
      });
      aggrGroup.add(legendTitle);

      this.x += (text?.width || 0) + this.legendCss.innerGap;

      let barColor = new zrender.LinearGradient(0, 0, 1, 1, [{
        offset: 0,
        color: item.list[0].color || ''
      }, {
        offset: 1,
        color: item.list[1].color || ''
      }]);
      let legendItem = new zrender.Rect({
        shape: {
          x: this.x,
          y: this.y + (this.legendCss.lineHeight - this.legendCss.barHeight) / 2,
          width: this.legendCss.barWidth,
          height: this.legendCss.barHeight,
          r: this.legendCss.barRadius
        },
        style: {
          fill: barColor
        }
      });
      aggrGroup.add(legendItem);

      this.x += this.legendCss.barWidth + this.legendCss.itemGap;

      this.legendGroup.add(aggrGroup);
    });
    this.y += this.offsetY;
  }
  renderCatHorizontal() {
    this.x = this.x0;
    let catGroup = new zrender.Group;

    this.catLegends.forEach((item, index) => {
      let pageIndex = this.noPagination(item);
      let rowGroup = this.renderCatRow(item, index, pageIndex);
      catGroup.add(rowGroup);
    });
    if (this.catLegends.length) this.y += this.offsetY;
    this.legendGroup.add(catGroup);
  }
  renderCatRow(item, rowIndex: number, pageIndex: number) {
    let rowGroup = new zrender.Group;
    let titleEl = this.commonCtx?.measureText(item.title);
    let legendTitle = new zrender.Text({
      x: this.x,
      y: this.y,
      style: {
        fontSize: this.legendCss.titleStyle.fontSize,
        text: item.title
      }
    });
    rowGroup.add(legendTitle);

    // 记录
    this.legendStore[item.title] = [];

    this.x += (titleEl?.width || 0) + this.legendCss.titlePadding;
    if (pageIndex === -1) {
      rowGroup.add(this.renderCatLegend(item.title, item.listProcessed));
    } else {
      let pagination = new Pagination({
        x0: this.x,
        x1: this.x1,
        y0: this.y,
        title: item.title,
        data: item.listProcessed,
        legendCss: this.legendCss,
        nextIndex: pageIndex,
        rowIndex: rowIndex,
        id: this.options.id,
        cb: this.dispatchEvent.bind(this)
        // cb: this.dispatchEvent
      });
      this.paginations.push(pagination);
      rowGroup.add(pagination.group);
    }
    return rowGroup;
  }

  getRect(x, y, width, height, barColor) {
    let rect = new zrender.Rect({
      shape: {
        x,
        y,
        width,
        height,
        r: this.legendCss.barRadius
      },
      style: {
        fill: barColor
      }
    });
    return rect;
  }

  renderCatLegend(title, list) {
    let legendGroup = new zrender.Group;
    list.forEach(legend => {
      let catItemGroup = new zrender.Group;
      let legendItem = new zrender.Rect({
        shape: {
          x: this.x,
          y: this.y + (this.legendCss.lineHeight - this.legendCss.itemHeight) / 2,
          width: this.legendCss.itemWidth,
          height: this.legendCss.itemHeight,
          r: this.legendCss.radius
        },
        style: {
          fill: legend.data.color
        }
      });

      catItemGroup.add(legendItem);
      this.x += this.legendCss.itemWidth + this.legendCss.innerGap;

      let textEl = this.commonCtx?.measureText(legend.label);
      let legendText = new zrender.Text({
        x: this.x,
        y: this.y,
        style: {
          fontSize: this.legendCss.fontSize,
          text: legend.label
        }
      });

      this.legendStore[title].push({
        legendRect: legendItem,
        label: legend.label
      });
      catItemGroup.add(legendText);
      catItemGroup.onclick = () => {
        this.dispatchEvent(title, legend.label);
      };
      this.x += (textEl?.width || 0) + this.legendCss.itemGap;
      legendGroup.add(catItemGroup);
    });
    return legendGroup;
  }
  dispatchEvent(title, key) {
    this.paginations.forEach(p => {
      p.showHighlight(title, key);
    });
    this.showHighlight(title, key);
    let moveEvent = new CustomEvent('legendSelect_' + this.options.id, { 'detail': { key, title } });
    document.dispatchEvent(moveEvent);
  }
  noPagination(item) {
    let titleEl = this.commonCtx?.measureText(item.title);
    let length = titleEl?.width || 0 + this.legendCss.titlePadding;

    let space = this.x1 - this.x; // 一页的长度, 包含分页控件的宽度，如果刚好满一页，不需要计算分页控件的宽度
    for (let i = 0; i < item.listProcessed.length; i++) {
      let textEl = this.commonCtx?.measureText(item.listProcessed[i].label);
      length += (textEl?.width || 0) + this.legendCss.innerGap + this.legendCss.itemWidth;
      if (length >= space) {
        if (this.x === this.x0) { // 如果是从最左边绘制的，直接返回截止的index
          if (space < 25) { // 如果计算一页的位置超出分页控件的位置，则回退一项
            return i - 1;
          }
          return i;
        } else { // 如果是从中间开始绘制，则换行重新绘制计算
          space = this.x1 - this.x0;
          this.x = this.x0;
          this.y += this.offsetY;
        }
      }
      length += this.legendCss.itemGap;
    }
    return -1;
  }
  showHighlight(title, label) {
    Object.keys(this.legendStore).forEach(t => {
      this.legendStore[t].forEach(legend => {
        if (!label || (legend.label === label && title === t)) {
          legend.legendRect.setStyle({
            opacity: 1
          });
        } else {
          legend.legendRect.setStyle({
            opacity: 0.2
          });
        }
      });
    });
  }
}