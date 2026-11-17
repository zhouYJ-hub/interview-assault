# 移动端适配详解

> 移动端适配 = 同一份代码在不同尺寸的手机上都能正常显示。本章按「概念 -> 方案 -> 步骤 -> 代码」的顺序讲清楚每种实现方式。

## 一、为什么需要适配

```text
设计稿（如 750px 宽）
        |
        |  同一套代码运行在
        v
+--------+--------+--------+
| 375px  | 414px  | 360px  |  ← 各种手机宽度
| iPhone | 大屏   | 安卓   |
+--------+--------+--------+

不适配的后果：
- 全部写死 px -> 小屏溢出、大屏留白
- 元素之间的比例失调 -> 设计稿是 1:1，到手机上变形
```

**适配的本质**：让页面元素**按屏幕宽度等比缩放**——设计稿上量出的尺寸，在任何手机上都占相同的「屏幕占比」。

## 二、先弄懂三个概念

### 2.1 物理像素 vs 逻辑像素

```text
物理像素：屏幕上真实的发光点（硬件决定，iPhone 15 是 1179px 宽）
逻辑像素：CSS 使用的像素（iPhone 15 是 393px 宽）

          一个 CSS 像素 = 多个物理像素
+-------------------+
| ■ ■ ■             |
| ■ ■ ■   = 1个css像素|
| ■ ■ ■             |
+-------------------+
```

### 2.2 DPR（设备像素比）

```js
DPR = 物理像素 / 逻辑像素
// iPhone 15: 1179 / 393 = 3（DPR 为 3）
// 普通 PC：1920 / 1920 = 1

console.log(window.devicePixelRatio) // 查看当前设备的 DPR
// DPR 越高屏幕越清晰，也是 1px 边框变粗问题的根源（见第八节）
```

### 2.3 三种 viewport

```text
布局视口（layout viewport）：
  页面默认渲染的宽度，手机上默认 980px —— 太宽，内容被缩小

视觉视口（visual viewport）：
  用户当前看到的那部分区域

理想视口（ideal viewport）：
  让布局视口 = 设备宽度 —— 移动端适配的起点
```

**第一步永远是设置理想视口**：

```html
<!-- 没有它，后面所有适配方案全部失效 -->
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<!-- width=device-width：布局视口 = 设备逻辑宽度（375/414/360...） -->
<!-- initial-scale=1：不缩放 -->
```

## 三、方案一：rem 适配（经典方案，手写完整版）

**原理**：元素尺寸用 rem（相对根字号），JS 按屏幕宽度动态改根字号 -> 字号变 -> 所有 rem 元素等比变。

### 实现步骤

**第 1 步：设置 viewport（前提）**

```html
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
```

**第 2 步：JS 动态设置根字号**

```js
// 设计稿 750px 宽（UI 出的二倍图）
// 约定：1rem = 100px（设计稿上的 100px）
// 换算简单：设计稿量出 200px -> 写 2rem

function setRem() {
  // 拿到当前屏幕的逻辑宽度
  const width = document.documentElement.clientWidth

  // 计算根字号：
  //   设计稿 750px 时 1rem = 100px
  //   屏幕宽 375px 时，比例 = 375/750 = 0.5 -> 1rem = 50px
  //   屏幕宽 414px 时，比例 = 414/750 -> 1rem = 55.2px
  // 公式：根字号 = 屏幕宽 / (750 / 100) = 屏幕宽 / 7.5
  document.documentElement.style.fontSize = width / 7.5 + 'px'
}

// 初始化执行
setRem()
// 屏幕旋转 / 窗口变化时重新计算
window.addEventListener('resize', setRem)
```

**第 3 步：CSS 中用 rem 写尺寸**

```css
.banner {
  /* 设计稿上量出来是 750x300px */
  width: 7.5rem;   /* 750 / 100 = 7.5rem -> 375屏上实际 350px，占满屏宽 */
  height: 3rem;    /* 300 / 100 = 3rem */
}

.title {
  /* 设计稿字号 32px */
  font-size: 0.32rem; /* 32 / 100 */
}

.card {
  /* 设计稿 padding 24px */
  padding: 0.24rem;  /* 24 / 100 */
  border-radius: 0.16rem; /* 16 / 100 */
}
```

**换算公式（背下来）**：

```text
设计稿尺寸(px) / 100 = rem 值

设计稿 750px、屏幕 375px 的换算过程：
  1rem = 375 / 7.5 = 50px
  设计稿 200px -> 写 2rem -> 实际渲染 2 × 50 = 100px（正好占屏宽一半）
```

### 用 PostCSS 自动转换（免手动算）

```js
// postcss.config.js —— 安装 postcss-pxtorem
module.exports = {
  plugins: {
    'postcss-pxtorem': {
      rootValue: 100,    // 1rem = 100px（和 JS 约定一致）
      propList: ['*'],   // 所有属性都转换
      // 一般要排除第三方库，避免把它们的 px 也转了
      exclude: /node_modules/i
    }
  }
}
// 写 CSS 时直接按设计稿写 px，构建时自动转 rem
```

## 四、方案二：vw 适配（现代主流）

**原理**：1vw = 屏幕宽的 1%。直接按比例换算，**不需要 JS、不需要监听 resize**。

### 换算逻辑

```text
设计稿 750px 宽：

1px 占屏幕比 = 1 / 750 = 0.1333vw

设计稿尺寸 -> vw：
  vw = 设计稿px / 750 * 100

设计稿 200px -> 200/750*100 = 26.67vw
设计稿 32px（字号）-> 32/750*100 = 4.267vw
```

### 实现步骤

**第 1 步：viewport（同样前提）**

```html
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
```

**第 2 步：直接写 vw（手算演示）**

```css
.banner {
  /* 设计稿 750x300 */
  width: 100vw;    /* 750/750*100，占满 */
  height: 40vw;    /* 300/750*100 */
}

.title {
  /* 设计稿字号 32px */
  font-size: 4.267vw; /* 32/750*100 */
}
```

**第 3 步：实际项目用 PostCSS 自动转换（推荐）**

```js
// postcss.config.js —— 安装 postcss-px-to-viewport
module.exports = {
  plugins: {
    'postcss-px-to-viewport': {
      viewportWidth: 750,  // 设计稿宽度
      unitPrecision: 5,    // 保留 5 位小数
      minPixelValue: 1,    // 小于 1px 不转换
      exclude: [/node_modules/] // 排除第三方库
    }
  }
}

// 开发时直接按设计稿写 px：
// .banner { width: 750px; height: 300px; }
// 构建时自动变成 vw，零手动换算
```

### vw 的局限与补救

```css
/* 问题：字号跟随视口完全等比 -> 大屏手机字超大、小屏字超小 */
/* 补救：限制字号上下限（clamp） */

.title {
  /* 最小 14px，理想 4vw，最大 18px */
  font-size: clamp(14px, 4vw, 18px);
}
```

## 五、方案三：flexible（rem + viewport 缩放，了解原理）

阿里/淘宝早期方案，原理是「动态改 viewport 的 scale + 根字号」：

```js
// 简化版核心逻辑（lib-flexible 的思想）
function flexible() {
  const meta = document.querySelector('meta[name=viewport]')
  const dpr = window.devicePixelRatio  // 设备像素比
  const scale = 1 / dpr                // 缩放比例：DPR=3 就缩到 1/3

  // 1. 动态改 viewport：宽度 = 设备宽、缩放 = 1/DPR
  //    效果：CSS 的 1px 在 DPR=3 的屏幕上正好占 3 个物理像素（解决高清屏模糊）
  meta.content = `width=device-width, initial-scale=${scale}`

  // 2. 根字号 = 屏幕宽 * DPR / 10
  //    配合 rem 使用
  document.documentElement.style.fontSize =
    (document.documentElement.clientWidth * dpr) / 10 + 'px'
}
flexible()
```

**为什么现在少用了**：viewport 缩放会影响整页，和第三方库兼容性有摩擦；vw 方案出现后（兼容性已足够好），新项目基本用 vw 或 vw+rem 混合。

## 六、方案四：媒体查询 + 百分比（简单场景）

```css
/* 响应式：按断点切换布局 —— 适合内容型页面，不适合严格还原设计稿 */
.container { width: 100%; padding: 0 4%; }

/* 手机端 */
.cards { display: grid; grid-template-columns: 1fr; }

/* 平板以上变两列 */
@media (min-width: 768px) {
  .cards { grid-template-columns: repeat(2, 1fr); }
}

/* 桌面变四列 */
@media (min-width: 1200px) {
  .cards { grid-template-columns: repeat(4, 1fr); }
}
```

## 七、图片适配

```html
<!-- 高清屏用 2 倍图（srcset） -->
<img
  src="logo.png"               <!-- 普通屏 1x -->
  srcset="logo@2x.png 2x, logo@3x.png 3x"
  <!-- DPR=2 用 2x 图，DPR=3 用 3x 图 -->
/>

<!-- 响应式尺寸（sizes 告诉浏览器图片在不同宽度下占多少） -->
<img
  src="photo.jpg"
  srcset="photo-400.jpg 400w, photo-800.jpg 800w, photo-1200.jpg 1200w"
  sizes="(max-width: 600px) 100vw, 50vw"
  <!-- 手机上占满屏（100vw），桌面上占一半（50vw） -->
/>
```

## 八、1px 边框问题（高频追问）

**为什么 1px 会变粗**：

```text
CSS 写 border: 1px solid #ccc
DPR=3 的屏幕：1 个 CSS 像素 = 3 个物理像素
-> 边框实际占 3 个物理像素宽 -> 视觉上比设计稿的 1 物理像素粗 3 倍
```

**解决：伪元素 + transform 缩放（最常用）**

```scss
// 定义一个 1px 下边框 mixin（SCSS）
@mixin border-1px($color: #eee) {
  position: relative;

  &::after {
    content: '';
    position: absolute;
    left: 0;
    bottom: 0;
    width: 100%;
    height: 1px;              // 先画 1px（占 1 个 CSS 像素）
    background: $color;
    transform: scaleY(0.5);   // 再在 Y 轴压缩一半
    // DPR=2：1css px = 2 物理 px -> 压到 0.5css = 1 物理 px ✅
    // DPR=3 时改成 scaleY(0.33)
    transform-origin: 0 0;
  }
}

// 配合媒体查询自动适配 DPR：
// @media (-webkit-min-device-pixel-ratio: 3) { &::after { transform: scaleY(0.33) } }

.list-item {
  @include border-1px;
}
```

## 九、刘海屏安全区域适配

```html
<!-- viewport-fit=cover：允许内容延伸到刘海/底部横条区域 -->
<meta name="viewport"
  content="width=device-width, initial-scale=1.0, viewport-fit=cover" />
```

```css
/* env() 读取安全区域距离 */
.footer-bar {
  /* 底部固定栏：底部留出安全距离（iPhone 底部小横条） */
  padding-bottom: calc(12px + env(safe-area-inset-bottom));
  /* 有横条时 env() > 0，没有时 = 0，也不影响安卓 */
}

/* 常量兜底（老 iOS） */
@supports (padding: constant(safe-area-inset-bottom)) {
  .footer-bar { padding-bottom: constant(safe-area-inset-bottom); }
}
```

## 十、方案对比选型

| 方案 | 原理 | 优点 | 缺点 | 适用 |
| --- | --- | --- | --- | --- |
| **rem** | 动态根字号 | 兼容好、成熟 | 需要 JS + resize 监听 | 老项目、兼容要求高 |
| **vw（主流）** | 视口百分比 | 零 JS、天然响应 | 超大屏字过大（clamp 补救） | 新项目首选 |
| flexible | rem+viewport 缩放 | 顺带解决高清 1px | 兼容摩擦多 | 历史方案，了解原理 |
| 媒体查询 | 断点切换 | 简单直接 | 不等比、断点爆炸 | 内容型/后台页面 |

**实战常见组合**：

```css
/* vw + rem 混合：布局用 vw、字号用 rem（可 clamp 限制） */
.layout { width: 92vw; }        /* 布局随屏幕等比 */
.title  { font-size: 1rem; }    /* 字号可控，不会无限放大 */

/* PostCSS 同时配两个插件：px->vw 转布局、px->rem 转字号 */
```

## 十一、高频速答

| 问题 | 答案 |
| --- | --- |
| 适配的本质？ | 元素按屏幕宽度等比缩放 |
| rem 换算公式？ | 设计稿 px / 100 = rem（750 稿、1rem=100px 约定下） |
| vw 换算公式？ | 设计稿 px / 750 * 100 = vw |
| rem 和 vw 谁主流？ | vw（零 JS、天然响应）；字号可用 clamp 限范围 |
| flexible 是什么？ | 动态 viewport 缩放 + rem，历史方案，了解原理 |
| PostCSS 插件作用？ | 按设计稿写 px，构建自动转 rem/vw |
| 1px 为什么粗？ | 1css px = DPR 个物理像素，DPR=3 就占 3 物理 px |
| 1px 怎么解决？ | 伪元素 scaleY(0.5/0.33)，或 viewport 缩放 |
| 刘海屏怎么适配？ | viewport-fit=cover + env(safe-area-inset-*) |
| 为什么先设 viewport？ | 没有它布局视口默认 980px，一切换算基础都不存在 |

## 十二、速记卡

```text
1. 前提：<meta viewport width=device-width>，否则全失效
2. rem：JS 改根字号 width/7.5，设计稿 px/100 写 rem
3. vw：设计稿 px/750*100，零 JS 是新项目首选
4. 字号用 clamp(14px, 4vw, 18px) 防止过大过小
5. PostCSS 自动转：postcss-pxtorem / postcss-px-to-viewport
6. 1px 粗 = DPR 原因，伪元素 scaleY 解决
7. 刘海屏：viewport-fit=cover + env(safe-area-inset-bottom)
8. 选型：新项目 vw，老项目 rem，内容页媒体查询
```
