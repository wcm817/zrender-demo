import { PivotSheet, TableSheet, RowCell, ColCell, DataCell, renderRect, Node, SpreadSheet } from "@antv/s2";
import { Group } from '@antv/g-canvas';
import * as d3 from 'd3';
import { dataProcess } from '../../utils/utils';

export interface Options {
  config: Record<string, any>// 漏斗样式配置信息
  data: Record<string, any> // 漏斗图数据
}


// 角头
// class CustomCornerHeader extends Group {
//   constructor() {
//     super({});
//   }
// }

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
  s2!: PivotSheet | TableSheet;
  s2Options!: Record<string, any>;
  s2DataConfig!: Record<string, any>;

  constructor(opts: Options) {
    const { data, config } = opts;
    this.data = data.features_data;
    this.id = config.id;
    this.dom = document.getElementById(this.id) || new HTMLElement();
    this.width = this.dom?.offsetWidth || 680;
    this.height = this.dom?.offsetHeight || 400;
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
    // this.s2 = new TableSheet(this.dom, this.s2DataConfig, this.s2Options);
    this.setBaseStyle();
    this.s2.render();
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
      dataCell: {
        cell: {
          backgroundColor: 'transparent',
          crossBackgroundColor: 'rgba(219, 235, 255, 0.3)',
          ...borderSetting
        },
        text: {
          textAlign: this.tableSetting.align,
        }
      },
      cornerCell: {
        cell: {
          ...borderSetting
        }
      },
      colCell: {
        cell: {
          backgroundColor: 'transparent',
          ...borderSetting,
        },
        text: tableTitleStyle,
        bolderText: tableTitleStyle
      },
      rowCell: {
        cell: {
          ...borderSetting
        },
        measureText: tableTitleStyle
      },
      splitLine: {
        ...borderSetting,
      }
    });
  }

  setS2Options() {
    this.s2Options = {
      width: this.width,
      height: this.height,
      // interaction: {
      //   resize: false, // 是否开始拖拽热效应
      // },
      // 自定义角头
      // cornerHeader: () => {
      //   return new CustomCornerHeader();
      // },
      // 自定义行头
      rowCell: (node: Node, s2: SpreadSheet) => {
        const row = new CustomRowCell(node, s2);
        return row;
      },
      // 自定义数据单元格
      dataCell: (viewMeta) => {
        // 渐变色
        return new CustomDataCell(viewMeta, viewMeta?.spreadsheet, this.labelsListKeyMap);
      },
      style: {
        cellCfg: {
          width: this.tableSetting.cell.width
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

    // 配置数据 (处理符合s2所需格式 & 数据渐变色配置linearColor & 数据格式化配置 )
    let newData: Array<any> = [];
    let rowNames: Array<any> = [];
    let colNames: Array<any> = [];
    let metaNames: Array<any> = [];
    let valuesNames: Array<any> = [];

    let { col, row } = this.features;
    console.log('this.features:::', this.features);
    const flag = row.some((item: any) => item.dtype === 'AGGR');
    if (flag) {
      colNames = ['allCols', ...col.map((item: any) => item.name)];
      rowNames = row.map((item: any) => `${item.legend.toLocaleLowerCase()}(${item.name})`);
      for (let i = 0; i < this.data.length; i++) {
        rowNames.forEach((key: any) => {
          const value = this.data[i][key];
          const overflowColor = compute && (value > cList[1].originValue) && cList[1].color
          let obj: Record<string, any> = {
            ...this.data[i],
            allCols: col.map((item: any) => item.name).join('/'),
            rowKeys: key,
            [key]: dataProcess(value, this.labelsListKeyMap[key].format),
            // ...(compute && (key === colorKey) ? { linearColor: compute(linear(value)) } : {})  // 对应数据设置渐变色
            ...(compute ? { linearColor: overflowColor || compute(linear(value)) } : {})
          };

          Object.keys(obj).forEach((o: string) => {
            if ((o !== key) && rowNames.includes(o)) {
              delete obj[o]
            }
          });
          newData.push(obj);
        });
      }
    } else {
      // 行项
      rowNames = row.map((item: any) => item.name);
      metaNames = rowNames.map((item: any) => ({
        field: item,
        name: item,
      }));

      // 列项
      const aggrCol = col.filter((item: any) => item.dtype === 'AGGR');
      const catCol = col.filter((item: any) => item.dtype === 'CAT');
      colNames = catCol.map((aItem: any) => aItem.name);

      // 数据项
      valuesNames = aggrCol.map((item: any) => `${item.legend.toLocaleLowerCase()}(${item.name})`);

      // 数据改造
      for (let i = 0; i < this.data.length; i++) {
        newData.push({
          ...this.data[i],
          allColCats: colNames.join('/')
        });
      }
      colNames = ['allColCats', ...colNames];

    }

    console.log('rowNames:::', rowNames);
    console.log('colNames:::', colNames);
    console.log('metaNames:::', metaNames);
    console.log('this.data:::', this.data);
    // console.log("newData:::", newData)

    this.s2DataConfig = {
      fields: {
        columns: colNames,
        rows: rowNames,
        values: valuesNames,
        valueInCols: true,
      },
      meta: metaNames,
      data: newData
    }

  }
}

