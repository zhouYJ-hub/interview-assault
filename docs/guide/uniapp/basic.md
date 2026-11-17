# UniApp 基础篇（Q1 - Q8）

> 覆盖：跨端原理、项目结构、生命周期、跳转、通信、rpx、存储、组件

## Q1：uni-app 是什么？跨端原理？（<span class="hot">超高频</span>）

**答案**：用 Vue 语法开发，**一套代码编译到多个平台**（H5、微信/支付宝小程序、iOS/Android App）。

```text
              编写 .vue（Vue 语法 + uni.xxx API）
                          |
        +-----------------+------------------+
        |                 |                  |
   编译到 H5          编译到小程序         编译到 App
  （运行时适配）      （转 WXML/WXSS）    （原生渲染/nvue）
```

**跨端原理 = 两根支柱**：

1. **统一 API 层**：`uni.request` 在 H5 转成 fetch、小程序转成 wx.request、App 转成原生网络请求——开发者只写一套；
2. **条件编译**：`#ifdef` 让同一份代码包含平台特有逻辑，编译时只打包对应平台（见进阶篇 Q9）。

**编译型 vs 运行时**：

| 目标平台 | 机制 |
| --- | --- |
| 小程序 | **编译时**转换：template 编译成 wxml，样式转 wxss |
| H5 | **运行时**模拟：用 Vue 在浏览器里模拟小程序环境 |
| App | 原生渲染（或 nvue 的 weex 引擎） |

**考点**：组件最终渲染为各平台**原生组件**（不是 WebView 里跑网页），所以部分 CSS 在小程序端表现有差异。

## Q2：项目结构：pages.json / manifest.json？

```text
项目根目录
├── pages.json        页面路由 + 窗口样式 + tabBar + 分包 配置
├── manifest.json     应用配置：appid、名称、图标、各平台配置
├── App.vue           应用入口：全局样式 + 应用生命周期
├── main.js           Vue 初始化入口
├── uni.scss          全局 SCSS 变量（内置主题色）
├── pages/            页面目录
│   └── index/index.vue
└── static/           静态资源（图片等，不参与编译）
```

**pages.json 最常配的三块**：

```json
{
  "pages": [
    { "path": "pages/index/index", "style": { "navigationBarTitleText": "首页" } }
  ],
  "tabBar": {
    "list": [
      { "pagePath": "pages/index/index", "text": "首页" },
      { "pagePath": "pages/mine/mine", "text": "我的" }
    ]
  },
  "globalStyle": { "navigationBarBackgroundColor": "#1677ff" }
}
```

**考点**：pages 数组**第一个元素是启动页**；tabBar 页面必须在主包。

## Q3：三层生命周期与执行顺序（<span class="hot">超高频</span>）

```js
// ========== 1. 应用生命周期（App.vue，全局只触发一次） ==========
export default {
  onLaunch(options) {
    // 启动：登录初始化、获取系统信息、检查更新
  },
  onShow() { /* 从后台切回前台 */ },
  onHide() { /* 进入后台 */ }
}

// ========== 2. 页面生命周期 ==========
export default {
  onLoad(options) {
    // 页面加载：options 是跳转参数（只触发一次）
  },
  onShow()    { /* 每次显示都触发（含从下页返回） */ },
  onReady()   { /* 首次渲染完成：可以获取节点信息 */ },
  onHide()    { /* 跳走时隐藏 */ },
  onUnload()  { /* 页面卸载：清理定时器/解绑事件 */ },
  onReachBottom()         { /* 上拉触底 */ },
  onPullDownRefresh()     { /* 下拉刷新 */ }
}

// ========== 3. 组件生命周期 ==========
// 就是 Vue 的 created / mounted / unmounted —— 组件里没有 onLoad/onShow
```

**执行顺序**：`App.onLaunch -> App.onShow -> 页面.onLoad -> 页面.onShow -> 页面.onReady`。

**高频追问 onLoad vs onShow**：

| | onLoad | onShow |
| --- | --- | --- |
| 触发次数 | 一次 | 每次显示 |
| 拿跳转参数 | ✅ options | ❌ |
| 典型用途 | 初始化请求 | 从详情页返回后刷新列表 |

## Q4：五种页面跳转方式区别（<span class="hot">超高频</span>）

```js
uni.navigateTo({ url: '/pages/detail/detail?id=1' }) // 1. 保留当前页（入栈，可返回）
uni.redirectTo({ url: '/pages/login/login' })        // 2. 关闭当前页替换（不可返回）
uni.switchTab({ url: '/pages/index/index' })         // 3. 跳 tabBar 页（专用）
uni.navigateBack({ delta: 1 })                       // 4. 返回上一层
uni.reLaunch({ url: '/pages/login/login' })          // 5. 清空栈重开（退出登录）
```

| 方式 | 保留当前页 | 带参数 | 跳 tabBar | 场景 |
| --- | --- | --- | --- | --- |
| navigateTo | ✅ 入栈 | ✅ | ❌ | 跳详情 |
| redirectTo | ❌ 替换 | ✅ | ❌ | 登录成功进主页 |
| switchTab | - | **❌** | ✅ | 底部导航切换 |
| navigateBack | 出栈 | 靠事件 | - | 返回 |
| reLaunch | 清空全部 | ✅ | ✅ | 退出登录 |

**坑**：switchTab 不能带 URL 参数（tabbar 切换机制不解析 query）——要传数据用全局状态或 storage。

## Q5：页面间通信的四种方式（<span class="hot">超高频</span>）

```js
// ========== 方式一：URL 参数（最常用） ==========
uni.navigateTo({ url: '/pages/detail?id=1&name=xx' })
// 详情页接收：
onLoad(options) {
  console.log(options.id) // 全是字符串！数字要 Number(options.id)
}

// ========== 方式二：EventChannel（官方推荐的页面双向通信） ==========
// A 页面
uni.navigateTo({
  url: '/pages/detail',
  events: {
    // 监听 B 页 emit 的事件（接收 B 返回的数据）
    selectResult(data) { console.log('B 传回：', data) }
  },
  success(res) {
    res.eventChannel.emit('initData', { id: 1 }) // 发给 B
  }
})
// B 页面
onLoad() {
  const ec = this.getOpenerEventChannel()
  ec.on('initData', (data) => { /* 收 A 的数据 */ })
  ec.emit('selectResult', { value: 'xx' })       // 回传给 A
}

// ========== 方式三：全局事件（任意页面/组件间） ==========
uni.$emit('refreshList', { page: 1 })     // 发
uni.$on('refreshList', this.load)         // 收（onLoad 注册）
uni.$off('refreshList', this.load)        // onUnload 必须解绑！

// ========== 方式四：全局状态 ==========
getApp().globalData.user = { id: 1 }      // 简单场景
// 复杂场景用 Pinia（见进阶篇 Q12）
```

**坑**：`uni.$on` 不配 `uni.$off` 解绑 -> 重复注册 -> 回调执行多次。

## Q6：rpx 的底层原理

### 一句话本质

rpx **不是浏览器原生单位**——浏览器只认识 px/em/rem 等标准单位。rpx 是框架（小程序基础库 / uni-app 编译器）提供的**换算层单位**，本质是一个**屏幕宽度比例单位**：

```text
1rpx = 屏幕宽度的 1/750 ≈ 屏幕宽度的 0.133%

所有端的实现殊途同归：把 rpx 换算成 px 再交给渲染引擎
```

### 渲染链条：rpx 的必经之路

```text
你写的样式            框架做的事                 最终渲染
============   =========================   ==============
width: 375rpx  ->  按公式换算成 px        ->  渲染引擎只处理 px
                    375/750 * 屏宽 = 屏宽的一半
```

**关键认知**：渲染引擎（浏览器内核 / 小程序 WebView / 原生引擎）从头到尾**只处理 px**——rpx 在到达渲染引擎之前就已被换算掉。不同端的差别只在「谁来换算、什么时候换算」。

### 小程序端：基础库渲染时换算

微信小程序的 WXSS 引擎**原生支持 rpx**：

```text
WXSS 样式: width: 375rpx
    |
    | 小程序基础库（渲染层）
    | 换算公式: 实际px = rpx值 * windowWidth / 750
    v
iPhone 6:  375 * 375 / 750 = 187.5px
安卓 414:  375 * 414 / 750 = 207px
    |
    v
交给 WebView 按 px 渲染
```

这是 rpx 的「出生地」——微信基础库在渲染层内置了这个换算，开发者无感知。

### H5 端：uni-app 编译时转 rem + 运行时动态根字号

浏览器**完全不认识 rpx**（写进 CSS 直接无效）。uni-app 的做法分两步：

**第 1 步（编译时）**：把 CSS 里的 rpx **统一转成 rem**：

```css
/* 你写的： */
.banner { width: 750rpx; height: 300rpx; }

/* 编译产物（H5 端 DevTools 里能看到）： */
.banner { width: 23.4375rem; height: 9.375rem; }
/* 按 1rem = 32rpx 的比例换算：750/32=23.4375，300/32=9.375 */
```

**第 2 步（运行时）**：JS 动态设置根字号，让 rem 随屏幕宽变化：

```js
// uni-app 运行时内部逻辑（等价实现）
function setRootFontSize() {
  const width = document.documentElement.clientWidth
  // 1rem = 32rpx，而 750rpx = 屏宽
  // -> 1rem = 屏宽 / 750 * 32
  document.documentElement.style.fontSize = (width / 750 * 32) + 'px'
}
setRootFontSize()
window.addEventListener('resize', setRootFontSize)
```

**验证换算闭环**（375px 宽的 iPhone 6）：

```text
根字号 = 375 / 750 * 32 = 16px（即 1rem = 16px）

.banner 宽 = 23.4375rem × 16px = 375px  正好满屏 ✅
屏宽变成 414px 时根字号 = 17.66px
.banner 宽 = 23.4375 × 17.66 ≈ 414px    依然满屏 ✅
```

**这就是 H5 端 rpx 的全部真相：rpx ->（编译）-> rem ->（动态根字号）-> px。**

### 手写一个 rpx（彻底理解原理）

不依赖 uni-app，用 10 行代码在纯 H5 页面复刻 rpx 效果：

```html
<style>
  /* 假装 1rem = 100rpx（比 uni-app 的 32 好算） */
  .banner {
    width: 7.5rem;   /* 想表达 750rpx 满屏 */
    height: 3rem;    /* 想表达 300rpx */
  }
</style>
<script>
  // 满屏 = 7.5rem -> 1rem = 屏宽/7.5 = 屏宽/750*100
  function init() {
    const w = document.documentElement.clientWidth
    document.documentElement.style.fontSize = w / 7.5 + 'px'
  }
  init()
  window.addEventListener('resize', init)
</script>
```

375px 屏：1rem = 50px，banner = 7.5 × 50 = 375px 满屏；414px 屏自动变 414px——**这就是 rpx 的本质：用 rem + 动态根字号模拟的比例单位**。

### 各端实现总结表

| 端 | 换算时机 | 换算方式 |
| --- | --- | --- |
| 微信小程序 | **渲染时** | WXSS 引擎原生支持：`rpx * windowWidth / 750` |
| H5 | **编译时 + 运行时** | 编译转 rem + JS 动态改根字号 |
| App（vue 页） | 编译时 | 同 H5 思路 |
| App（nvue） | 渲染时 | 原生引擎内置换算 |

### JS 中怎么处理 rpx

JS 逻辑里不能用 rpx 字符串参与计算，用内置 API 换算：

```js
const px = uni.upx2px(375)   // 375rpx -> 当前设备的 px 值（375屏返回187.5）

// 动态绑定高度的典型写法：
data() {
  return { barHeight: uni.upx2px(88) + 'px' }
}
```

### 面试怎么答（总-分）

> **总起**：rpx 不是浏览器原生单位，本质是「屏幕宽度比例单位」——1rpx 固定等于屏宽的 750 分之一，所有实现最终都换算成 px 再渲染。
>
> **分端讲实现**：
>
> **小程序端**，WXSS 引擎原生支持，渲染时按 `rpx × windowWidth ÷ 750` 直接换算成 px；
>
> **H5 端**，浏览器不认识 rpx，uni-app 分两步：编译时把 rpx 按 1rem 等于 32rpx 转成 rem，运行时 JS 动态设置根字号等于「屏宽 ÷ 750 × 32」——rem 值不变、根字号随屏宽变，闭环还原 rpx 语义；
>
> **本质一句话**：rpx 等价于「rem + 动态根字号」这套组合，只是把动态换算从开发者手里挪进了框架。## Q7：数据存储怎么做？

```js
// 同步版（常用）
uni.setStorageSync('token', 'abc123')
const token = uni.getStorageSync('token')
uni.removeStorageSync('token')
uni.clearStorageSync()

// 异步版（大数据防阻塞）
uni.setStorage({
  key: 'userInfo',
  data: { name: '小明' },
  success: () => console.log('存好了')
})
```

**坑**：

1. 不要用 `localStorage`——只在 H5 端存在，小程序端报错；`uni.setStorageSync` 全端可用；
2. 微信小程序**单个 key 限 1MB、总共 10MB**——大列表别塞 storage；
3. 存对象直接存（内部会序列化），取出来就是对象，不用 JSON.parse。

## Q8：组件通信与 easycom

**组件通信**：props 传子、`$emit` 传父——和 Vue 完全一样；跨页面用 Q5 的 `uni.$emit`。

**easycom 自动注册**：按规范放组件就**不用 import**：

```text
components/
  my-button/
    my-button.vue     <- 文件夹名 = 文件名 = 组件名
```

```vue
<template>
  <!-- 直接用，无需 import 和 components 注册 -->
  <my-button type="primary">按钮</my-button>
</template>
```

uni-ui 等组件库就是靠 easycom 做到「装了即用」。

## 本篇速答

| 问题 | 答案 |
| --- | --- |
| 跨端原理两支柱？ | 统一 API 层 + 条件编译 |
| onLoad vs onShow？ | onLoad 一次带参数；onShow 每次显示 |
| switchTab 带参？ | 不能，用全局状态传 |
| 1rpx 等于多少？ | 屏幕宽 / 750；750rpx 永远满屏 |
| uni.$on 的坑？ | onUnload 必须 $off，否则重复执行 |
| 能用 localStorage 吗？ | 不能（仅 H5），用 uni.setStorageSync |
