export default (type, bgCss) => {
  bgCss = bgCss || {};
  const format = {
    check: false,
    decimal: 2,
    isPercent: false,
    negative: '-1234',
    prefix: '',
    selectFormat: 'origin',
    setFlag: false,
    suffix: '',
    unit: '',
    useThousandMark: true,
    zone: '¥ 人民币'
  };
  const text = {
    align: 'left',
    display: 'auto',
    check: false,
    decoration: '',
    fontColor: bgCss.color || '#6B6B6B',
    fontSize: 12,
    fontStyle: 'normal',
    letterSpacing: '0',
    lineHeight: '24',
    setFlag: false
  };
  return JSON.parse(JSON.stringify({
    type: type === 'AGGR' ? 'linear' : 'ordinal',
    key: '',
    title: '',
    display: 'auto',
    format: type === 'AGGR' ? format : {},
    text: text
  }));
};
