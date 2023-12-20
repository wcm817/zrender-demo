type legendPosition = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT'
type legendType = 'CAT' | 'AGGR'
type RGB = `rgb(${number}, ${number}, ${number})`
type RGBA = `rgba(${number}, ${number}, ${number}, ${number})`
type HEX = `#${string}`;
type Color = RGB | RGBA | HEX
interface Style {
  fill?: Color,
  stroke?: Color,
  padding?: [number, number, number, number] | [number, number] | number,
  lineHeight?: number,
  fontSize?: number
}
interface CATLegendOption {
  color: Color,
  [propname: string]: any
}
interface CATLegend {
  [propname: string]: CATLegendOption
}
type AGGRLegend = [Color, Color]

// list根据type的类型来定义
interface legendListBase<T extends legendType> {
  type: T,
  title: string,
  list: T extends 'CAT' ? CATLegend : AGGRLegend,
  [propname: string]: any
}

interface legendOptions {
  position: legendPosition,
  legendStyle?: Style,
  canvasStyle?: Style,
  data: legendListBase<legendType>[],
  zrInstance: import('zrender').ZRenderType
}
interface legendRow {
  row: legendListBase<legendType>,
  rowIndex: number,
  x0: number,
  y0: number,
  x1: number,
  y1: number
}
interface pagination {
  data: {
    label: string,
    data: CATLegendOption
  }[],
  x0: number,
  y0: number,
  x1: number,
  y1: number,
  index: number,
}
