<template>
  <div class="chart">
    <div id="canvas"></div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, Ref, ref } from 'vue';
import chart from '../../lib/index';
import axios from 'axios';
import pieConfig from './pieConfig/index';

let data: Ref<Record<string, any>> = ref({});

const getData = async () => {
  const res = await axios.get('/data/pie/pie.json');
  data.value = res.data;
};

onMounted(async () => {
  await getData();
  const config = pieConfig(data.value.config, data.value.data);
  console.log('config:::', config);
  let pie = new chart.Pie({
    id: 'canvas',
    chartData: data.value.data,
    ...config
  });

  pie.render();
});
</script>

<style  lang="scss" scoped>
.chart {
  width: 1000px;
  height: 600px;
  border: 2px solid #ccc;
  > div {
    width: 100%;
    height: 100%;
  }
}
</style>