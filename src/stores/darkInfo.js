// @/stores/darkInfo.js
import { defineStore } from 'pinia';

export const darkStore = defineStore('dark', {
    state: () => ({
        isDark: localStorage.getItem('isDark') === 'true' || false,
    }),
    actions: {
        // 初始化 body 类名
        initDarkMode() {
            if (this.isDark) {
                document.body.classList.add('dark');
            } else {
                document.body.classList.remove('dark');
            }
        },
        toggleDark() {
            this.isDark = !this.isDark;
            // 复用初始化方法更新 body 类名
            this.initDarkMode();
            localStorage.setItem('isDark', this.isDark.toString());
        },
    },
});