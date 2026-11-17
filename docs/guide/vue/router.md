# Vue Router 篇（Q16 - Q23）

> 每题五层结构：**为什么 -> 是什么（深讲）-> 代码 -> 坑 -> 面试回答（总-分）**

## Q16：hash 和 history 路由的区别？（<span class="hot">超高频</span>）

### 为什么有两种模式

SPA 的核心矛盾：**改变视图但不能刷新页面**——浏览器原生只有「改 URL 会导致重新请求」的机制。有两种「改 URL 不发请求」的漏洞可钻：hash 和 pushState——对应两种路由模式。

### hash 模式原理

```text
URL：https://example.com/#/user?id=1
                         ^^ # 之后是 hash

核心机制：
  1. hash 变化不触发页面请求（# 后面的部分根本不会发给服务器）
  2. hash 变化触发 hashchange 事件
  3. Router 监听 hashchange -> 解析 # 后的路径 -> 匹配组件渲染

优点：不需要任何服务器配置
缺点：URL 带 # 不美观、SEO 相对弱
```

### history 模式原理

```text
核心机制：
  1. history.pushState(url) 修改地址栏但不发请求
  2. 浏览器前进后退触发 popstate 事件
  3. Router 监听 popstate 匹配路由

致命问题：刷新或直接输入 URL 时，浏览器会真的向服务器请求该路径
  https://example.com/user -> 服务器没有 /user 这个文件 -> 404！
```

### history 模式的服务器兜底（必会）

```nginx
# Nginx：所有找不到的路径都返回 index.html
# 交给前端路由处理
location / {
  try_files $uri $uri/ /index.html;
}
# $uri：先找真实文件（js/css/图片）
# $uri/：再找目录
# /index.html：都没有就返回 index.html —— 前端路由接管
```

### 面试回答（总-分）

> **总起**：两种模式利用浏览器不同的「改 URL 不刷新」机制实现 SPA 路由，核心差异在**是否需要服务器配合**。
>
> **第一，hash 模式。** 利用 # 后面的部分不会发给服务器、变化触发 hashchange 事件——天然免配置，但 URL 带 # 不美观。
>
> **第二，history 模式。** 用 pushState 改 URL 不发请求，URL 干净；但用户刷新或直接输入时，服务器会收到真请求——必须配 Nginx 的 try_files 把所有路径兜底到 index.html，否则 404。这是 history 部署最经典的坑。

## Q17：完整的导航守卫执行流程？（<span class="hot">超高频</span>）

### 完整时序（跳转 /a -> /b）

```text
1. beforeRouteLeave      （a 组件内）离开前——表单未保存拦截
        |
2. beforeEach            （全局前置）——登录权限拦截最常用
        |
3. beforeEnter           （b 路由独享）
        |
4. beforeRouteUpdate     （组件复用时：/user/1 -> /user/2）
        |
5. beforeRouteEnter      （b 组件内——此时实例还没创建，拿不到 this）
        |
6. 解析异步路由组件        （懒加载的 chunk 下载完成）
        |
7. beforeResolve         （全局解析——所有守卫和异步组件都就绪）
        |
8. 导航确认 -> 组件渲染
        |
9. afterEach             （全局后置——改标题、上报 PV）
        |
10. DOM 更新 -> onMounted 触发
```

**速记口诀**：`离开 -> 全局前置 -> 独享 -> 组件 enter -> 全局解析 -> 后置`。

### 守卫的返回值控制

```js
router.beforeEach((to, from) => {
  // 返回 false        -> 取消导航，留在原地
  // 返回路由对象       -> 重定向
  // 返回 Error        -> 导航中止，错误传给 router.onError
  // 返回 undefined/true -> 放行

  const token = localStorage.getItem('token')
  if (!token && to.meta.requiresAuth) {
    return { path: '/login', query: { redirect: to.fullPath } }
    // 记录想去的页面，登录后跳回来
  }
})
```

### 面试回答（总-分）

> **总起**：从 /a 跳 /b 的完整流程是——离开守卫、全局前置、路由独享、组件 enter、全局解析、后置，共六个关口。
>
> **三个实践要点**：第一，登录拦截放全局 beforeEach，用返回路由对象的方式重定向到登录页并记录来源；第二，beforeRouteEnter 拿不到 this 因为组件实例还没创建——要访问实例用 next(vm => {}) 的回调形式；第三，afterEach 没有next，导航已经确认了——适合改标题、上报 PV 这类不拦截的场景。

## Q18：三类路由守卫分别怎么用？

```js
// ========== 1. 全局守卫（main.js，作用于所有路由） ==========
router.beforeEach((to, from) => {})     // 前置：登录拦截
router.beforeResolve((to, from) => {})  // 解析：所有组件守卫后
router.afterEach((to, from) => {})      // 后置：document.title = to.meta.title

// ========== 2. 路由独享守卫（routes 配置里，只管自己） ==========
{
  path: '/admin',
  beforeEnter: (to, from) => {
    if (!isAdmin) return '/403'
  }
}

// ========== 3. 组件内守卫 ==========
export default {
  beforeRouteEnter(to, from) {
    // 进来前——组件实例未创建，this 不可用
  },
  beforeRouteUpdate(to, from) {
    // /user/1 -> /user/2 复用同组件时触发（this 可用）
    this.fetchDetail(to.params.id)   // 高频坑：不重新请求就是旧数据！
  },
  beforeRouteLeave(to, from) {
    // 离开前——表单未保存拦截
    if (this.formDirty) return confirm('还有未保存内容，确定离开？')
  }
}
```

**beforeRouteUpdate 的高频坑**：`/detail/1` 跳 `/detail/2`——Vue Router 复用组件实例，**onMounted 不会再触发**，必须在 beforeRouteUpdate 里重新请求。

### 面试回答（总-分）

> **总起**：三类守卫按作用域分——全局管所有路由、独享管单个路由、组件内管自己。
>
> **实践选型**：全局 beforeEach 做登录拦截、afterEach 改标题；路由独享做特定页面的权限（如管理员页）；组件内 beforeRouteLeave 做表单拦截、beforeRouteUpdate 处理「同组件不同参数」的重新请求——这个是最容易被忽略的坑。

## Q19：路由传参：params vs query？

```js
// ========== query：? 后面的参数，任何路由都能用 ==========
router.push({ path: '/user', query: { id: 1, tab: 'info' } })
// URL：/user?id=1&tab=info
// 接收：route.query.id

// ========== params：路径段参数，必须配动态路由 ==========
// 路由配置：{ path: '/user/:id' }
router.push({ path: `/user/${1}` })
// URL：/user/1
// 接收：route.params.id
```

| | params | query |
| --- | --- | --- |
| URL 形式 | /user/1 | /user?id=1 |
| 需要路由配置 | ✅ `:id` 占位符 | ❌ |
| 刷新后保留 | ✅ | ✅ |
| 场景 | 详情页必需的 id | 筛选条件、可选参数 |

**坑**：`router.push({ path: '/user', params: { id: 1 } })` ——**params 会被忽略**！path 跳转时 params 不生效，必须配 name 使用。

### 面试回答（总-分）

> **总起**：params 是路径的一部分（RESTful 风格），query 是问号后面的查询参数。
>
> **三个要点**：第一，params 必须在路由配置 `:id` 占位符；query 即插即用不需要配置。第二，用 path 跳转时 params 会被忽略——params 要配 name 使用，这是高频坑。第三，语义上——路径里的参数用 params（详情页 id），可选的过滤条件用 query（?page=1&size=10）。

## Q20：路由懒加载怎么做？

```js
// 组件用动态 import -> 自动代码分割成独立 chunk
const routes = [
  { path: '/', component: () => import('../views/Home.vue') },
  // 访问 / 时才下载 Home 的 chunk

  { path: '/about', component: () => import('../views/About.vue') },
  // 访问 /about 时才下载 —— 首屏不包含 About 的代码
]

// 原理：() => import() 返回 Promise
// 导航到该路由时执行 import -> 触发浏览器下载 chunk
// 守卫流程第 6 步「解析异步路由组件」等的就是这个 Promise
```

**效果**：首屏只加载首页 + 公共代码的 chunk，其他页面按需下载——首屏体积大幅减小。

## Q21：动态路由和 addRoute？

**场景**：后台管理系统——不同角色看到的菜单不同，登录后按权限动态注册路由。

```js
// 登录成功后
const menus = await fetchUserMenus()   // 后端返回该用户可访问的菜单

menus.forEach((menu) => {
  router.addRoute({
    path: menu.path,
    name: menu.name,
    component: viewModules[menu.component],  // 组件映射表
    meta: { requiresAuth: true }
  })
})

// 关键坑：addRoute 后要触发一次重新导航
router.replace(router.currentRoute.value.fullPath)
// 否则当前页面的路由表还是旧的

// 登出时移除
router.removeRoute('routeName')
router.replace('/login')
```

## Q22：keep-alive 路由缓存？

```html
<!-- App.vue -->
<router-view v-slot="{ Component }">
  <keep-alive :include="['UserList', 'OrderList']">
    <component :is="Component" />
  </keep-alive>
</router-view>
<!-- include 按组件名匹配——组件必须有 name -->
```

```js
// 被缓存组件的专属钩子
import { onActivated, onDeactivated } from 'vue'

export default {
  name: 'UserList',           // 必须有 name 才能被 include 匹配
  setup() {
    onActivated(() => {})      // 每次切回来触发
    onDeactivated(() => {})    // 切走时触发
    // 注意：不走 onMounted/onUnmounted——组件没有销毁
  }
}
```

**场景**：列表页 -> 详情页 -> 返回列表——保持滚动位置和筛选条件。

### 面试回答（总-分）

> **总起**：keep-alive 缓存组件实例，切走时不销毁、切回来不重建。
>
> **三个要点**：第一，include 按组件的 name 匹配，组件必须声明 name。第二，被缓存的组件不走 mounted/unmounted，用 onActivated/onDeactivated 感知激活和失活——数据刷新逻辑放 activated 里。第三，典型场景是列表页缓存——返回时保留筛选条件和滚动位置。

## Q23：路由 404 和匹配规则

```js
const routes = [
  { path: '/user/:id', component: User },
  // 404 兜底必须放最后
  { path: '/:pathMatch(.*)*', component: NotFound }
]
```

**匹配规则**：按定义**顺序**从上到下，第一个匹配的生效——所以精确路径在前、动态段居中、通配符兜底必须最后。

