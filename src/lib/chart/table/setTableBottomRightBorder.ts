// 设置表格外框
export default (s2, tableSetting, tableHeight) => {
  const { x, viewportWidth } = s2.facet.panelBBox;
  const width = x + viewportWidth;
  const height = s2.getContentHeight() > tableHeight ? tableHeight : s2.getContentHeight();
  const points = [
    [0, 0],
    [width, 0],
    [width, height],
    [0, height],
    [0, 0]
  ];
  s2.foregroundGroup.addShape('polyline', {
    attrs: {
      points,
      stroke: tableSetting.outter.color,
      lineWidth: 1
    }
  });
};
