import {
  CornerCell,
  RowCell,
  ColCell,
  DataCell,
  renderLine,
  CellBorderPosition,
  getBorderPositionAndStyle,
  // renderText,
  // getEmptyPlaceholder,
  // getEllipsisText

} from "@antv/s2";

// import img from './totop.png';

/**
 * 自定义CornerCell 角头单元格
 */
class CustomCornerCell extends CornerCell {
  // 重构绘制border函数
  drawBorderShape() {
    [CellBorderPosition.TOP, CellBorderPosition.LEFT].forEach((type) => {
      const { position, style } = getBorderPositionAndStyle(
        type,
        this.getCellArea(),
        // @ts-ignore
        this.getStyle().cell
      );
      // @ts-ignore
      const { borderConfig } = this.headerConfig;
      const newStyle = {
        ...style,
        lineWidth: borderConfig.inner.width,
        stroke: borderConfig.inner.color,
        strokeOpacity: 1
      };

      const leftOutterFlag = type === 'LEFT' && this.meta.x === 0;
      const topOutterFlag = type === 'TOP' && this.meta.x === 0 && this.meta.y === 0;
      if (leftOutterFlag && topOutterFlag) {
        newStyle.stroke = 'transparent';
        newStyle.lineWidth = 1;
      }
      renderLine(this, position, newStyle);
    });
  }

  getTextStyle() {
    const headConfig = this.headerConfig;
    const field = this.meta.field;
    const arr = ['$$extra$$', ...headConfig.columns];
    const defaultTextStyle = super.getTextStyle();
    return {
      ...defaultTextStyle,
      // @ts-ignore
      fill: arr.includes(field) || this.headerConfig.hideText ? 'transparent' : defaultTextStyle.fill
    };
  }
}

/**
 * 自定义 RowCell 行头单元格
 */
class CustomRowCell extends RowCell {
  // 重构绘制border
  drawRectBorder() {
    const { x } = this.getCellArea();
    const contentIndent = this.getContentIndent();
    const finalX = this.spreadsheet.isHierarchyTreeType()
      ? x
      : x + contentIndent;

    [CellBorderPosition.BOTTOM, CellBorderPosition.LEFT].forEach((type) => {
      const { position, style } = getBorderPositionAndStyle(
        type,
        {
          ...this.getCellArea(),
          x: finalX
        },
        // @ts-ignore
        this.getStyle().cell
      );
      // @ts-ignore
      const { borderConfig } = this.headerConfig;
      const newStyle = {
        ...style,
        lineWidth: borderConfig.inner.width,
        stroke: borderConfig.inner.color,
        strokeOpacity: 1
      };
      if (type === 'LEFT' && this.meta.x === 0) {
        newStyle.stroke = 'transparent';
        newStyle.lineWidth = 1;
      }
      // if (type === 'BOTTOM') {
      //   const flag = this.headerConfig.data[this.headerConfig.data.length - 1].id.includes(this.meta.id);
      //   if (flag) {
      //     newStyle.stroke = borderConfig.outter.color;
      //     newStyle.lineWidth = 1;
      //   }
      // }
      renderLine(this, position, newStyle);
    });

  }

  // 覆盖背景绘制，可覆盖或者增加绘制方法
  drawBackgroundShape() {
    const { rowIndex } = this.meta;
    this.backgroundShape = this.addShape('rect', {
      attrs: {
        ...this.getCellArea(),
        fill: rowIndex % 2 === 0 ? 'rgba(219, 235, 255, 0.3)' : 'transparent'
      }
    });
  }

  getTextStyle() {
    const defaultTextStyle = super.getTextStyle();
    return {
      ...defaultTextStyle,
      // @ts-ignore
      fill: this.headerConfig.hideText ? 'transparent' : defaultTextStyle.fill
    };
  }
}



/**
 * 自定义 ColCell 列头单元格
 */
class CustomColCell extends ColCell {
  // drawTextShape() {
  //   const { formattedValue } = this.getFormattedFieldValue();
  //   const maxTextWidth = this.getMaxTextWidth();
  //   const textStyle = this.getTextStyle();
  //   const {
  //     options: { placeholder },
  //     measureTextWidth,
  //   } = this.spreadsheet;
  //   const emptyPlaceholder = getEmptyPlaceholder(this, placeholder);
  //   const ellipsisText = getEllipsisText({
  //     measureTextWidth,
  //     text: formattedValue,
  //     maxWidth: maxTextWidth,
  //     fontParam: textStyle,
  //     placeholder: emptyPlaceholder,
  //   });
  //   this.actualText = ellipsisText;
  //   this.actualTextWidth = measureTextWidth(ellipsisText, textStyle);
  //   const position = this.getTextPosition();
  //   // this.textShape = renderText(
  //   //   this,
  //   //   [this.textShape],
  //   //   position.x,
  //   //   position.y,
  //   //   ellipsisText,
  //   //   textStyle,
  //   // );
  //   // this.textShapes.push(this.textShape);

  //   this.addShape('text', {
  //     attrs: {
  //       x: position.x,
  //       y: position.y / 2,
  //       text: ellipsisText,
  //       ...textStyle,
  //     },
  //   });

  //   this.addShape('text', {
  //     attrs: {
  //       x: position.x,
  //       y: position.y + 10,
  //       text: 'Good',
  //       ...textStyle,
  //     },
  //   });

  //   this.addShape('image', {
  //     attrs: {
  //       x: position.x + 60,
  //       y: position.y,
  //       width: 20,
  //       height: 20,
  //       img,
  //     },
  //   });
  // }


  // 重构绘制border
  drawBorders() {
    [CellBorderPosition.TOP, CellBorderPosition.RIGHT].forEach((type) => {
      const { position, style } = getBorderPositionAndStyle(
        type,
        this.getCellArea(),
        // @ts-ignore
        this.getStyle().cell
      );
      // @ts-ignore
      const { borderConfig } = this.headerConfig;
      const newStyle = {
        ...style,
        lineWidth: borderConfig.inner.width,
        stroke: borderConfig.inner.color,
        strokeOpacity: 1
      };
      const lastNodeX = this.headerConfig.viewportWidth + (this.headerConfig.scrollX || 0) - this.meta.width;
      const topOutterFlag = type === 'TOP' && this.meta.y === 0;
      const rightOutterFlag = type === 'RIGHT' && (this.meta.x === lastNodeX);
      if (topOutterFlag || rightOutterFlag) {
        newStyle.stroke = 'transparent';
        newStyle.lineWidth = 1;
      }
      renderLine(this, position, newStyle);
    });

    // const textStyle = this.getTextStyle();
    // const position = this.getTextPosition();

  }

  getTextStyle() {
    const defaultTextStyle = super.getTextStyle();
    return {
      ...defaultTextStyle,
      // @ts-ignore
      fill: this.headerConfig.hideText ? 'transparent' : defaultTextStyle.fill
    };


  }
}

// 数据单元格
class CustomDataCell extends DataCell {
  constructor(meta: any, spreadsheet: any, dataConfig: Record<string, any>) {
    super({ ...meta, ...dataConfig }, spreadsheet);
  }

  // 重构绘制border
  drawBorderShape() {
    [CellBorderPosition.BOTTOM, CellBorderPosition.RIGHT].forEach((type) => {
      const { position, style } = getBorderPositionAndStyle(
        type,
        this.getCellArea(),
        // @ts-ignore
        this.getStyle().cell
      );

      const { borderConfig } = this.meta;
      const newStyle = {
        ...style,
        // @ts-ignore
        lineWidth: borderConfig.inner.width,
        // @ts-ignore
        stroke: borderConfig.inner.color,
        strokeOpacity: 1
      };

      renderLine(this, position, newStyle);
    });
  }

  getTextStyle() {
    const defaultTextStyle = super.getTextStyle();
    // const { valueField, data } = this.meta;
    // // @ts-ignore
    // const textStyle = this.meta.labelsListKeyMap[valueField]?.text || {};
    // const compute = data.compute || '';
    // const linear = data.linear || '';
    // const colorInfo = data.colorInfo || [];
    // const originValue = data[`origin_${valueField}`];
    // let linearColor = '';
    // if (compute) {
    //   let overflowColor = (originValue > colorInfo[1].originValue) && colorInfo[1].color;
    //   if (originValue === null) {
    //     overflowColor = colorInfo[0].color;
    //   }
    //   linearColor = overflowColor || compute(linear(originValue));
    // }
    return {
      ...defaultTextStyle,
      // fontSize: textStyle.fontSize,
      // fill: linearColor || textStyle.fontColor,
      // textAlign: textStyle.align
    };
  }
}

export {
  CustomCornerCell,
  CustomRowCell,
  CustomColCell,
  CustomDataCell
};
