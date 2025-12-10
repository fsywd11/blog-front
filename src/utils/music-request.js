import axios from 'axios';

// 创建axios实例
const request = axios.create({
    baseURL: 'http://localhost:3000',
    timeout: 10000
});

// 请求拦截器
request.interceptors.request.use(
    config => {
        return config;
    },
    error => {
        console.error('请求错误:', error);
        return Promise.reject(error);
    }
);

// 响应拦截器
request.interceptors.response.use(
    response => {
        if (response.data && response.data.code !== 200) {
            return Promise.reject(new Error(response.data.message || '请求失败'));
        }
        return response.data;
    },
    error => {
        console.error('响应错误:', error);
        return Promise.reject(error);
    }
);

// 通用请求方法封装
const apiUtils = {
    get: (url, params = {}) => request.get(url, { params }),
    post: (url, data = {}) => request.post(url, data),
    put: (url, data = {}) => request.put(url, data),
    delete: (url, params = {}) => request.delete(url, { params })
};

export default apiUtils;