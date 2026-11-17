# HTML 基础篇（Q1 - Q6）

> 每题五层结构：**为什么存在 -> 是什么 -> 怎么用 -> 常见坑 -> 面试怎么答（总-分）**

## Q1：语义化标签是什么？有什么用？（<span class="hot">高频</span>）

### 1.1 为什么存在

在语义化标签出现之前，页面结构全靠 div 堆叠——人称「div 一把梭」：

```html
<!-- 没有语义的写法：结构全靠 class 名猜 -->
<div class="header">
  <div class="nav">...</div>
</div>
<div class="main">
  <div class="article">...</div>
  <div class="sidebar">...</div>
</div>
<div class="footer">...</div>
```

这种写法三个致命问题：**人看不懂**（header 是什么全靠 class 猜）、**机器看不懂**（爬虫无法识别哪里是正文）、**辅助设备读不懂**（屏幕阅读器无法告诉盲人「这是导航」）。

### 1.2 是什么

语义化 = **用「有含义的标签」代替「无含义的容器」**，让标签本身就能表达内容的作用。HTML5 为此新增了一批结构标签：

```html
<!-- 语义化写法：标签名即含义 -->
<header>页头</header>
<nav>导航</nav>
<main>主内容区（一页只能有一个）</main>
<article>独立成篇的内容（文章/卡片）</article>
<section>章节（通常带标题）</section>
<aside>侧边栏（与主内容弱相关）</aside>
<footer>页脚</footer>
```

### 1.3 怎么用

一个典型页面的完整结构：

```html
<body>
  <header>
    <h1>网站标题</h1>
    <nav>
      <ul>
        <li><a href="/">首页</a></li>
        <li><a href="/blog">博客</a></li>
      </ul>
    </nav>
  </header>

  <main>
    <article>
      <h2>文章标题</h2>
      <section>
        <h3>第一节</h3>
        <p>正文...</p>
      </section>
    </article>

    <aside>相关推荐</aside>
  </main>

  <footer>版权信息</footer>
</body>
```

### 1.4 常见坑

```text
坑一：不是消灭 div —— 纯粹为了布局/包裹的容器照样用 div，
      语义标签用在「内容有结构含义」的位置
坑二：main 一页只能有一个；article 强调「独立可分发」
坑三：语义化 ≠ SEO 万能药，只是让爬虫更好地理解权重
```

### 1.5 面试回答示范（总-分结构）

> **总起**：语义化就是用有含义的标签代替 div 堆叠，让「人和机器」都能看懂页面结构。
>
> **三个价值**：
>
> **第一，可维护性。** 标签名即含义，接手项目的人不用逐个 class 去猜哪里是导航、哪里是正文。
>
> **第二，SEO。** 爬虫能识别 header、nav、article 这些标签的权重——article 里的内容会被当作正文核心，比 div 更利于收录。
>
> **第三，无障碍。** 屏幕阅读器按语义朗读，盲人用户能快速跳转到导航或主内容区。
>
> **收尾**：但语义化不等于消灭 div——纯布局容器照样用 div，语义标签用在内容有结构含义的地方。

## Q2：src 和 href 的区别？defer / async？（<span class="hot">超高频</span>）

### 2.1 为什么存在

页面里要加载各种外部资源（脚本、样式、图片、链接），浏览器对不同资源有两种截然不同的处理方式——**嵌入替换**和**建立关联**。理解这个区别，才能明白脚本阻塞和 defer/async 的由来。

### 2.2 是什么

```text
src（嵌入替换）：
  把资源「下载下来替换当前元素的内容」
  过程会阻塞后续解析 —— 你必须等它加载执行完
  典型：<script src>、<img src>、<iframe src>

href（建立关联）：
  指明当前文档和目标资源的「关系」
  不阻塞解析，可以并行下载
  典型：<link href>、<a href>
```

### 2.3 怎么用

```html
<!-- src：嵌入并替换，阻塞解析 -->
<script src="app.js"></script>
<!-- JS 可能修改 DOM -> 必须等它执行完才能继续解析后面的 HTML -->

<img src="logo.png" />

<!-- href：建立关联，不阻塞 -->
<link rel="stylesheet" href="style.css" />
<!-- CSS 下载解析在预解析线程做，主线程继续解析 HTML -->

<a href="https://example.com">链接</a>
```

**defer / async 解决 JS 阻塞**：

```html
<!-- 1. 无属性：阻塞 -->
<script src="a.js"></script>
<!-- 下载阻塞 -> 执行阻塞 -> 继续解析 -->

<!-- 2. defer：延迟执行 -->
<script defer src="a.js"></script>
<!-- 并行下载（不阻塞解析）
     -> 等 DOM 解析完
     -> 按出现顺序执行（在 DOMContentLoaded 前）
     适用：依赖 DOM 的脚本 -->

<!-- 3. async：异步执行 -->
<script async src="a.js"></script>
<!-- 并行下载（不阻塞解析）
     -> 下载完立刻执行（执行那一下会阻塞）
     -> 不保证顺序（谁先下完谁先执行）
     适用：独立脚本（统计、埋点） -->
```

```text
加载时序对比：

无属性:   解析 ---下载---执行-----------继续解析
defer:    解析 ------下载-------|解析完|--按序执行--
async:    解析 ------下载--执行-|继续解析|
                        ^谁先下完谁执行，乱序
```

### 2.4 常见坑

```text
坑一：async 乱序 —— a.js、b.js 有依赖关系时不能用 async
坑二：defer 保序 —— 多个 defer 脚本按 HTML 中的顺序执行
坑三：内联脚本不能 defer/async —— 属性只对外部文件有效
```

### 2.5 面试回答示范（总-分结构）

> **总起**：src 是「嵌入替换」——下载并替换元素内容，会阻塞解析；href 是「建立关联」——声明文档和资源的关系，不阻塞解析。JS 因为可能修改 DOM，用 src 加载时天然阻塞，defer 和 async 就是解决这个阻塞的。
>
> **分三点**：
>
> **第一，无属性的 script 阻塞一切。** 下载和执行期间 HTML 解析完全暂停，页面白屏风险最大。
>
> **第二，defer 是「延迟到解析完」。** 并行下载不阻塞，DOM 解析完后按顺序执行——依赖 DOM 或有相互依赖的脚本用它。
>
> **第三，async 是「下载完立即执行」。** 不保证执行顺序，适合统计埋点这类完全独立的脚本。

## Q3：行内元素、块级元素、inline-block？

### 3.1 为什么存在

HTML 元素默认有不同的**显示方式（display）**——有的独占一行、有的并排站、有的介于两者之间。不了解这个差异，布局时就会遇到「为什么 div 挤不上去」「为什么 span 设宽高无效」的困惑。

### 3.2 是什么 + 怎么用

```css
/* 块级 block：独占一行，能设宽高 */
div.header { width: 100%; height: 60px; }  /* ✅ */

/* 行内 inline：并排站，设宽高无效 */
span.badge { width: 100px; }  /* ❌ 无效！由内容决定 */

/* 行内块 inline-block：并排站 + 能设宽高 */
img.avatar { width: 48px; height: 48px; }  /* ✅ */
```

| | 块级 block | 行内 inline | 行内块 inline-block |
| --- | --- | --- | --- |
| 独占一行 | ✅ | ❌ | ❌ |
| 设置宽高 | ✅ | ❌（无效） | ✅ |
| 默认宽度 | 撑满父容器 | 由内容决定 | 由内容决定 |
| 上下 margin | ✅ 有效 | ❌ 视觉无效 | ✅ 有效 |
| 典型元素 | div / p / h1 / ul | span / a / strong | **img / input / button** |

### 3.3 常见坑

```css
/* 坑一：行内元素设置上下 margin 无效 */
span { margin-top: 20px; }  /* 左右有效，上下视觉无效 */
/* 解决：display: inline-block 或 block */

/* 坑二：inline-block 之间有空白间隙 */
/* HTML 里的换行符被渲染成一个空格 */
<a>A</a>
<a>B</a>  /* 两个 inline-block 之间有约 4px 间隙 */
/* 现代解决：父元素 display: flex */

/* 坑三：img 是 inline-block 还带基线对齐 */
img { vertical-align: top; }  /* 消除底部几像素空隙 */
```

### 3.4 面试回答示范（总-分结构）

> **总起**：三者是元素 display 的三种默认形态，核心差异在「独占一行」和「能否设宽高」两个维度。
>
> **分三种**：
>
> **第一，块级。** 独占一行、能设宽高、默认撑满父容器，典型是 div、p、h1。
>
> **第二，行内。** 并排站、不能设宽高、上下 margin 无效，典型是 span、a。
>
> **第三，inline-block。** 兼具两者——并排且能设宽高，img、input 天生就是它；但要注意换行符导致的空白间隙问题，现代布局我直接用 Flex 替代。

## Q4：HTML5 有哪些新特性？

### 4.1 为什么存在

HTML5 之前的时代之痛：视频音频靠 Flash（安全差、移动端不支持）、表单校验全靠 JS、页面结构无语义、本地无法存数据。HTML5 针对性补齐了这些能力。

### 4.2 怎么用（按六类记忆）

```html
<!-- 1. 语义化标签（Q1 详讲） -->
<header> <nav> <article> <section> <aside> <footer>

<!-- 2. 多媒体：替代 Flash -->
<video src="movie.mp4" controls poster="cover.jpg"></video>
<audio src="music.mp3" controls></audio>

<!-- 3. 图形绘制 -->
<canvas id="chart"></canvas>  <!-- 位图：JS 逐像素绘制，图表/游戏 -->
<svg viewBox="0 0 100 100">    <!-- 矢量：放大不失真，图标 -->
  <circle cx="50" cy="50" r="40" />
</svg>

<!-- 4. 表单增强：内置校验，少写 JS -->
<input type="email" required />      <!-- 自动校验邮箱格式 -->
<input type="date" />                 <!-- 日期选择器 -->
<input type="range" min="0" max="100" />
<input type="color" />

<!-- 5. 本地存储 -->
localStorage / sessionStorage / IndexedDB

<!-- 6. 新 API -->
Web Worker    <!-- 后台线程算大数据 -->
WebSocket     <!-- 全双工实时通信 -->
Geolocation   <!-- 定位 -->
History       <!-- 单页路由的基础 -->
```

### 4.3 面试回答示范（总-分结构）

> **总起**：HTML5 我按六类记——标签、多媒体、绘图、表单、存储、API。
>
> **分六点（背熟骨架）**：
>
> **第一，语义化标签**，header/nav/article 这些改善结构和 SEO。
>
> **第二，多媒体**，video 和 audio 原生播放，彻底替代 Flash。
>
> **第三，绘图**，canvas 画位图（图表、游戏），svg 画矢量（图标）。
>
> **第四，表单增强**，email、date、range 等类型自带校验和控件。
>
> **第五，本地存储**，localStorage、sessionStorage、IndexedDB。
>
> **第六，新 API**，Web Worker 多线程、WebSocket 实时通信、History 支撑单页路由。

## Q5：meta viewport 的作用？（<span class="hot">高频</span>，移动端必考）

### 5.1 为什么存在

早期手机浏览器为了显示为 PC 设计的网页，默认用 **980px 的虚拟视口**渲染再整体缩小——结果手机上文字极小。需要一种方式告诉浏览器：「按手机真实宽度来渲染」。

### 5.2 是什么

viewport meta 就是设置**布局视口**的宽度：

```html
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
```

```text
不设置：视口宽 980px（虚拟）-> 页面按 PC 宽度渲染 -> 缩小塞进手机 -> 字小
设置 width=device-width：视口宽 = 设备逻辑像素（如 375px）
                          -> 按手机真实宽度渲染 -> 配合响应式刚好
```

### 5.3 怎么用（各参数含义）

```html
<meta name="viewport" content="
  width=device-width,   视口宽 = 设备宽（核心！）
  initial-scale=1.0,    初始缩放 1 倍
  maximum-scale=1.0,    最大缩放（禁止放大——无障碍不友好，慎用）
  user-scalable=no      禁止用户缩放（同上，慎用）
" />
```

### 5.4 常见坑

```text
坑一：没有 viewport，媒体查询照样「能跑」但断点按 980px 算 —— 全部失效
坑二：rem 适配依赖根字号，而根字号基于视口宽 —— 没有它 rem 方案失效
坑三：禁用缩放（user-scalable=no）会伤害无障碍，还可能被 iOS 忽略
```

### 5.5 面试回答示范（总-分结构）

> **总起**：viewport 是移动端适配的前提——它把布局视口从默认的 980px 虚拟宽度改成设备真实宽度，所有移动端方案都建立在它之上。
>
> **分三点**：
>
> **第一，不设的后果。** 手机按 980px 渲染再缩小，字小到没法看。
>
> **第二，核心参数。** `width=device-width, initial-scale=1.0` 是标配——视口等于设备宽、不缩放。
>
> **第三，它是其他方案的地基。** 没有它，媒体查询断点按 980px 判断全错，rem/vw 适配的换算基础也不存在。另外 maximum-scale 和 user-scalable=no 会伤害无障碍，我一般不设。

## Q6：iframe 的优缺点

### 6.1 是什么 + 为什么存在

iframe = 在页面里嵌一个**独立的浏览器上下文**——有自己的 DOM、样式、脚本，和父页面天然隔离。

### 6.2 怎么用 + 优缺点

```html
<!-- 典型场景：嵌入第三方内容 -->
<iframe src="https://www.google.com/maps/embed?..." />
<iframe src="//player.bilibili.com/player.html?bvid=xxx" />

<!-- 沙箱隔离：限制 iframe 的能力 -->
<iframe src="untrusted.html" sandbox="allow-scripts" />
```

| 优点 | 缺点 |
| --- | --- |
| 样式脚本完全隔离（沙箱） | 阻塞主页面 onload |
| 嵌入第三方（地图/视频/广告） | SEO 不友好（爬虫难理解） |
| 微前端场景隔离老系统 | 通信要 postMessage，成本高 |
| | 共享连接池，可能互相阻塞 |

### 6.3 面试回答示范（总-分结构）

> **总起**：iframe 是页面内嵌的独立浏览器上下文，核心价值是「隔离」，核心代价也是「隔离带来的通信成本」。
>
> **分两面说**：
>
> **优点方面**：样式脚本天然隔离，适合嵌入第三方内容和微前端里的老系统沙箱。
>
> **缺点方面**：会阻塞主页面 onload；爬虫难以理解影响 SEO；和父页面通信只能 postMessage；多个 iframe 共享浏览器的连接池，可能互相阻塞加载——这个连接池的点是加分项。

## 本篇速答

| 问题 | 一句话答案 |
| --- | --- |
| 语义化的三大价值？ | 可维护性、SEO、无障碍 |
| src 和 href 本质区别？ | src 嵌入替换并阻塞；href 建立关联不阻塞 |
| defer 和 async？ | defer 解析完按序执行；async 下载完立即执行不保序 |
| img 是什么元素？ | inline-block（可设宽高、不独占行、基线对齐留空隙） |
| viewport 核心参数？ | width=device-width, initial-scale=1 |
| iframe 最大代价？ | 通信成本（postMessage）+ 连接池共享阻塞 |
