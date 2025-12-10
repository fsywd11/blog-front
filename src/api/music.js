import apiUtils from "@/utils/music-request.js";

// 歌单相关API
export const playlistApi = {
    // 获取歌单分类
    getCategories() {
        return apiUtils.get('/playlist/catlist');
    },

    // 根据分类获取歌单
    getByCategory(category, limit = 30) {
        return apiUtils.get(`/top/playlist?cat=${encodeURIComponent(category)}&limit=${limit}`);
    },

    // 获取歌单歌曲
    getSongs(playlistId, limit = 100) {
        return apiUtils.get(`/playlist/track/all?id=${playlistId}&limit=${limit}`);
    }


};

// 歌曲相关API
export const songApi = {
    // 获取热门/最新歌曲
    getSongsByType(type) {
        const typeParam = type === 'new' ? 0 : 96;
        return apiUtils.get(`/top/song?type=${typeParam}`);
    },

    // 搜索歌曲
    search(keywords) {
        return apiUtils.get(`/search?keywords=${encodeURIComponent(keywords)}`);
    },

    // 获取歌曲播放地址
    getPlayUrl(songId) {
        return apiUtils.get(`/song/url?id=${songId}`);
    },

    // 获取歌曲歌词
    getLyric(songId) {
        return apiUtils.get(`/lyric?id=${songId}`);
    }
};