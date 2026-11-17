# UniApp 高级篇（Q16 - Q20）

> 覆盖：分包加载、热更新、长列表性能优化、多端差异化、打包发布

## Q16：分包加载完整操作流程

### 第 0 步：判断是否需要分包

```text
微信开发者工具 -> 详情 -> 基本信息
  查看「代码包体积」：
  主包 > 1.8MB（接近 2MB 上限）-> 必须分包
  或者：上传时报错「主包大小超过 2MB」

常见体积大户（优先排查）：
  1. static 目录的大图片（本地图片改用 CDN 链接，能省最多）
  2. 未按需引入的 UI 组件库（整包引入 uni-ui）
  3. 页面过多未拆分（商品、订单、设置全堆主包）
```

### 第 1 步：规划分包结构

```text
规划原则：按「业务模块」拆，低频模块进分包

src/
├── pages/                  主包：只留 tabBar 页 + 首页/登录等高频页
│   ├── index/index.vue     （tabBar 页必须在主包！）
│   ├── mine/mine.vue       （tabBar 页）
│   └── login/login.vue
│
├── subpkg-goods/           分包1：商品模块（低频）
│   ├── list/list.vue
│   └── detail/detail.vue
│
├── subpkg-order/           分包2：订单模块
│   ├── list/list.vue
│   └── detail/detail.vue
│
└── subpkg-setting/         分包3：设置（更低频）
    ├── about/about.vue
    └── privacy/privacy.vue
```

### 第 2 步：pages.json 配置分包

```json
{
  "pages": [
    { "path": "pages/index/index" },
    { "path": "pages/mine/mine" },
    { "path": "pages/login/login" }
  ],

  "subPackages": [
    {
      "root": "subpkg-goods",
      "pages": [
        { "path": "list/list", "style": { "navigationBarTitleText": "商品列表" } },
        { "path": "detail/detail", "style": { "navigationBarTitleText": "商品详情" } }
      ]
    },
    {
      "root": "subpkg-order",
      "pages": [
        { "path": "list/list" },
        { "path": "detail/detail" }
      ]
    },
    {
      "root": "subpkg-setting",
      "pages": [
        { "path": "about/about" },
        { "path": "privacy/privacy" }
      ]
    }
  ],

  "preloadRule": {
    "pages/index/index": {
      "network": "all",
      "packages": ["subpkg-goods"]
    },
    "pages/mine/mine": {
      "network": "wifi",
      "packages": ["subpkg-order"]
    }
  },

  "lazyCodeLoading": "requiredComponents"
}
```

**配置逐项解释**：

| 配置 | 作用 | 注意 |
| --- | --- | --- |
| `root` | 分包根目录名 | 也是路径前缀 |
| `pages[].path` | 相对 root 的页面路径 | 实际完整路径 = root + path |
| `preloadRule` | 进入某页时**预下载**指定分包 | `network: wifi` 只在 WiFi 预载，`all` 任何时候 |
| `lazyCodeLoading` | 按需注入组件代码 | 进一步减小启动时注入的代码量 |

**预下载策略怎么定**：

```text
首页 -> 预载商品分包（用户大概率马上点商品）network: all
我的 -> 预载订单分包（查订单是次高频）      network: wifi（省流量）
设置类分包 -> 不预载（点进去再加载也不慢）
单个分包预载大小 + 当前页主包大小 <= 2MB
```

### 第 3 步：跳转分包页面

```js
// 跳转路径 = / + 分包root + / + 页面path
uni.navigateTo({ url: '/subpkg-goods/list/list' })           // 商品列表
uni.navigateTo({ url: '/subpkg-goods/detail/detail?id=1' })  // 带参数
uni.navigateTo({ url: '/subpkg-order/list/list?type=1' })
```

### 第 4 步：处理分包的引用关系（易错）

```text
引用方向规则：
  分包 -> 主包 ✅ 可以（组件、工具函数、样式）
  主包 -> 分包 ❌ 不行（主包加载时分包还没下载）
  分包 -> 分包 ❌ 不行

违反的后果：编译报错或运行时组件找不到
```

```js
// 分包页面里引用主包的东西 —— ✅ 合法
import request from '@/utils/request'   // 主包的工具
```

```vue
<!-- 分包页面里用主包注册的全局组件 —— ✅ 合法 -->
<template>
  <my-navbar />   <!-- easycom 组件放主包，分包能用 -->
</template>
```

```js
// ❌ 反过来：主包页面 import 分包里的组件 -> 编译报错
```

**公共组件放哪**：多个分包共用的放**主包** `components/`；只有某个分包用的放**分包内**（省主包体积）：

```text
subpkg-goods/
  components/          分包私有组件（不占主包体积）
    goods-card/
      goods-card.vue
```

### 第 5 步：独立分包（进阶）

```json
{
  "subPackages": [
    {
      "root": "subpkg-activity",
      "pages": [{ "path": "poster/poster" }],
      "independent": true
    }
  ]
}
```

**独立分包**：不依赖主包就能运行——主包还没下载时就能打开（适合营销落地页、分享海报页）。限制：**不能引用主包的任何内容**（组件/工具/样式都不行）。

### 第 6 步：验证分包效果

```text
1. 微信开发者工具 -> 详情 -> 基本信息
   看到多个包的体积分布：
   主包: 1.2MB ✅（< 2MB）
   subpkg-goods: 0.3MB
   subpkg-order: 0.2MB

2. 编译模式 -> 添加编译模式 -> 启动页面选分包页面
   验证分包页面能独立打开

3. 真机预览：首次进入分包页面会有短暂 loading（下载分包）
   配了 preloadRule 的页面应无感
```

## Q17：App 热更新完整操作流程

### 热更新的原理基础

```text
App 安装包的组成：
┌─────────────────────────────┐
│  原生壳（apk / ipa）          │  <- 应用商店分发
│  ├── 原生插件 / SDK           │  <- 变了必须整包更新
│  └── 前端资源（wgt 包）        │  <- 页面/JS/CSS，变了可热更
└─────────────────────────────┘

热更新 = 只下载新的 wgt 前端资源包 -> 安装 -> 重启
       = 不经过应用商店、用户无感知升级
```

**能不能热更新的判定表**：

| 本次修改的内容 | 更新方式 |
| --- | --- |
| 页面 / 组件 / JS / CSS / 图片 | ✅ wgt 热更新 |
| 修复前端 bug、改 UI | ✅ wgt 热更新 |
| 新增/升级**原生插件** | ❌ 整包更新 |
| 修改 **manifest.json 的原生配置**（权限、模块） | ❌ 整包更新 |
| 升级 uni-app **SDK/基座**版本 | ❌ 整包更新 |

### 第 1 步：维护版本号（manifest.json）

```json
// manifest.json -> 源码视图
{
  "versionName": "1.2.0",
  "versionCode": 120
}
// versionName 给用户看；versionCode 递增整数给程序比对
// 每次发版两个都要改！
```

### 第 2 步：打 wgt 资源包

```text
HBuilderX 操作：
  发行 -> 原生App-制作应用wgt包
  -> 生成 xxx.wgt 文件

wgt 本质：一个 zip，里面是编译后的前端资源
上传到服务器 / OSS，拿到下载地址：
  https://cdn.example.com/app/release-1.2.0.wgt
```

### 第 3 步：后端版本管理接口

```json
// GET /app/check-update?platform=android&version=1.1.0
// 后端返回：
{
  "code": 0,
  "data": {
    "needUpdate": true,
    "version": "1.2.0",          // 最新版本号
    "isForce": false,             // 是否强制更新
    "wgtUrl": "https://cdn.xxx/app/release-1.2.0.wgt",
    "pkgUrl": "",                 // 有值 = 需要整包（apk 下载地址）
    "updateLog": "1. 修复xxx\n2. 优化xxx"
  }
}
// 后端逻辑：比对 version，返回是否更新 + 用 wgt 还是 pkg
```

### 第 4 步：前端完整检测更新代码

```js
// utils/update.js —— App 端专用
// #ifdef APP-PLUS
export function checkUpdate(showTip = false) {
  // 1. 拿当前版本
  plus.runtime.getProperty(plus.runtime.appid, (widgetInfo) => {
    const currentVersion = widgetInfo.version  // '1.1.0'

    // 2. 请求后端检查
    request({
      url: '/app/check-update',
      data: {
        platform: plus.os.name === 'Android' ? 'android' : 'ios',
        version: currentVersion
      }
    }).then((res) => {
      if (!res.needUpdate) {
        // 手动检查时提示「已是最新」
        if (showTip) uni.showToast({ title: '已是最新版本', icon: 'none' })
        return
      }

      // 3a. 需要整包更新（原生层变了）
      if (res.pkgUrl) {
        showWholeUpdateModal(res)
        return
      }

      // 3b. wgt 热更新（前端资源变了）
      showWgtUpdateModal(res)
    })
  })
}

// —— wgt 热更新弹窗 ——
function showWgtUpdateModal(res) {
  uni.showModal({
    title: `发现新版本 v${res.version}`,
    content: res.updateLog,
    confirmText: '立即更新',
    // 强制更新时不允许取消
    showCancel: !res.isForce,
    success: ({ confirm }) => {
      if (confirm) downloadAndInstallWgt(res.wgtUrl)
    }
  })
}

// —— 下载并安装 wgt ——
function downloadAndInstallWgt(wgtUrl) {
  uni.showLoading({ title: '下载中...', mask: true })

  uni.downloadFile({
    url: wgtUrl,
    success: (res) => {
      uni.hideLoading()
      if (res.statusCode !== 200) {
        uni.showToast({ title: '下载失败', icon: 'none' })
        return
      }
      // 安装 wgt：tempFilePath 是下载好的临时文件
      plus.runtime.install(
        res.tempFilePath,
        { force: false },   // false：版本号低于当前不安装（防降级）
        () => {
          // 安装成功 -> 必须重启才能生效
          uni.showModal({
            title: '更新完成',
            content: '重启应用后生效',
            showCancel: false,
            success: () => plus.runtime.restart()
          })
        },
        (e) => {
          uni.showToast({ title: '安装失败：' + e.message, icon: 'none' })
        }
      )
    },
    fail: () => {
      uni.hideLoading()
      uni.showToast({ title: '网络异常', icon: 'none' })
    }
  })
}

// —— 整包更新 ——
function showWholeUpdateModal(res) {
  uni.showModal({
    title: '发现新版本',
    content: `${res.updateLog}\n本次更新需重新安装`,
    showCancel: !res.isForce,
    success: ({ confirm }) => {
      if (!confirm) return
      if (plus.os.name === 'Android') {
        // 安卓：直接下载 apk
        plus.runtime.openURL(res.pkgUrl)
        // 或用 plus.runtime.openFile 下载后拉起安装
      } else {
        // iOS：只能跳 App Store
        plus.runtime.launchApplication({
          action: `itms-apps://itunes.apple.com/cn/app/id${appleId}`
        })
      }
    }
  })
}
// #endif
```

### 第 5 步：触发时机

```js
// App.vue
export default {
  onLaunch() {
    // #ifdef APP-PLUS
    checkUpdate()          // 启动时静默检查（有更新弹窗，无更新不打扰）
    // #endif
  }
}

// 设置页放一个「检查更新」按钮（手动触发）
// #ifdef APP-PLUS
checkUpdate(true)   // showTip=true：没更新时提示「已是最新」
// #endif
```

### 第 6 步：测试热更新流程

```text
1. 用 1.1.0 版本的包（自定义基座或正式包）装到手机
2. 改几行代码 -> 打 1.2.0 的 wgt -> 上传服务器
3. 后端 check-update 接口返回 needUpdate: true
4. 重启 App -> 弹更新弹窗 -> 确认 -> 下载安装 -> 重启
5. 验证：新代码生效 + 版本号变成 1.2.0

注意：
  - 云打包的「自定义基座」测热更新最方便（不用重新打整包）
  - wgt 版本号必须高于当前版本（force:false 会拒绝降级）
  - 模拟器测试不完整，务必真机回归
```

### 版本号对比函数（后端/前端都可能用）

```js
// 语义化版本比较：'1.2.0' vs '1.10.0' —— 不能直接字符串比！
function compareVersion(v1, v2) {
  const a = v1.split('.').map(Number)   // [1, 2, 0]
  const b = v2.split('.').map(Number)   // [1, 10, 0]
  for (let i = 0; i < 3; i++) {
    if (a[i] !== b[i]) return a[i] - b[i]  // 2 < 10 -> 负数 = v1 更旧
  }
  return 0  // 相等
}
// compareVersion('1.2.0', '1.10.0') -> -8（负数 = 有新版本可更）
// '1.10.0' > '1.9.9' ✅；直接字符串比 '1.10.0' < '1.9.9' ❌ 会判断反！


## Q18：长列表性能优化

**问题根源**：小程序 setData 是最大瓶颈——数据从逻辑层传到渲染层有序列化成本，长列表全量渲染必卡。

**四板斧**：

```js
// 1. 减少 setData 数据量：只传变化的字段，不全量替换
// ❌ this.list = res（1000 条全量重传）
// ✅ 用数据路径更新：只更新某一项
this.setData ? null : null
uni.pageScrollTo({}) // 占位
// Vue 写法上 uni-app 自动 diff，但避免频繁触发（滚动中疯狂 setState）

// 2. 分页 + 触底加载（见进阶篇 Q11）—— 不一次性拉全部
```

```vue
<!-- 3. 虚拟列表：只渲染可视区域 + 缓冲区，销毁滚出屏幕的项 -->
<uni-list :border="false">
  <uni-list-item v-for="item in visibleList" :key="item.id" />
</uni-list>
<!-- visibleList 由滚动位置计算：startIndex ~ endIndex
     1 万条数据实际只渲染 20 条，性能 O(可视区) 而不是 O(总数) -->
```

```js
// 4. 图片优化
// 列表用缩略图，点开再看大图
<img :src="item.thumbUrl" lazy-load />
```

**考点**：能说出「虚拟列表 = 只渲染可视区 + 滚动时动态换窗口」这句原理，再提 uni-list 组件或自己实现均可。

## Q19：多端差异化处理

**1. 平台判断（运行时）**：

```js
// 快速判断当前平台
const isWeixin = uni.getSystemInfoSync().uniPlatform === 'mp-weixin'
// 或条件编译给变量赋值（推荐，编译期确定）
// #ifdef MP-WEIXIN
const platform = 'weixin'
// #endif
```

**2. 样式差异**：

```css
/* #ifdef H5 */
.header { padding-top: 44px; }  /* H5 浏览器有地址栏遮挡 */
/* #endif */

/* #ifdef MP-WEIXIN */
.header { padding-top: 0; }     /* 小程序有原生导航栏 */
/* #endif */
```

**3. API 差异清单（高频）**：

| 能力 | H5 | 小程序 | App |
| --- | --- | --- | --- |
| 支付 | 跳转支付页 | uni.requestPayment | uni.requestPayment（各渠道） |
| 登录 | 账号密码/手机号 | uni.login 各平台 code | 一键登录/第三方 |
| 存储 | localStorage 兼容 | wx.setStorage | plus.storage |
| 推送 | 无 | 订阅消息 | uniPush |

**处理原则**：能用统一 API 就用统一的；平台特有逻辑用 `#ifdef` 包裹；判断当前端用编译期变量而不是运行时 if。

## Q20：打包发布全流程

```text
H5：
  npm run build:h5
  -> dist/build/h5 部署到 nginx / 静态托管
  注意：配置 manifest.json 的 h5.router.mode（hash/history）

微信小程序：
  方式一 HBuilderX：发行 -> 小程序-微信
    -> 自动打开微信开发者工具 -> 上传 -> 后台提审
  方式二 CLI：npm run build:mp-weixin
    -> 微信开发者工具导入 dist/build/mp-weixin -> 上传

App：
  云打包：HBuilderX -> 发行 -> 原生App-云打包
    -> 配置图标/启动图/证书 -> 打包出 apk / ipa
  注意 iOS 需要开发者账号和证书；安卓可直接分发 apk
```

**发布前检查清单**：

```text
1. 版本号是否更新（manifest.json 的 versionName）
2. 接口环境是否切到生产（baseUrl 检查）
3. 主包体积是否超 2MB（超了做分包）
4. 隐私权限声明（相册/定位等用途说明）
5. 体验版完整回归一遍再提审
```

## 本篇速答

| 问题 | 答案 |
| --- | --- |
| 为什么分包？ | 微信主包限 2MB，业务大必超 |
| tabBar 页面能放分包吗？ | 不能，必须在主包 |
| preloadRule 干嘛的？ | 进入指定页时预下载分包，减少白屏 |
| 热更新原理？ | 前端资源打包成 wgt，下载安装重启，不动原生壳 |
| 什么情况必须整包更新？ | 原生插件/SDK/manifest 原生配置变了 |
| 虚拟列表原理一句话？ | 只渲染可视区 + 缓冲区，滚动时动态换窗口 |
| 多端差异的处理原则？ | 统一 API 优先、#ifdef 裁剪、编译期变量判端 |
