import {
  PivotSheet,
  Node,
  SpreadSheet,
} from "@antv/s2";
import {
  CustomCornerCell,
  CustomRowCell,
  CustomColCell,
  CustomDataCell
} from './table/customCell';
import * as d3 from 'd3';
import { dataProcess } from "../../utils/utils";

export interface Options {
  config: Record<string, any>// 漏斗样式配置信息
  data: Record<string, any> // 漏斗图数据
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
  }


  // 基础样式设置
  setBaseStyle() {
    const borderSetting = {
      verticalBorderColorOpacity: 0,
      horizontalBorderColorOpacity: 0
    };
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
          ...borderSetting
        },
        bolderText: tableTitleStyle
      },
      rowCell: { // 行头
        cell: {
          ...borderSetting,
          backgroundColor: 'transparent'
        },
        bolderText: { ...tableTitleStyle, fontWeight: 400 },
        measureText: tableTitleStyle
      },
      colCell: { // 列头
        cell: {
          backgroundColor: 'transparent',
          ...borderSetting
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
        horizontalBorderWidth: this.tableSetting.inner.width,
        horizontalBorderColor: this.tableSetting.inner.color,
        verticalBorderWidth: this.tableSetting.inner.width,
        verticalBorderColor: this.tableSetting.inner.color
      }
    });
  }

  // 设置表格外框
  setTableBottomRightBorder() {
    const { x, viewportWidth } = this.s2.facet.panelBBox;
    const width = x + viewportWidth;
    const height = this.s2.getContentHeight() > this.height ? this.height : this.s2.getContentHeight();
    const points = [
      [0, 0],
      [width, 0],
      [width, height],
      [0, height],
      [0, 0]
    ];
    this.s2.foregroundGroup.addShape('polyline', {
      attrs: {
        points,
        stroke: this.tableSetting.outter.color,
        lineWidth: 1
      }
    });
  }
  setS2Options() {
    const borderConfig = {
      inner: this.tableSetting.inner,
      outter: this.tableSetting.outter
    };
    const cellWidth = Number(this.tableSetting.cell.width) || 100;
    this.s2Options = {
      width: this.width,
      height: this.height,
      interaction: {
        resize: {
          rowResizeType: 'current'
        }
      },
      // 自定义角头单元格
      cornerCell: (node: Node, s2: SpreadSheet, headConfig: any) => {
        const config = { ...headConfig, borderConfig };
        const corner = new CustomCornerCell(node, s2, config);
        this.setTableBottomRightBorder();
        return corner;
      },
      // 自定义行头
      rowCell: (node: Node, s2: SpreadSheet, headConfig: any) => {
        // headConfig一定要传，否则resize无效
        const config = { ...headConfig, borderConfig };
        return new CustomRowCell(node, s2, config);
      },
      // 定义列头
      colCell: (node: Node, s2: SpreadSheet, headConfig: any) => {
        const config = { ...headConfig, borderConfig };
        return new CustomColCell(node, s2, config);
      },
      // 自定义数据单元格
      dataCell: (viewMeta: any) => {
        const config = { labelsListKeyMap: this.labelsListKeyMap, borderConfig };
        const cell = new CustomDataCell(viewMeta, viewMeta?.spreadsheet, config);
        // 重绘边框
        cell.drawBorderShape();
        return cell;
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
      }
    };
  }

  setDataConfig() {
    // 获取渐变色计算函数 compute
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
    newData = this.data.map((item: any) => {
      for (let i = 0; i < this.labelsList.length; i++) {
        const key = this.labelsList[i].key;
        const format = this.labelsList[i].format
        item[key] = dataProcess(item[key], format);
      }
      return {
        ...item,
        ...(colNames.length ? { allColCats: colNames.join('/') } : {}),
        ...(compute ? {
          compute,
          linear,
          colorInfo: cList
        } : {})
      }
    });
    colNames = colNames.length ? ['allColCats', ...colNames] : colNames;

    this.s2DataConfig = {
      fields: {
        columns: colNames,
        rows: rowNames,
        values: valuesNames,
        valueInCols
      },
      data: newData
    };

  }
}

