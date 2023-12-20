export default (bgCss) => {
  bgCss = bgCss || {};
  return JSON.parse(JSON.stringify({
    position: 'bottom',
    key: '',
    type: ['bar'],
    line: {
      show: true,
      style: {
        lineWidth: 1,
        fontColor: '#EAECED',
        opacity: 1,
        lineDash: [0, 0]
      }
    },
    label: {
      style: {
        fontColor: bgCss.color || '#6B6B6B',
        fontSize: 12,
        fontWeight: 'normal',
        opacity: 1,
        rotate: 0,
        hasUnit: 'auto'
      },
    },
    title: {
      value: '',
      show: true,
      style: {
        fontColor: bgCss.color || '#6B6B6B',
        fontSize: 12,
        fontStyle: 'normal'
      }
    },
    grid: {
      line: {
        show: false,
        style: {
          fontColor: '#c2c9d1',
          opacity: 0,
          lineDash: [0, 0], // [3,3]
          lineWidth: 1
        }
      }
    }
  }));
};
