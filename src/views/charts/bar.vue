<template>
  <div>
    <div id="canvas"></div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, Ref, ref } from 'vue';
import chart from '../../lib/index';
import axios from 'axios';

let config: Ref<Record<string, any>> = ref({});

const getData = async () => {
  const res = await axios.get('/data/bar/bar.json');
  config.value = res.data;
};

onMounted(async () => {
  await getData();
  new chart.Bar({
    id: 'canvas',
    width: 1000,
    height: 600,
    renderer: 'svg',
    config: config.value
  });
});
</script>

<style  lang="scss" scoped>
#canvas {
  width: 1000px;
  height: 600px;
  border: 2px solid #ccc;
}
</style>