import {
  PivotSheet,
  CornerCell,
  RowCell,
  ColCell,
  DataCell,
  renderRect,
  Node,
  SpreadSheet,
  S2Event,
  // renderLine,
  // CellBorderPosition,
  // getBorderPositionAndStyle
} from "@antv/s2";
import { Group } from '@antv/g-canvas';
import * as d3 from 'd3';
import { dataProcess } from '../../utils/utils';

export interface Options {
  config: Record<string, any>// 漏斗样式配置信息
  data: Record<string, any> // 漏斗图数据
}
/**
 * 自定义角头单元格
 */
class CustomCornerCell extends CornerCell {

  getTextStyle() {
    const headConfig = this.headerConfig;
    const field = this.meta.field;
    const arr = ['$$extra$$', ...headConfig.columns];
    const defaultTextStyle = super.getTextStyle();
    return {
      ...defaultTextStyle,
      fill: arr.includes(field) ? 'transparent' : defaultTextStyle.fill
    }
  }
}

/**
 * 自定义整个角头, 添加文字和背景色
 */
class CustomCornerHeader extends Group {
  node;
  headConfig;

  constructor(node, s2, headConfig) {
    super({});
    this.node = node;
    this.headConfig = headConfig;
    this.initCornerHeader();
  }
  initCornerHeader() {
    const { width, height, rows, tableSetting, tableTitleStyle } = this.headConfig;
    let shapeArr: Array<any> = [];
    const leftTopLine = this.addShape('polyline', {
      attrs: {
        points: [
          [0, height],
          [0, 0],
          [width, 0]
        ],
        stroke: tableSetting.inner.color,
        lineWidth: tableSetting.inner.width
      }
    });
    shapeArr.push(leftTopLine);

    for (let i = 0; i < rows.length - 1; i++) {
      if (rows[i] === '$$extra$$') continue;
      const stepWidth = width / rows.length;
      let line = this.addShape('line', {
        attrs: {
          x1: (i + 1) * stepWidth,
          y1: 0,
          x2: (i + 1) * stepWidth,
          y2: height,
          stroke: tableSetting.inner.color,
          lineWidth: tableSetting.outter.width,
        }
      });
      const text = this.addShape('text', {
        attrs: {
          x: i * (stepWidth) + 10,
          y: height - (20 / 2),
          text: rows[i],
          fontSize: tableTitleStyle['font-size'] || '12',
          fill: tableTitleStyle.fill || '#6b6b6b',
          fontWeight: '600'
        },
      });
      shapeArr.push(line);
      shapeArr.push(text);
    }

    shapeArr.forEach((item: any) => this.node.add(item));
  }

}

// 行头
class CustomRowCell extends RowCell {
  // 覆盖背景绘制，可覆盖或者增加绘制方法
  drawBackgroundShape() {
    const { rowIndex } = this.meta;
    this.backgroundShape = renderRect(this, {
      ...this.getCellArea(),
      fill: rowIndex % 2 === 0 ? 'rgba(219, 235, 255, 0.3)' : 'transparent',
    });
  }

  getTextStyle() {
    const defaultTextStyle = super.getTextStyle();
    // const textStyle = this.meta.labelsListKeyMap[key].text;
    return {
      ...defaultTextStyle,
      // fontSize: textStyle.fontSize,
      // fill: this.meta.data.linearColor || textStyle.fontColor,
      // textAlign: textStyle.align,
    }
  }

}

// 数据单元格
class CustomDataCell extends DataCell {
  constructor(meta, spreadsheet, labelsListKeyMap: Record<string, any>) {
    super({ ...meta, labelsListKeyMap }, spreadsheet);
  }

  getTextStyle() {
    const defaultTextStyle = super.getTextStyle();
    const key = this.meta.valueField;
    // const textStyle = this.meta.labelsListKeyMap[key].text;
    return {
      ...defaultTextStyle,
      // fontSize: textStyle.fontSize,
      // fill: this.meta.data.linearColor || textStyle.fontColor,
      // textAlign: textStyle.align,
    }
  }
}


export default class Table {
  data: Array<Record<string, any>>; // 画布数据
  width: number; // 画布宽
  height: number; // 画布高
  id: string; // id
  size: number; // 图表大小 0 ~ 100
  features: Record<string, any>; // 分类信息
  labelsList: Array<Record<string, any>>; // 标签列表
  labelsListKeyMap: Record<string, any>; // 标签列表转对象格式 {[key]: key所在项}
  colorList: Array<Record<string, any>>; // 颜色列表
  tableSetting: Record<string, any>;
  tableTitleData: Record<string, any>;
  dom: HTMLElement;
  s2!: PivotSheet;
  s2Options!: Record<string, any>;
  s2DataConfig!: Record<string, any>;

  constructor(opts: Options) {
    const { data, config } = opts;
    this.data = data.features_data;
    this.id = config.id;
    this.dom = document.getElementById(this.id) || new HTMLElement();
    this.width = this.dom?.offsetWidth || 680;
    this.height = this.dom?.offsetHeight || 300;
    this.size = config.size || 50;
    this.features = config.features;
    this.labelsList = config.css.labelsList;
    this.labelsListKeyMap = this.labelsList.reduce((pre: any, item: any) => ({
      ...pre,
      [item.key]: item
    }), {});
    this.colorList = config.css.colorList;
    this.tableSetting = config.css.tableSetting;
    this.tableTitleData = config.css.tableTitleData;

    this.setS2Options();
    this.setDataConfig();
  }

  render() {
    this.s2 = new PivotSheet(this.dom, this.s2DataConfig, this.s2Options);
    this.setBaseStyle();
    this.s2.render();
    // 设置表格外框（需渲染完后才可调用）
    // this.setTableLayout();
    this.s2.on(S2Event.LAYOUT_RESIZE, () => {
      // this.setTableLayout();
    })
  }

  // 设置表格外框
  setTableLayout() {
    const cornerWidth = this.s2.facet.cornerBBox.width;
    const cornerHeight = this.s2.facet.cornerBBox.height;
    const width = cornerWidth + this.s2.facet.getRealWidth();
    const height = (cornerHeight + this.s2.facet.getRealHeight()) > this.height ? this.height : cornerHeight + this.s2.facet.getRealHeight();
    const polyline = {
      attrs: {
        points: [
          [1, 1],
          [width, 0],
          [width, height],
          [1, height],
          [1, 1]
        ],
        stroke: this.tableSetting.outter.color,
        lineWidth: this.tableSetting.outter.width,
      }
    };
    this.s2.container.addShape('polyline', polyline);
  }


  // 基础样式设置
  setBaseStyle() {
    // this.dom.style.border = `${this.tableSetting.outter.width}px solid ${this.tableSetting.outter.color}`;
    const borderSetting = {
      horizontalBorderColor: this.tableSetting.inner.color,
      verticalBorderColor: this.tableSetting.inner.color,
    }

    const style = this.tableTitleData[0].style;
    const tableTitleStyle = {
      fill: style.fill,
      fontSize: style['font-size'],
      textAlign: style['text-align']
    };

    this.s2.setTheme({
      background: {
        color: 'transparent'
      },
      cornerCell: { // 角头
        cell: {
          backgroundColor: 'transparent',
          // ...borderSetting
        },
        bolderText: tableTitleStyle
      },
      rowCell: { // 行头
        cell: {
          ...borderSetting
        },
        bolderText: { ...tableTitleStyle, fontWeight: 400 },
        measureText: tableTitleStyle,
      },
      colCell: { // 列头
        cell: {
          backgroundColor: 'transparent',
          // ...borderSetting,
        },
        text: { ...tableTitleStyle, fontWeight: 600 },
        bolderText: tableTitleStyle
      },
      dataCell: { // 数据单元格
        cell: {
          backgroundColor: 'transparent',
          crossBackgroundColor: 'rgba(219, 235, 255, 0.3)',
          ...borderSetting
        },
        text: {
          textAlign: this.tableSetting.align,
        }
      },
      splitLine: {
        ...borderSetting,
      }
    });
  }

  setS2Options() {
    console.log(this.tableSetting.cell.width)
    const cellWidth = Number(this.tableSetting.cell.width) || 100;
    this.s2Options = {
      width: this.width,
      height: this.height,
      interaction: {
        // resize: false, // 是否开始拖拽热效应
      },
      // 自定义角头单元格
      cornerCell: (node, s2, headConfig) => {
        const corner = new CustomCornerCell(node, s2, headConfig);
        return corner;
      },
      // 自定义角头
      // cornerHeader: (node, s2, headConfig) => {
      //   return new CustomCornerHeader(node, s2, {
      //     ...headConfig,
      //     tableTitleStyle: this.tableTitleData[0]?.style || {},
      //     tableSetting: this.tableSetting
      //   });
      // },
      // 自定义行头
      rowCell: (node: Node, s2: SpreadSheet) => {
        const row = new CustomRowCell(node, s2);
        return row;
      },
      // 自定义数据单元格
      dataCell: (viewMeta: any) => {
        // 渐变色
        return new CustomDataCell(viewMeta, viewMeta?.spreadsheet, this.labelsListKeyMap);
      },
      style: {
        layoutWidthType: 'compact',
        cellCfg: {
          width: cellWidth
        },
        rowCfg: {
          width: cellWidth
        },
        colCfg: {
          width: cellWidth
        }
      },
    };
  }

  setDataConfig() {
    // 获取渐变色计算函数 compute
    // const colorFeatures = this.features.color;
    // const colorKey = colorFeatures.dtype === 'AGGR' ? `${colorFeatures.legend.toLocaleLowerCase()}(${colorFeatures.name})` : colorFeatures.name;
    const coloredType = this.colorList[0]?.colored_type;
    const cList = this.colorList[0]?.list;
    let compute: any = null;
    let linear: any = null;
    if (coloredType === 'linear') {
      const rg = /rgb\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*\)$/;
      const minObj = cList.find((cItem: any) => cItem.rangeType === 'min');
      const minColorMatch = rg.exec(minObj.color) || [];
      const maxObj = cList.find((cItem: any) => cItem.rangeType === 'max');
      const maxColorMatch = rg.exec(maxObj.color) || [];

      const min = d3.rgb(minColorMatch[1], minColorMatch[2], minColorMatch[3]);
      const max = d3.rgb(maxColorMatch[1], maxColorMatch[2], maxColorMatch[3]);
      compute = d3.interpolate(min, max);
      linear = d3.scaleLinear()
        .domain([minObj.originValue, maxObj.originValue])
        .range([0, 1]);
    }

    // 配置数据 
    let newData: Array<any> = [];
    let rowNames: Array<any> = [];
    let colNames: Array<any> = [];
    let valuesNames: Array<any> = [];
    let valueInCols: boolean = false;

    let { col, row } = this.features;
    const flag = row.some((item: any) => item.dtype === 'AGGR');
    if (flag) {
      valueInCols = false;
      // 列项
      colNames = col.map((item: any) => item.name);

      // 行项
      const catRow = row.filter((item: any) => item.dtype === 'CAT');
      rowNames = catRow.map((aItem: any) => aItem.name);

      // 数据项
      const aggrRow = row.filter((item: any) => item.dtype === 'AGGR');
      valuesNames = aggrRow.map((item: any) => `${item.legend.toLocaleLowerCase()}(${item.name})`);

    } else {
      valueInCols = true;
      // 行项
      rowNames = row.map((item: any) => item.name);

      // 列项
      const catCol = col.filter((item: any) => item.dtype === 'CAT');
      colNames = catCol.map((aItem: any) => aItem.name);

      // 数据项
      const aggrCol = col.filter((item: any) => item.dtype === 'AGGR');
      valuesNames = aggrCol.map((item: any) => `${item.legend.toLocaleLowerCase()}(${item.name})`);

    }
    // 数据改造
    newData = this.data.map((item: any) => ({
      ...item,
      ...(colNames.length ? { allColCats: colNames.join('/') } : {})
    }));
    colNames = colNames.length ? ['allColCats', ...colNames] : colNames;

    // console.log('rowNames:::', rowNames);
    // console.log('colNames:::', colNames);
    // console.log("newData:::", newData);

    this.s2DataConfig = {
      fields: {
        columns: colNames,
        rows: rowNames,
        values: valuesNames,
        valueInCols,
      },
      data: newData
    }

  }
}

