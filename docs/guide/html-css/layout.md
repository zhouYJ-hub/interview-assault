# CSS 布局篇（Q7 - Q13）

> 每题五层结构：**为什么存在 -> 是什么 -> 怎么用 -> 常见坑 -> 面试怎么答（总-分）**

## Q7：盒模型？标准与怪异模式？box-sizing？（<span class="hot">超高频</span>）

### 7.1 为什么存在

给元素设置 `width: 200px` 后，它在页面上**实际占多宽**？答案取决于用哪种盒模型——这就是问题起源。不理解这个，布局时「明明算好了宽度却溢出/换行」的怪事会反复出现。

### 7.2 是什么

每个元素都是一个矩形盒子，由内到外四层：

```text
+---------------------------+
|         margin            |  外边距（盒子之间的距离）
|  +---------------------+  |
|  |      border         |  |  边框
|  |  +---------------+  |  |
|  |  |    padding    |  |  |  内边距
|  |  |  +---------+  |  |  |
|  |  |  | content |  |  |  |  内容
|  |  |  +---------+  |  |  |
|  |  +---------------+  |  |
|  +---------------------+  |
+---------------------------+
```

**两种模型的唯一区别：width 算谁**：

```text
标准盒模型（content-box，默认）：
  width = content 宽度
  实际占位 = width + padding + border
  例：width:100px + padding:10px + border:5px -> 实占 130px

怪异盒模型（border-box）：
  width = content + padding + border
  实际占位 = width（padding 向内挤 content）
  例：width:100px + padding:10px + border:5px -> 实占还是 100px
```

### 7.3 怎么用

```css
/* 全局推荐：写多少 width 就占多少，布局好算 */
* {
  box-sizing: border-box;
}
/* 更稳妥的写法（不依赖 * ）：
   *, *::before, *::after { box-sizing: border-box; } */
```

为什么全局推荐 border-box：给 100% 宽的元素加 padding 不再撑破父容器。

### 7.4 常见坑

```text
坑一：margin 不算盒子尺寸 —— 它是「盒子之间」的距离，不是盒子的一部分
坑二：width:100% + padding 溢出 —— content-box 下必溢出，border-box 解决
坑三：行内元素的盒模型 —— 宽高/padding 表现特殊（见 Q3）
```

### 7.5 面试回答示范（总-分结构）

> **总起**：盒模型描述元素的组成——content、padding、border、margin 四层；两种模型的区别就在 width 算谁。
>
> **分三点**：
>
> **第一，标准盒模型 content-box（默认）。** width 只含内容，实际占位要加 padding 和 border——width 100px 加 padding 后实际变 130px。
>
> **第二，怪异盒模型 border-box。** width 包含内容和 padding、border，写 100 就占 100，padding 向内挤压内容。
>
> **第三，项目实践。** 全局设置 `* { box-sizing: border-box }`，布局时宽度直观可控，加 padding 不会撑破容器。注意 margin 不算盒子尺寸，它是盒子间的距离。

## Q8：BFC 是什么？怎么触发？解决什么问题？（<span class="hot">超高频</span>）

### 8.1 为什么存在

先看三个「诡异」的布局现象：

```css
/* 现象一：父元素高度塌陷 —— 子元素浮动后，父元素高度变成 0 */
.parent { border: 1px solid red; }
.child { float: left; height: 100px; } /* 父元素塌成 0 高 */

/* 现象二：margin 上下重叠 —— 两个块级元素相邻，margin 取大者不叠加 */
.a { margin-bottom: 50px; }
.b { margin-top: 30px; }   /* 实际间距是 50，不是 80！ */

/* 现象三：文字环绕浮动元素 —— 不想让文字环绕 */
```

BFC 就是解释和解决这一类现象的机制。

### 8.2 是什么

BFC（Block Formatting Context，块级格式化上下文）= **一个独立的渲染区域**。可以理解为给元素画了一个「结界」：

```text
普通流中：
  内部元素的布局可能影响外部（浮动溢出、margin 穿出去）

BFC 结界中：
  内部布局完全封闭 —— 浮动被包裹、margin 不越界、不与外部浮动重叠
  外部也无法影响它内部
```

### 8.3 怎么用

**触发条件（背三个够用）**：

```css
.bfc {
  overflow: hidden;   /* 最常用，但有截断内容的副作用 */
  display: flow-root; /* 专门创建 BFC，零副作用（推荐！） */
  position: absolute; /* 脱流元素 */
  display: flex;      /* flex 容器 */
  float: left;        /* 浮动元素 */
}
```

**三大应用（对着 8.1 的三个现象）**：

```css
/* 应用一：清除浮动（解决高度塌陷） */
.parent { display: flow-root; }  /* 父元素变 BFC -> 包住浮动子元素 */

/* 应用二：阻止 margin 上下重叠 */
.wrapper-b { overflow: hidden; }  /* 第二个元素放进新 BFC -> 与外面的 margin 隔离 */

/* 应用三：自适应两栏（解决文字环绕） */
.left { float: left; width: 200px; }
.right { overflow: hidden; }  /* 右侧 BFC 不与左侧浮动重叠 -> 自动占满剩余宽度 */
```

### 8.4 常见坑

```text
坑一：overflow: hidden 会截断超出内容（弹出层、阴影）-> 用 flow-root 替代
坑二：BFC 只对「块级盒」的布局生效
坑三：display:flow-root 是较新属性，老项目兼容性要注意
```

### 8.5 面试回答示范（总-分结构）

> **总起**：BFC 是块级格式化上下文——一个独立渲染区域，内部布局与外部互相隔离，可以理解为给元素画了个「结界」。
>
> **分三步说**：
>
> **第一，触发方式。** 常用 overflow 非 visible、display: flow-root（无副作用，推荐）、position absolute、display flex。
>
> **第二，三大应用。** 清除浮动——父元素变 BFC 包住浮动子元素解决高度塌陷；隔离 margin 重叠——把第二个元素放进新 BFC；自适应两栏——右侧 BFC 不与左侧浮动重叠，自动占满剩余宽度。
>
> **第三，实践选择。** overflow:hidden 有截断副作用，新项目我用 display:flow-root，专门为 BFC 而生。

## Q9：Flex 布局核心属性（<span class="hot">超高频</span>）

### 9.1 为什么存在

Flex 之前，水平居中要 hack、等分要算百分比、垂直居中几乎不可能优雅实现。Flex 把「一维方向上的排列分配」变成声明式——**容器定规则，项目自动排**。

### 9.2 是什么 + 怎么用

**两套属性：容器（父）管整体，项目（子）管自己。**

```css
/* ============ 容器属性 ============ */
.container {
  display: flex;

  flex-direction: row | row-reverse | column | column-reverse;
  /* 主轴方向：横着排还是竖着排 */

  justify-content: flex-start | center | space-between | space-around;
  /* 主轴对齐：起点 / 居中 / 两端 / 分布 */

  align-items: stretch | center | flex-start | flex-end;
  /* 交叉轴对齐：默认拉伸铺满 / 居中 / 起点对齐 */

  flex-wrap: nowrap | wrap;
  /* 是否换行：默认不换（挤压） */

  gap: 16px;
  /* 项目间距（代替给每个子元素写 margin-right） */
}
```

**记忆法**：先定方向（direction），再想对齐——**主轴 justify-content，交叉轴 align-items**。

```css
/* ============ 项目属性 ============ */
.item {
  flex-grow: 1;      /* 放大：有剩余空间时，按比例分多少（默认 0 不放大） */
  flex-shrink: 1;    /* 缩小：空间不够时是否压缩（默认 1 压缩） */
  flex-basis: 200px; /* 基准尺寸：分配前的初始大小 */

  flex: 1;           /* 简写：1 1 0% —— 等分剩余空间（最常用） */

  align-self: flex-end;  /* 单独覆盖自己在交叉轴的对齐 */
  order: 2;              /* 调整显示顺序（不影响 DOM） */
}
```

**flex: 1 vs flex: auto（高频追问）**：

```css
.left { flex: 1; }    /* 1 1 0%    基准为 0，完全按比例分 -> 真正的等分 */
.mid  { flex: auto; } /* 1 1 auto  基准为内容宽度，先保内容再分剩余 */
/* 三个 flex:1 的元素 -> 严格等宽；三个 flex:auto -> 内容多的更宽 */
```

### 9.3 常见坑

```css
/* 坑一：flex:1 的元素内容过长会撑爆 -> 加 min-width: 0 */
.text { flex: 1; min-width: 0; overflow: hidden; }

/* 坑二：想换行必须显式设置 wrap，默认 nowrap 会压缩项目 */
.cards { flex-wrap: wrap; }

/* 坑三：gap 代替 margin 更干净，但注意 gap 是容器属性 */
```

### 9.4 面试回答示范（总-分结构）

> **总起**：Flex 是一维弹性布局，核心是「两套属性」——容器管整体排列，项目管自身分配。
>
> **容器五个常用**：direction 定主轴方向、justify-content 管主轴对齐、align-items 管交叉轴对齐、wrap 控制换行、gap 设间距。记忆口诀是「先定方向，再想对齐——主轴 justify，交叉轴 align」。
>
> **项目两个核心**：flex-grow 放大比例、flex-shrink 缩小比例、flex-basis 基准尺寸；简写 flex:1 等于 1 1 0%，基准为零真正等分。
>
> **再补两个追问点**：flex:1 和 flex:auto 的区别在基准——前者 0% 严格等分，后者 auto 先保内容再分配；flex:1 的元素要配 min-width:0 防止内容撑爆。

## Q10：Grid 和 Flex 的区别与选型（<span class="hot">高频</span>）

### 10.1 为什么存在

Flex 解决了「一条轴上」的排列，但复杂页面是**行和列交织的二维结构**——用 Flex 得嵌套多层，Grid 直接定义网格。

### 10.2 是什么

```css
/* Grid：先定义网格结构（行列），再把内容放进格子 */
.layout {
  display: grid;
  grid-template-columns: 200px 1fr;      /* 两列：左固定右自适应 */
  grid-template-rows: 60px 1fr 40px;     /* 三行：头/主体/底 */
  gap: 16px;
}

/* 十二列栅格一行搞定 */
.grid12 { grid-template-columns: repeat(12, 1fr); }
```

### 10.3 选型口诀

| 场景 | 选择 | 原因 |
| --- | --- | --- |
| 导航、按钮组、单行卡片 | Flex | 一维，内容驱动 |
| 整页骨架（侧栏+主区+头脚） | Grid | 二维结构先行 |
| 内容数量不定 | Flex | 有多少排多少 |
| 先画格子再填内容 | Grid | 结构已知 |

一句话：**Flex 是内容找空间，Grid 是空间等内容。**

### 10.4 面试回答示范（总-分结构）

> **总起**：核心区别是维度——Flex 一维、Grid 二维，选型看「内容驱动」还是「结构先行」。
>
> **第一，Flex 一维。** 一次只控制一条轴（横向或纵向），适合导航条、按钮组这种内容数量不定的场景。
>
> **第二，Grid 二维。** 行列同时定义，`grid-template-columns: 200px 1fr` 一行代码画出整页骨架，适合结构已知的布局。
>
> **收尾**：两者经常组合用——Grid 搭页面骨架，骨架内部用 Flex 排组件。

## Q11：position 各值的定位原点（<span class="hot">超高频</span>）

### 11.1 为什么存在

默认文档流自上而下排列，但 UI 需要「把元素放到任意位置」——悬浮按钮、吸顶导航、弹窗定位。position 就是脱离常规排版的定位系统。

### 11.2 是什么 + 怎么用

| 值 | 定位原点 | 脱离文档流 | 滚动行为 | 典型场景 |
| --- | --- | --- | --- | --- |
| static（默认） | 不定位 | 否 | — | 正常流 |
| relative | **自己原位置** | 否（原位置保留占位） | 跟随滚动 | 给 absolute 当参照物、微调 |
| absolute | **最近非 static 祖先** | ✅（原位置释放） | 跟随滚动 | 弹窗内的关闭按钮、角标 |
| fixed | **浏览器视口** | ✅ | **滚动不动** | 悬浮客服、吸底栏 |
| sticky | 滚动前 relative / 越过阈值后 fixed | 否 | 阈值内滚动 | 吸顶导航、表格头 |

```css
/* 经典组合：父 relative + 子 absolute */
.parent { position: relative; }  /* 父设参照 */
.badge {
  position: absolute;            /* 子以父为原点 */
  top: 0;
  right: 0;                      /* 右上角小红点 */
}

/* sticky 必须设 top 才生效 */
.header { position: sticky; top: 0; }
```

### 11.3 常见坑

```css
/* 坑一：absolute 找不到定位祖先 -> 以页面（初始包含块）为原点
   解决：想以谁为原点，给谁加 position: relative */

/* 坑二：fixed 遇到祖先 transform/filter 会失效 */
.scroll-container { transform: translateZ(0); }
/* 里面的 fixed 元素不再以视口为原点，改为以这个祖先为原点！ */
/* 弹窗库常见的坑 */

/* 坑三：sticky 不生效 —— 必须设 top/bottom 且父元素不能 overflow: hidden */
```

### 11.4 面试回答示范（总-分结构）

> **总起**：position 五个值，核心看两个问题——以谁为原点、是否脱离文档流。
>
> **逐个说**：
>
> **第一，relative。** 以自己原位置偏移，占位保留——主要给 absolute 当参照物。
>
> **第二，absolute。** 以最近的非 static 祖先为原点，脱离文档流——所以经典组合是父 relative 子 absolute。
>
> **第三，fixed。** 以视口为原点、滚动不动；但注意祖先有 transform 时会失效，这是弹窗组件的经典坑。
>
> **第四，sticky。** 阈值前是 relative、越过 top 后变 fixed——吸顶导航专用，必须设 top 才生效。

## Q12：水平垂直居中几种方案（<span class="hot">超高频</span>）

### 12.1 为什么存在

居中是布局基本功，也是面试「手写题」的热门——不同方案适用不同条件（定宽与否、是否已知尺寸），能全说清体现功底。

### 12.2 四种方案

```css
/* ============ 方案一：Flex（首选，两行搞定） ============ */
.parent {
  display: flex;
  justify-content: center;  /* 水平居中 */
  align-items: center;      /* 垂直居中 */
}

/* ============ 方案二：Grid（最短） ============ */
.parent { display: grid; place-items: center; }
/* place-items 是 align-items + justify-items 的简写 */

/* ============ 方案三：absolute + transform（不定宽高也适用） ============ */
.parent { position: relative; }
.child {
  position: absolute;
  top: 50%; left: 50%;          /* 先到中心点 */
  transform: translate(-50%, -50%); /* 再往回挪自己的一半 */
}
/* 为什么万能：translate 的百分比是相对自己尺寸，不需要知道宽高 */

/* ============ 方案四：absolute + margin auto（需定宽高） ============ */
.child {
  position: absolute;
  inset: 0;              /* top/right/bottom/left 全 0 */
  margin: auto;          /* 自动分配剩余空间 */
  width: 200px;
  height: 100px;         /* 必须定宽高，否则拉伸铺满 */
}
```

### 12.3 常见坑

```text
坑一：absolute + margin:auto 不设宽高 -> 元素被拉伸铺满父容器
坑二：transform: translate(-50%,-50%) 的百分比相对自身，不是父容器
坑三：inline 元素直接 justify-content 无效 —— 先 display: block/flex
```

### 12.4 面试回答示范（总-分结构）

> **总起**：我准备四种方案，按「是否已知宽高」分两类。
>
> **万能方案两种**：Flex 的 justify-content 加 align-items，两行搞定，日常首选；Grid 的 place-items: center 一行更短。
>
> **absolute 系两种**：transform 方案——50% 定位加 translate 回挪一半，因为百分比相对自身，不定宽高也适用；margin auto 方案——inset: 0 加 margin auto，但必须定宽高否则被拉伸。
>
> **收尾**：实际项目无脑 Flex，面试手写四种展示深度。

## Q13：两栏 / 三栏布局怎么写？（<span class="hot">高频</span>）

### 13.1 为什么存在

「侧栏固定 + 主内容自适应」是后台系统最经典的骨架。历史上出现过 float 负 margin 的圣杯/双飞翼，现在有更简单的方案，但面试仍爱问思想。

### 13.2 两栏布局（左固定右自适应）

```css
/* ============ 方案一：Flex（最常用） ============ */
.layout { display: flex; }
.left { width: 200px; }          /* 固定宽 */
.right { flex: 1; }              /* 占据剩余空间 */

/* ============ 方案二：Grid（最简） ============ */
.layout { display: grid; grid-template-columns: 200px 1fr; }

/* ============ 方案三：BFC（原理见 Q8） ============ */
.left { float: left; width: 200px; }
.right { overflow: hidden; }     /* BFC 不与浮动重叠 -> 自动占剩余 */
```

### 13.3 三栏布局（两侧固定中间自适应）

```css
/* ============ 现代方案：Grid（一行） ============ */
.layout {
  display: grid;
  grid-template-columns: 200px 1fr 300px; /* 左200 中间自适应 右300 */
  min-height: 100vh;
}

/* ============ Flex 方案 ============ */
.layout { display: flex; }
.left { width: 200px; }
.main { flex: 1; }        /* 中间占剩余 */
.right { width: 300px; }
```

### 13.4 经典圣杯布局（完整实现）

**HTML 结构**（注意：中间列放最前，为了优先渲染主内容）：

```html
<div class="container">
  <div class="main">中间内容</div>
  <div class="left">左侧栏 200px</div>
  <div class="right">右侧栏 300px</div>
</div>
```

**CSS（逐行注释）**：

```css
.container {
  /* 父容器用 padding 给两侧预留空间（这是圣杯布局的核心手法之一） */
  padding-left: 200px;    /* 左栏宽度 */
  padding-right: 300px;   /* 右栏宽度 */
}

/* ---------- 中间列 ---------- */
.main {
  float: left;
  width: 100%;            /* 撑满整个父容器宽度（含 padding 区域） */
  background: #eee;       /* 因为它 100% 宽，左右两栏被挤到下一行了 */
  min-height: 200px;
}

/* ---------- 左栏 ---------- */
.left {
  float: left;
  width: 200px;
  margin-left: -100%;     /* 关键①：负 margin 把自己拉回上一行 */
                          /* -100% = 父容器整个内容区宽度 */
                          /* 拉回来后左栏盖在 main 的最左边 */
  position: relative;
  left: -200px;           /* 关键②：相对定位把自己往左挪 200px */
                          /* 正好挪进父容器 padding-left 留出的空间 */
  background: pink;
  min-height: 200px;
}

/* ---------- 右栏 ---------- */
.right {
  float: left;
  width: 300px;
  margin-left: -300px;    /* 关键①：负 margin 拉回上一行 */
                          /* -300px 正好是自己的宽度 */
                          /* 拉回来后右栏在整行的最右端 */
  position: relative;
  right: -300px;          /* 关键②：往右挪 300px 进 padding-right 空间 */
  background: skyblue;
  min-height: 200px;
}

/* ---------- 兜底：屏幕太窄时退化为上下堆叠 ---------- */
@media (max-width: 600px) {
  .container { padding: 0; }
  .main, .left, .right {
    float: none;
    width: 100%;
    position: static;
  }
}
```

```text
布局过程图解：

1. 三列都 float:left，main 占 100% -> left/right 被挤到第二行
   +--------------------------------+
   |            main(100%)          |
   +----------+---------------------+
   |  left    |  right              |   <- 在第二行
   +----------+---------------------+

2. left 用 margin-left:-100% 拉回上一行最左端
   +--------------------------------+
   | left |      main 露出的部分     |
   +----------+---------------------+
   |  right   |  (还在下面)          |
   +----------+---------------------+

3. right 用 margin-left:-300px 拉回上一行最右端
   +--------------------------------+
   | left |   main   |    right     |
   +--------------------------------+

4. 但 left/right 盖住了 main 的两侧！
   父容器 padding 出空间 + relative 挪进去：
   container: padding-left:200px; padding-right:300px
   left:  left:-200px  挪进左侧留白
   right: right:-300px 挪进右侧留白

   最终效果（main 可见区域 = 100% - 200 - 300）：
   +----+----------------------+-----+
   |left|    main（自适应）     |right|
   +----+----------------------+-----+
```

### 13.5 双飞翼布局（完整实现）

**HTML 结构**（和圣杯的关键差异：中间列多套一层 div）：

```html
<!-- 外层 main-wrap 负责浮动占位，内层 main 负责内容让位 -->
<div class="main-wrap">
  <div class="main">中间内容</div>
</div>
<div class="left">左侧栏 200px</div>
<div class="right">右侧栏 300px</div>
```

**CSS（逐行注释）**：

```css
/* ---------- 中间列（两层结构是双飞翼的灵魂） ---------- */
.main-wrap {
  float: left;
  width: 100%;            /* 外层撑满一行（左右被挤下去） */
}

.main {
  margin-left: 200px;     /* 关键差异：不用父容器 padding + relative， */
  margin-right: 300px;    /* 而是内层自己用 margin 给两侧让出空间 */
  background: #eee;       /* main 的内容区域 = 100% - 200 - 300 */
  min-height: 200px;
}

/* ---------- 左栏 ---------- */
.left {
  float: left;
  width: 200px;
  margin-left: -100%;     /* 负 margin 拉回上一行（同圣杯） */
  background: pink;       /* 注意：不需要 position:relative 了！ */
  min-height: 200px;      /* 因为 main 的 margin 已经让开了位置，直接放 */
}

/* ---------- 右栏 ---------- */
.right {
  float: left;
  width: 300px;
  margin-left: -300px;    /* 拉回上一行（同圣杯） */
  background: skyblue;    /* 同样不需要 relative */
  min-height: 200px;
}
```

```text
双飞翼布局过程：

1. main-wrap 占 100%，left/right 在第二行
   +--------------------------------+
   |        main-wrap(100%)         |
   +----------+---------------------+
   |  left    |  right              |
   +----------+---------------------+

2. left(-100%)、right(-300px) 拉回上一行两端
   +--------------------------------+
   | left |  main-wrap  |   right   |
   +--------------------------------+
   （此刻 left/right 盖住了 main 的两侧）

3. 内层 .main 用 margin 让开两侧：
   main 内容 = 父宽 - margin-left(200) - margin-right(300)
   left/right 不需要挪 —— 它们本来就浮动在两端，
   main 的内容只是从它们中间"让"出来

   +----+----------------------+-----+
   |left|   main 内容（自适应）|right|
   +----+----------------------+-----+
```

### 13.6 圣杯 vs 双飞翼对比

| | 圣杯布局 | 双飞翼布局 |
| --- | --- | --- |
| HTML 结构 | 三列平级 | 中间列多套一层 div |
| 给两侧让位的手法 | 父容器 **padding** + 两侧 **relative** 挪进去 | 内层 div 用 **margin** 直接让开 |
| 是否用定位 | 需要 position: relative | 不需要（纯浮动 + margin） |
| 代码感受 | 巧妙但Hack 味浓 | 结构直观一点 |
| 共同思想 | **中间列写最前（优先渲染）+ 负 margin 拉回两侧** | 同左 |

**面试一句话**：

> 两者共同思想是「中间列放 HTML 最前优先渲染 + 三列浮动 + 两侧负 margin 拉回」；区别在给两侧让位的方式——圣杯用父容器 padding 加 relative，双飞翼在中间列里套一层 div 用 margin 让开，省掉了 relative。
### 13.7 面试回答示范（总-分结构）

> **总起**：两栏三栏是后台系统的经典骨架，现代方案 Grid/Flex 一两行搞定，经典方案了解思想即可。
>
> **两栏三种**：Flex 左定宽右 flex:1；Grid 的 `200px 1fr` 一行；BFC 左浮动右 overflow:hidden 自动占剩余。
>
> **三栏**：Grid 的 `200px 1fr 300px` 最简洁；Flex 中间 flex:1。
>
> **经典追问**：圣杯和双飞翼的共同思想是「中间列放 HTML 最前 + 两侧负 margin 拉回」，区别是圣杯用 relative 让位、双飞翼加内层 div 用 margin 让位。中间列放前面是为了**优先渲染主内容提升首屏体验**——这个点能答出就是加分。

## 本篇速答

| 问题 | 一句话答案 |
| --- | --- |
| border-box 的 width 含什么？ | content + padding + border，不含 margin |
| BFC 一句话？ | 独立渲染区域，内外布局互不影响 |
| 触发 BFC 无副作用的写法？ | display: flow-root |
| BFC 三大应用？ | 清浮动、隔离 margin 重叠、自适应两栏 |
| flex:1 等于什么？ | 1 1 0%，基准为零真正等分 |
| flex:1 和 auto 区别？ | 基准 0% 严格等分 vs auto 先保内容再分 |
| Flex 和 Grid 选型？ | 一维内容驱动 Flex，二维结构先行 Grid |
| absolute 以谁为原点？ | 最近非 static 祖先，没有则初始包含块 |
| fixed 的经典坑？ | 祖先有 transform 时失效，以该祖先为原点 |
| 最推荐的居中？ | Flex 两行 或 Grid place-items: center |
| 三栏布局中间列放前面为什么？ | 优先渲染主内容，提升首屏体验 |
