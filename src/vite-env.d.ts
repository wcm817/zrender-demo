/// <reference types="vite/client" />

// ts中以下代码不警报
declare module '*.vue' {
  import Vue from 'vue';
  export default Vue;
}