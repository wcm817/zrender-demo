export default (type) => {
  const format = {
    check: false,
    decimal: 2,
    isPercent: false,
    negative: '-1234',
    prefix: '',
    selectFormat: -1,
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
    fontColor: '#6B6B6B',
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
    legendCheck: false,
    format: type === 'AGGR' ? format : {},
    text: text
  }));
};
