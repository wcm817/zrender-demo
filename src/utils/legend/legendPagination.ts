import { Group, Polygon, Rect, Text } from "zrender";
export default class pagination {
  pageControllerStyle = {
    paddingLeft: 5,
    itemWidth: 20,
    itemHeight: 8,
    itemGap: 2
  };
  title;
  data;
  group;
  legendPageGroup;
  preController;
  nextController;
  x0;
  x1;
  y0;
  preIndex = 0;
  nextIndex = 0;
  rowIndex = 0;
  legendCss;
  commonCtx = document.createElement('canvas').getContext('2d');
  cb;
  options;
  legendStore: Object[] = [];
  currentKey = '';
  constructor(options) {
    this.options = options;
    this.title = options.title;
    this.x0 = options.x0;
    this.x1 = options.x1;
    this.y0 = options.y0;
    this.data = options.data;
    this.legendCss = options.legendCss;
    this.nextIndex = options.nextIndex;
    this.rowIndex = options.rowIndex;
    this.cb = options.cb;
    this.commonCtx && (this.commonCtx.font = `${this.legendCss.fontSize} system-ui`);

    this.group = new Group({
      name: 'pagination_' + options.rowIndex
    });
    this.legendPageGroup = new Group({
      name: 'pagination_page_' + this.rowIndex
    });
    let topY = this.y0 + this.legendCss.lineHeight / 2 - this.pageControllerStyle.itemGap / 2;
    this.preController = new Polygon({
      shape: {
        points: [
          [this.x1 - this.pageControllerStyle.itemWidth, topY],
          [this.x1 - this.pageControllerStyle.itemWidth / 2, topY - this.pageControllerStyle.itemHeight],
          [this.x1, topY]
        ]
      },
      style: {
        fill: '#999999'
      }
    });
    this.preController.onclick = () => {
      this.preHandler();
    };
    let bottomY = this.y0 + this.legendCss.lineHeight / 2 + this.pageControllerStyle.itemGap / 2;
    this.nextController = new Polygon({
      shape: {
        points: [
          [this.x1 - this.pageControllerStyle.itemWidth, bottomY],
          [this.x1 - this.pageControllerStyle.itemWidth / 2, bottomY + this.pageControllerStyle.itemHeight],
          [this.x1, bottomY]
        ]
      }
    });
    this.nextController.onclick = () => {
      this.nextHandler();
    };
    this.init();
    document.addEventListener('cancelHighligh_' + this.options.id, (e) => {
      this.currentKey = '';
      this.showHighlight('', '');
    });
    document.addEventListener('blockSelect_' + this.options.id, (e) => {
      let { key, title } = e.detail;
      this.currentKey = key;
      let index = this.data.findIndex(item => item.label === key);
      if (index > -1) { // 整个数据中有这项
        if (index >= this.preIndex && index < this.nextIndex) { // 在当前页有, 高亮当前项；否则，翻页绘制存在当前项的那一页

        } else {
          if (this.nextIndex !== -1 && index >= this.nextIndex) { // 如果当前在后面，往后翻；否则往前翻
            while (this.nextIndex !== -1 && index >= this.nextIndex) {
              this.nextHandler();
            }
          } else {
            while (index < this.preIndex) {
              this.preHandler();
            }
          }
        }
        this.showHighlight(title, key);
      }

    });
  }
  init() {
    this.initPage();
    this.group.add(this.legendPageGroup);
    this.group.add(this.preController);
    this.group.add(this.nextController);
  }
  initPage() {
    this.renderCurrentPage();
  }
  renderCurrentPage() {
    this.legendStore = [];
    this.legendPageGroup.removeAll();
    let x = this.x0;
    let lastIndex = this.nextIndex === -1 ? this.data.length : this.nextIndex;
    for (let i = this.preIndex; i < lastIndex; i++) {
      let catItemGroup = new Group;
      let item = this.data[i];
      let legendItem = new Rect({
        shape: {
          x,
          y: this.y0 + (this.legendCss.lineHeight - this.legendCss.itemHeight) / 2,
          width: this.legendCss.itemWidth,
          height: this.legendCss.itemHeight,
          r: this.legendCss.radius
        },
        style: {
          fill: item.data.color,
          opacity: !this.currentKey || this.currentKey === item.label ? 1 : 0.2 // 翻页不影响高亮
        }
      });
      catItemGroup.add(legendItem);
      // 绘制图例文本
      x += this.legendCss.itemWidth + this.legendCss.innerGap;
      let legendText = new Text({
        x,
        y: this.y0,
        style: {
          fontSize: this.legendCss.fontSize,
          text: item.label
        }
      });
      catItemGroup.add(legendText);
      catItemGroup.onclick = () => {
        this.showHighlight(this.title, item.label);
        this.cb(this.title, item.label); // 和没有分页的图例交互
      };

      // 记录cat legend
      this.legendStore.push({
        legendRect: legendItem,
        label: item.label
      });

      this.legendPageGroup.add(catItemGroup);
      let legendTextEl = this.commonCtx?.measureText(item.label);
      x += (legendTextEl?.width || 0) + this.legendCss.itemGap;
    }
  }
  preHandler() {
    if (this.preIndex === 0) return;
    this.nextIndex = this.preIndex;
    // 找出第一项
    let preIndex = 0;
    let length = 0;
    for (let i = this.nextIndex - 1; i >= 0; i--) { // 上一页的最后一项是本页的第一项减1
      let textEl = this.commonCtx?.measureText(this.data[i].label);
      length = length + (textEl?.width || 0) + this.legendCss.innerGap + this.legendCss.itemWidth;
      if (length > this.x1 - this.x0 - 25) { // 减去翻页控件的宽度
        preIndex = i + 1; // 超出位置，因为是倒序查找，index需要往后退一个
        break;
      }
      length += this.legendCss.itemGap;
    }
    this.preIndex = preIndex;
    this.renderCurrentPage();
    this.nextController.setStyle({
      fill: '#333333'
    });
    if (this.preIndex === 0) {
      this.preController.setStyle({
        fill: '#999999'
      });
    }
  }
  nextHandler() {
    if (this.nextIndex === -1) return;
    this.preIndex = this.nextIndex;
    let index = -1;
    let length = 0;

    for (let i = this.nextIndex; i < this.data.length; i++) {
      let textEl = this.commonCtx?.measureText(this.data[i].label);
      length += (textEl?.width || 0) + this.legendCss.innerGap + this.legendCss.itemWidth;
      if (length > this.x1 - this.x0 - 25) { // 减去翻页控件的宽度
        index = i;
        break;
      }
      length += this.legendCss.itemGap;
    }
    this.nextIndex = index;
    this.renderCurrentPage();
    this.preController.setStyle({
      fill: '#333333'
    });
    if (this.nextIndex === -1) {
      this.nextController.setStyle({
        fill: '#999999'
      });
    }
  }
  showHighlight(title, label) {
    this.legendStore.forEach(legend => {
      if (!label || legend.label === label) {
        legend.legendRect.setStyle({
          opacity: 1
        });
      } else {
        legend.legendRect.setStyle({
          opacity: 0.2
        });
      }
    });
  }
}