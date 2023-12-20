<template>
  <div>
    <div class="btn-block">
      <button
        :class="currentActive === 1 ? 'active' : ''"
        @click="handleClickBtn(1)"
      >
        上移
      </button>
      <button
        :class="currentActive === 2 ? 'active' : ''"
        @click="handleClickBtn(2)"
      >
        下移
      </button>
      <button
        :class="currentActive === 3 ? 'active' : ''"
        @click="handleClickBtn(3)"
      >
        左移
      </button>
      <button
        :class="currentActive === 4 ? 'active' : ''"
        @click="handleClickBtn(4)"
      >
        右移
      </button>
    </div>
    <div id="canvas"></div>
  </div>
</template>

<script setup lang="ts">
import * as zrender from 'zrender';
import { ZRenderType } from 'zrender';
import { onMounted, watch, ref, Ref } from 'vue';
import ResizeGroup, { Direction } from '../utils/resizeGroupWithDirection';

let zr: ZRenderType;
let cir: zrender.Circle;
let rg: ResizeGroup;
let rgBoundingRect: Ref<Record<string, any>> = ref({});
let currentActive: Ref<number> = ref(4);
let direction: Ref<Direction> = ref('right');

watch(currentActive, (val) => {
  const directionMap: any = {
    1: 'top',
    2: 'bottom',
    3: 'left',
    4: 'right'
  };
  direction.value = directionMap[val] || 'right';

  rg.removeAll();
  drawChart();
});

// 监听rg2的数据变化
// watch(
//   rgBoundingRect,
//   (val) => {
//     // const { x, y, width, height } = val || {};
//     // const cx = x >= 100 ? 100 + x + width - 200 : x + 100;
//     // const cy = y >= 100 ? 100 + y + height - 380 : y + 100;
//     // cir.attr({
//     //   shape: {
//     //     cx: cx,
//     //     cy: cy,
//     //     r: 100
//     //   }
//     // });
//     const { x, y, width, height } = val || {};
//     const moveX = x >= 100 ? width - 200 : 200 - width;
//     const moveY = y >= 100 ? height - 380 : 380 - height;
//     cir.setPosition([moveX, moveY]);
//   },
//   {
//     deep: true
//   }
// );

onMounted(() => {
  const dom: HTMLElement | null = document.querySelector('#canvas');
  zr = zrender.init(dom, {
    renderer: 'svg',
    width: 600,
    height: 600
  });
  drawChart();
});

function handleClickBtn(num: number): void {
  currentActive.value = num;
}

function drawChart() {
  cir = new zrender.Circle({
    shape: {
      cx: 200,
      cy: 200,
      r: 100
    },
    style: {
      fill: 'blue'
    }
  });
  rg = new ResizeGroup({
    zr,
    x: 100,
    y: 100,
    width: 200,
    height: 380,
    resizeDirection: direction.value,
    lineColor: 'red'
  });
  rg.on('groupresize', (data: any) => {
    rgBoundingRect.value = data;
  });
  rg.add(cir);
  zr.add(rg);
}
</script>

<style  lang="scss" scoped>
.btn-block {
  width: 600px;
  margin-bottom: 12px;
  display: flex;
  justify-content: center;
  button {
    padding: 4px 12px;
    border: 1px solid skyblue;
    background-color: lightblue;
    margin-right: 6px;
    &.active {
      background-color: lightyellow;
    }
  }
}
#canvas {
  width: 600px;
  height: 600px;
  background-color: lightblue;
}
</style>