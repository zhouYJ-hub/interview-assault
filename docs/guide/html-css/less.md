# Less 详解

> Less 与 SCSS 能力高度重合，但语法更「随意」——类可以直接当混入、变量能延迟加载、循环靠递归。本章逐个讲透知识点，标注与 SCSS 的差异。

## 一、变量 `@`

### 1.1 基本用法

```less
// 用 @ 定义
@primary: #1677ff;
@spacing: 8px;
@border-radius: 4px;

.button {
  background: @primary;
  padding: @spacing * 2;        // 支持运算：8px * 2 = 16px
  border-radius: @border-radius;
  color: darken(@primary, 10%); // Less 也有颜色函数
}
```

### 1.2 延迟加载（Less 特色）

变量可以**先使用后定义**——Less 编译时会先扫描整个作用域再解析：

```less
.header {
  color: @link-color;   // 先使用
}
@link-color: blue;       // 后定义 —— 完全合法！

// SCSS 里这么写直接报错，这是两者的实际差异之一
```

### 1.3 变量的三种用途（不止当值）

```less
// 用途一：当值（最常见）
@color: red;
.a { color: @color; }

// 用途二：当选择器 / 属性名 —— 用 @{name} 插值
@name: btn;
@prop: color;

.@{name} { }        // -> .btn
.title { @{prop}: red; }  // -> color: red

// 用途三：当 URL 的一部分
@img-path: '../assets';
.logo { background: url('@{img-path}/logo.png'); }
```

## 二、嵌套与 `&`

嵌套和 `&` 的用法与 SCSS 完全一致：

```less
.nav {
  .list { }               // -> .nav .list

  .item {
    &:hover { }           // -> .nav .item:hover
    &--active { }         // -> .nav .item--active（BEM 拼接）
    &__title { }          // -> .nav .item__title
    & + & { }             // -> 相邻兄弟
  }
}
```

## 三、注释

```less
// 单行注释：编译后移除
/* 双斜杠注释：压缩时移除 */
```

## 四、混入（Mixin）—— Less 最有特色的部分

### 4.1 类即混入：任何类都能直接引用

```less
// 定义一个普通类
.flex-center {
  display: flex;
  justify-content: center;
  align-items: center;
}

// 直接引用类名 —— 声明被复制过来
.modal {
  .flex-center;      // 等价于 SCSS 的 @include
  background: #fff;
}
// 注意：产物里 .flex-center 本身也会输出（它还是个真实的类）
```

### 4.2 加括号 = 纯混入（自身不输出）

```less
// 加 () 声明它是纯 mixin，不产出自己的规则
.ellipsis(@line: 1) {
  //   ^^^^^^^^^^ 带默认参数
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.title { .ellipsis(); }   // 复用（括号可省略：.ellipsis;）
.desc  { .ellipsis(2); }  // 传参

// 产物里只有 .title 和 .desc，没有 .ellipsis 这条规则
```

**「加不加括号」是 Less 混入的关键区别**：

| | `.class { }` 不加括号 | `.class() { }` 加括号 |
| --- | --- | --- |
| 能否被引用 | ✅ | ✅ |
| 自身是否输出到产物 | ✅ 输出（还是真实类） | ❌ 不输出（纯 mixin） |
| 能否传参 | ❌ | ✅ |

### 4.3 参数混入详解

```less
.button(@bg: #ccc; @color: #333) {
  // 多个参数用分号分隔（分号在 Less 中是正式的分隔符）
  background: @bg;
  color: @color;
}

.btn-a { .button(#1677ff; #fff); }        // 按位置传参
.btn-b { .button(@color: #fff; @bg: red); } // 按名字传参，顺序随意
.btn-c { .button(); }                     // 全用默认值

// @arguments：拿到全部参数（同 JS 的 arguments）
.box-shadow(@x: 0; @y: 2px; @blur: 4px; @color: rgba(0,0,0,.1)) {
  box-shadow: @arguments;   // 原样展开所有参数
}

.card { .box-shadow(); }
// -> box-shadow: 0 2px 4px rgba(0,0,0,.1)

// !important 后缀：给所有混入属性加 important
.legacy { .flex-center !important; }
```

### 4.4 模式匹配：同名混入按参数分发（像函数重载）

```less
// 三组同名混入，按第一个参数的值分发
.theme(dark; @bg) {
  background: #333;
  color: #fff;
}
.theme(light; @bg) {
  background: #fff;
  color: #333;
}
// @ 表示匹配任意值（兜底版本）
.theme(@_; @bg) {
  padding: 16px;           // 任何模式都会带上这段
}

.header { .theme(dark; #1f1f1f); }  // 命中 dark + 兜底
.footer { .theme(light; #fafafa); } // 命中 light + 兜底
```

### 4.5 `when` 守卫：条件混入

```less
// when 后面是条件，满足才生效
.button(@type) when (@type = primary) {
  background: @primary;
  color: #fff;
}
.button(@type) when (@type = default) {
  background: #f5f5f5;
  color: #333;
}

.btn-primary { .button(primary); }
.btn-default { .button(default); }
```

**when 的组合条件**：

```less
// and：并且
.mixin(@a) when (@a > 0) and (@a < 100) { }

// 逗号：或者（默认就是 or）
.mixin(@a) when (@a < 0), (@a > 100) { }

// not：取反
.mixin(@a) when not (@a = 0) { }
```

## 五、循环：递归混入

Less 没有原生 `@for`，用「**混入调用自己 + when 控制停止**」模拟循环：

```less
// 目标：生成 .col-1 到 .col-24（24 列栅格）
.loop(@i) when (@i <= 24) {
  //  ^^^^ 条件满足才执行这一轮
  .col-@{i} {
    width: percentage(@i / 24);   // 内置函数：转百分比
  }
  .loop(@i + 1);   // 关键：调用自己，参数 +1
}
.loop(1);           // 从 1 启动

// 执行过程展开：
// loop(1)  生成 .col-1  -> loop(2)
// loop(2)  生成 .col-2  -> loop(3)
// ...
// loop(25) 条件不满足(25 > 24)，递归停止
// 产物：.col-1 { width: 4.16666667% } ~ .col-24 { width: 100% }
```

**分步打印工具类（嵌套递归）**：

```less
@spacing: 4px;

.gen(@i) when (@i <= 8) {
  .mt-@{i} { margin-top: (@i * @spacing); }
  .mb-@{i} { margin-bottom: (@i * @spacing); }
  .p-@{i}  { padding: (@i * @spacing); }
  .gen(@i + 1);
}
.gen(1);
// 一次生成 8 * 3 = 24 个工具类
```

## 六、映射（命名空间 + `[]` 取值）

```less
// 命名空间：把相关的混入/变量组织到一起
#config() {
  //  ^^ 加括号：纯命名空间，不输出到产物
  colors: {
    primary: #1677ff;
    danger: #ff4d4f;
  }
}

// 取值：[] 语法（类似 map-get）
.button { background: #config[colors][primary]; }
.alert  { background: #config[colors][danger]; }
```

命名空间里的**方法**（带括号的混入）用 `>` 调用：

```less
#utils {
  .center() {
    display: flex;
    justify-content: center;
    align-items: center;
  }
}

.modal {
  #utils > .center;    // 调用命名空间里的混入
  // 也可以写 #utils.center;
}
```

## 七、运算与颜色函数

```less
@primary: #1677ff;
@w: 100px;

// 运算（和 SCSS 一致，除法不用加括号）
.a { width: @w + 20; }       // 120px
.b { width: @w / 2; }        // 50px（Less 除法不需要括号）
.c { font-size: 14px + 2; }  // 16px

// 颜色函数
lighten(@primary, 20%)   // 变亮
darken(@primary, 20%)    // 变暗
fade(@primary, 50%)      // 50% 透明度（对应 SCSS 的 rgba）
fadein(fade(@primary, 50%), 20%)  // 提高不透明度
fadeout(@primary, 20%)   // 降低不透明度
spin(@primary, 60deg)    // 色相旋转（对应 adjust-hue）
mix(#fff, @primary)      // 混色
saturate(@primary, 20%)  // 提高饱和度
desaturate(@primary, 20%) // 降低饱和度
average(#fff, #000)      // 均值色
```

## 八、内置函数速查

```less
// 数学
ceil(4.2)        // 5
floor(4.8)       // 4
round(4.5)       // 5（四舍五入）
percentage(.5)   // 50%
sqrt(16)         // 4
pow(2, 3)        // 8
abs(-5)          // 5
min(1px, 2px)    // 1px
max(1px, 2px)    // 2px

// 字符串
replace('hello', 'l', 'L')   // 'heLLo'
e('calc(100% - 30px)')       // 转义：原样输出，避免 Less 编译 calc
~'calc(100% - 30px)'         // 转义的另一种写法

// % 格式化（类似 sprintf）
%('rgba(%d, %d, %d, %d)', 22, 160, 133, 0.5)
// -> 'rgba(22, 160, 133, 0.5)'

// 类型判断
isnumber(10px)    // true
isstring('a')     // true
iscolor(red)      // true
isunit(10px, px)  // true
```

**转义 `~''` 很实用**：`calc()` 里的表达式不想被 Less 提前计算时用它包住。

## 九、`@import` 与模块化

```less
// 基本导入（once 是默认：同一文件只导入一次）
@import 'variables.less';
@import (reference) 'mixins';  // reference：只引用不输出（只要混入不要它的样式）
@import (multiple) 'reset';    // multiple：允许导入多次
@import (inline) 'legacy.css'; // inline：原样内联进产物（老 CSS 兼容用）
```

**reference 是高频用法**——引入库文件只想用它的混入/变量，不想把整个库的样式打进产物。

## 十、实战案例

### 10.1 Element UI 主题定制（Less 最经典场景）

```less
// Element UI 用 Less 开发，主题色是变量 —— 覆盖变量重新编译即可
// 方式一：less-loader 的 modifyVars（webpack 配置）
{
  loader: 'less-loader',
  options: {
    lessOptions: {
      modifyVars: {
        'primary-color': '#1DA57A',   // 覆盖 Element 的主色变量
        'border-radius-base': '6px'
      },
      javascriptEnabled: true
    }
  }
}
// 方式二：自己建 theme.less，覆盖变量后 @import Element 源码重新编译
```

### 10.2 按钮状态系统（模式匹配 + when）

```less
@primary: #1677ff;

.btn(@type; @color) when (@type = solid) {
  background: @color;
  color: #fff;
  &:hover { background: darken(@color, 10%); }
}
.btn(@type; @color) when (@type = outline) {
  background: transparent;
  border: 1px solid @color;
  color: @color;
  &:hover { background: fade(@color, 10%); }
}

.btn-primary   { .btn(solid; @primary); }
.btn-outline   { .btn(outline; @primary); }
```

### 10.3 24 列栅格（递归循环）

```less
@columns: 24;
@gap: 16px;

.row { display: flex; flex-wrap: wrap; margin: -(@gap / 2); }

.gen(@i) when (@i <= @columns) {
  .col-@{i} {
    flex: 0 0 percentage(@i / @columns);
    padding: (@gap / 2);
  }
  .gen(@i + 1);
}
.gen(1);
// 产物：.col-1 到 .col-24，宽度 4.17% ~ 100%
```

## 十一、与 SCSS 对照表

| 对比项 | SCSS | Less |
| --- | --- | --- |
| 变量 | `$name` | `@name`（支持延迟加载） |
| 嵌套和 `&` | 相同 | 相同 |
| 混入 | `@mixin` + `@include` 显式声明 | 类名直接引用 / `.mixin()` |
| 混入自身是否输出 | mixin 本来就不输出 | 不加括号会输出，加括号不会 |
| 条件 | `@if / @else` | `when` 守卫 |
| 重载/分发 | 无（用 @if 实现） | 模式匹配（同名按参数分发） |
| 循环 | `@for / @each` 原生 | 递归混入 |
| map | map 类型 + `map-get` | 命名空间 + `[]` |
| 模块化 | `@use`（命名空间） | `@import`（reference 等） |
| 除法 | 要括号 `(10px/2)` 或 math.div | 直接 `10px/2` |
| 转义 | 无需（calc 直接用） | `~'calc(...)'` |
| 生态 | Bootstrap 5、Ant Design 5 | Element UI、老项目 |

## 十二、高频速答

| 问题 | 答案 |
| --- | --- |
| 变量符号？ | `@name` |
| 延迟加载是什么？ | 先使用后定义合法（SCSS 会报错） |
| 混入加括号的区别？ | 加括号 = 纯 mixin 不输出；不加 = 类本身也在产物里 |
| `@arguments` 是什么？ | 混入内拿到全部参数，同 JS arguments |
| 模式匹配是什么？ | 同名混入按参数值分发，像函数重载 |
| when 怎么组合条件？ | and 并且、逗号或者、not 取反 |
| 循环怎么写？ | 混入调用自己 + when 控制停止（递归） |
| reference 导入是什么？ | 只引用混入变量，不输出文件里的样式 |
| calc 被编译坏了怎么办？ | 用 `~'calc(...)'` 转义 |
| 怎么定制 Element 主题？ | less-loader modifyVars 覆盖 `@primary-color` 重新编译 |

## 十三、速记卡

```text
1. @变量可延迟加载；@{name} 拼选择器和属性名
2. 类即混入 —— 加括号纯 mixin 不输出，不加则类也在产物
3. @arguments 拿全部参数；!important 后缀全属性加权
4. 模式匹配 = 同名混入按参数分发；when = 条件守卫
5. 循环 = 递归混入 + when 停止条件
6. #ns[key] 取映射值；#ns > .mixin() 调命名空间方法
7. reference 导入只要混入不要样式；calc 用 ~'' 转义
8. 定制 Element：modifyVars 覆盖变量重新编译
```
