export default (drillFeature: any, actionClick: Function) => {
  const { rowDrillFeature, columnDrillFeature } = drillFeature;
  return {
    // 自定义图标
    customSVGIcons: [
      {
        name: 'MyDrillDownIcon',
        svg: `<?xml version="1.0" standalone="no"?><!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">
      <svg t="1694574253396" class="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="7557" xmlns:xlink="http://www.w3.org/1999/xlink" width="200" height="200" style="transform: rotate(180deg);">
        <path d="M224.128 377.002667a42.666667 42.666667 0 0 0 63.744 56.661333L384 325.546667V768a42.666667 42.666667 0 0 0 42.666667 42.666667h267.434666A85.333333 85.333333 0 0 0 853.333333 768a85.333333 85.333333 0 0 0-159.232-42.666667H469.333333V325.546667l96.128 108.117333a42.666667 42.666667 0 0 0 63.744-56.661333l-170.666666-192a42.666667 42.666667 0 0 0-63.744 0l-170.666667 192z" fill="#333333" p-id="7558"></path>
      </svg>`
      }
    ],
    // 表头图标
    headerActionIcons: [
      {
        iconNames: ['MyDrillDownIcon'],
        belongsCell: 'rowCell',
        defaultHide: true,
        displayCondition: (meta: any) => {
          return rowDrillFeature.includes(meta.key);
        },
        onClick: (props: any) => {
          const { meta, event } = props;
          const { key, value } = meta;
          actionClick && actionClick({ [key]: value }, event.originalEvent);
        }
      },
      {
        iconNames: ['MyDrillDownIcon'],
        belongsCell: 'colCell',
        defaultHide: true,
        displayCondition: (meta: any) => {
          return columnDrillFeature.includes(meta.key);
        },
        onClick: (props: any) => {
          const { meta, event } = props;
          const { key, value } = meta;
          actionClick && actionClick({ [key]: value }, event.originalEvent);
        }
      }
    ]
  };
};