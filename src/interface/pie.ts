import ResizeGroup from '../utils/resizeGroupWithDirection';

// 初始化参数
export interface InitParams {
  config: Record<string, any>, // pie 的配置信息
  data: Record<string, any> // pie 的数据
}

// 饼图数据处理参数
export interface PieDataParams extends InitParams {
  radius: number, // 饼图半径
  cx: number, // 圆心x
  cy: number, // 圆心y
}

// 饼图颜色数据处理参数
export interface PieDataColorParams {
  data: Array<Record<string, any>>,
  features: Record<string, any>,
  colorList: Array<Record<string, any>>,
}

// 饼图引导引导线数据处理参数
export interface PolylineDataPParams {
  data: Array<Record<string, any>>,
  radius: number, // 饼图半径
  cx: number, // 圆心x
  cy: number, // 圆心y
}

export interface LabelDataParams {
  data: Array<Record<string, any>>,
  labelsList: Array<Record<string, any>>,
  cx: number, // 圆心x
}

// 饼图每项的数据
export interface PieDataItem {
  color: string, // 颜色
  index: number, // 索引
  value: number, // 值
  startAngle: number, // 开始弧度
  endAngle: number, // 结束弧度
  showLabel: boolean, // 是否显示引导线与标签
  formatLabelsList: Array<Record<string, any>>, // 标签列表
  maxLabelWidth: number, // 标签列表中宽度最长的一项的宽度
  point0: Array<number>, // 引导线开始坐标点
  point1: Array<number>, // 引导线拐点坐标点
  point2: Array<number>, // 引导线结束坐标点
}

// 画图参数
export interface DrawPieParams {
  data: Array<PieDataItem>, // 数据
  radius: number, // 半径
  cx: number, // 圆心x
  cy: number, // 圆心y
  innerRadius: number | undefined, // 是否为环形
  group: ResizeGroup // 组
}