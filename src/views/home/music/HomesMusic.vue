<script setup lang="js">
import { ref, computed, onMounted, watch } from 'vue';
import { playlistApi, songApi } from '@/api/music.js';

// 工具类 - 颜色处理
const colorUtils = {
  isLightColor(color) {
    const lightColors = ['#ffffff', '#f5f5f7', '#fde68a', '#dbeafe', '#e0e7ff', '#fef2f2'];
    return lightColors.includes(color);
  }
};

// 工具类 - 时间格式化
const timeUtils = {
  formatTime(ms) {
    if (!ms) return '0:00';

    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;

    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }
};

// 解析歌词
const parseLyrics = (lyricString) => {
  if (!lyricString) return [];

  const lines = lyricString.split('\n');
  const lyrics = [];

  // 匹配歌词时间的正则表达式
  const timeRegex = /\[(\d{2}):(\d{2})\.(\d{2,3})/;

  lines.forEach(line => {
    const result = timeRegex.exec(line);
    if (!result) return;

    // 解析时间
    const minutes = parseInt(result[1], 10);
    const seconds = parseInt(result[2], 10);
    const milliseconds = result[3].length === 3
        ? parseInt(result[3], 10)
        : parseInt(result[3], 10) * 10; // 处理两位数的毫秒

    const time = minutes * 60 * 1000 + seconds * 1000 + milliseconds;

    // 获取歌词文本
    const text = line.replace(timeRegex, '').trim();

    if (text) {
      lyrics.push({ time, text });
    }
  });

  // 按时间排序
  return lyrics.sort((a, b) => a.time - b.time);
};

// 背景颜色设置
const bgColors = [
  '#ffffff',       // 白色
  '#f5f5f7',       // 浅灰
  '#121212',       // 深黑
  '#fde68a',       // 浅黄
  '#dbeafe',       // 浅蓝
  '#e0e7ff',       // 淡紫
  '#fef2f2',       // 淡红
];
const colorNames = [
  '白色', '浅灰', '深黑', '浅黄', '浅蓝', '淡紫', '淡红'
];
const currentBgIndex = ref(0);
const currentBgColor = ref('#ffffff');

// 歌单分类数据
const categories = ref({
  main: [],    // 主分类
  sub: []      // 子分类
});
const activeCategoryType = ref('main'); // 'main' 或 'sub'
const activeCategory = ref('');
const loadingCategories = ref(false);

// 歌单数据
const playlists = ref([]);
const currentPlaylistId = ref(null);
const currentPlaylistName = ref('');
const showPlaylists = ref(true);

// 歌曲数据 - 始终保留歌曲列表
const songs = ref([]);
const currentSongIndex = ref(-1);
const currentSong = ref(null);
const currentSongUrl = ref('');
const searchQuery = ref('');

// 播放状态 - 初始音量设置为20
const isPlaying = ref(false);
const currentTime = ref(0);
const progress = ref(0);
const volume = ref(20); // 初始音量修改为20
const loopMode = ref('all'); // 'all', 'single', 'none'
const shuffleMode = ref(false);

// 歌词相关 - 始终保留歌词容器
const showLyrics = ref(false);
const lyrics = ref([]);
const currentLyricIndex = ref(-1);
const lyricsOffset = ref(0);
const loadingLyrics = ref(false);
const lyricsError = ref(false);

// 加载状态
const loading = ref(false);
const error = ref('');

// 音频元素引用
const audioPlayer = ref(null);

// 动态样式计算
const headerStyle = computed(() => {
  const isLight = colorUtils.isLightColor(currentBgColor.value);
  return {
    backgroundColor: isLight ? '#f5f5f7' : '#282828',
    borderBottom: `1px solid ${isLight ? '#e0e0e0' : '#333'}`
  };
});

const sidebarStyle = computed(() => {
  const isLight = colorUtils.isLightColor(currentBgColor.value);
  return {
    backgroundColor: isLight ? '#f8f9fa' : '#1e1e1e',
    color: isLight ? '#333' : '#ddd'
  };
});

const contentStyle = computed(() => {
  const isLight = colorUtils.isLightColor(currentBgColor.value);
  return {
    backgroundColor: currentBgColor.value,
    color: isLight ? '#333' : '#ddd'
  };
});

const footerStyle = computed(() => {
  const isLight = colorUtils.isLightColor(currentBgColor.value);
  return {
    backgroundColor: isLight ? '#f5f5f7' : '#282828',
    borderTop: `1px solid ${isLight ? '#e0e0e0' : '#333'}`
  };
});

const textStyle = computed(() => {
  const isLight = colorUtils.isLightColor(currentBgColor.value);
  return {
    color: isLight ? '#000' : '#fff'
  };
});

const secondaryTextStyle = computed(() => {
  const isLight = colorUtils.isLightColor(currentBgColor.value);
  return {
    color: isLight ? '#666' : '#aaa'
  };
});

const inputStyle = computed(() => {
  const isLight = colorUtils.isLightColor(currentBgColor.value);
  return {
    backgroundColor: isLight ? '#e9ecef' : '#333',
    color: isLight ? '#000' : '#fff',
    border: `1px solid ${isLight ? '#ddd' : 'transparent'}`
  };
});

const categoryItemStyle = computed(() => {
  const isLight = colorUtils.isLightColor(currentBgColor.value);
  return {
    color: isLight ? '#333' : '#ddd',
    backgroundColor: 'transparent'
  };
});

const songItemStyle = computed(() => {
  const isLight = colorUtils.isLightColor(currentBgColor.value);
  return {
    borderBottom: `1px solid ${isLight ? '#f0f0f0' : '#282828'}`
  };
});

const controlBtnStyle = computed(() => {
  const isLight = colorUtils.isLightColor(currentBgColor.value);
  return {
    color: isLight ? '#666' : '#aaa'
  };
});

const cardStyle = computed(() => {
  const isLight = colorUtils.isLightColor(currentBgColor.value);
  return {
    backgroundColor: isLight ? 'rgba(255, 255, 255, 0.8)' : 'rgba(30, 30, 30, 0.8)',
    boxShadow: isLight ? '0 2px 8px rgba(0, 0, 0, 0.05)' : '0 2px 8px rgba(0, 0, 0, 0.3)'
  };
});

// 歌词高亮样式 - 增强的视觉效果
const activeLyricStyle = computed(() => {
  return {
    color: '#1db954',  // 网易云绿色作为高亮主色
    fontWeight: 'bold',
    transform: 'scale(1.08)',  // 轻微放大
    textShadow: '0 0 8px rgba(29, 185, 84, 0.3)',  // 添加发光效果
    transition: 'all 0.3s ease'  // 平滑过渡动画
  };
});

// 根据当前激活的分类类型显示对应的分类
const displayedCategories = computed(() => {
  return categories.value[activeCategoryType.value] || [];
});

// 方法定义
function changeBgColor(index) {
  currentBgIndex.value = index;
  currentBgColor.value = bgColors[index];
}

async function loadPlaylistCategories() {
  loadingCategories.value = true;
  try {
    const data = await playlistApi.getCategories();

    // 重置分类数据
    categories.value = { main: [], sub: [] };

    // 处理主分类
    if (Array.isArray(data.categories)) {
      categories.value.main = data.categories.map((name, id) => ({
        id,
        name
      }));
    } else if (typeof data.categories === 'object' && data.categories !== null) {
      categories.value.main = Object.entries(data.categories).map(([id, name]) => ({
        id,
        name
      }));
    } else {
      // 未知格式，使用默认分类
      categories.value.main = [
        { id: 1, name: '华语' },
        { id: 2, name: '流行' },
        { id: 3, name: '摇滚' },
        { id: 4, name: '电子' }
      ];
      console.warn('歌单主分类格式未知，使用默认分类');
    }

    // 处理子分类
    if (typeof data.sub === 'object' && data.sub !== null) {
      // 将子分类对象转换为数组
      for (const key in data.sub) {
        if (data.sub.hasOwnProperty(key) && Array.isArray(data.sub[key])) {
          categories.value.sub.push(...data.sub[key]);
        }
      }
    } else {
      console.warn('歌单子分类格式不正确');
    }

    // 默认选择第一个主分类
    if (categories.value.main.length > 0) {
      activeCategory.value = categories.value.main[0].name;
      await loadPlaylistsByCategory(activeCategory.value);
    }
  } catch (err) {
    console.error('加载歌单分类失败:', err);
    error.value = '无法加载歌单分类，请检查API服务';
  } finally {
    loadingCategories.value = false;
  }
}

async function loadPlaylistsByCategory(category) {
  loading.value = true;
  error.value = '';
  showPlaylists.value = true;
  currentPlaylistId.value = null;

  try {
    const data = await playlistApi.getByCategory(category);
    playlists.value = data.playlists || [];
    activeCategory.value = category;
  } catch (err) {
    console.error('加载歌单失败:', err);
    error.value = '加载歌单失败，请检查API服务';
    playlists.value = [];
  } finally {
    loading.value = false;
  }
}

async function loadSongsFromPlaylist(playlistId) {
  loading.value = true;
  error.value = '';

  try {
    const data = await playlistApi.getSongs(playlistId);

    if (data.songs) {
      songs.value = data.songs;
      currentPlaylistId.value = playlistId;

      // 获取歌单名称
      const playlistInfo = playlists.value.find(p => p.id === playlistId);
      currentPlaylistName.value = playlistInfo ? playlistInfo.name : '歌单';

      showPlaylists.value = false;
    } else {
      error.value = '未找到歌曲';
      songs.value = [];
    }
  } catch (err) {
    console.error('加载歌单歌曲失败:', err);
    error.value = '加载歌曲失败，请检查API服务';
    songs.value = [];
  } finally {
    loading.value = false;
  }
}

function switchToHotSongs() {
  loadSongsByType('hot');
}

function switchToNewSongs() {
  loadSongsByType('new');
}

async function loadSongsByType(type) {
  loading.value = true;
  error.value = '';
  showPlaylists.value = false;
  currentPlaylistId.value = null;
  currentPlaylistName.value = '';

  try {
    const data = await songApi.getSongsByType(type);
    songs.value = data.songs || [];
    activeCategory.value = type;
  } catch (err) {
    console.error('加载歌曲失败:', err);
    error.value = '无法加载歌曲，请检查API服务';
  } finally {
    loading.value = false;
  }
}

async function searchMusic() {
  if (!searchQuery.value.trim()) return;

  loading.value = true;
  error.value = '';
  showPlaylists.value = false;
  currentPlaylistId.value = null;

  try {
    const data = await songApi.search(searchQuery.value);

    if (data.result && data.result.songs) {
      songs.value = data.result.songs;
      activeCategory.value = 'search';
    } else {
      songs.value = [];
      error.value = '未找到匹配的歌曲';
    }
  } catch (err) {
    console.error('搜索失败:', err);
    error.value = '搜索失败，请检查API服务';
  } finally {
    loading.value = false;
  }
}

async function fetchLyrics(songId) {
  loadingLyrics.value = true;
  lyricsError.value = false;

  try {
    const data = await songApi.getLyric(songId);

    if (data.lrc && data.lrc.lyric) {
      lyrics.value = parseLyrics(data.lrc.lyric);
      currentLyricIndex.value = -1; // 重置歌词索引
    } else {
      lyrics.value = [];
    }
  } catch (err) {
    console.error('获取歌词失败:', err);
    lyricsError.value = true;
    lyrics.value = [];
  } finally {
    loadingLyrics.value = false;
  }
}

async function playSong(index) {
  if (index < 0 || index >= songs.value.length) return;

  loading.value = true;
  error.value = '';

  try {
    const song = songs.value[index];
    const data = await songApi.getPlayUrl(song.id);

    if (data.data && data.data[0] && data.data[0].url) {
      currentSongIndex.value = index;
      currentSong.value = song;
      currentSongUrl.value = data.data[0].url;

      // 获取歌词
      await fetchLyrics(song.id);

      // 加载并播放歌曲
      const audio = audioPlayer.value;
      if (audio) {
        // 先暂停当前播放（如果有）
        if (isPlaying.value) {
          audio.pause();
        }

        // 设置新的音频源并播放
        audio.src = data.data[0].url;
        await audio.play();
        isPlaying.value = true; // 直接设置为播放状态
      }
    } else {
      error.value = '无法获取播放地址，可能是版权限制';
    }
  } catch (err) {
    console.error('播放失败:', err);
    error.value = '播放失败，请重试';
    // 处理浏览器自动播放限制
    if (err.name === 'NotAllowedError' || err.message.includes('autoplay')) {
      error.value = '由于浏览器限制，请点击播放按钮开始播放';
      // 仍然更新当前歌曲信息，只是不自动播放
      currentSongIndex.value = index;
      currentSong.value = songs.value[index];
      isPlaying.value = false;
    }
  } finally {
    loading.value = false;
  }
}

function togglePlayPause() {
  const audio = audioPlayer.value;
  if (!audio) return;

  if (isPlaying.value) {
    audio.pause();
  } else {
    audio.play().catch(err => {
      console.error('播放失败:', err);
      error.value = '需要用户交互才能播放音乐';
    });
  }
  isPlaying.value = !isPlaying.value;
}

async function playPrevious() {
  if (songs.value.length === 0) return;

  // 暂停当前播放
  const audio = audioPlayer.value;
  if (audio && isPlaying.value) {
    audio.pause();
    isPlaying.value = false;
  }

  // 计算上一首索引
  let index;
  if (currentSongIndex.value <= 0) {
    index = songs.value.length - 1;
  } else {
    index = currentSongIndex.value - 1;
  }

  // 播放上一首
  await playSong(index);
}

async function playNext() {
  if (songs.value.length === 0) return;

  // 暂停当前播放
  const audio = audioPlayer.value;
  if (audio && isPlaying.value) {
    audio.pause();
    isPlaying.value = false;
  }

  // 计算下一首索引
  let index;
  if (shuffleMode.value) {
    // 随机播放
    index = Math.floor(Math.random() * songs.value.length);
  } else {
    // 顺序播放
    if (currentSongIndex.value >= songs.value.length - 1) {
      index = 0;
    } else {
      index = currentSongIndex.value + 1;
    }
  }

  // 播放下一首
  await playSong(index);
}

function updateProgress() {
  const audio = audioPlayer.value;
  if (!audio || !audio.duration) return;

  currentTime.value = audio.currentTime * 1000; // 转换为毫秒
  progress.value = (audio.currentTime / audio.duration) * 100;

  // 更新歌词显示
  updateLyricsPosition();
}

// 优化歌词同步逻辑，更精确地匹配当前播放时间
function updateLyricsPosition() {
  if (lyrics.value.length === 0) return;

  // 找到当前时间对应的歌词索引
  let currentIndex = -1;
  for (let i = 0; i < lyrics.value.length; i++) {
    // 歌词时间在当前时间点前，且下一句歌词时间在当前时间点后
    if (lyrics.value[i].time <= currentTime.value) {
      currentIndex = i;
    } else {
      break;
    }
  }

  // 只有当索引变化时才更新，减少不必要的重渲染
  if (currentIndex !== currentLyricIndex.value) {
    currentLyricIndex.value = currentIndex;

    // 计算滚动偏移量，使当前歌词居中
    if (currentIndex !== -1) {
      const lineHeight = 36; // 每行歌词的高度
      const containerHeight = 400; // 歌词容器高度
      const centerOffset = containerHeight / 2 - lineHeight / 2;

      lyricsOffset.value = centerOffset - currentIndex * lineHeight;
    }
  }
}

function seek(e) {
  const audio = audioPlayer.value;
  if (!audio || !audio.duration) return;

  const progressBar = e.currentTarget;
  const rect = progressBar.getBoundingClientRect();
  const position = (e.clientX - rect.left) / rect.width;

  audio.currentTime = position * audio.duration;
  progress.value = position * 100;
}

function setVolume() {
  const audio = audioPlayer.value;
  if (audio) {
    audio.volume = volume.value / 100;
  }
}

function toggleLoop() {
  const modes = ['all', 'single', 'none'];
  const currentIndex = modes.indexOf(loopMode.value);
  loopMode.value = modes[(currentIndex + 1) % modes.length];
}

function toggleShuffle() {
  shuffleMode.value = !shuffleMode.value;
}

function handleSongEnd() {
  if (loopMode.value === 'single') {
    // 单曲循环
    const audio = audioPlayer.value;
    if (audio) {
      audio.currentTime = 0;
      audio.play();
    }
  } else {
    // 播放下一首
    playNext();
  }
}

function handleAudioError() {
  error.value = '播放出错，尝试播放下一首';
  console.error('音频播放错误');

  // 自动尝试下一首
  setTimeout(() => {
    playNext();
  }, 2000);
}

function retryLoad() {
  if (showPlaylists.value) {
    loadPlaylistsByCategory(activeCategory.value);
  } else if (currentPlaylistId.value) {
    loadSongsFromPlaylist(currentPlaylistId.value);
  } else if (activeCategory.value === 'hot' || activeCategory.value === 'new') {
    loadSongsByType(activeCategory.value);
  } else {
    loadPlaylistCategories();
  }
}

// 时间格式化方法（对外暴露工具类方法）
function formatTime(ms) {
  return timeUtils.formatTime(ms);
}

// 监听当前歌曲变化，自动加载歌词
watch(currentSong, (newSong) => {
  if (newSong && newSong.id) {
    fetchLyrics(newSong.id);
  }
});

// 初始化时加载歌单分类
onMounted(() => {
  loadPlaylistCategories();
  if (audioPlayer.value) {
    audioPlayer.value.volume = volume.value / 100;
  }
});

</script>

<template>
  <div class="music-player" :style="{'background-color': currentBgColor}">
    <!-- 苹果风格标题栏 -->
    <div class="apple-titlebar">
      <div class="traffic-lights">
        <div class="light red"></div>
        <div class="light yellow"></div>
        <div class="light green"></div>
      </div>
      <div class="window-title">网易云音乐播放器</div>
      <div class="bg-controls">
        <button
            v-for="(color, index) in bgColors"
            :key="index"
            :style="{'background-color': color}"
            @click="changeBgColor(index)"
            class="color-btn"
            :class="{ 'active': currentBgIndex === index }"
            :title="colorNames[index]"
        ></button>
      </div>
    </div>

    <!-- 播放器头部 -->
    <div class="player-header" :style="headerStyle">
      <div class="search-box">
        <input
            v-model="searchQuery"
            @keyup.enter="searchMusic"
            type="text"
            placeholder="搜索歌曲、歌手或专辑..."
            class="search-input"
            :style="inputStyle"
        >
        <button @click="searchMusic" class="search-btn">
          <i class="fas fa-search"></i>
        </button>
      </div>
    </div>

    <!-- 内容区域 -->
    <div class="player-content">
      <!-- 左侧边栏：歌单分类 -->
      <div class="sidebar" :style="sidebarStyle">
        <h3 :style="textStyle">歌单分类</h3>

        <div v-if="loadingCategories" class="category-loading">
          <div class="small-spinner"></div>
        </div>

        <ul v-else class="category-list">
          <li
              v-for="category in displayedCategories"
              :key="category.id || category.name"
              :class="{ active: activeCategory === category.name }"
              @click="loadPlaylistsByCategory(category.name)"
              :style="categoryItemStyle"
          >
            {{ category.name }}
          </li>
        </ul>

        <div class="sidebar-section">
          <h3 :style="textStyle">音乐推荐</h3>
          <ul class="quick-links">
            <li
                :class="{ active: activeCategory === 'hot' }"
                @click="switchToHotSongs"
                :style="categoryItemStyle"
            >
              热门歌曲
            </li>
            <li
                :class="{ active: activeCategory === 'new' }"
                @click="switchToNewSongs"
                :style="categoryItemStyle"
            >
              最新歌曲
            </li>
          </ul>
        </div>
      </div>

      <!-- 主内容区：始终显示的容器 -->
      <div class="main-content" :style="contentStyle">
        <!-- 切换视图的按钮 - 始终显示 -->
        <div class="view-toggle">
          <button
              @click="showLyrics = false"
              :class="{ 'active': !showLyrics }"
              class="view-btn"
          >
            歌曲列表
          </button>
          <button
              @click="showLyrics = true"
              :class="{ 'active': showLyrics }"
              class="view-btn"
          >
            歌词
          </button>
        </div>

        <!-- 歌曲列表视图 - 始终保持容器存在 -->
        <div v-if="!showLyrics" class="content-view">
          <div v-if="loading" class="loading">
            <div class="small-spinner"></div>
            <p :style="textStyle">加载中...</p>
          </div>

          <div v-else-if="error" class="error-message">
            <i class="fas fa-exclamation-triangle"></i>
            <p :style="textStyle">{{ error }}</p>
            <button @click="retryLoad" class="retry-btn">重试</button>
          </div>

          <!-- 歌单列表视图 -->
          <div v-else-if="showPlaylists && playlists.length > 0" class="playlist-grid">
            <div
                v-for="playlist in playlists"
                :key="playlist.id"
                class="playlist-card"
                @click="loadSongsFromPlaylist(playlist.id)"
                :style="cardStyle"
            >
              <div class="playlist-image-container">
                <img :src="playlist.coverImgUrl" alt="歌单封面" class="playlist-image">
                <div class="playlist-song-count">
                  <i class="fas fa-music"></i> {{ playlist.trackCount }}首
                </div>
              </div>
              <h3 class="playlist-name" :style="textStyle">{{ playlist.name }}</h3>
              <p class="playlist-creator" :style="secondaryTextStyle">
                <i class="fas fa-user"></i> {{ playlist.creator.nickname }}
              </p>
            </div>
          </div>

          <!-- 歌曲列表视图 -->
          <div v-else-if="songs.length > 0" class="song-list-container">
            <div class="list-header">
              <h3 :style="textStyle" v-if="currentPlaylistName">{{ currentPlaylistName }}</h3>
              <h3 :style="textStyle" v-else>{{ activeCategory === 'hot' ? '热门歌曲' : '最新歌曲' }}</h3>
              <button
                  @click="showPlaylists = true"
                  class="back-to-playlists"
                  v-if="currentPlaylistId"
              >
                <i class="fas fa-arrow-left"></i> 返回歌单列表
              </button>
            </div>

            <ul class="song-list">
              <li
                  v-for="(song, index) in songs"
                  :key="song.id"
                  @click="playSong(index)"
                  class="song-item"
                  :class="{ playing: currentSongIndex === index }"
                  :style="songItemStyle"
              >
                <div class="song-number" :style="secondaryTextStyle">
                  <span v-if="currentSongIndex !== index">{{ index + 1 }}</span>
                  <i v-else-if="isPlaying" class="fas fa-pause"></i>
                  <i v-else class="fas fa-play"></i>
                </div>

                <div class="song-info">
                  <img :src="song.al.picUrl" alt="专辑封面" class="album-cover">
                  <div class="song-details">
                    <h4 class="song-title" :style="textStyle">{{ song.name }}</h4>
                    <p class="song-artist" :style="secondaryTextStyle">
                      {{ song.ar.map(artist => artist.name).join(', ') }}
                      <span class="album-name"> - {{ song.al.name }}</span>
                    </p>
                  </div>
                </div>

                <div class="song-duration" :style="secondaryTextStyle">
                  {{ formatTime(song.dt) }}
                </div>
              </li>
            </ul>
          </div>

          <div v-else class="empty-state">
            <i class="fas fa-music" :style="textStyle"></i>
            <p :style="textStyle">没有找到内容</p>
            <p :style="secondaryTextStyle" v-if="showPlaylists">尝试选择其他分类</p>
            <p :style="secondaryTextStyle" v-else>点击歌单返回列表</p>
          </div>
        </div>

        <!-- 歌词视图 - 始终保持容器存在 -->
        <div v-if="showLyrics" class="content-view lyrics-container">
          <div v-if="!currentSong" class="no-song-selected">
            <p :style="textStyle">请选择一首歌曲开始播放</p>
          </div>

          <div v-else>
            <div class="lyrics-header">
              <img :src="currentSong.al.picUrl" alt="专辑封面" class="lyrics-album-cover">
              <div class="lyrics-song-info">
                <h2 :style="textStyle" class="lyrics-song-title">{{ currentSong.name }}</h2>
                <p :style="secondaryTextStyle" class="lyrics-song-artist">
                  {{ currentSong.ar.map(artist => artist.name).join(', ') }}
                </p>
              </div>
            </div>

            <div v-if="loadingLyrics" class="lyrics-loading">
              <div class="small-spinner"></div>
              <p :style="textStyle">加载歌词中...</p>
            </div>

            <div v-else-if="lyricsError" class="lyrics-error" :style="textStyle">
              <i class="fas fa-exclamation-circle"></i>
              <p>无法加载歌词</p>
            </div>

            <div v-else-if="lyrics.length === 0" class="no-lyrics" :style="textStyle">
              <p>该歌曲暂无歌词</p>
            </div>

            <div v-else class="lyrics-scroll-container">
              <div class="lyrics-content" :style="{ transform: `translateY(${lyricsOffset}px)` }">
                <p
                    v-for="(line, index) in lyrics"
                    :key="index"
                    :class="{ 'active': currentLyricIndex === index }"
                    :style="[
                      textStyle,
                      currentLyricIndex === index ? activeLyricStyle : {}
                    ]"
                    v-html="line.text"
                >
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 底部播放控制栏 -->
    <div v-if="currentSong" class="player-footer" :style="footerStyle">
      <div class="now-playing">
        <img :src="currentSong.al.picUrl" alt="当前播放歌曲封面" class="now-playing-cover">
        <div class="now-playing-info">
          <h4 class="now-playing-title" :style="textStyle">{{ currentSong.name }}</h4>
          <p class="now-playing-artist" :style="secondaryTextStyle">{{ currentSong.ar.map(artist => artist.name).join(', ') }}</p>
        </div>
      </div>

      <div class="play-controls">
        <button @click="toggleShuffle" class="control-btn shuffle-btn" :class="{ active: shuffleMode }" :style="controlBtnStyle">
          <i class="fas fa-random"></i>
        </button>

        <button @click="playPrevious" class="control-btn prev-btn" :style="controlBtnStyle">
          <i class="fas fa-step-backward"></i>
        </button>

        <button @click="togglePlayPause" class="control-btn play-pause-btn">
          <i v-if="isPlaying" class="fas fa-pause"></i>
          <i v-else class="fas fa-play"></i>
        </button>

        <button @click="playNext" class="control-btn next-btn" :style="controlBtnStyle">
          <i class="fas fa-step-forward"></i>
        </button>

        <button @click="toggleLoop" class="control-btn loop-btn" :class="{ active: loopMode !== 'none' }" :style="controlBtnStyle">
          <i :class="loopMode === 'single' ? 'fas fa-redo-alt' : 'fas fa-redo'"></i>
        </button>
      </div>

      <div class="progress-control">
        <span class="current-time" :style="secondaryTextStyle">{{ formatTime(currentTime) }}</span>
        <div class="progress-bar" @click="seek">
          <div class="progress-fill" :style="{ width: `${progress}%` }"></div>
          <div class="progress-handle" :style="{ left: `${progress}%` }"></div>
        </div>
        <span class="total-time" :style="secondaryTextStyle">{{ currentSong ? formatTime(currentSong.dt) : '0:00' }}</span>
      </div>

      <div class="volume-control">
        <i class="fas fa-volume-up" :style="secondaryTextStyle"></i>
        <input
            type="range"
            min="0"
            max="100"
            v-model="volume"
            @input="setVolume"
            class="volume-slider"
        >
      </div>
    </div>

    <!-- 音频元素 -->
    <audio
        ref="audioPlayer"
        :src="currentSongUrl"
        @timeupdate="updateProgress"
        @ended="handleSongEnd"
        @error="handleAudioError"
    ></audio>
  </div>
</template>



<style scoped lang="scss">
/* 苹果风格标题栏 */
.apple-titlebar {
  height: 32px;
  background-color: #f5f5f7;
  display: flex;
  align-items: center;
  padding: 0 16px;
  border-bottom: 1px solid #e0e0e0;
}

.traffic-lights {
  display: flex;
  gap: 8px;
  margin-right: 16px;
}

.light {
  width: 12px;
  height: 12px;
  border-radius: 50%;
}

.light.red {
  background-color: #ff5f58;
}

.light.yellow {
  background-color: #ffbd2e;
}

.light.green {
  background-color: #14c38e;
}

.window-title {
  font-size: 13px;
  color: #333;
  flex: 1;
  text-align: center;
}

.bg-controls {
  display: flex;
  gap: 6px;
}

.color-btn {
  width: 18px;
  height: 18px;
  border-radius: 4px;
  border: 2px solid transparent;
  cursor: pointer;
  transition: transform 0.2s ease;
}

.color-btn:hover {
  transform: scale(1.1);
}

.color-btn.active {
  border-color: #1db954;
  box-shadow: 0 0 0 1px rgba(29, 185, 84, 0.3);
}

/* 基础样式 */
.music-player {
  font-family: 'Helvetica Neue', Arial, sans-serif;
  max-width: 1200px;
  margin: 70px auto;
  border-radius: 8px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
  overflow: hidden;
  transition: background-color 0.3s ease;
}

/* 头部样式 */
.player-header {
  background: linear-gradient(60deg, rgb(228, 165, 222) 0%, rgb(190, 95, 213) 100%);
  padding: 16px 24px;
  display: flex;
  justify-content: flex-end;
  align-items: center;
  transition: all 0.3s ease;
}

.search-box {
  display: flex;
  align-items: center;
}

.search-input {
  border-radius: 20px;
  padding: 8px 16px;
  font-size: 0.9rem;
  width: 280px;
  outline: none;
  transition: all 0.3s ease;
}

.search-input::placeholder {
  color: #aaa;
}

.search-input:focus {
  width: 320px;
}

.search-btn {
  background-color: #1db954;
  border: none;
  border-radius: 50%;
  width: 36px;
  height: 36px;
  margin-left: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.search-btn:hover {
  background-color: #1ed760;
}

/* 内容区域样式 */
.player-content {
  display: flex;
  height: 500px;
}

/* 侧边栏样式 */
.sidebar {
  width: 240px;
  overflow-y: auto;
  transition: all 0.3s ease;
}

.sidebar-section {
  padding: 20px 0;
  border-top: 1px solid #e0e0e0;
}

.sidebar h3 {
  padding: 0 20px 12px;
  margin: 0 0 12px 0;
  font-size: 0.9rem;
  text-transform: uppercase;
  border-bottom: 1px solid #e0e0e0;
}

.category-list, .quick-links {
  list-style: none;
  margin: 0;
  padding: 0;
}

.category-list li, .quick-links li {
  padding: 12px 20px;
  cursor: pointer;
  transition: all 0.2s ease;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.category-list li:hover, .quick-links li:hover {
  background-color: rgba(0, 0, 0, 0.05);
}

.category-list li.active, .quick-links li.active {
  color: #1db954;
  border-left: 3px solid #1db954;
}

/* 主内容区样式 */
.main-content {
  flex: 1;
  padding: 20px;
  overflow-y: hidden;
  transition: all 0.3s ease;
}

.list-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 10px;
  border-bottom: 1px solid #e0e0e0;
}

.list-header h3 {
  margin: 0;
  font-size: 1.2rem;
}

.back-to-playlists {
  background-color: #1db954;
  color: white;
  border: none;
  border-radius: 4px;
  padding: 6px 12px;
  font-size: 0.85rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  transition: background-color 0.2s ease;
}

.back-to-playlists i {
  margin-right: 6px;
}

.back-to-playlists:hover {
  background-color: #1ed760;
}

/* 视图切换按钮 */
.view-toggle {
  display: flex;
  gap: 10px;
  margin-bottom: 20px;
  position: sticky;
  top: 0;
  z-index: 10;
  background-color: inherit;
  padding-top: 5px;
  padding-bottom: 5px;
}

.view-btn {
  padding: 6px 16px;
  border: none;
  border-radius: 4px;
  background-color: rgba(0, 0, 0, 0.05);
  cursor: pointer;
  transition: all 0.2s ease;
}

.view-btn.active {
  background-color: #1db954;
  color: white;
}

/* 内容视图容器 - 确保始终显示 */
.content-view {
  height: calc(100% - 50px);
  overflow-y: auto;
}

/* 歌单网格样式 */
.playlist-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 20px;
  margin-top: 20px;
}

.playlist-card {
  border-radius: 8px;
  overflow: hidden;
  cursor: pointer;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.playlist-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.1);
}

.playlist-image-container {
  position: relative;
}

.playlist-image {
  width: 100%;
  aspect-ratio: 1/1;
  object-fit: cover;
  display: block;
}

.playlist-song-count {
  position: absolute;
  bottom: 8px;
  right: 8px;
  background-color: rgba(0, 0, 0, 0.6);
  color: white;
  font-size: 0.75rem;
  padding: 2px 8px;
  border-radius: 12px;
  display: flex;
  align-items: center;
}

.playlist-song-count i {
  margin-right: 4px;
  font-size: 0.65rem;
}

.playlist-name {
  font-size: 0.95rem;
  margin: 12px 10px 6px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.playlist-creator {
  font-size: 0.75rem;
  margin: 0 10px 12px;
  display: flex;
  align-items: center;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.playlist-creator i {
  margin-right: 4px;
  font-size: 0.65rem;
}

/* 歌曲列表样式 */
.song-list-container {
  margin-top: 20px;
}

.song-list {
  list-style: none;
  margin: 0;
  padding: 0;
}

.song-item {
  display: flex;
  align-items: center;
  padding: 12px 16px;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.song-item:hover {
  background-color: rgba(0, 0, 0, 0.03);
}

.song-item.playing {
  background-color: rgba(29, 185, 84, 0.1);
}

.song-number {
  width: 30px;
  text-align: center;
  font-size: 0.9rem;
}

.song-item.playing .song-number {
  color: #1db954;
}

.song-info {
  display: flex;
  align-items: center;
  flex: 1;
  margin-left: 16px;
}

.album-cover {
  width: 50px;
  height: 50px;
  object-fit: cover;
  border-radius: 4px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.song-details {
  margin-left: 14px;
  overflow: hidden;
}

.song-title {
  margin: 0 0 4px 0;
  font-size: 1rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.song-artist {
  margin: 0;
  font-size: 0.85rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.album-name {
  opacity: 0.8;
}

.song-duration {
  font-size: 0.85rem;
  padding: 0 10px;
}

/* 歌词样式 */
.lyrics-container {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.lyrics-header {
  display: flex;
  align-items: center;
  margin-bottom: 30px;
  padding-bottom: 20px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.1);
}

.lyrics-album-cover {
  width: 100px;
  height: 100px;
  object-fit: cover;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.lyrics-song-info {
  margin-left: 20px;
}

.lyrics-song-title {
  margin: 0 0 8px 0;
  font-size: 1.5rem;
}

.lyrics-song-artist {
  margin: 0;
  font-size: 1rem;
}

.lyrics-scroll-container {
  flex: 1;
  overflow: hidden;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 300px;
}

.lyrics-content {
  transition: transform 0.3s ease;
  text-align: center;
}

.lyrics-content p {
  margin: 0 0 12px 0;
  padding: 6px 0;
  font-size: 1rem;
  transition: all 0.3s ease;
  line-height: 1.5;
  opacity: 0.7; /* 未激活歌词透明度降低 */
}

.lyrics-content p.active {
  margin: 10px 0;
  opacity: 1; /* 激活歌词完全显示 */
}

.no-song-selected {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
}

.lyrics-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
}

.lyrics-error, .no-lyrics {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  gap: 16px;
}

.lyrics-error i {
  font-size: 2rem;
  color: #ff4444;
}

/* 加载状态样式 */
.loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
}

.small-spinner {
  width: 20px;
  height: 20px;
  border: 2px solid rgba(29, 185, 84, 0.2);
  border-radius: 50%;
  border-top-color: #1db954;
  animation: spin 1s ease-in-out infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.loading p {
  margin-top: 16px;
}

/* 错误信息样式 */
.error-message {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: #ff4444;
  text-align: center;
  padding: 20px;
}

.error-message i {
  font-size: 2rem;
  margin-bottom: 12px;
}

.error-message p {
  margin: 0 0 16px 0;
}

.retry-btn {
  background-color: #1db954;
  color: white;
  border: none;
  border-radius: 20px;
  padding: 8px 16px;
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.retry-btn:hover {
  background-color: #1ed760;
}

/* 空状态样式 */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  text-align: center;
}

.empty-state i {
  font-size: 3rem;
  margin-bottom: 16px;
  opacity: 0.3;
}

.empty-state p {
  margin: 4px 0;
}

/* 底部播放控制栏样式 */
.player-footer {
  padding: 12px 24px;
  display: flex;
  align-items: center;
  transition: all 0.3s ease;
}

.now-playing {
  display: flex;
  align-items: center;
  width: 300px;
}

.now-playing-cover {
  width: 56px;
  height: 56px;
  object-fit: cover;
  border-radius: 4px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.now-playing-info {
  margin-left: 14px;
  overflow: hidden;
}

.now-playing-title {
  margin: 0 0 4px 0;
  font-size: 0.95rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.now-playing-artist {
  margin: 0;
  font-size: 0.8rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* 播放控制按钮样式 */
.play-controls {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
}

.control-btn {
  background: none;
  border: none;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
}

.control-btn:hover {
  opacity: 0.8;
}

.shuffle-btn, .loop-btn {
  width: 30px;
  height: 30px;
  font-size: 0.9rem;
}

.prev-btn, .next-btn {
  width: 36px;
  height: 36px;
  font-size: 1.1rem;
  margin: 0 8px;
}

.play-pause-btn {
  width: 48px;
  height: 48px;
  background-color: #1db954;
  color: white;
  border-radius: 50%;
  font-size: 1.2rem;
  margin: 0 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: transform 0.2s ease;
}

.play-pause-btn:hover {
  transform: scale(1.05);
}

.control-btn.active {
  color: #1db954;
}

/* 进度条样式 */
.progress-control {
  flex: 2;
  display: flex;
  align-items: center;
  padding: 0 20px;
}

.current-time, .total-time {
  font-size: 0.75rem;
  width: 40px;
}

.progress-bar {
  flex: 1;
  height: 4px;
  background-color: #e0e0e0;
  border-radius: 2px;
  margin: 0 12px;
  position: relative;
  cursor: pointer;
}

.progress-fill {
  position: absolute;
  top: 0;
  left: 0;
  height: 100%;
  background-color: #1db954;
  border-radius: 2px;
  transition: width 0.1s ease;
}

.progress-handle {
  position: absolute;
  top: 50%;
  transform: translate(-50%, -50%);
  width: 12px;
  height: 12px;
  background-color: #1db954;
  border-radius: 50%;
  box-shadow: 0 0 8px rgba(0, 0, 0, 0.2);
  opacity: 0;
  transition: opacity 0.2s ease;
}

.progress-bar:hover .progress-handle {
  opacity: 1;
}

/* 音量控制样式 */
.volume-control {
  width: 200px;
  display: flex;
  align-items: center;
}

.volume-control i {
  margin-right: 10px;
}

.volume-slider {
  width: 100px;
  height: 4px;
  background-color: #e0e0e0;
  border-radius: 2px;
  outline: none;
}

.volume-slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: #1db954;
  cursor: pointer;
}

/* 隐藏原生音频控件 */
audio {
  display: none;
}

/* 滚动条样式优化 */
::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

::-webkit-scrollbar-track {
  background: #f1f1f1;
}

::-webkit-scrollbar-thumb {
  background: #ccc;
  border-radius: 4px;
}

::-webkit-scrollbar-thumb:hover {
  background: #aaa;
}
</style>







