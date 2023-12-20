let getTxtWidth = (text: string, font: number, whiteSpace?: string) => {
  let textDom = document.createElement('text');
  textDom.innerText = text;
  textDom.style.fontSize = font + 'px';
  textDom.style.whiteSpace = whiteSpace || 'normal';
  textDom.style.position = 'fixed';
  document.body.appendChild(textDom);
  let width = textDom.clientWidth;
  document.body.removeChild(textDom);
  return width;
};

let dataProcess = function (val: string, format: Record<string, any>) {
  if (!val) {
    return val;
  }
  if (typeof format.selectFormat === 'undefined') {
    return val;
  }
  if (!Number(val)) {
    return val;
  }
  let ret = val;

  let negative = -1;
  if (Number(ret) < 0) {
    if (format.negative === '(1234)') {
      negative = 0;
    } else if (format.negative === '1234-') {
      negative = 1;
    } else {
      negative = 2;
    }
  }
  ret = unitProcess(ret, format.unit, format.useThousandMark, format);

  ret = displayFormatProcess(ret, format.selectFormat, format.zone, negative);
  ret = prefSuffixProcess(ret, format.prefix, format.suffix, format.isPercent);
  return ret;
};

let unitProcess = function (
  val: string,
  unit: string,
  micrometerFlag: boolean,
  format: Record<string, any>
) {
  let unitPare: Record<string, number> = {
    'K 千': 1000,
    'M 百万': 1000000,
    'G 十亿': 1000000000,
    'T 千亿': 100000000000,
    K: 1000,
    M: 1000000,
    G: 1000000000,
    T: 100000000000,
    'K Thousand': 1000,
    'M Million': 1000000,
    'G Billion': 1000000000,
    'T 100 billion': 100000000000,
    'M 百萬': 1000000,
    'G 十億': 1000000000,
    'T 千億': 100000000000
  };
  let ret = val;
  if (unit && format.selectFormat !== 'percent') {
    ret = val / unitPare[unit];
  }
  if (format.decimal || format.decimal === 0) {
    if (format.isPercent || format.selectFormat === 'percent') {
      ret = ret * 100;
    }
    ret = ret.toFixed(format.decimal);
    if (format.isPercent) {
      ret = ret + '%';
    }
  }

  // let ret = val / unitPare[unit];
  let curRes = micrometerProcess(ret, micrometerFlag);
  if (format.selectFormat === 'percent') {
    return curRes;
  } else {
    return unit ? curRes + unit : curRes;
  }
  // return unit ? curRes + unit : curRes;
};

let displayFormatProcess = function (val: string, format: number | string, zone: string, negative: number) {
  // if (!format) {
  //   return val;
  // }
  if (negative === 0) {
    val = '(' + val.substring(1) + ')';
  } else if (negative === 1) {
    val = val.substring(1) + '-';
  }
  if (format === 'percent' || format === -1 || format === 'origin') {
    return val;
  }
  let formatPare: Record<string, string> = {
    CN: '￥',
    JP: '¥',
    HK: 'HK$',
    US: '＄',
    EUR: '€',
    GBP: '£',
    '¥ 人民币': '￥',
    '￥ 日元': '¥',
    '¥ RMB': '¥',
    '￥ Yen': '￥',
    'HK$ Hong Kong dollar': 'HK$',
    '＄ Dollar': '＄',
    '€ Euro': '€',
    '£ Pound': '£',
    '¥ 人民幣': '¥',
    'HK$ 港币': 'HK$',
    '＄ 美元': '＄',
    '€ 歐元': '€',
    '€ 欧元': '€',
    '£ 英镑': '£',
    '£ 英鎊': '£'
  };
  if (negative === -1) {
    return formatPare[zone] ? formatPare[zone] + val : val;
  }

  return formatPare[zone] ? formatPare[zone] + val : val;
};

let prefSuffixProcess = function (val: string, prefix: string, suffix: string, isPercent: boolean) {
  if (prefix) {
    val = prefix + val;
  }
  if (suffix && !isPercent) {
    val = val + suffix;
  } else if (isPercent) {
    if (suffix && suffix.indexOf('%') === 0) {
      val = val + suffix.substr(1);
    } else if (suffix && suffix.indexOf('%') !== 0) {
      val = val.substr(0, val.length - 1) + suffix;
    }
  }
  return val;
};

let micrometerProcess = function (val: number, flag: boolean) {
  if (!flag || val < 1000) {
    return val;
  }
  let ret = '';
  let list = [];
  let curStr = val.toString().split('.');
  for (let i = curStr[0].length - 1; i >= 0; i--) {
    list.push(curStr[0][i]);
    if ((curStr[0].length - 1 - i) % 3 === 2) {
      ret = ',' + list.reverse().join('') + ret;
      list = [];
    }
  }
  if (ret) {
    ret = list.length === 0 ? ret.substr(1) : ret;
  }
  ret = list.reverse().join('') + ret;
  return curStr.length > 1 ? ret + '.' + curStr[1] : ret;
};

export {
  getTxtWidth,
  dataProcess,
  unitProcess,
  displayFormatProcess,
  prefSuffixProcess,
  micrometerProcess
}