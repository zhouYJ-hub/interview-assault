# qiankun 微前端专题

> 五大核心知识点：使用场景 / JS 沙箱 / CSS 隔离 / 路由隔离 / 应用通信

---

## 一、什么情况需要 qiankun？

### 为什么需要微前端

```text
一个大平台 = 多个团队负责的不同模块

┌─────────────────────────────────────────────┐
│                整体平台                       │
│                                             │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐     │
│  │ 用户中心  │  │ 订单系统 │  │ 数据报表 │     │
│  │ (Vue 3) │  │ (React 18)│  │ (老jQuery)│  │
│  │ 团队A   │  │ 团队B    │  │ 团队C    │     │
│  └─────────┘  └─────────┘  └─────────┘     │
└─────────────────────────────────────────────┘

不用微前端的问题：
  ① 一个仓库 -> 构建慢、冲突多
  ② 一起发版 -> 团队A改一行，团队B也要回归
  ③ 技术栈绑死 -> 老系统无法渐进迁移
  ④ 新人接手 -> 一个几百万行的仓库看不懂
```

### 需要用 qiankun 的具体场景

| 场景 | 说明 |
| --- | --- |
| **大型平台多团队** | 三个以上团队各自维护一个模块，需要独立开发部署 |
| **技术栈不一致** | 团队A用 Vue、团队B用 React、老系统是 jQuery——要整合到一个页面 |
| **老系统渐进迁移** | 不想一次性重写，一个模块一个模块地拆出去 |
| **按需降级部署** | 某个子应用出问题，只回滚那一个，不影响其他 |
| **子团队独立发版** | 每个团队自己的 CI/CD，发版不用协调其他团队 |

### 不需要 qiankun 的情况

```text
① 小项目（几个页面）-> 直接一个 Vue/React 应用就够了
② 团队少（1-2个团队）-> 没有协作痛点
③ 技术栈统一且没有拆分需求 -> 拆了反而增加复杂度
④ 对 SEO 要求极高的 C 端页面 -> SSR 更合适
```

### qiankun 与其他方案对比

| 方案 | 隔离方式 | 接入成本 | 适合 |
| --- | --- | --- | --- |
| **qiankun** | Proxy 沙箱 + scoped CSS | 中（子应用要改） | 生产级标准方案 |
| **micro-app** | Proxy 沙箱 + Web Component | 低（像组件） | 快速接入 |
| **wujie** | iframe（天然隔离） | 低 | 需要完美隔离 |
| **模块联邦** | 构建时共享（无运行时隔离） | 高 | Webpack 项目间 |

---

## 二、JS 沙箱原理

### 为什么需要 JS 沙箱

```js
// 问题：子应用A和子应用B都往 window 上挂东西

// 子应用A
window.name = '我是A'
window.getConfig = () => { return configA }

// 子应用B（后加载的覆盖了A的！）
window.name = '我是B'        // A的 name 被污染
window.getConfig = () => { return configB }  // A的方法被覆盖

// 子应用A卸载后
delete window.getConfig     // B的方法也被删了！
```

**JS 沙箱的目标**：让每个子应用的全局变量操作互不影响。

### qiankun 的三种沙箱模式

#### 模式一：SnapshotSandbox（快照沙箱，降级方案）

```js
// 原理：激活前拍快照，失活后恢复

class SnapshotSandbox {
  constructor() {
    this.snapshot = {}  // 快照
    this.modifyProps = {}  // 记录子应用修改过的属性
  }

  // 激活：拍快照
  active() {
    // 遍历 window 的所有属性，拍一张快照
    for (const key in window) {
      this.snapshot[key] = window[key]
    }
    // 恢复上一次子应用修改过的属性
    Object.keys(this.modifyProps).forEach((key) => {
      window[key] = this.modifyProps[key]
    })
  }

  // 失活：对比快照，恢复原值
  inactive() {
    for (const key in window) {
      if (window[key] !== this.snapshot[key]) {
        // 记录子应用改了什么
        this.modifyProps[key] = window[key]
        // 恢复原值
        window[key] = this.snapshot[key]
      }
    }
  }
}
```

**缺点**：遍历 window 的所有属性，性能差；不支持多实例（同时只能一个子应用激活）。

#### 模式二：LegacySandbox（代理沙箱，单实例优化）

```js
// 原理：用 Proxy 记录「新增」和「修改」的属性，失活时恢复

class LegacySandbox {
  constructor() {
    this.addedProps = new Map()   // 子应用新增的属性
    this.modifiedProps = new Map() // 子应用修改的原有属性
    this.currentUpdatedProps = new Map()

    const self = this
    this.proxy = new Proxy(window, {
      set(target, key, value) {
        if (!target.hasOwnProperty(key)) {
          // 新增属性
          self.addedProps.set(key, value)
        } else if (!self.modifiedProps.has(key)) {
          // 修改已有属性，记录原值
          self.modifiedProps.set(key, target[key])
        }
        self.currentUpdatedProps.set(key, value)
        target[key] = value  // 直接写到真 window 上
      },
      get(target, key) {
        return target[key]
      }
    })
  }

  // 失活：恢复
  inactive() {
    // 恢复被修改的属性
    this.modifiedProps.forEach((val, key) => { window[key] = val })
    // 删除新增的属性
    this.addedProps.forEach((_, key) => { delete window[key] })
  }
}
```

**改进**：不用遍历 window，性能好。**缺点**：仍然直接操作真 window，不支持多实例。

#### 模式三：ProxySandbox（代理沙箱增强版，默认，支持多实例）⭐

```js
// 原理：为每个子应用创建一个「假的 window」
// 所有写操作都困在 fakeWindow 里，真 window 完全不受影响

class ProxySandbox {
  constructor() {
    this.fakeWindow = {}  // 每个子应用独立的假 window

    this.proxy = new Proxy(this.fakeWindow, {
      get(target, key, receiver) {
        // 读：优先从 fakeWindow 拿
        if (key in target) {
          return Reflect.get(target, key, receiver)
        }
        // fakeWindow 没有再从真 window 拿（只读）
        const rawValue = Reflect.get(window, key)
        // 一些特殊属性需要绑定 this
        if (typeof rawValue === 'function' && !rawValue.prototype) {
          return rawValue.bind(window)
        }
        return rawValue
      },

      set(target, key, value, receiver) {
        // 写：只写进 fakeWindow！真 window 完全不受影响！
        return Reflect.set(target, key, value, receiver)
      },

      has(target, key) {
        return key in target || key in window
      },

      deleteProperty(target, key) {
        // 删除也只删 fakeWindow 里的
        return Reflect.deleteProperty(target, key)
      }
    })
  }
}

// 子应用A的 fakeWindow: { name: 'A' }
// 子应用B的 fakeWindow: { name: 'B' }
// 真正的 window: 什么都没变 ✅
```

**为什么支持多实例**：每个子应用有自己独立的 fakeWindow——A 挂的 `window.name = 'A'` 写进 A 的 fakeWindow，B 的写进 B 的，互不干扰。

### 三种沙箱对比

| | SnapshotSandbox | LegacySandbox | ProxySandbox |
| --- | --- | --- | --- |
| 实现 | 遍历快照 | Proxy 记录修改 | **Proxy + fakeWindow** |
| 操作真 window | ✅（恢复式） | ✅（记录式） | **❌ 完全不碰** |
| 多实例 | ❌ | ❌ | **✅** |
| 性能 | 差（遍历） | 好 | **最好** |
| 何时用 | 不支持 Proxy 的浏览器 | 单实例场景 | **默认（多实例）** |

---

## 三、CSS 隔离原理

### 为什么需要 CSS 隔离

```css
/* 子应用A的样式 */
.btn { color: red; padding: 8px 16px; }

/* 子应用B的样式（后加载的覆盖了A的！） */
.btn { color: blue; padding: 4px 8px; }
/* A的按钮也变蓝了，间距也变了 —— 样式污染 */
```

### 方案一：experimentalStyleIsolation（Scoped CSS）

```js
// qiankun 启动时配置
start({
  sandbox: { experimentalStyleIsolation: true }
})
```

**原理**：qiankun 在运行时**劫持子应用的样式规则**，给每条规则加上子应用容器的前缀选择器：

```css
/* 原始的子应用A样式 */
.btn { color: red; }
.card .title { font-size: 16px; }

/* qiankun 处理后 */
div[data-qiankun="sub-app-a"] .btn { color: red; }
div[data-qiankun="sub-app-a"] .card .title { font-size: 16px; }
/*                            ^^^^^^^^^^^^^^^^^^^^ 加了前缀 */
```

```html
<!-- qiankun 会给子应用的容器加上 data-qiankun 属性 -->
<div data-qiankun="sub-app-a" id="subapp-viewport">
  <!-- 子应用A渲染在这里 -->
  <!-- 它的样式只作用于这个 div 内部的元素 -->
</div>
```

**优点**：简单有效，不影响弹窗。

**缺点**：
- 子应用运行时**动态插入**的 style 标签可能处理不到
- 子应用如果用了 `body` 或 `html` 级别的样式，前缀处理不了

### 方案二：strictStyleIsolation（Shadow DOM）

```js
start({
  sandbox: { strictStyleIsolation: true }
})
```

**原理**：把子应用渲染到 ShadowRoot 里——浏览器原生的样式隔离边界：

```js
// qiankun 内部实现
const shadowRoot = container.attachShadow({ mode: 'open' })
shadowRoot.appendChild(subAppElement)
// ShadowRoot 内外的样式完全隔离
// 外面的 .btn 不会影响里面，里面的也不会泄漏出去
```

```html
<!-- DOM 结构 -->
<div id="subapp-viewport">
  #shadow-root (open)
    <!-- 子应用渲染在这里 -->
    <div class="app">...</div>
</div>
```

**优点**：完全隔离——内外样式零影响。

**缺点**：
- **弹窗组件失效**：Element/Ant Design 的弹窗默认挂到 `document.body`，而 body 在 ShadowRoot 外面——样式作用不到弹窗
- 一些 UI 库（获取元素尺寸/做全局事件代理的）在 Shadow DOM 下不兼容
- 全局事件（如 window.resize）监听可能失效

### 两种方案对比

| | experimentalStyleIsolation | strictStyleIsolation |
| --- | --- | --- |
| 技术 | CSS 选择器前缀 | Shadow DOM |
| 隔离程度 | 基本隔离（有边界情况） | **完全隔离** |
| 弹窗兼容 | ✅ 正常 | ❌ 弹到 body 找不到样式 |
| 动态 style | 可能处理不到 | ✅ 全覆盖 |
| 推荐度 | **默认推荐** | 特殊需求才用 |

### 最佳实践

```text
1. 首选 experimentalStyleIsolation
2. 团队约定 CSS 命名规范（BEM + 项目前缀）-> 从源头避免冲突
3. 子应用避免直接写 body/html 级别的样式
4. UI 库的样式用按需引入，减少全局注入
```

---

## 四、路由隔离原理

### qiankun 怎么知道该加载哪个子应用

```text
核心机制：URL 变化 -> 匹配 activeRule -> 激活/卸载子应用
```

```js
// 注册时每个子应用有一个 activeRule
registerMicroApps([
  { name: 'appA', activeRule: '/app-a', ... },
  { name: 'appB', activeRule: '/app-b', ... }
])

// URL 变化时：
// /app-a/page1 -> 匹配 appA -> 激活 appA
// /app-b/list  -> 匹配 appB -> 激活 appB（同时卸载 appA）
// /home        -> 不匹配任何 -> 显示主应用自己的页面
```

### 路由监听的实现

qiankun（基于 single-spa）劫持了浏览器的路由 API：

```js
// qiankun 内部劫持了以下路由操作：

// ① 劫持 pushState
const originalPushState = window.history.pushState
window.history.pushState = function (state, title, url) {
  // 先通知 qiankun 路由变了
  notifyRouterChange(url)
  // 再执行原始的 pushState
  return originalPushState.call(this, state, title, url)
}

// ② 劫持 replaceState（同理）

// ③ 监听 popstate（浏览器前进后退）
window.addEventListener('popstate', () => {
  notifyRouterChange(location.pathname)
})

// 通知后 -> qiankun 遍历所有子应用的 activeRule
//         -> 匹配的激活（调 mount）
//         -> 不匹配的卸载（调 unmount）
```

### activeRule 的匹配方式

```js
// 方式一：字符串前缀匹配（最常用）
{ activeRule: '/app-a' }
// /app-a ✅  /app-a/page1 ✅  /app-b ❌

// 方式二：函数（自定义匹配逻辑）
{ activeRule: (location) => location.pathname.startsWith('/app-a') }

// 方式三：数组（多个路径都激活）
{ activeRule: ['/app-a', '/admin'] }
```

### 子应用路由的 base 配置

```js
// 子应用A的路由必须以 /app-a 为前缀
// 否则子应用内部跳转会跳出 activeRule 导致被卸载！

const router = createRouter({
  history: createWebHistory(
    window.__POWERED_BY_QIANKUN__ ? '/app-a/' : '/'
    // qiankun 环境：base 是 /app-a
    // 独立运行：base 是 /
  ),
  routes: [
    { path: '/', component: Home },        // 实际路径：/app-a/
    { path: '/detail', component: Detail } // 实际路径：/app-a/detail
  ]
})
```

### 路由流程完整图

```text
用户点击 <router-link to="/app-a/user">
    |
    v
主应用路由变化 -> URL 变成 /app-a/user
    |
    v
qiankun 的路由劫持捕获到变化
    |
    v
遍历所有注册的子应用
    |
    ├── appA 的 activeRule '/app-a' 匹配 ✅
    │   -> 如果未激活 -> 加载 entry 资源 -> 调 mount
    │   -> 如果已激活 -> 子应用内部路由自己处理跳转
    |
    └── appB 的 activeRule '/app-b' 不匹配 ❌
        -> 如果之前激活了 -> 调 unmount 卸载
```

---

## 五、应用间通信

### 方案一：initGlobalState（官方推荐）

```js
// ========== 主应用 ==========
import { initGlobalState } from 'qiankun'

// 初始化全局状态（本质是一个发布订阅中心）
const actions = initGlobalState({
  user: null,
  theme: 'light'
})

// 主应用改状态
actions.setGlobalState({ user: { name: '小明' } })

// 主应用监听变化
actions.onGlobalStateChange((state, prev) => {
  console.log('主应用：', prev, '->', state)
})

// 把通信方法传给子应用
registerMicroApps([{
  name: 'appA',
  entry: '//localhost:7100',
  container: '#subapp',
  activeRule: '/app-a',
  props: {
    onGlobalStateChange: actions.onGlobalStateChange,  // 监听
    setGlobalState: actions.setGlobalState              // 修改
  }
}])
```

```js
// ========== 子应用A ==========
export async function mount(props) {
  // 从 props 里拿到通信方法

  // 监听全局状态变化
  props.onGlobalStateChange((state, prev) => {
    console.log('子应用收到：', state)
  })

  // 子应用也可以修改全局状态
  props.setGlobalState({ theme: 'dark' })
  // 主应用和其他子应用的 onGlobalStateChange 都会触发
}
```

**原理**：本质就是一个**发布订阅模式**——setGlobalState 触发所有注册的 onGlobalStateChange 回调。

### 方案二：Props 传递（父传子）

```js
// 主应用直接通过 props 传数据和方法
registerMicroApps([{
  name: 'appA',
  props: {
    token: 'xxx',
    getUserInfo: () => { return userInfo },  // 主应用的方法
    onLogout: () => { /* 主应用处理登出 */ }
  }
}])

// 子应用 mount 里接收
export async function mount(props) {
  console.log(props.token)       // 'xxx'
  props.getUserInfo()            // 调主应用方法
  props.onLogout()               // 触发主应用登出
}
```

**适合**：主应用单向传数据给子应用（token、用户信息）。

### 方案三：CustomEvent（轻量级事件）

```js
// 子应用A发事件
window.dispatchEvent(new CustomEvent('appA:refresh', {
  detail: { page: 1 }
}))

// 主应用（或子应用B）监听
window.addEventListener('appA:refresh', (e) => {
  console.log(e.detail)  // { page: 1 }
})

// ⚠️ 监听方需要在 unmount 时移除
// window.removeEventListener('appA:refresh', handler)
```

**适合**：一次性事件通知（刷新列表、关闭弹窗）。

### 方案四：共享状态库（复杂场景）

```js
// 主应用和子应用都安装同一个轻量状态库（如 mitt）

// 主应用
import mitt from 'mitt'
const emitter = mitt()

registerMicroApps([{
  props: { emitter }  // 把实例传给子应用
}])

// 子应用
export async function mount(props) {
  props.emitter.on('user-change', (user) => { ... })
  props.emitter.emit('theme-change', 'dark')
}
```

### 四种方案对比

| 方案 | 方向 | 复杂度 | 适合 |
| --- | --- | --- | --- |
| **initGlobalState** | 双向 | 低 | **标准方案（推荐）** |
| Props | 主→子 | 最低 | 传 token / 用户信息 |
| CustomEvent | 任意 | 低 | 一次性事件通知 |
| 共享状态库 | 任意 | 中 | 复杂的跨应用状态同步 |

---

## 核心面试题速答

| 问题 | 答案 |
| --- | --- |
| 什么时候用 qiankun？ | 多团队独立开发部署、技术栈不一致、老系统渐进迁移 |
| JS 沙箱的核心？ | ProxySandbox：为每个子应用创建 fakeWindow，set 只写 fakeWindow |
| 三种沙箱区别？ | Snapshot 遍历恢复；Legacy Proxy 记录恢复；Proxy fakeWindow 完全隔离支持多实例 |
| CSS 隔离两种方式？ | scoped（选择器前缀，推荐）/ Shadow DOM（完全隔离但弹窗有问题） |
| 路由隔离原理？ | 劫持 pushState/popstate -> 匹配 activeRule -> 激活/卸载子应用 |
| 子应用路由的坑？ | base 必须配成 activeRule 前缀，否则跳转跳出匹配范围被卸载 |
| 应用间怎么通信？ | initGlobalState（发布订阅）/ Props 传值 / CustomEvent |
| unmount 为什么要清理？ | 不清事件和定时器 = 内存泄漏 + 重复执行 |

## 速记卡

```text
1. 场景：多团队 + 多技术栈 + 独立部署 + 渐进迁移
2. JS沙箱：Proxy + fakeWindow，set 只写假的，get 先查假的再查真的
3. 三种沙箱：Snapshot降级 / Legacy单实例 / Proxy多实例（默认）
4. CSS隔离：scoped前缀（推荐）/ ShadowDOM（弹窗有问题）
5. 路由：劫持pushState -> activeRule匹配 -> mount/unmount
6. 子应用base必须 = activeRule，否则跳出匹配被卸载
7. 通信：initGlobalState = 发布订阅模式
8. unmount必须清理：removeEventListener + clearInterval
```
