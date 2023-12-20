export default (tableTitleData, tableSetting) => {
  const borderSetting = {
    verticalBorderColorOpacity: 0,
    horizontalBorderColorOpacity: 0
  };
  const style = tableTitleData[0]?.style;
  const tableTitleStyle = style ? {
    fill: style.fill,
    fontSize: style['font-size'],
    textAlign: style['text-align']
  } : {};

  const iconStyle = {
    size: tableTitleStyle.fontSize || 12,
    fill: tableTitleStyle.fill || '#333',
    margin: {
      left: 10,
      right: -10
    }
  };

  return {
    background: {
      color: 'transparent'
    },
    cornerCell: { // 角头
      cell: {
        backgroundColor: 'transparent',
        ...borderSetting
      },
      bolderText: tableTitleStyle
    },
    rowCell: { // 行头
      cell: {
        ...borderSetting,
        backgroundColor: 'transparent'
      },
      bolderText: { ...tableTitleStyle, fontWeight: 400 },
      measureText: tableTitleStyle,
      text: tableTitleStyle,
      icon: iconStyle
    },
    colCell: { // 列头
      cell: {
        backgroundColor: 'transparent',
        ...borderSetting
      },
      bolderText: tableTitleStyle,
      measureText: { ...tableTitleStyle, fontWeight: 600 },
      text: { ...tableTitleStyle, fontWeight: 600 },
      icon: iconStyle
    },
    dataCell: { // 数据单元格
      cell: {
        backgroundColor: 'transparent',
        crossBackgroundColor: 'rgba(219, 235, 255, 0.3)',
        ...borderSetting
      },
      text: {
        textAlign: tableSetting.align
      }
    },
    splitLine: {
      horizontalBorderWidth: tableSetting.inner.width,
      horizontalBorderColor: tableSetting.inner.color,
      horizontalBorderColorOpacity: 0.6,
      verticalBorderWidth: tableSetting.inner.width,
      verticalBorderColor: tableSetting.inner.color,
      verticalBorderColorOpacity: 0.6
    }
  };
};
