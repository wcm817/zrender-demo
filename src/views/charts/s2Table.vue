<template>
  <div class="chart">
    <!-- <div>
      测试图标
      <span style="font-family: 'iconfont'">&#xe6d6;</span>
    </div> -->
    <div id="canvas"></div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, Ref, ref } from 'vue';
import chart from '../../lib/index';
import axios from 'axios';
import tableConfig from './tableConfig/index';

const catList = [
  {
    data_type: 'STRING',
    feature_idx: 3,
    feature_name: 'Name',
    formula_type: null,
    parent_feature_idx: null,
    reference_count: 0,
    sub_feature_idx: null,
    unique_num: 891,
    dtype: 'CAT'
  },
  {
    data_type: 'STRING',
    feature_idx: 8,
    feature_name: 'Ticket',
    formula_type: null,
    parent_feature_idx: null,
    reference_count: 0,
    sub_feature_idx: null,
    unique_num: 681,
    dtype: 'CAT'
  },
  {
    data_type: 'STRING',
    feature_idx: 10,
    feature_name: 'Cabin',
    formula_type: null,
    parent_feature_idx: null,
    reference_count: 0,
    sub_feature_idx: null,
    unique_num: 148,
    dtype: 'CAT'
  },
  {
    data_type: 'GROUP',
    feature_idx: 12,
    feature_name: 'test',
    formula_type: null,
    groups: [
      {
        data_type: 'STRING',
        feature_idx: 4,
        feature_name: 'Sex',
        formula_type: null,
        parent_feature_idx: 12,
        reference_count: 0,
        sub_feature_idx: 11,
        unique_num: 2,
        dtype: 'CAT'
      },
      {
        data_type: 'STRING',
        feature_idx: 11,
        feature_name: 'Embarked',
        formula_type: null,
        parent_feature_idx: 4,
        reference_count: 0,
        sub_feature_idx: null,
        unique_num: 4,
        dtype: 'CAT'
      }
    ],
    parent_feature_idx: null,
    reference_count: 0,
    sub_feature_idx: 4,
    unique_num: null
  }
];
let data: Ref<Record<string, any>> = ref({});

const getData = async () => {
  const res = await axios.get('/data/table/table.json');
  data.value = res.data;
};

onMounted(async () => {
  await getData();
  const dom = document.querySelector('#canvas');
  if (dom) {
    dom.innerHTML = '';
  }

  const config = tableConfig(data.value.config, data.value.data, catList);

  let s2Table = new chart.Table({
    id: 'canvas',
    chartData: data.value.data,
    ...config
  });
  s2Table.render();
});
</script>

<style lang="scss">
.chart {
  width: 1000px;
  height: 600px;
  border: 2px solid #ccc;
  > div {
    width: 100%;
    height: 100%;
  }
}
/* .antv-s2-tooltip-container {
  position: absolute;
} */
.antv-s2-tooltip-container-hide {
  visibility: hidden;
}
</style>
