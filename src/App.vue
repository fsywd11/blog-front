<script setup>
import {darkStore} from "@/stores/darkInfo.js";
const darkstore = darkStore();
import {onMounted} from "vue";
onMounted(() => {
  darkstore.initDarkMode();
})
</script>

<template>
  <router-view></router-view>
</template>

<style scoped>

</style>
