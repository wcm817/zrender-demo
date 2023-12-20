/* 暂时提取 legendConfig */
export const getLegendOption = (config: any) => {
  const position = config.css.legendCss.position.toLocaleUpperCase();
  if (!config.css.colorList.length) {
    return {
      position,
      data: []
    };
  }
  return {
    position,
    data: config.css.colorList.map((item: any) => {
      const type = [item.colored_type, item.type].includes('linear') ? 'AGGR' : 'CAT';
      let title = item.name;
      let feature = item.feature;
      let list: Record<string, any> = {};
      if (!title && !feature) {
        title = '指标名称';
        list = { [item.key]: { color: "#4284F5" } }; // 默认颜色
      } else if (feature) {
        title = item.key;
        list = item.list;
      } else if (type === 'AGGR') {
        list = item.list.map((m: any) => m.color);
      } else {
        list = item.list.reduce((pre: any, item: any) => ({
          ...pre,
          [item.val]: { color: item.color }
        }), {});
      }
      return {
        type,
        title,
        feature,
        list
      };
    })
  };
};