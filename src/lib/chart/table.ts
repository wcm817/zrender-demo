import {
  PivotSheet,
  Node,
  SpreadSheet
} from "@antv/s2";
import * as d3 from 'd3';
// import * as zrender from 'zrender';
import {
  CustomCornerCell,
  CustomRowCell,
  CustomColCell,
  CustomDataCell
} from './table/customCell';
import CellHoverTooltipInteraction from './table/customTooltip';
import Base from '../../utils/chartBase';
import Legend from '../../utils/legend/legend';
import { dataProcess } from "../../utils/utils";
import setTableBottomRightBorder from './table/setTableBottomRightBorder';
import setS2CustomIconOptions from "./table/setS2CustomIconOptions";
import setTableTheme from "./table/setTableTheme";

export interface s2DataConfig {
  fields: Record<string, any>
  data: Array<Record<string, any>>
  [other: string]: any
}

export default class Table extends Base {
  data: Array<Record<string, any>>; // 画布数据
  hasLegend: Boolean; // 是否显示图例
  legendOption: Record<string, any>; // 图例配置信息&颜色信息
  legendIns!: Legend; // 图例实例
  width: number; // 画布宽
  height: number; // 画布高
  features: Record<string, any>; // 分类信息
  labelsList: Array<Record<string, any>>; // 标签列表
  labelsListKeyMap: Record<string, any>; // 标签列表转对象格式 {[key]: key所在项}
  tooltipListKeymap: Record<string, any>; // tooltip列表转对象格式 {[key]: key所在项}
  tableSetting: Record<string, any>;
  tableTitleData: Record<string, any>;
  tableTitleHideInfos!: Record<string, any>; // 控制表头隐藏的配置
  fitModel: string; // 画布视图
  dom: HTMLElement;
  s2!: PivotSheet;
  s2Options!: Record<string, any>;
  s2DataConfig!: s2DataConfig;
  actionClick: Function; // 下钻回调事件处理
  drillFeature: Record<string, any>; // 下钻特征

  constructor(config: any) {
    super(config);
    const { id, chartData } = config;
    this.data = JSON.parse(JSON.stringify(chartData.features_data));
    this.hasLegend = config.hasLegend;
    this.legendOption = config.legendOption;
    if (this.hasLegend) {
      let legendOpt = Object.assign({
        x0: this.x0, // 来自chartBase的x0
        y0: this.y0,
        x1: this.x1,
        y1: this.y1,
        zrInstance: this.zrInstance, // 来自chartBase的zrInstance
        id, // 用于定义对应的事件
        legendCss: this.legendCss // 来自chartBase的this.legendCss
      }, this.legendOption);
      // @ts-ignore
      this.legendIns = new Legend(legendOpt);
    }
    this.dom = document.getElementById(id) || new HTMLElement();
    this.width = this.hasLegend ? this.legendIns.chartX1 - this.legendIns.chartX0 : this.dom?.offsetWidth || 680;
    this.height = this.hasLegend ? this.legendIns.chartY1 - this.legendIns.chartY0 : this.dom?.offsetHeight || 400;
    this.features = config.features;
    this.labelsList = config.labelsList;
    this.labelsListKeyMap = this.labelsList.reduce((pre: any, item: any) => ({
      ...pre,
      [item.key]: item
    }), {});
    this.tooltipListKeymap = config.tooltipList.reduce((pre: any, item: any) => ({
      ...pre,
      [item.key]: item
    }), {});
    this.tableSetting = config.tableSetting;
    this.tableTitleData = config.tableTitleData;
    this.fitModel = config.fitModel;
    this.actionClick = config.actionClick;
    this.drillFeature = {
      columnDrillFeature: config.columnDrillFeature,
      rowDrillFeature: config.rowDrillFeature
    };

    this.setDataConfig();
    this.setS2Options();
  }


  render() {
    let tooltip = document.querySelector('.antv-s2-tooltip-container');
    if (tooltip) {
      document.body.removeChild(tooltip);
    }

    // @ts-ignore
    this.s2 = new PivotSheet(this.dom, this.s2DataConfig, this.s2Options);
    const themeInfos = setTableTheme(this.tableTitleData, this.tableSetting);
    this.s2.setTheme(themeInfos);
    this.s2.render();

    // 适配高度
    const flag = this.s2.getContentHeight() > this.height;
    if (flag && ['fitHeight', 'full'].includes(this.fitModel)) {
      this.adaptiveHeight();
    }
    this.dom.style.position = 'relative';
    const left = this.legendIns?.chartX0 || 0;
    const top = this.legendIns?.chartY0 || 0;
    this.s2.getCanvasElement().style.position = 'absolute';
    this.s2.getCanvasElement().style.left = left + 'px';
    this.s2.getCanvasElement().style.top = top + 'px';
  }


  // 画布视图适配高度
  adaptiveHeight() {
    const rows = this.s2.facet.gridInfo.rows;
    const dataAreaHeight = rows[0] + rows[rows.length - 1];
    let newRowHeight = rows[0];
    const rowNodes = this.s2.getRowNodes();
    const rowLength = rowNodes[rowNodes.length - 1].rowIndex;
    newRowHeight = Math.ceil(dataAreaHeight / rowLength) > 18 ? Math.ceil(dataAreaHeight / rowLength) : 18;

    this.s2.setOptions({
      ...this.s2Options,
      style: {
        ...this.s2Options.style,
        cellCfg: {
          ...this.s2Options.style.cellCfg,
          height: newRowHeight
        },
        rowCfg: {
          ...this.s2Options.style.rowCfg,
          height: newRowHeight
        }
      }
    }, true);
    this.s2.render();
  }

  setDataConfig() {
    // 获取渐变色计算函数 compute
    const coloredType = this.legendOption.data[0]?.type;
    const colorList = this.legendOption.data[0]?.list;
    let compute: any = null;
    let linear: any = null;
    if (coloredType === 'AGGR') {
      const rg = /(\d(\.\d+)?)+/g;
      const { color: minColor, originValue: minOriginVal } = colorList[0];
      const { color: maxColor, originValue: maxOriginVal } = colorList[1];

      const minColorMatch = minColor.match(rg) || [];
      const maxColorMatch = maxColor.match(rg) || [];
      const minD3Color = d3.rgb(minColorMatch[0], minColorMatch[1], minColorMatch[2]);
      const maxD3Color = d3.rgb(maxColorMatch[0], maxColorMatch[1], maxColorMatch[2]);
      compute = d3.interpolate(minD3Color, maxD3Color);
      linear = d3.scaleLinear()
        .domain([minOriginVal, maxOriginVal])
        .range([0, 1]);
    }

    // 配置数据 
    let newData: Array<any> = JSON.parse(JSON.stringify(this.data));
    let rowNames: Array<any> = [];
    let colNames: Array<any> = [];
    let valuesNames: Array<any> = [];
    let valueInCols: boolean = false;
    let hideRowHeader = false; // 是否强制隐藏所有行头
    let hideColHeader = false; // 是否强制隐藏所有列头
    let hideAllCol = false; // 是否强制隐藏整列
    let { col, row } = this.features;
    // 标签项的数值AGGR
    const labelsValuesNames = this.labelsList.map((item: any) => item.key);
    // 有AGGR字段时
    if (labelsValuesNames.length) {
      // 行和列都无 字段
      if (!col.length && !row.length) {
        // 手动配置列头，生成数据后，且隐藏列头
        colNames = labelsValuesNames;
        hideColHeader = true;
      } else if (!col.length) {
        // 只有 行 有字段
        rowNames = row.filter((item: any) => item.dtype === 'CAT').map((item: any) => item.name);
        valuesNames = row
          .filter((item: any) => item.dtype === 'AGGR')
          .map((item: any) => `${item.legend.toLocaleLowerCase()}(${item.name})`);
        valueInCols = true;

      } else if (!row.length) {
        // 只有 列 有字段
        colNames = col.filter((item: any) => item.dtype === 'CAT').map((item: any) => item.name);
        valuesNames = col
          .filter((item: any) => item.dtype === 'AGGR')
          .map((item: any) => `${item.legend.toLocaleLowerCase()}(${item.name})`);
        hideRowHeader = true;
      } else {
        // 行和列都有字段
        valueInCols = col.filter((item: any) => item.dtype === 'AGGR').length;
        rowNames = row.filter((item: any) => item.dtype === 'CAT').map((item: any) => item.name);
        colNames = col.filter((item: any) => item.dtype === 'CAT').map((item: any) => item.name);
      }
    } else {
      // 无AGGR字段时
      rowNames = row.map((item: any) => item.name);
      colNames = col.map((item: any) => item.name);
      if (!col.length) {
        // 构造假数据 可以显示出行头
        newData = newData.map((item: any) => ({ ...item, v1: 'v1' }));
        valuesNames = ['v1'];
        hideAllCol = true; // 隐藏掉构造出来的假数据
        valueInCols = true;
      }
    }

    valuesNames = [...new Set([...valuesNames, ...labelsValuesNames])];

    // 数据改造
    newData = newData.map((item: any) => {
      for (let i = 0; i < this.labelsList.length; i++) {
        const key = this.labelsList[i].key;
        const format = this.labelsList[i].format;
        item[`origin_${key}`] = item[key];
        item[key] = dataProcess(item[key], format);
      }
      return {
        ...item,
        ...(colNames.length ? { allColCats: colNames.join(' / ') } : {}),
        ...(compute ? {
          compute,
          linear,
          colorInfo: colorList
        } : {})
      };
    });

    // 隐藏的表头标题集合
    const hideTitleList = this.tableTitleData.filter((f: any) => f.display === 'none').map((item: any) => item.title);
    // 分类系列的表头隐藏
    const hideColTitleFlag: boolean = colNames.some((item: any) => hideTitleList.some((s: any) => s.includes(item)));
    // 数值系列的 行表头是否都隐藏
    let isHideAGGRRowHeader: boolean = valuesNames.every((item: any) => hideTitleList.includes(item));

    colNames = colNames.length && !hideColTitleFlag ? ['allColCats', ...colNames] : colNames;

    this.tableTitleHideInfos = {
      hideTitleList,
      isHideAGGRRowHeader,
      hideRowHeader,
      hideColHeader,
      hideAllCol
    };

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

  setS2Options() {
    const borderConfig = {
      inner: this.tableSetting.inner,
      outter: this.tableSetting.outter
    };
    const layoutWidthTypeMap: Record<string, any> = {
      standard: 'compact',
      fitWidth: 'adaptive',
      fitHeight: 'compact',
      full: 'adaptive'
    };
    const cellWidth = layoutWidthTypeMap[this.fitModel] === 'compact' ? Number(this.tableSetting.cell.width) : 0;
    const { hideTitleList, isHideAGGRRowHeader, hideRowHeader, hideColHeader, hideAllCol } = this.tableTitleHideInfos;

    this.s2Options = {
      width: this.width,
      height: this.height,
      interaction: {
        resize: {
          rowResizeType: 'current'
        },
        selectedCellsSpotlight: true,
        customInteractions: [
          {
            key: 'CellHoverTooltipInteraction',
            interaction: CellHoverTooltipInteraction
          }
        ]
      },
      tooltip: {
        showTooltip: false,
        style: {
          fontSize: '14px',
          position: 'absolute',
          backgroundColor: '#fff',
          border: '1px solid #fff',
          borderRadius: '4px',
          boxShadow: 'rgba(0,0,0,0.2) 1px 2px 10px',
          padding: '4px 6px'
        }
      },
      // 自定义行头&列头图标
      customSVGIcons: setS2CustomIconOptions(this.drillFeature, this.actionClick).customSVGIcons,
      headerActionIcons: setS2CustomIconOptions(this.drillFeature, this.actionClick).headerActionIcons,
      // 自定义角头单元格
      cornerCell: (node: Node, s2: SpreadSheet, headConfig: any) => {
        const config = { ...headConfig, borderConfig, hideText: hideTitleList.includes(node.value) };
        setTableBottomRightBorder(s2, this.tableSetting, this.height);
        return new CustomCornerCell(node, s2, config);
      },
      // 自定义行头
      rowCell: (node: Node, s2: SpreadSheet, headConfig: any) => {
        // headConfig一定要传，否则resize无效
        const config = { ...headConfig, borderConfig, hideText: hideTitleList.includes(node.value) };
        return new CustomRowCell(node, s2, config);
      },
      // 定义列头
      colCell: (node: Node, s2: SpreadSheet, headConfig: any) => {
        if (this.features.text?.length && node.key === '$$extra$$') {
          hideTitleList.push(node.label);
        }
        const config = { ...headConfig, borderConfig, hideText: hideTitleList.includes(node.value) };
        return new CustomColCell(node, s2, config);
      },
      // 自定义数据单元格
      dataCell: (viewMeta: any) => {
        const config = {
          labelsListKeyMap: this.labelsListKeyMap,
          tooltipListKeymap: this.tooltipListKeymap,
          borderConfig,
          hideColHeader,
          hideRowHeader
        };
        const cell = new CustomDataCell(viewMeta, viewMeta?.spreadsheet, config);
        // 重绘边框
        cell.drawBorderShape();
        return cell;
      },
      style: {
        layoutWidthType: layoutWidthTypeMap[this.fitModel] || 'adaptive',
        cellCfg: {
          width: cellWidth || ''
        },
        rowCfg: {
          // width: cellWidth || '',
          width: (row: any) => {
            if (hideRowHeader) return 0;
            // AGGR字段来自标签时 隐藏AGGR字段的行头
            if (this.features.text?.length && (row.field === '$$extra$$')) return 0;
            return isHideAGGRRowHeader && (row.field === '$$extra$$') ? 0 : cellWidth;
          }
        },
        colCfg: {
          width: () => {
            if (hideAllCol) return 0;
            return cellWidth || '';
          },
          height: hideColHeader ? 0 : 40
        }
      }
    };
  }
};
