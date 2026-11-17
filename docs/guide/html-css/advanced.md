# CSS 进阶篇（Q14 - Q20）

> 每题五层结构：**为什么存在 -> 是什么 -> 怎么用 -> 常见坑 -> 面试怎么答（总-分）**

## Q14：选择器优先级怎么计算？（<span class="hot">超高频</span>）

### 14.1 为什么存在

一个元素可能同时被多条规则命中：

```css
div { color: blue; }
.box { color: green; }
#main .box { color: red; }  /* 三条都命中，最终听谁的？ */
```

CSS 需要一套确定的「裁决规则」——这就是优先级算法。

### 14.2 是什么 + 怎么用

**四元组计算法**：`(内联, ID, 类/伪类/属性, 标签/伪元素)`，**同等级比个数，不同等级左大右小**：

```css
div { }                        /* 0,0,0,1 */
.box { }                       /* 0,0,1,0 */
div.box { }                    /* 0,0,1,1 */
.box .item { }                 /* 0,0,2,0 */
#header { }                    /* 0,1,0,0 */
#header .nav a:hover { }       /* 0,1,2,2 */
<div style="color: red">       /* 1,0,0,0 内联样式 */
```

```text
裁决规则：
1. 逐级从左往右比，高位完胜 —— 一个 ID 干翻所有 class
2. 四级全相同 -> 后写的覆盖先写的（层叠规则）
3. !important 压制一切（除了另一个同级的 important 再拼优先级）
```

**不参与计算的**：通配符 `*`、组合符 `> + ~`、`:where()`（零优先级）；`:is()` 取参数里最高的。

### 14.3 常见坑

```css
/* 坑一：!important 慎用 —— 破坏级联，第三方库覆盖会变地狱 */
/* 坑二：通配符和继承样式优先级为 0，随便一个选择器都能覆盖 */
/* 坑三：一个 id 永远大于 N 个 class —— 0,1,0,0 > 0,0,99,99 */
```

### 14.4 面试回答示范（总-分结构）

> **总起**：优先级按四元组算——内联、ID、类/伪类/属性、标签/伪元素，高位完胜低位，同级比个数。
>
> **三条裁决规则**：
>
> **第一，高位压制。** 一个 ID 的优先级永远高于任意数量的 class，四元组从左往右比。
>
> **第二，全同级看层叠。** 四级完全相同时，后写的覆盖先写的。
>
> **第三，两个例外。** !important 压制一切但破坏级联要慎用；通配符和组合符不参与计算。inline style 是 1,0,0,0 排最前。

## Q15：伪类和伪元素的区别？（<span class="hot">高频</span>）

### 15.1 为什么存在

有些「状态」和「局部」无法用普通选择器表达：鼠标悬停时、输入框聚焦时、段落的第一行——伪类和伪元素就是给这些场景开的「后门」。

### 15.2 是什么

```text
伪类（一个冒号）：描述已有元素的「某种状态」
  -> 选的还是这个元素，只是在特定条件下
  例：:hover 是「鼠标悬停时的这个元素」

伪元素（两个冒号）：创建「不存在于 DOM 的虚拟元素」
  -> 选的是元素的一部分或凭空造的新盒子
  例：::before 是在元素前面插入一个新盒子
```

### 15.3 怎么用

```css
/* ============ 常用伪类 ============ */
a:hover { color: red; }            /* 悬停状态 */
input:focus { border: blue; }      /* 聚焦状态 */
input:disabled { opacity: .5; }    /* 禁用状态 */
li:first-child { }                 /* 是长子的 li */
li:nth-child(2n + 1) { }           /* 奇数行：1,3,5... */
tr:nth-child(odd) { background: #fafafa; } /* 斑马纹 */
a:not(.active) { }                 /* 反选 */

/* ============ 常用伪元素 ============ */
.required::before {                /* 必填项前加红星 */
  content: '* ';
  color: red;                      /* ::before 必须配 content 才生效！ */
}

.ellipsis-one {                    /* 单行省略 */
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;         /* ellipsis 本质是伪元素行为 */
}

.clearfix::after {                 /* 清浮动经典（BFC 之外的另一种解法） */
  content: '';
  display: block;
  clear: both;
}

input::placeholder { color: #999; }  /* 占位文本 */
p::first-line { color: gray; }       /* 第一行（随宽度流动） */
p::selection { background: yellow; } /* 文字选中态 */
```

### 15.4 常见坑

```css
/* 坑一：::before 不写 content 完全不渲染 */
/* 坑二：伪元素不在 DOM 里 —— JS 拿不到，DevTools 里能看到但选中 */
/* 坑三：一个冒号是历史写法（:before）—— CSS3 规范统一伪元素用 :: */
```

### 15.5 面试回答示范（总-分结构）

> **总起**：本质区别一句话——伪类选「已有元素的状态」，伪元素「造出 DOM 里不存在的虚拟元素」。
>
> **第一，伪类一个冒号。** hover、focus、nth-child 这些描述的是元素在特定条件下的状态，选的还是那个元素。
>
> **第二，伪元素两个冒号。** before、after、first-line 操作的是元素的一部分或凭空插入的新盒子——比如 ::before 加必填星号、::after 清浮动。
>
> **第三，两个细节。** ::before 必须配 content 才生效；伪元素不在 DOM 里 JS 拿不到。

## Q16：px / em / rem / vw / vh 区别？（<span class="hot">超高频</span>）

### 16.1 为什么存在

屏幕尺寸千差万别，全部写死 px 会导致小屏溢出、大屏空旷——需要「能伸缩」的单位体系。

### 16.2 是什么 + 怎么用

| 单位 | 相对什么 | 典型场景 |
| --- | --- | --- |
| px | 绝对（逻辑像素） | 边框、需要精确的间距 |
| em | **父元素** font-size | 组件内部相对缩进（嵌套会累积，少用） |
| rem | **根元素 html** font-size | 整体缩放、移动端适配 |
| vw / vh | 视口宽 / 高的 1% | 全屏布局、大屏可视化 |
| % | 父元素的对应属性 | 宽度自适应 |

```css
/* em 的嵌套累积问题（这是它少用的原因） */
.parent { font-size: 16px; }
.child  { font-size: 1.5em; }   /* 24px */
.grandson { padding: 1em; }      /* 1em 相对 24px = 24px（不是 16！层层向上找） */

/* rem 永远相对根 —— 换算统一 */
html { font-size: 16px; }
.box { width: 12.5rem; }         /* 12.5 × 16 = 200px */
```

**rem 移动端适配原理（必会）**：

```js
// 设计稿 750px，约定 1rem = 100px 方便换算
// 屏幕宽 375px 时：根字号 = 375/7.5 = 50px -> 1rem = 50px
// 屏幕宽 414px 时：根字号 = 414/7.5 = 55.2px -> 1rem 按比例放大
document.documentElement.style.fontSize =
  (document.documentElement.clientWidth / 7.5) + 'px'
// 设计稿上量出 200px -> 写 2rem，任何屏宽下自动等比缩放
```

**vw 方案（更现代，无需 JS）**：

```css
/* 设计稿 750px：1px = 100/750 vw */
.box { width: 26.67vw; }  /* 200px / 750 × 100 */
```

### 16.3 常见坑

```text
坑一：em 找的是「父元素」字号 —— 层层嵌套会累积，除组件内部外少用
坑二：rem 改根字号影响全局 —— 全局只改 html 的 font-size，别的地方别乱动
坑三：100vw 含滚动条宽度（比 100% 略宽）—— 全屏容器用 100% 更稳
```

### 16.4 面试回答示范（总-分结构）

> **总起**：五个单位按「相对什么」区分——px 绝对，em 相对父字号，rem 相对根字号，vw/vh 相对视口，% 相对父元素。
>
> **重点讲 em 和 rem 的区别**：em 找父元素的 font-size，嵌套会层层累积，只在组件内部用；rem 永远相对根元素，全局换算统一。
>
> **适配方案**：rem 方案——JS 按屏幕宽动态设根字号，设计稿 200px 写 2rem 自动等比缩放；vw 方案更现代——直接按视口百分比换算，不依赖 JS。
>
> **再补一个坑**：100vw 包含滚动条宽度比 100% 略宽，全屏容器用 100% 更稳。

## Q17：响应式布局有哪些方案？（<span class="hot">高频</span>）

### 17.1 为什么存在

一套代码要同时服务手机、平板、桌面——不可能为每个设备写一份页面，需要「同一页面按条件自适应」的手段。

### 17.2 五种方案

```css
/* ============ 1. 媒体查询：按视口断点切换样式 ============ */
.container { width: 100%; padding: 0 16px; }
@media (min-width: 768px)  { .container { max-width: 720px; } }   /* 平板 */
@media (min-width: 1200px) { .container { max-width: 1140px; } }  /* 桌面 */

/* ============ 2. 弹性单位：rem / vw 自动缩放 ============ */
.hero { height: 100vh; font-size: 5vw; }

/* ============ 3. 弹性布局：容器变化列数自动增减 ============ */
.cards {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  /* 容器每塞得下一个 240px 就多一列，塞不下就减一列 */
}

/* ============ 4. 响应式图片 ============ */
<img src="photo.jpg"
     srcset="photo@2x.jpg 2x"              /* 高分屏用 2 倍图 */
     sizes="(max-width: 600px) 100vw, 50vw" /> /* 小屏全宽，大屏半宽 */

/* ============ 5. 容器查询：按父容器宽度响应（新一代） ============ */
.card-wrap { container-type: inline-size; }  /* 声明为容器 */
@container (min-width: 400px) {
  .card { display: flex; }   /* 父容器够宽时改横向布局 */
}
```

### 17.3 媒体查询 vs 容器查询

```text
媒体查询：响应的是「视口」—— 整个页面级别
容器查询：响应的是「父容器」—— 组件级别
场景：同一个卡片组件放侧栏（窄）和主区（宽）
      媒体查询做不到（视口一样宽）—— 容器查询正好解决
```

### 17.4 面试回答示范（总-分结构）

> **总起**：响应式我按五套方案说——媒体查询、弹性单位、弹性布局、响应式图片、容器查询。
>
> **第一，媒体查询是基础。** 按视口断点切换样式，768/1200 是常用断点。
>
> **第二，弹性单位和布局。** rem/vw 自动缩放字号和尺寸；Grid 的 auto-fill 加 minmax 让列数随容器自动增减。
>
> **第三，容器查询是新一代。** 媒体查询响应视口，容器查询响应父容器——同一个组件在不同宽度的位置能有不同形态，这是组件化时代的响应式方案。

## Q18：隐藏元素的几种方式及区别？（<span class="hot">高频</span>）

### 18.1 为什么存在

「隐藏」看似一个需求，实际有三种语义：彻底消失、保留占位看不见、透明但可交互——不同语义对应不同方案。

### 18.2 四种方案 + 核心对比

```css
.hide1 { display: none; }                       /* 彻底移除 */
.hide2 { visibility: hidden; }                  /* 保留占位不可见 */
.hide3 { opacity: 0; }                          /* 全透明，占位+可交互 */
.hide4 { position: absolute; left: -9999px; }   /* 移出视口（屏读可用） */
```

| | display: none | visibility: hidden | opacity: 0 |
| --- | --- | --- | --- |
| 占据空间 | ❌ 不占 | ✅ 保留 | ✅ 保留 |
| 渲染开销 | **触发重排**（几何变了） | 重绘 | **只合成**（性能最好） |
| 能否交互/触发事件 | 否 | 否 | **能**（还挡在那里） |
| 子元素能否单独显示 | 否 | ✅ 可设回 visible | ✅ 可设回 1 |
| 过渡动画 | ❌ 不支持 | ✅ | ✅ 最适合 |

### 18.3 怎么选

```css
/* 想隐藏且做淡入淡出动画 */
.fade { opacity: 0; transition: opacity .3s; }
.fade.show { opacity: 1; }

/* 彻底移除不占位 */
.gone { display: none; }

/* 隐藏但不想影响布局 */
.ghost { visibility: hidden; }
```

### 18.4 面试回答示范（总-分结构）

> **总起**：三种主流方案，核心差异在「占不占位、能不能交互、渲染开销」三个维度。
>
> **第一，display:none。** 彻底移除——不占空间、触发重排、无法做过渡动画。
>
> **第二，visibility:hidden。** 保留占位只是不可见——子元素可以单独设回 visible，这是它独有能力。
>
> **第三，opacity:0。** 全透明但元素还在——**仍然可以点击触发事件**（常被忽略的点），且只走合成性能最好，是过渡动画的首选。
>
> **收尾**：做淡入淡出用 opacity，彻底移除用 display，隐藏保占位用 visibility。

## Q19：transition 和 animation 区别？（<span class="hot">高频</span>）

### 19.1 是什么 + 怎么用

```css
/* ============ transition：两个状态间的过渡，需要触发 ============ */
.btn {
  background: #1677ff;
  transition: transform .3s ease, background .3s;
  /*             属性 时长 曲线（可列多个，逗号分隔） */
}
.btn:hover {
  transform: scale(1.05);   /* 状态改变 -> 自动补间过渡 */
  background: #4096ff;
}

/* ============ animation：多关键帧动画，可自动播放 ============ */
@keyframes spin {
  from { transform: rotate(0deg); }
  50%  { transform: rotate(180deg) scale(1.1); }  /* 任意多个关键帧 */
  to   { transform: rotate(360deg); }
}
.loading {
  animation: spin 1s linear infinite;
  /*          名字 时长 曲线 循环 */
  animation-fill-mode: forwards;  /* 停在最后一帧 */
  animation-play-state: paused;   /* 可暂停（hover 时恢复） */
}
```

| | transition | animation |
| --- | --- | --- |
| 触发 | 需要 hover/类切换 | 可自动开始 |
| 关键帧 | 只有两个状态 | @keyframes 任意多个 |
| 循环 | ❌ | ✅ infinite |
| 暂停/反转 | ❌ | ✅ paused / reverse |
| 适用 | 交互反馈（hover、展开收起） | loading、持续动效 |

### 19.2 性能考点（关联渲染原理）

```css
/* ✅ 只触发合成：GPU 处理，丝滑 */
.box { transition: transform .3s, opacity .3s; }

/* ❌ 触发重排：主线程处理，掉帧 */
.box { transition: left .3s, width .3s; }
```

完整原理（重排 > 重绘 > 合成）见《浏览器渲染流程》专题。

### 19.3 面试回答示范（总-分结构）

> **总起**：transition 是「两状态过渡、需要触发」，animation 是「多关键帧、可自动可循环」。
>
> **三点差异**：transition 只有两个状态且必须 hover 或类切换触发，适合交互反馈；animation 用 @keyframes 定义任意多个关键帧，能 infinite 循环、能暂停反转，适合 loading 这类持续动效。
>
> **性能原则**：无论哪个，动画属性只用 transform 和 opacity——它们只走合成阶段由 GPU 处理；left/width 会触发重排掉帧。这个原理和浏览器渲染流水线直接相关。

## Q20：CSS 变量、:has、容器查询等现代特性

### 20.1 为什么存在

原生 CSS 长期缺「逻辑能力」——不能定义变量、不能按子元素选父、不能按容器响应。预处理器解决了编译期的问题，但运行时换肤、运行时响应还是要靠这些原生新特性。

### 20.2 怎么用

**CSS 变量——运行时换肤的基石**：

```css
:root {
  --primary: #1677ff;   /* 定义：-- 开头 */
  --bg: #fff;
}
[data-theme='dark'] {   /* 切主题类 -> 变量值全变 */
  --primary: #3c89e8;
  --bg: #1f1f1f;
}
.button {
  background: var(--primary);  /* 使用：var() */
  color: var(--bg);
}
/* JS 也能改：document.documentElement.style.setProperty('--primary', 'red') */
/* 对比 SCSS 变量：编译期定死；CSS 变量运行时可改 -> 换肤零成本 */
```

**:has() 父选择器（革命性）**：

```css
/* 以前只能 JS 给父级加类，现在 CSS 自己选父 */
.form-item:has(input:invalid) { border-color: red; }
/* 表单项里的 input 校验失败 -> 给整个 form-item 加红边 */

.card:has(img) { padding-top: 0; }  /* 有图的卡片去掉顶部留白 */
```

**容器查询**：见 Q17（组件级响应式）。

**其他实用新特性**：

```css
.aspect-box { aspect-ratio: 16 / 9; }     /* 免 JS 保持宽高比 -> 防 CLS */
.text { text-wrap: balance; }             /* 标题换行更均衡 */
.scroll-box { scrollbar-gutter: stable; } /* 预留滚动条空间防抖动 */
```

### 20.3 面试回答示范（总-分结构）

> **总起**：现代 CSS 正在补齐「逻辑能力」，我重点掌握四个——变量、:has、容器查询、aspect-ratio。
>
> **第一，CSS 变量支持运行时修改。** 这是它比 SCSS 变量强的核心——切主题类或 JS setProperty 修改变量，全站样式实时变化，换肤零成本。
>
> **第二，:has 是父选择器。** 根据子元素状态选中父元素，表单校验给整个 form-item 加红边这类需求不再需要 JS。
>
> **第三，容器查询按父容器响应。** 和媒体查询的视口响应互补，是组件化时代的响应式方案。
>
> **第四，aspect-ratio 预留宽高比。** 图片和视频容器提前占位，从源头减少 CLS 布局偏移。

## 本篇速答

| 问题 | 一句话答案 |
| --- | --- |
| 优先级四元组？ | 内联 > id > class > 标签，高位完胜同级比个数 |
| 一个 id 和十个 class？ | id 赢（0,1,0,0 > 0,0,10,0） |
| 伪类和伪元素？ | 伪类选状态（:hover），伪元素造元素（::before） |
| ::before 不生效？ | 忘了写 content 属性 |
| em 和 rem？ | em 相对父字号（嵌套累积），rem 相对根字号 |
| 100vw 和 100% 区别？ | vw 含滚动条略宽，全屏容器用 100% |
| opacity:0 还能点到吗？ | 能，元素还在只是透明（对比 display:none） |
| 动画为什么用 transform？ | 只触发合成走 GPU，不占主线程 |
| CSS 变量 vs SCSS 变量？ | CSS 变量运行时可改 -> 换肤零成本 |
| :has() 是什么？ | 父选择器，按子元素状态选中父元素 |
