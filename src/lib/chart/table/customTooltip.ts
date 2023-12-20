import {
  BaseEvent,
  S2Event
} from "@antv/s2";
import { dataProcess } from "../../../utils/utils";

export default class CellHoverTooltipInteraction extends BaseEvent {
  bindEvents() {
    // 行头hover
    this.spreadsheet.on(S2Event.ROW_CELL_HOVER, (event) => {
      this.showTooltip(event);
    });
    // this.spreadsheet.on(S2Event.ROW_CELL_CLICK, (event) => {
    //   this.showTooltip(event);
    // });
    // 列头hover
    this.spreadsheet.on(S2Event.COL_CELL_HOVER, (event) => {
      this.showTooltip(event);
    });
    // this.spreadsheet.on(S2Event.COL_CELL_CLICK, (event) => {
    //   this.showTooltip(event);
    // });
    // 数据单元格hover
    this.spreadsheet.on(S2Event.DATA_CELL_HOVER, (event) => {
      this.showDataTooltip(event);
    });
    this.spreadsheet.on(S2Event.DATA_CELL_CLICK, (event) => {
      this.showDataTooltip(event);
    });
  }

  showTooltip(event: any) {
    const cell = this.spreadsheet.getCell(event.target);
    const meta = cell.getMeta();
    const content = meta.value;
    this.spreadsheet.tooltip.show({
      position: {
        x: event.clientX,
        y: event.clientY
      },
      content
    });
  }

  showDataTooltip(event: any) {
    const cell = this.spreadsheet.getCell(event.target);
    const meta = cell.getMeta();
    const { hideColHeader, hideRowHeader } = meta;
    let contentListObj: Record<string, any> = { [meta.valueField]: meta.fieldValue };
    const colQuery = hideColHeader ? {} : { ...meta.colQuery };
    delete colQuery.allColCats;
    delete colQuery['$$extra$$'];
    const rowQuery = hideRowHeader ? {} : { ...meta.rowQuery };
    delete rowQuery['$$extra$$'];
    contentListObj = { ...contentListObj, ...colQuery, ...rowQuery };

    let html = ``;
    for (let i = 0; i < Object.keys(contentListObj).length; i++) {
      const key = Object.keys(contentListObj)[i];
      const value = contentListObj[key];
      const infos = meta.tooltipListKeymap[key];
      if (infos.display === 'none') { continue; }
      const textStyle = infos?.text || {};
      const format = infos.format;
      html += `
        <div style="text-align: ${textStyle.align}; color: ${textStyle.fontColor}; font-size: ${textStyle.fontSize}px; line-height: ${textStyle.lineHeight}px;">
          <span>${infos.title}</span>: 
          <span>${format.type === 'linear' ? dataProcess(value, format) : value}</span>
        </div>
      `;
    }
    this.spreadsheet.tooltip.show({
      position: {
        x: event.clientX,
        y: event.clientY
      },
      content: html
    });
  }
}