//定制请求的实例

//导入axios  npm install axios
import axios from 'axios';
import {ElMessage} from 'element-plus'
//定义一个变量,记录公共的前缀  ,  baseURL
const baseURL = 'http://localhost:8080';
const instance = axios.create({
    baseURL: baseURL,
    timeout: 5000, // 新增超时配置，避免请求一直挂起
})


import {useTokenStore} from '@/stores/token.js'
//添加请求拦截器
instance.interceptors.request.use(
    (config)=>{
        //请求前的回调
        //添加token
        const tokenStore = useTokenStore();
        //判断有没有token
        if(tokenStore.token){
            //在请求头中添加token返回给服务器后端，后端根据token进行身份验证
            config.headers.Authorization = tokenStore.token
        }
        return config;
    },
    (err)=>{
        //请求错误的回调
        Promise.reject(err).catch(r => console.error('捕获到错误:', r))
    }
)

//添加响应拦截器对象
instance.interceptors.response.use(
    //请求响应成功
    result=>{
        //success
        if (result.data.code === 0){
            return result.data;
        }
        //error
        // alert(result.data.msg?result.data.msg:'服务异常')
          ElMessage.error(result.data.message?result.data.message:'服务异常');//存在显示result.data.message,不存在显示'服务异常'
        //返回被拒绝的原因
        return Promise.reject(result.data.message);
    },
    err=>{
        //如果响应状态码时401，代表未登录，给出对应的提示，并跳转到登录页
        //令牌过期，也就是账号失效
        if(err.response.status===401){
            /*未获取令牌，即还未登录状态，令牌过期*/
            const tokenStore = useTokenStore();
            tokenStore.removeToken()
            ElMessage.warning('请先登录！')
        }else{
            ElMessage.error('服务异常');
        }
        return Promise.reject(err);//异步的状态转化成失败的状态
    }
)

export default instance;