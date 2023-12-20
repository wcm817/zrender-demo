<template>
  <div class="chart">
    <div id="canvas"></div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, Ref, ref } from 'vue';
import chart from '../../lib/index';
import axios from 'axios';
import radarConfig from './radarConfig/index';

let data: Ref<Record<string, any>> = ref({});

const getData = async () => {
  const res = await axios.get('/data/radar/radar.json');
  data.value = res.data;
};

onMounted(async () => {
  await getData();
  const config = radarConfig(data.value.config, data.value.data);
  console.log('config:::', config);
  let radar = new chart.Radar({
    id: 'canvas',
    chartData: data.value.data,
    ...config
  });

  radar.render();

  // let pie1 = new chart.Radar({
  //   id: 'canvas',
  //   data: data.value.data,
  //   legendOption: getLegendOption({ ...data.value.config, type: 'radar' }),
  //   config: data.value.config
  // });

  // pie1.render();
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