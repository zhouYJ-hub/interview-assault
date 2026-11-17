# WebWorker

> 面试频率：⭐⭐⭐⭐ | 关联考点：JS 单线程、事件循环、postMessage、PWA

## 面试回答（开口版）

如果面试官问「WebWorker 是什么、解决什么问题」，可以这样回答：

> 要从 JS 单线程说起：主线程既要执行 JS 又要负责渲染 UI，一个耗时计算就能把页面卡死。Worker 就是浏览器为 JS 开的**后台线程**，把大数据计算、文件解析这类任务搬过去做，主线程只负责接收结果，页面保持流畅。通信用 `postMessage` 和 `onmessage`，数据默认经过结构化克隆深拷贝；大块 `ArrayBuffer` 可以用 Transferable **零拷贝转移所有权**，避免拷贝开销。Worker 里最大的限制是**没有 window 和 document，不能操作 DOM**，一切交互只能靠消息通信。它分三种：专用 Worker 给单个页面用；SharedWorker 可被多个标签页共享，比如共用一条 WebSocket 连接；ServiceWorker 能拦截网络请求，是 PWA 离线缓存的核心。最后要注意用完 `terminate` 释放资源。

**答题要点：** 单线程痛点 → 通信机制 → DOM 限制 → 三种类型 → 资源释放
## 一、为什么需要 Worker？

### 1.1 单线程的代价

JS 主线程既要执行代码，又要配合渲染 UI：

```js
// 主线程：计算 10 亿次
console.time('计算')
let sum = 0
for (let i = 0; i < 1e9; i++) sum += i
console.timeEnd('计算')
```

计算期间：按钮点不动、动画卡死、页面白屏——因为主线程被占满，浏览器无法渲染。

### 1.2 对比：主线程 vs Worker

| | 主线程执行 | Worker 执行 |
| --- | --- | --- |
| 计算期间页面 | 卡死、掉帧 | 流畅 |
| 计算位置 | 调用栈 | 独立线程 |
| 结果获取 | 直接拿到 | postMessage 回传 |

Worker 的价值：**把耗时计算搬到后台线程，主线程只负责接收结果**。

## 二、Worker 的三种类型

| 类型 | 特点 | 典型场景 |
| --- | --- | --- |
| 专用 Worker（Dedicated Worker） | 只能被创建它的页面使用 | 大数据计算、图像处理 |
| 共享 Worker（SharedWorker） | 可被多个同源页面/标签共享 | 多标签页共用连接、状态同步 |
| 服务 Worker（ServiceWorker） | 独立于页面，可拦截网络请求，需 HTTPS | PWA 离线缓存、消息推送 |

## 三、专用 Worker 详解

### 3.1 完整示例：大数据计算

**worker.js（子线程）：**

```js
// worker.js
self.onmessage = function (e) {
  const { data } = e.data
  console.log('主线程发来：', data)

  // 耗时计算在 Worker 线程进行，不影响页面
  const result = heavyCompute(data)

  // 把结果发回主线程
  self.postMessage({ type: 'done', result })
}

function heavyCompute(n) {
  let sum = 0
  for (let i = 0; i < n; i++) sum += i
  return sum
}
```

**main.js（主线程）：**

```js
const worker = new Worker('./worker.js')

// 发送消息
worker.postMessage({ data: 1000000000 })

// 接收结果
worker.onmessage = function (e) {
  console.log('计算结果：', e.data.result)
  worker.terminate() // 用完终止，释放资源
}

// 监听错误
worker.onerror = function (err) {
  console.error('Worker 出错：', err.message)
}

// 监听错误消息（可结构化）
worker.onmessageerror = function () {
  console.error('消息无法反序列化')
}
```

### 3.2 生命周期

```text
new Worker(url)
      |
      v
   加载脚本 --> 运行中 <------- postMessage 双向通信 -------> 主线程
      |            |
      |            +-- 主线程调用 worker.terminate()
      |            +-- Worker 内部调用 self.close()
      v
    已终止（不可恢复，需要重新 new）
```

### 3.3 常用 API

| API | 所属 | 说明 |
| --- | --- | --- |
| `new Worker(url)` | 主线程 | 创建专用 Worker（受同源策略限制） |
| `worker.postMessage(data)` | 主线程 | 向 Worker 发消息 |
| `worker.onmessage` | 主线程 | 接收 Worker 发来的消息 |
| `worker.onerror` | 主线程 | 监听 Worker 内错误 |
| `worker.terminate()` | 主线程 | 立即终止 Worker |
| `self.postMessage(data)` | Worker | 向主线程发消息 |
| `self.onmessage` | Worker | 接收主线程消息 |
| `self.close()` | Worker | 自我销毁 |
| `self.importScripts(...)` | Worker | 同步加载其他脚本 |

### 3.4 Worker 里能用什么？

**可用**：`setTimeout/setInterval`、`fetch`、`WebSocket`、`IndexedDB`、`Promise/async-await`、`Atomics/SharedArrayBuffer`（受限）等。

**不可用**：`window`、`document`、DOM API（querySelector、alert 等）、`localStorage`（用 IndexedDB 代替）。

Worker 中的全局对象不是 `window`，而是 `self`（也可用 `globalThis`）。

## 四、通信机制详解

### 4.1 postMessage：结构化克隆

传递的数据默认经过**结构化克隆（深拷贝）**，两边互不影响：

```js
// 主线程
const data = { list: [1, 2, 3] }
worker.postMessage(data)
data.list.push(4) // 不影响 Worker 收到的数据
```

### 4.2 Transferable Objects：零拷贝转移

大数据（ArrayBuffer 等）可以**转移所有权**而不是复制，避免拷贝开销：

```js
const buffer = new ArrayBuffer(1024 * 1024) // 1MB
// 第二个参数：转移列表
worker.postMessage(buffer, [buffer])

console.log(buffer.byteLength) // 0 —— 所有权已转移给 Worker
```

适合：音视频处理、图像像素操作等大块二进制数据。

### 4.3 MessageChannel：双端口通信

`postMessage` 混在一条通道上，`MessageChannel` 提供**独立的双端口**，适合多 Worker 或精细通信：

```js
const channel = new MessageChannel()

worker1.postMessage(null, [channel.port1]) // 把 port1 转移给 worker1
worker2.postMessage(null, [channel.port2]) // 把 port2 转移给 worker2

// 之后 worker1 与 worker2 可以直接通过这两个 port 互相通信
// 无需经过主线程转发
```

### 4.4 BroadcastChannel：同源广播

同源的所有页面 / Worker 之间广播消息：

```js
// 页面 A
const bc = new BroadcastChannel('news')
bc.postMessage('更新了')

// 页面 B / Worker
const bc = new BroadcastChannel('news')
bc.onmessage = (e) => console.log(e.data) // '更新了'
```

## 五、工程化中使用 Worker（Vite / Webpack5+）

老式写法 `new Worker('./worker.js')` 在打包器中路径容易出问题。现代写法（Vite / Webpack5 原生支持）：

```js
const worker = new Worker(
  new URL('./worker.js', import.meta.url),
  { type: 'module' } // 支持 ES Module 语法
)

worker.postMessage({ data: 100 })
```

```js
// worker.js 里可以直接 import
import { heavyCompute } from './compute.js'

self.onmessage = (e) => {
  const result = heavyCompute(e.data)
  self.postMessage(result)
}
```

## 六、SharedWorker：多标签页共享

一个 SharedWorker 实例可被**同源的多个标签页**共享，常用于共用 WebSocket 连接：

```js
// shared-worker.js
let connections = 0
const ports = []

self.onconnect = function (e) {
  const port = e.ports[0]
  connections++
  ports.push(port)

  port.onmessage = function (e) {
    // 广播给所有连接的页面
    ports.forEach((p) => p.postMessage(`第 ${connections} 个连接说：${e.data}`))
  }

  port.start()
}
```

```js
// 各标签页 main.js
const worker = new SharedWorker('./shared-worker.js')
const port = worker.port // 注意：必须通过 port 通信
port.start()
port.onmessage = (e) => console.log(e.data)
port.postMessage('hello')
```

与 Dedicated Worker 的区别：**通过 port 通信**，且 `onconnect` 而非 `onmessage` 直连。

## 七、ServiceWorker 与 PWA

ServiceWorker 是浏览器与网络之间的**代理线程**，可拦截所有网络请求，实现离线缓存，是 PWA 的核心。

### 7.1 基本用法

```js
// 注册（主线程，需 HTTPS 或 localhost）
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/sw.js')
}

// sw.js
self.addEventListener('install', (e) => {
  console.log('安装：预缓存资源')
})

self.addEventListener('activate', (e) => {
  console.log('激活：清理旧缓存')
})

// 拦截网络请求
self.addEventListener('fetch', (e) => {
  e.respondWith(
    caches.match(e.request).then((cached) => {
      return cached || fetch(e.request) // 有缓存用缓存，否则请求网络
    })
  )
})
```

### 7.2 生命周期

```text
注册 register -> 安装 install -> 等待 waiting -> 激活 activate -> 控制页面
                                     |
                                     +-- 旧版本仍在控制页面时进入 waiting
                                         等所有旧页面关闭后 activate
```

### 7.3 与普通 Worker 的区别

| | Dedicated Worker | ServiceWorker |
| --- | --- | --- |
| 生命周期 | 随页面 | 独立于页面，可长期存活 |
| 通信 | postMessage | postMessage + fetch 拦截 |
| 能否拦截请求 | 否 | 可以拦截全部网络请求 |
| 协议要求 | HTTP 即可 | HTTPS（或 localhost） |
| 用途 | 后台计算 | 离线缓存、推送、后台同步 |

## 八、限制与常见坑

1. **不能操作 DOM**：DOM 只属于主线程，Worker 只能算好数据发回来；
2. **同源策略**：Worker 脚本必须与页面同源（跨源可用 importScripts 引入脚本，但入口必须同源）；
3. **通信有序列化成本**：大对象结构化克隆不便宜，大 buffer 用 Transferable；
4. **创建有线程开销**：短平快任务不值得用 Worker；
5. **调试**：DevTools 的 Sources/Console 面板可切换到 Worker 上下文；
6. **`file://` 协议受限**：通常需要 HTTP(S) 环境（部分浏览器支持 flag）。

## 九、适用场景

| 场景 | 说明 |
| --- | --- |
| 大数据计算 | 百万级排序、统计、加密解密 |
| 大文件解析 | Excel / CSV / JSON 上传解析 |
| 图像处理 | 滤镜、压缩、像素级运算 |
| 高频运算 | 游戏物理引擎、音视频编解码 |
| 耗时算法 | OCR、AI 推理（onnxruntime-web 等） |

## 十、高频面试题速答

| 问题 | 参考答案 |
| --- | --- |
| JS 是单线程为什么还能多线程？ | JS 引擎执行是单线程，浏览器提供 Worker 线程运行额外脚本，主线程与 Worker 通信 |
| Worker 能操作 DOM 吗？ | 不能，DOM 只属于主线程，只能 postMessage 通信 |
| Worker 和主线程怎么通信？ | postMessage / onmessage，数据默认结构化克隆 |
| 大数据怎么高效传给 Worker？ | ArrayBuffer 用 Transferable 转移所有权，零拷贝 |
| Dedicated / Shared / Service 区别？ | 专用：单页面；共享：多标签页；服务：拦截请求做离线缓存 |
| ServiceWorker 生命周期？ | install -> waiting -> activate，新版本等旧页面全部关闭后激活 |
| 什么时候不值得用 Worker？ | 任务轻量、创建线程开销大于计算本身 |
| Worker 里怎么加载脚本？ | self.importScripts 或 ES Module（type: 'module'） |

## 十一、速记卡

```text
1. 主线程卡 -> 把计算丢进 Worker
2. 通信三件套：new Worker -> postMessage -> onmessage
3. Worker 无 DOM/window，全局对象是 self
4. postMessage 默认深拷贝，ArrayBuffer 可转移所有权
5. 三种 Worker：Dedicated 单页 / Shared 多页 / Service 拦网
6. 用完 terminate，别留着吃内存
```
