<!--<script setup lang="ts">
</script>

<template>
  <div class="header">
    <div>
      &lt;!&ndash; 1. 调整viewBox（最后一位60）和添加height="200" &ndash;&gt;
      <svg class="waves" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"
           viewBox="0 24 150 60" preserveAspectRatio="none" shape-rendering="auto" height="200">
        <defs>
          <path id="gentle-wave"
                d="M-160 44c30 0 58-18 88-18s 58 18 88 18 58-18 88-18 58 18 88 18 v44h-352z"/>
        </defs>
        <g class="parallax">
          <use xlink:href="#gentle-wave" x="48" y="0" fill="rgba(255, 255, 255, 0.58)"/>
          <use xlink:href="#gentle-wave" x="48" y="3" fill="rgba(255, 255, 255, 0.58)"/>
          <use xlink:href="#gentle-wave" x="48" y="5" fill="rgba(255, 255, 255, 0.58)"/>
          <use xlink:href="#gentle-wave" x="48" y="7" fill="rgba(255, 255, 255, 0.58)"/>
        </g>
      </svg>
    </div>
  </div>
</template>

<style scoped lang="scss">
* {
  padding: 0;
  margin: 0;
}

h1 {
  font-weight: 300;
  letter-spacing: 2px;
  font-size: 48px;
}

p {
  font-family: 'Lato', sans-serif;
  letter-spacing: 1px;
  font-size: 30px;
  color: #333333;
}

/* 2. 修改.header：设置固定高度，移除max-height */
.header {
  position: absolute;
  left: 0;
  bottom: 0;
  width: 100%;
  height: 200px; /* 与SVG height一致 */
  min-height: 150px;
  z-index: -1;
}

.inner-header {
  height: 65vh;
  width: 100%;
  margin: 0;
  padding: 0;
}

.flex {
  display: flex;
  justify-content: center;
  align-items: center;
  text-align: center;
}

/* 3. 修改.waves：占满父容器，移除max-height */
.waves {
  position: relative;
  width: 100%;
  height: 100%; /* 占满.header */
  margin-bottom: -7px;
  min-height: 150px;
}

.content {
  position: relative;
  height: 20vh;
  text-align: center;
  background-color: white;
}

.parallax > use {
  animation: move-forever 25s cubic-bezier(.55, .5, .45, .5) infinite;
}

.parallax > use:nth-child(1) {
  animation-delay: -2s;
  animation-duration: 7s;
}

.parallax > use:nth-child(2) {
  animation-delay: -3s;
  animation-duration: 10s;
}

.parallax > use:nth-child(3) {
  animation-delay: -4s;
  animation-duration: 13s;
}

.parallax > use:nth-child(4) {
  animation-delay: -5s;
  animation-duration: 20s;
}

@keyframes move-forever {
  0% {
    transform: translate3d(-90px, 0, 0);
  }

  100% {
    transform: translate3d(85px, 0, 0);
  }
}

/* 4. 同步调整移动端适配 */
@media (max-width: 910px) {
  .waves {
    height: 100%;
    min-height: 120px;
  }

  .header {
    height: 150px;
    bottom: 0; /* 取消负边距，避免截断 */
  }
}
</style>-->







<script setup lang="ts">
</script>

<template>
  <div class="header">
    <div>
      <svg class="waves" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"
           viewBox="0 24 150 28" preserveAspectRatio="none" shape-rendering="auto">
        <defs>
          <path id="gentle-wave"
                d="M-160 44c30 0 58-18 88-18s 58 18 88 18 58-18 88-18 58 18 88 18 v44h-352z"/>
        </defs>
        <g class="parallax">
          <!-- 修改 fill 属性值为你想要的颜色 -->
          <use xlink:href="#gentle-wave" x="48" y="0" fill="var(--wave1)"/>
          <use xlink:href="#gentle-wave" x="48" y="3" fill="var(--wave2)"/>
          <use xlink:href="#gentle-wave" x="48" y="5" fill="var(--wave1)"/>
          <use xlink:href="#gentle-wave" x="48" y="7" fill="var(--wave2)"/>
        </g>
      </svg>
    </div>
  </div>
</template>

<style scoped lang="scss">
* {
  padding: 0;
  margin: 0;
}

h1 {
  font-weight: 300;
  letter-spacing: 2px;
  font-size: 48px;
}

p {
  font-family: 'Lato', sans-serif;
  letter-spacing: 1px;
  font-size: 30px;
  color: #333333;
}

.header {
  position: absolute;
  left: 0;
  bottom: 0;
  width: 100%;
  height: 0;
  min-height: 100px;
  max-height: 9.375rem;
  z-index: -1;
}

.inner-header {
  height: 65vh;
  width: 100%;
  margin: 0;
  padding: 0;
}

.flex {
  display: flex;
  justify-content: center;
  align-items: center;
  text-align: center;
}

.waves {
  position: relative;
  width: 100%;
  height: 15vh;
  margin-bottom: -7px;
  min-height: 100px;
  max-height: 150px;
}

.content {
  position: relative;
  height: 20vh;
  text-align: center;
  background-color: white;
}

.parallax > use {
  animation: move-forever 25s cubic-bezier(.55, .5, .45, .5) infinite;
}

.parallax > use:nth-child(1) {
  animation-delay: -2s;
  animation-duration: 7s;
}

.parallax > use:nth-child(2) {
  animation-delay: -3s;
  animation-duration: 10s;
}

.parallax > use:nth-child(3) {
  animation-delay: -4s;
  animation-duration: 13s;
}

.parallax > use:nth-child(4) {
  animation-delay: -5s;
  animation-duration: 20s;
}

@keyframes move-forever {
  0% {
    transform: translate3d(-90px, 0, 0);
  }

  100% {
    transform: translate3d(85px, 0, 0);
  }
}

@media (max-width: 910px) {
  .waves {
    height: 70px;
    min-height: 70px;
    max-height: 150px;
  }

  .header {
    bottom: -40px;
  }
}
</style>
