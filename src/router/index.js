import {createRouter, createWebHistory} from 'vue-router';
import LayoutVue from "@/views/Layout.vue";
import HomePageLayout from "@/views/home/HomePageLayout.vue";
import {useLoadingStore} from "@/stores/loading.js";

// 定义路由关系
const routes = [
    {
        path: '/article',
        component: LayoutVue,
        redirect: '/article/manage',
        children: [
            {
                path: '/article/category',
                name: 'ArticleCategory',
                meta:{
                    title:'文章分类'
                },
                component: ()=>import("@/views/article/ArticleCategory.vue")//懒加载
            },
            {
                path: '/article/manage',
                name: 'ArticleManage',
                meta:{
                    title:'文章管理'
                },
                component: ()=>import("@/views/article/ArticleManage.vue")
            },
            {
                path: '/article/add',
                name: 'ArticleForm',
                meta:{
                    title:'发布文章'
                },
                component: ()=>import("@/views/article/ArticleForm.vue")
            },
            {
                path: '/article/edit',
                name: 'ArticleEdit',
                meta:{
                    title:'编辑文章'
                },
                component: ()=>import("@/views/article/ArticleEdit.vue")
            },
            {
                path: '/user/avatar',
                name: 'UserAvatar',
                meta:{
                    title:'头像管理'
                },
                component: ()=>import("@/views/user/UserAvatar.vue")
            },
            {
                path: '/user/info',
                name: 'UserInfo',
                meta:{
                    title:'个人信息'
                },
                component: ()=>import("@/views/user/UserInfo.vue")
            },
            {
                path: '/user/resetPassword',
                name: 'UserResetPassword',
                meta:{
                    title:'重置密码'
                },
                component: ()=>import("@/views/user/UserResetPassword.vue")
            },
            {
                path: '/user/manage',
                name: 'UserManage',
                meta:{
                    title:'用户管理'
                },
                component: ()=>import("@/views/user/UserManage.vue")
            },
            {
                path: '/permission/manage',
                name: 'PermissionManage',
                meta:{
                    title:'权限管理'
                },
                component: ()=>import("@/views/user/PermissionManage.vue")
            },
            {
                path: '/roles/manage',
                name: 'RolesManage',
                meta:{
                    title:'角色管理'
                },
                component: ()=>import("@/views/user/RolesManage.vue")
            },
            {
                path: '/roles/rolesGrant',
                name: 'RolesGrant',
                meta:{
                    title:'角色授权'
                },
                component: ()=>import("@/views/user/Grant/RolesGrant.vue")
            },
            {
                path: '/user/userGrant',
                name: 'UsersGrant',
                meta:{
                    title:'用户授权'
                },
                component: ()=>import("@/views/user/Grant/UsersGrant.vue")
            },
            {
                path: '/permission/permissionGrant',
                name: 'PermissionsGrant',
                meta:{
                    title:'权限授权'
                },
                component: ()=>import("@/views/user/Grant/PermissionsGrant.vue")
            },
            {
                path: '/comment/manage',
                name: 'CommentManage',
                meta:{
                    title:'评论管理'
                },
                component: ()=>import("@/views/user/CommentManage.vue")
            },
            //树洞管理
             {
                 path: '/treeholes/manage',
                 name: 'TreeHolesManage',
                  meta:{
                      title:'树洞管理'
                  }
                  ,
                 component: ()=>import("@/views/user/TreeholesManage.vue")
             },
            //留言管理
             {
                 path: '/message/manage',
                  name: 'MessageManage',
                  meta:{
                      title:'留言管理'
                  },
                 component: ()=>import("@/views/article/MessageManage.vue")
             },
             //友链管理
             {
                 path: '/friendLinks/manage',
                  name: 'FriendLinksManage',
                  meta:{
                      title:'友链管理'
                  },
                 component: ()=>import("@/views/article/FriendLinksManage.vue")
             },
             //图片管理
              {
                  path: '/photo/manage',
                  name: 'PhotoManage',
                  meta:{
                      title:'图片管理'
                  },
                  component: ()=>import("@/views/article/PhotoManage.vue")
              },
            {
                path: '/calendar',
                name: 'Calendar',
                meta:{
                    title:'日历'
                },
                component: ()=>import("@/components/Calendar.vue")
            },
        ]
    },
    {
        path: '/',
        component: HomePageLayout,
        redirect: '/homes/home',
        children: [
            {
                path: '/homes/home',
                name: 'HomesPages',
                meta:{
                    title:'首页'
                },
                component: ()=>import("@/views/home/HomesPages.vue")
            },
            {
                path: '/homes/about',
                name: 'HomesAbout',
                meta:{
                    title:'关于'
                },
                component: ()=>import("@/views/home/HomesAbout.vue")
            },
            {
                path: '/homes/category',
                name: 'HomesCategory',
                meta:{
                    title:'分类'
                },
                component: ()=>import("@/views/home/HomesCategory.vue")
            },
            {
                path: '/homes/music',
                name: 'HomesMusic',
                meta:{
                    title:'音乐'
                },
                component: ()=>import("@/views/home/music/HomesMusic.vue")
            },
            {
                path: '/homes/login',
                name: 'HomesLogin',
                meta:{
                    title:'登录'
                },
                component: ()=>import("@/views/home/HomersLogin.vue"),
                redirect: '/homes/login/register',
                children: [
                    {
                        path: '/homes/login/register',
                        name: 'HomesRegister',
                        meta:{
                            title:'登录'
                        },
                        component: ()=>import("@/views/Login.vue")
                    }
                ]
            },
            {
                path: '/homes/timeline',
                name: 'HomesTimeline',
                meta:{
                    title:'时间轴'
                },
                component: () => import("@/views/home/HomesTimeLine/HomesTimeline.vue")
            },
            {
                path: '/homes/logined',
                name: 'HomesLogined',
                meta:{
                    title:'登录'
                },
                component: ()=>import("@/views/home/HomesLogined.vue"),
            },
            {
                path: '/homes/articleComment/:id',
                name: 'ArticleComment',
                meta:{
                    title:'文章评论'
                },
                component: ()=>import("@/components/ArticleComment.vue")
            },
            {
                path: '/tree-hole',
                name: 'TreeHole',
                meta:{
                    title:'树洞'
                },
                component: ()=>import("@/views/home/TreeHoles.vue")
            },
            {
                path: '/message',
                name: 'HomesMessage',
                meta:{
                    title:'留言'
                },
                component: ()=>import("@/views/home/HomesMessage.vue")
            },
            {
                path: '/homes/friendLink/',
                name: 'FriendLink',
                meta:{
                    title:'友链'
                },
                component: ()=>import("@/views/home/FriendLink.vue")
            },
            {
                path: '/homes/photo/',
                name: 'Photo',
                meta:{
                    title:'图片'
                },
                component: ()=>import("@/views/home/HomesPhoto.vue")
            }
        ]
    }
];

// 创建路由器
const router = createRouter({
    history: createWebHistory(),
    routes: routes
});

// 存储每个路由的滚动位置
const scrollPositions = {};
//在调用router时会自动调用beforeEach和afterEach钩子
router.beforeEach((to, from, next) => {
    // 保存当前页面的滚动位置
    if (from.path) {
        scrollPositions[from.path] = window.scrollY || document.documentElement.scrollTop;
    }

    if (to.meta?.title) {
        document.title = to.meta.title;
    }

    // 继续导航
    next();
});

router.afterEach((to) => {
    // 恢复之前保存的滚动位置
    if (scrollPositions[to.path]) {
        window.scrollTo(0, scrollPositions[to.path]);
    } else {
        window.scrollTo(0, 0);
    }
});

router.beforeEach((to, from, next) => {
    // 保存当前页面的滚动位置
    if (from.path) {
        scrollPositions[from.path] = window.scrollY || document.documentElement.scrollTop;
    }
    const loadingStore = useLoadingStore();
    loadingStore.setLoading(true);
    // 继续导航
    next();
});

router.afterEach((to) => {
    // 恢复之前保存的滚动位置
    if (scrollPositions[to.path]) {
        window.scrollTo(0, scrollPositions[to.path]);
    } else {
        window.scrollTo(0, 0);
    }
    const loadingStore = useLoadingStore();
    loadingStore.setLoading(false);
});


export default router;