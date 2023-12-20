<template>
  <div>
    <div id="canvas"></div>
  </div>
</template>

<script setup lang="ts">
import * as zrender from 'zrender';
import { ZRenderType } from 'zrender';
import { onMounted, watch, ref } from 'vue';
import ResizeGroup from '@/utils/resizeGroup';

let zr: ZRenderType;
let rect: zrender.Rect;
let cir: zrender.Circle;
let rgBoundingRect: any = ref({});
let rgBoundingRect2: any = ref({});
let rg2: ResizeGroup;

// 监听rg的数据变化
watch(
  rgBoundingRect,
  (val) => {
    const { width } = val || {};
    const moveX = width - rect.getBoundingRect().width;

    rect.attr({
      shape: {
        x: 0,
        y: 0,
        width: width,
        height: 380
      }
    });

    const rg2Width = rgBoundingRect2.value.width || 200;
    rg2.resize({
      x: width,
      y: 0,
      width: rg2Width > zr.getWidth() - width ? rg2Width - moveX : rg2Width,
      height: 380
    });
  },
  {
    deep: true
  }
);

// 监听rg2的数据变化
watch(
  rgBoundingRect2,
  (val) => {
    const { x, width } = val || {};
    cir.attr({
      shape: {
        cx: x + width / 2
      }
    });
  },
  {
    deep: true
  }
);

onMounted(() => {
  const dom: HTMLElement | null = document.querySelector('#canvas');
  zr = zrender.init(dom, {
    renderer: 'svg',
    width: 600,
    height: 600
  });

  // +++++++++++++rg++++++++++++++++++++++
  const rg: ResizeGroup = new ResizeGroup({
    zr,
    x: 0,
    y: 0,
    width: 100,
    height: 380
  });
  rect = new zrender.Rect({
    shape: {
      x: 0,
      y: 0,
      width: 100,
      height: 380
    },
    style: {
      stroke: 'yellow',
      fill: 'transparent'
    }
  });

  rg.on('groupresize', (data: any) => {
    rgBoundingRect.value = data;
  });
  rg.add(rect);

  // +++++++++++++rg2++++++++++++++++++++++
  cir = new zrender.Circle({
    shape: {
      cx: 200,
      cy: 100,
      r: 100
    },
    style: {
      fill: 'blue'
    }
  });

  zr.add(rg);
  rg2 = new ResizeGroup({
    zr,
    x: 100,
    y: 0,
    width: 200,
    height: 380
  });
  rg2.on('groupresize', (data: any) => {
    rgBoundingRect2.value = data;
  });
  rg2.add(cir);
  zr.add(rg2);
});
</script>

<style lang="scss" scoped>
#canvas {
  background-color: lightblue;
}
</style>