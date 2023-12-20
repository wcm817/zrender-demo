import axisConfig from './axisConfig';
import { setCatName } from '../utils/index';
export default (metadata, css, isRotated) => {
  const xList = metadata.x_dimensions || [];
  const len = metadata.x_dimensions.length;
  let xAxis = [];
  let xAxisPart = [];
  let xAxisConfig = axisConfig(css.bgCss);
  for (let i = 0; i < len; i++) {
    xAxisConfig.keyId = `${i}-${0}`;
    if (xList[i].split instanceof Array) {
      let splitArr = xList[i].split;
      let splitLen = splitArr.length;
      let xListObj = JSON.parse(JSON.stringify(xList[i]));
      if (i === len - 1) {
        delete xListObj.split;
        xListObj.split = splitArr[splitLen - 1];
        xAxisConfig.key = setCatName(xListObj);
        xAxisConfig.title.value = xAxisConfig.key;
        xAxis.push(hasXAxisObj(xAxisConfig, css));
        splitLen = splitLen - 1;
      }
      for (let j = 0; j < splitLen; j++) {
        xListObj.split = splitArr[j];
        xAxisConfig.key = setCatName(xListObj);
        xAxisConfig.title.value = xAxisConfig.key;
        xAxisConfig.position = 'top';
        if (isRotated) {
          xAxisConfig.label.style.rotate = 90;
        }
        xAxisPart.push(hasXAxisObj(xAxisConfig, css));
      }
    } else {
      xAxisConfig.key = setCatName(xList[i]);
      xAxisConfig.title.value = xAxisConfig.key;
      if (i === len - 1) {
        xAxis.push(hasXAxisObj(xAxisConfig, css));
      } else {
        xAxisConfig.position = 'top';
        if (isRotated) {
          xAxisConfig.label.style.rotate = 90;
        }
        xAxisPart.push(hasXAxisObj(xAxisConfig, css));
      }
    }
  }
  return {
    xAxis,
    xAxisPart,
  };
};

const hasXAxisObj = (obj, css) => {
  let list = css.axis_style || [];
  let xAxis = list.filter(item => item.axisType === 'x');
  for (let i = 0, len = xAxis.length; i < len; i++) {
    if (obj.keyId === xAxis[i].keyId && obj.key === xAxis[i].key) {
      let xAxisObj = JSON.parse(JSON.stringify(xAxis[i]));
      xAxisObj.axisType = 'x';
      return xAxisObj;
    }
  }
  obj.axisType = 'x';
  if (xAxis.length) {
    obj.grid = xAxis[0].grid;
    obj.line = xAxis[0].line;
    obj.title.style = xAxis[0].title.style;
  }
  return JSON.parse(JSON.stringify(obj));
};
