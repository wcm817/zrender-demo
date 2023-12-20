import * as d3 from 'd3';
const { symbol, symbolCircle, symbolCross, symbolTriangle, symbolSquare, symbolStar, symbolDiamond, symbolWye } = d3;
/**
 * 生成背景多边形的顶点
 * @param opts.vertexNum  // 顶点个数
 * @param opts.radius  // 最大半径
 * @param opts.tickNum  // 刻度分隔数
 * @param opts.rx  // 圆心x
 * @param opts.ry  // 圆心y
 * @returns 每层多边形坐标点集合
 */
export const getPolygonPoints = (opts: any) => {
  const { vertexNum, radius, tickNum, rx, ry } = opts;
  const radarAllPoints: Array<Array<Array<number>>> = [];
  let polygonPoints;
  if (vertexNum < 3) return radarAllPoints;
  const anglePiece = Math.PI * 2 / vertexNum;
  const radiusReduce = radius / tickNum;
  // for (let r = radius; r > 0; r -= radiusReduce) {
  for (let r = radius + radiusReduce; r > -radiusReduce; r -= radiusReduce) {
    polygonPoints = [];
    for (let i = 0; i < vertexNum; i++) {
      polygonPoints.push([rx + Math.sin(i * anglePiece) * r, ry - Math.cos(i * anglePiece) * r]);
    }
    radarAllPoints.push(polygonPoints);
  }
  return radarAllPoints;
};

/**
 * 生成多边形顶点文字的文字摆放方向
 * @param pointsX x轴坐标点
 * @param rx 圆心x
 * @returns 方向 center | left | rigjt
 */
export const getOuterTextAlign = (pointsX: number, rx: number) => {
  const isCenter = Math.abs(pointsX - rx) < 100;
  let align = 'center';
  if (isCenter) {
    align = 'center';
  } else if (pointsX > rx) {
    align = 'left';
  } else {
    align = 'right';
  };
  return align;
};

/**
 * 处理数据
 * @param opts.xAxis CAT分类
 * @param opts.xAxisData CAT分类 数据
 * @param opts.yAxis AGGR数据
 * @param opts.colorList 图例颜色信息
 * @param opts.rx 圆心x
 * @param opts.ry 圆心y
 * @param opts.scaleRadius 半径比例尺
 * @returns Array<Record<string, any>>
 */
export const handleYAxisData = (opts: any): Array<Record<string, any>> => {
  const { xAxis, xAxisData, yAxis, colorList, rx, ry, scaleRadius } = opts;
  const newData: Array<Record<string, any>> = [];
  const xKey = xAxis[0].key;
  // 分类数据对应的角度映射
  const xAxisDataAngleMap: Record<string, any> = xAxisData.reduce((pre: any, item: any, i: number) => ({
    ...pre,
    [item]: i * Math.PI * 2 / xAxisData.length
  }), {});

  colorList.forEach((cItem: any) => {
    for (let i = 0; i < yAxis.length; i++) {
      const colorTitle = cItem.title;
      const featureName = cItem.feature;
      Object.keys(cItem.list).forEach((cListKey: any) => {
        for (let i = 0; i < yAxis.length; i++) {
          let featureData = yAxis[i].data.filter((f: any) => f[featureName] === cListKey)
          if (!featureData.length) {
            const temp = cItem.originTitle || cListKey;
            featureData = yAxis[i].key === temp ? yAxis[i].data : [];
          }
          const dataItem = {
            ...yAxis[i],
            colorLabel: cListKey,
            colorTitle: colorTitle,
            color: cItem.list[cListKey].color,
            opacity: cItem.opacity ? cItem.opacity / 100 : 1,
            data: featureData.map((d: Record<string, any>) => {
              const angle = xAxisDataAngleMap[d[xKey]];
              const x = rx + Math.sin(angle) * scaleRadius(d[yAxis[i].key] || 0);
              const y = ry - Math.cos(angle) * scaleRadius(d[yAxis[i].key] || 0);
              // 过滤掉数值为null 或者 NAN的数据
              const point = d[yAxis[i].key] ? [x, y] : null;
              return {
                data: d,
                point
              };
            })
          };
          newData.push(dataItem);
        }
      });
    }
  });

  return newData;
};

/**
  * 判断标签是否重叠
  * @param curRect 当前label的矩形包围盒
  * @param otherRect  当前label之前的矩形包围盒
  * @returns 是否重叠 true | false
  */
export const collision = (curRect: any, otherRect: any) => {
  const ax = curRect.x - 1;
  const ay = curRect.y - 1;
  const aw = curRect.width + 2;
  const ah = curRect.height + 2;
  const bx = otherRect.x - 1;
  const by = otherRect.y - 1;
  const bw = otherRect.width + 2;
  const bh = otherRect.height + 2;
  return (ax + aw > bx && ax < bx + bw && ay + ah > by && ay < by + bh);
};

/**
 * 获取顶点符号svg路径
 * @param symbolType 符号点类型
 * @param symbolSize 符号点大小
 * @returns 符号点路径
 */
export const getSymbolSvgPath = (symbolType: string, symbolSize: number) => {
  const symbols: any = {
    circle: symbolCircle,
    cross: symbolCross,
    cross45: symbolCross,
    triangle: symbolTriangle,
    triangle180: symbolTriangle,
    square: symbolSquare,
    star: symbolStar,
    diamond: symbolDiamond,
    wye: symbolWye
  };
  const pathFn = symbol().type(symbols[symbolType]).size(symbolSize);
  return pathFn && pathFn();
};