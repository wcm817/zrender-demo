import { setAggrName } from '../config/utils/index';

export default (features, canvasCss) => {
  let canvasTableTitleData = getTableTitleData(features);
  let oldTableTitleData = canvasCss.tableTitleData ? JSON.parse(JSON.stringify(canvasCss.tableTitleData)) : [];
  if (canvasTableTitleData) {
    let useItemStyle = oldTableTitleData[0];
    canvasTableTitleData = canvasTableTitleData.map(item => {
      let getItem = oldTableTitleData.find(i => i.key === item.key);
      let curItem = getItem || item;
      let bgFontColor = null;
      if (canvasCss.bgCss && canvasCss.bgCss.color && canvasCss.bgCss.index !== 0) {
        bgFontColor = canvasCss.bgCss.color;
      }
      if (useItemStyle) {
        let curFontColor = useItemStyle.style['font-color'] || useItemStyle.style.fill;
        curItem.style = {
          fill: bgFontColor || curFontColor,
          'font-size': useItemStyle.style['font-size'],
          'text-decoration': useItemStyle.style.decoration,
          'font-style': useItemStyle.style['font-style'],
          'letter-spacing': useItemStyle.style['letter-spacing'],
          'line-height': useItemStyle.style['line-height'],
          'text-align': useItemStyle.style.align || useItemStyle.style['text-align']
        };
        if (curItem.show === 'auto' && curItem.display === undefined) {
          curItem.display = 'auto';
        }
      }
      return curItem;
    });
    return canvasTableTitleData;
  };
};
const getTableTitleData = (features) => {
  if (!features) return;
  let list = [];
  const col = features.col || [];
  const row = features.row || [];
  const obj = {
    key: '',
    title: '',
    display: 'auto',
    style: {
      fill: '#6b6b6b',
      'font-size': 12,
      'text-decoration': '',
      'font-style': 'normal',
      'letter-spacing': '0',
      'line-height': '24',
      'text-align': 'left'
    }
  };
  let catCol = [];
  for (let i = 0, len = col.length; i < len; i++) {
    if (col[i].dtype === 'CAT') {
      catCol.push(col[i].name);
    } else {
      let dataObj = JSON.parse(JSON.stringify(obj));
      let name = setAggrName(col[i]);
      dataObj.key = name;
      dataObj.title = name;
      list.push(dataObj);
    }
  }
  if (catCol.length > 0) {
    let titleKey = catCol.join(' / ');
    let dataObj = JSON.parse(JSON.stringify(obj));
    dataObj.key = titleKey;
    dataObj.title = titleKey;
    list.push(dataObj);
  }
  for (let i = 0, len = row.length; i < len; i++) {
    let dataObj = JSON.parse(JSON.stringify(obj));
    dataObj.key = row[i].name;
    dataObj.title = row[i].name;
    if (row[i].dtype === 'AGGR') {
      let name = setAggrName(row[i]);
      dataObj.key = name;
      dataObj.title = name;
    }
    list.push(dataObj);
  }
  // if (!list.length) {
  //   return [obj];
  // }
  return list;
};
