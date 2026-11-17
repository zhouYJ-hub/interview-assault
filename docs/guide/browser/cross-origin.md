# 跨域解决方案

> 面试频率：⭐⭐⭐⭐⭐ | 关联考点：同源策略、CORS、预检请求、JSONP、代理、Cookie

## 面试回答（开口版）

如果面试官问「跨域怎么解决」，可以这样回答：

> 先说同源策略：协议、域名、端口任一不同就是跨域。这里有个关键认知——**跨域请求其实发出去了，服务器也返回了，是浏览器把响应拦住了**，因为响应头里没有允许的源。这是浏览器的安全机制，服务器之间通信完全不受限。标准方案是 **CORS**：后端返回 `Access-Control-Allow-Origin` 等响应头，浏览器检查放行。其中简单请求直接发、检查响应头；非简单请求（PUT、JSON 格式、自定义头）会先发一个 **OPTIONS 预检请求**，通过了才发真实请求，预检结果还能用 `Max-Age` 缓存。老方案 **JSONP** 利用的是 script 标签加载资源不受同源限制，服务端返回调用回调的 JS，但只支持 GET。开发环境用 **Vite 代理**、生产用 **Nginx 反向代理**——本质都是让浏览器只跟同源服务器通信，跨域放到服务器之间完成。

**答题要点：** 同源策略拦截的是「读响应」-> CORS 简单/预检 -> JSONP 原理 -> 代理的本质（服务器无同源限制）

## 一、同源策略

### 1.1 什么算「同源」

**协议 + 域名 + 端口，三者完全相同才是同源**：

```text
http://www.a.com:8080/page
  |        |        |
  |        |        +-- 端口（http 默认 80，https 默认 443，可省略）
  |        +----------- 域名
  +-------------------- 协议

http://a.com       vs  https://a.com       协议不同  -> 跨域
http://a.com       vs  http://a.com:8080   端口不同  -> 跨域
http://a.com       vs  http://b.com        域名不同  -> 跨域
http://www.a.com   vs  http://a.com        子域不同  -> 跨域（高频坑！）
http://a.com/x     vs  http://a.com/y      路径不同  -> 同源 ✅（路径不影响）
```

### 1.2 最重要的认知：浏览器拦的是「响应」，不是「请求」

很多人以为跨域就是请求发不出去，**真相是：请求正常发出、服务器正常处理并返回，只是浏览器拒绝把响应交给 JS**。

```text
浏览器                          服务器（另一个源）
  |                                |
  | ---- 1. 发出请求（正常到达）--> |
  |                                |  2. 服务器正常处理
  | <-- 3. 响应正常返回 ----------- |     （服务器根本不觉得有跨域）
  |                                |
  X  4. 浏览器检查响应头：
  X     没有 Access-Control-Allow-Origin
  X     -> 拒绝把响应交给 JS
  X     -> 控制台报 CORS 错误
```

**验证方法**：跨域报错时打开 Network 面板，请求状态往往是 200，且 Preview 里能看到数据——但 JS 拿不到。

这也解释了为什么 CORS 要**后端配响应头**：浏览器看的是响应里服务器「同意了没有」。

### 1.3 限制范围：哪些受限、哪些不受限

```text
        受同源策略限制                    不受限制
+--------------------------------+  +--------------------------------+
| Ajax / fetch 的响应读取          |  | <img> 加载跨域图片（不能画布取像素）
| Cookie / localStorage 读取      |  | <script> 加载跨域脚本（JSONP 的基础）
| iframe / window 的 DOM 访问     |  | <link> 加载跨域样式
| XMLHttpRequest 响应体           |  | 表单提交、页面跳转（不能读响应）
+--------------------------------+  +--------------------------------+
```

**为什么这么设计？** 如果连请求都发不出去，Web 就废了（a 链接到 b 网站也算跨域请求）。所以策略只拦「脚本读取数据」，不拦「资源加载和导航」。

## 二、CORS（标准方案，必须掌握）

Cross-Origin Resource Sharing：由**服务端**设置响应头，浏览器检查放行。

### 2.1 简单请求：直接发 + 检查响应头

**同时满足**这两个条件才算简单请求：

1. 方法是 GET / POST / HEAD；
2. Content-Type 只能是 `text/plain`、`multipart/form-data`、`application/x-www-form-urlencoded`（**`application/json` 不算！**）且没有自定义头。

```text
浏览器                            服务器
  |                                  |
  | -- 直接发真实请求 -------------> |
  |    Origin: https://front.com     |  正常处理
  |                                  |
  | <-- 响应 ----------------------- |
  |    Access-Control-Allow-Origin: https://front.com
  |                                  |
浏览器检查响应头:
  Allow-Origin 允许自己? -- 是 --> 放行, JS 拿到数据
                          -- 否 --> 拦截, 报 CORS 错误
```

### 2.2 预检请求：先问一句「允许吗」

非简单请求（满足任一）：

1. 方法是 PUT / DELETE / PATCH；
2. Content-Type 是 `application/json`（前后端联调最常见的触发点！）；
3. 带自定义头（如 `Authorization`）。

```text
浏览器                                 服务器
  |                                       |
  | [检测到非简单请求]                     |
  |                                       |
  | -- 1. OPTIONS /api (预检) ----------> |  浏览器自动加的!
  |    Origin: https://front.com          |  (不是前端代码发的)
  |    Access-Control-Request-Method: PUT |
  |    Access-Control-Request-Headers: Authorization
  |                                       |
  | <-- 2. 204 (预检通过) --------------- |
  |    Access-Control-Allow-Origin: https://front.com
  |    Access-Control-Allow-Methods: GET,POST,PUT,DELETE
  |    Access-Control-Allow-Headers: Authorization
  |    Access-Control-Max-Age: 86400  ----> 预检结果缓存24h
  |                                       |
  | -- 3. 发出真实请求 -----------------> |
  | <-- 4. 正常响应 --------------------- |
```

**预检的意义**：避免服务器在不知情时收到破坏性请求（比如 PUT 改数据、DELETE 删数据）——先发个 OPTIONS 问一句，服务器明确同意了再动真格。

**预检的优化**：`Access-Control-Max-Age: 86400` 让浏览器缓存预检结果，24 小时内同类请求不再发 OPTIONS。

### 2.3 关键响应头

| 响应头 | 作用 |
| --- | --- |
| `Access-Control-Allow-Origin` | 允许的源（`*` 或具体 origin） |
| `Access-Control-Allow-Methods` | 允许的方法（预检用） |
| `Access-Control-Allow-Headers` | 允许的请求头（预检用） |
| `Access-Control-Max-Age` | 预检结果缓存时长 |
| `Access-Control-Allow-Credentials` | 允许带 Cookie |

### 2.4 带 Cookie 的跨域（前后端都要改）

```js
// 前端：显式开启
fetch(url, { credentials: 'include' })
// 或 axios：axios.defaults.withCredentials = true
```

```http
# 后端：此时 Allow-Origin 不能是 *，必须写具体域名！
Access-Control-Allow-Origin: https://front.com
Access-Control-Allow-Credentials: true
```

**为什么不能用 `*`？** `*` + credentials 的组合等于「任何网站都能带着用户 Cookie 来请求」，浏览器直接拒绝。

## 三、JSONP（老方案，面试要懂原理）

**原理：`<script>` 标签加载外部 JS 不受同源策略限制**，服务器返回一段「调用回调函数」的 JS，数据作为参数传回来。

```text
1. 前端先定义好回调:
   function handleData(data) { console.log(data) }

2. 动态创建 script, src 指向目标接口, 回调名通过参数告诉服务器:
   <script src="https://api.com/data?callback=handleData">

3. 服务器返回的不是 JSON, 而是一段 JS:
   handleData({ name: '小明' })

4. script 加载完成自动执行
   -> 调用 handleData -> 拿到数据
```

```js
// 手写 JSONP
function jsonp(url, callbackName = 'cb') {
  return new Promise((resolve) => {
    window[callbackName] = (data) => {
      resolve(data)
      delete window[callbackName]      // 清理全局函数
      script.remove()                  // 清理 script 标签
    }
    const script = document.createElement('script')
    script.src = `${url}?callback=${callbackName}`
    document.body.appendChild(script)
  })
}

jsonp('https://api.com/data').then(console.log)
```

**局限（面试必说）：**

1. **只支持 GET**（script 加载就是 GET）；
2. 需要服务端配合按约定包装；
3. 没有错误处理机制；
4. 安全风险：加载回来的代码会被直接执行。

## 四、代理（开发 / 生产通用思路）

**本质：同源策略是浏览器行为，服务器之间通信完全不受限。**

```text
没有代理（浏览器直接请求后端）:

  浏览器 localhost:5173 --------> api.example.com
             协议/域名/端口全不同 -------> 跨域！被浏览器拦截


开发环境代理（Vite dev server）:

  浏览器 localhost:5173 --> Vite localhost:5173 --> api.example.com
        |------ 同源，不跨域 ------|     |---- 服务器之间随便通信 ----|
```

### 4.1 开发环境：Vite 代理

```js
// vite.config.js
export default {
  server: {
    proxy: {
      '/api': {
        target: 'https://backend.com',
        changeOrigin: true,                          // 修改请求头里的 Origin
        rewrite: (path) => path.replace(/^\/api/, '') // 去掉 /api 前缀
      }
    }
  }
}
```

```js
// 前端请求同源路径，浏览器认为没有跨域
fetch('/api/user') // 实际由 Vite 转发到 https://backend.com/user
```

### 4.2 生产环境：Nginx 反向代理

```nginx
server {
  listen 80;
  server_name front.com;

  location /api/ {
    proxy_pass https://backend.com/;  # 转发给后端
  }
}
```

前后端同域部署后，浏览器全程同源，一劳永逸。

## 五、其他方案

| 方案 | 适用场景 | 要点 |
| --- | --- | --- |
| postMessage | 父页面 <-> iframe / 弹窗 | `window.postMessage` + `message` 事件，注意校验 origin |
| WebSocket | 实时通信 | 不受同源策略约束（但用 Origin 头做了保护） |
| document.domain | 主域相同的子域（a.xx.com <-> b.xx.com） | **已废弃**，仅老项目还会问 |
| 后端聚合 | 彻底避免跨域 | 前端请求自己的后端，后端去调第三方接口 |

## 六、方案选型决策图

```text
遇到跨域怎么选?
  |
  能控制后端? -- 是 --> CORS（标准方案，后端加几个响应头搞定）
  |                   带 Cookie? 记得 credentials + 具体域名
  |
  控制不了后端?
        |
        +-- 开发环境 --> Vite server.proxy
        +-- 生产环境 --> Nginx 反向代理 / 后端聚合
        +-- 只要 GET 且是老接口 --> JSONP（新项目别用）
```

## 七、高频面试题速答

| 问题 | 参考答案 |
| --- | --- |
| 同源策略限制什么？ | 限制脚本**读取**跨域响应（Ajax、Cookie、DOM）；不限制 img/script 加载 |
| 跨域时请求发出去了吗？ | 发出去了，服务器也返回了，是浏览器把**响应**拦住了（Network 里能看到 200） |
| 为什么 CORS 要后端配？ | 浏览器检查的是响应头里服务器有没有「同意」 |
| 什么情况发预检请求？ | PUT/DELETE、Content-Type 为 JSON、带自定义头（如 Authorization） |
| OPTIONS 是谁发的？ | **浏览器自动加的**，不是前端代码发的 |
| 预检请求能优化吗？ | 后端设 `Access-Control-Max-Age` 缓存预检结果 |
| 带 Cookie 跨域怎么处理？ | 前端 credentials: include + 后端具体域名 + Allow-Credentials |
| 为什么带 Cookie 时不能用 *？ | 等于任何网站都能带用户 Cookie 请求，浏览器直接拒绝 |
| JSONP 原理和局限？ | script 不受限 + 回调传参；只支持 GET、需服务端配合 |
| 代理为什么能解决跨域？ | 浏览器只跟同源服务器通信，跨域由服务器间转发（服务器无同源限制） |
| www.a.com 能读 a.com 的数据吗？ | 不能，子域不同就是不同源 |

## 八、速记卡

```text
1. 同源 = 协议 + 域名 + 端口全同（子域也算不同）
2. 跨域拦截的是「读响应」，不是「发请求」—— Network 里是 200
3. CORS：简单请求直接发；JSON/PUT/自定义头先 OPTIONS 预检
4. 预检是浏览器自动发的，Max-Age 可缓存结果
5. 带 Cookie：前端 include + 后端具体域名 + Allow-Credentials（不能 *）
6. JSONP：script 不受限，只支持 GET
7. 代理本质：跨域交给服务器之间，浏览器始终同源
```
