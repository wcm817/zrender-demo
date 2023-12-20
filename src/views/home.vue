<template>
  <div class="home">
    <div class="title">{{ currentRouteData.title }}</div>
    <div class="content">
      <ul class="nav">
        <li
          v-for="item in menuList"
          :key="item.name"
          :class="$route.name === item.name ? 'active' : ''"
        >
          <router-link :to="item.path">{{ item.title }}</router-link>
        </li>
      </ul>
      <div class="chart-box">
        <router-view></router-view>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'Home',
  components: {},
  data () {
    return {
      menuList: [
        {
          path: '/resizeGroup',
          name: 'resizeGroup',
          title: 'rg初始粗略版'
        },
        {
          path: '/resizeGroupWithDirection',
          name: 'resizeGroupWithDirection',
          title: 'rg控制方向'
        },
        {
          path: '/bar',
          name: 'bar',
          title: '简单套用柱状图（rg）'
        },
        {
          path: '/pie',
          name: 'pie',
          title: '饼图'
        },
        {
          path: '/funnel',
          name: 'funnel',
          title: '漏斗图'
        },
        {
          path: '/table',
          name: 'table',
          title: '表格'
        },
        {
          path: '/radar',
          name: 'radar',
          title: '雷达图'
        },
      ]
    }
  },
  computed: {
    currentRouteData () {
      return this.menuList.find(item => this.$route.name === item.name)
    }
  },
  created () { },
  mounted () { },
  methods: {}
}
</script>

<style lang="scss" scoped>
.home {
  height: 100%;
  .title {
    height: 50px;
    line-height: 50px;
    background-color: #eee;
    padding-left: 12px;
    text-align: center;
  }
}
.content {
  display: flex;
  height: calc(100% - 50px);
  .nav {
    width: 200px;
    border-right: 1px #ccc solid;
    box-shadow: 5px 10px 8px 2px #eee;
    margin: 0;
    list-style: none;
    padding: 10px 0;
    li {
      padding-left: 12px;
      height: 40px;
      line-height: 40px;
      a {
        text-decoration: none;
        color: #333;
        display: block;
        height: 100%;
      }
      &.active {
        border-left: 2px solid #0094ff;
        a {
          color: #0094ff;
        }
      }
    }
  }
  .chart-box {
    padding: 20px;
  }
}
</style>
