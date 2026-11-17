# Sass（SCSS）详解

> 预处理器 = CSS 超集 + 编程能力，构建时编译回普通 CSS。本章逐个讲透 SCSS 的知识点，每个都配注释和案例。

## 一、变量 `$`

### 1.1 基本用法

```scss
// 用 $ 定义，能存颜色、数字、字符串、布尔等
$primary: #1677ff;     // 颜色
$spacing: 8px;         // 数值（数字 + 单位）
$font-stack: 'PingFang SC', sans-serif; // 字符串列表

.button {
  background: $primary;
  padding: $spacing * 2;           // 支持运算：8px * 2 = 16px
  font-family: $font-stack;
  color: darken($primary, 10%);    // 内置颜色函数：加深 10%
}
```

### 1.2 作用域与两个重要标记

```scss
$size: 12px;            // 全局变量

.component {
  $size: 14px;          // 局部变量，只在 .component 内生效
  font-size: $size;     // 14px
}

.other {
  font-size: $size;     // 12px，外部不受影响
}

// !global：在局部创建/修改全局变量（少用）
.wrap {
  $theme: dark !global;
}

// !default：默认值 —— 只有当变量「还没被赋值」时才生效
// 典型用途：库开发者给默认配置，使用者可提前覆盖
$radius: 8px;           // 使用者先赋值
$radius: 4px !default;  // 已有值，默认值不生效 -> 最终 8px
```

### 1.3 数据类型

```scss
$number:  16px;         // 数字（可带单位）
$string:  'hello';      // 字符串（引号可选）
$color:   rgba(0, 0, 0, .5); // 颜色
$bool:    true;         // 布尔
$null:    null;         // 空（参与计算时按空处理）
$list:    1px 2px 3px;  // 列表（空格或逗号分隔）
$map: (                 // 键值对映射
  primary: #1677ff,
  danger: #ff4d4f
);
```

## 二、嵌套与 `&`

### 2.1 基本嵌套

```scss
.nav {                  // -> .nav
  .list {               // -> .nav .list
    .item { }           // -> .nav .list .item
  }
}
```

### 2.2 `&` 的五种用法

`&` 代表「父选择器的完整字符串」，不只是配伪类：

```scss
.item {
  &:hover { }           // -> .item:hover（伪类）
  &--active { }         // -> .item--active（拼接 BEM 修改类）
  &__title { }          // -> .item__title（BEM 子元素）
  & + & { }             // -> .item + .item（相邻兄弟）
  &.disabled { }        // -> .item.disabled（同元素多类）
}

.sidebar .item { }      // & 放外面还可以反向提升：
.item {
  .sidebar & { }        // -> .sidebar .item
}
```

### 2.3 属性嵌套（少用但要知道）

```scss
// 同名属性可以嵌套简写（font、margin 等）
.title {
  font: {
    family: sans-serif;   // -> font-family
    size: 16px;           // -> font-size
    weight: bold;         // -> font-weight
  }
}
```

### 2.4 嵌套的度

```scss
// 建议：不超过 3 层 —— 太深说明选择器权重高、产物冗长
.a { .b { .c { } } }     // 3 层 OK
.a { .b { .c { .d { } } } } // 4 层，考虑重构
```

## 三、注释

```scss
// 单行注释：编译后不存在（只给开发者看）
.title { color: red; }

/* 多行注释：压缩模式会被去掉，普通模式保留 */
.body { color: blue; }

/*! 强制保留注释：即使压缩也保留，常用于版权声明 */
```

## 四、插值 `#{}`

变量默认只能用在「值」的位置；要拼进**选择器、属性名、媒体查询**必须用 `#{}`：

```scss
$name: 'btn';
$side: 'top';

.#{$name} { }              // -> .btn（拼选择器）
.margin-#{$side} { }       // -> .margin-top

@mixin size($prop, $val) {
  #{$prop}: $val;          // 拼属性名
}
@include size(padding, 10px);  // -> padding: 10px

@media (max-width: #{$bp}) { } // 拼媒体查询条件

// 值的位置也可以用，但一般直接写变量
.item { width: #{$spacing}; } // 等价 width: $spacing
```

## 五、运算

```scss
$w: 100px;

.a { width: $w + 20; }        // 120px（同单位相加）
.b { width: $w * 2; }         // 200px（乘数字）
.c { width: ($w / 2); }       // 50px —— 除法要加括号！
.d { width: percentage(0.5); } // 50%（内置函数转百分比）

// 除法的经典坑：
.e { font: 10px / 1.5 sans-serif; }
// 这里 / 被解析为 font 简写的行高分隔符，不是除法！
// 想做除法：font-size: (10px / 2) 或用 math.div(10px, 2)
```

## 六、混入 `@mixin` / `@include`

### 6.1 基本用法与参数

```scss
// 定义：可带参数和默认值
@mixin button($bg: #ccc, $color: #333) {
  background: $bg;
  color: $color;
  border: none;
  cursor: pointer;
}

// 按位置传参
.btn-a { @include button(#1677ff, #fff); }

// 按名字传参（推荐，顺序随意）
.btn-b { @include button($color: #fff, $bg: red); }

// 用默认值
.btn-c { @include button; }
```

### 6.2 可变参数 `$args...`

```scss
// 接收任意多个参数（转发给 box-shadow 等）
@mixin shadow($shadows...) {
  box-shadow: $shadows;   // 原样展开
}

.card {
  @include shadow(0 2px 4px rgba(0,0,0,.1), 0 4px 8px rgba(0,0,0,.2));
  // -> box-shadow: 0 2px 4px ..., 0 4px 8px ...
}
```

### 6.3 `@content`：接收样式块

```scss
// 响应式断点的标准封装
@mixin respond($bp) {
  @if $bp == mobile {
    @media (max-width: 768px) { @content; }
  } @else if $bp == pad {
    @media (max-width: 992px) { @content; }
  } @else if $bp == desktop {
    @media (min-width: 1200px) { @content; }
  }
}

.sidebar {
  width: 300px;
  @include respond(mobile) {
    display: none;     // 这段样式通过 @content 进入 media query
  }
}
```

## 七、继承 `@extend` 与占位符 `%`

### 7.1 占位符：定义不输出

```scss
// % 开头：本身不编译进产物，被继承时才出现
%flex-center {
  display: flex;
  justify-content: center;
  align-items: center;
}

.modal  { @extend %flex-center; }
.avatar { @extend %flex-center; }
```

编译产物（**选择器合并成一条**，比 mixin 复制更省）：

```css
.modal, .avatar {
  display: flex;
  justify-content: center;
  align-items: center;
}
```

### 7.2 mixin vs extend 怎么选

| | @mixin | @extend |
| --- | --- | --- |
| 产物 | 每个 include 复制一份声明 | 选择器合并成一条 |
| 传参 / @content | ✅ | ❌ |
| 选择 | 需要参数、需要 @content | 纯样式共享、在意产物体积 |

**注意**：`@extend` 不能跨 `@media` 边界继承外部选择器；大范围 extend 可能造成「选择器爆炸」（几十个选择器被合并到一起）。

## 八、条件与循环

### 8.1 `@if / @else if / @else`

```scss
@mixin ellipsis($line) {
  overflow: hidden;
  @if $line == 1 {
    // 单行：white-space 方案
    white-space: nowrap;
    text-overflow: ellipsis;
  } @else {
    // 多行：-webkit-line-clamp 方案
    display: -webkit-box;
    -webkit-line-clamp: $line;
    -webkit-box-orient: vertical;
  }
}
```

### 8.2 `@for`：数字循环

```scss
// through 包含终点（1,2,3,4,5）；to 不包含（1,2,3,4）
@for $i from 1 through 5 {
  .mt-#{$i} { margin-top: $i * 4px; }
  .px-#{$i} { padding-left: $i * 4px; padding-right: $i * 4px; }
}
// 产物：.mt-1 ~ .mt-5、.px-1 ~ .px-5 —— Tailwind 工具类的原理
```

### 8.3 `@each`：遍历列表和 map

```scss
// 遍历列表
@each $animal in dog, cat, fish {
  .icon-#{$animal} { background: url('img/#{$animal}.png'); }
}

// 遍历 map（解构出键值）—— 主题系统的标准写法
$themes: (
  primary: #1677ff,
  success: #52c41a,
  danger:  #ff4d4f
);

@each $name, $color in $themes {
  .btn-#{$name} {
    background: $color;
    &:hover { background: darken($color, 10%); }
  }
}
// 一行循环生成 3 组按钮 + hover 态，手写要 6 条规则
```

### 8.4 `@while`

```scss
$i: 6;
@while $i > 0 {
  .z-#{$i} { z-index: $i * 10; }
  $i: $i - 1;   // 必须手动递减，否则死循环
}
```

## 九、内置函数速查

### 9.1 颜色函数（最常用）

```scss
$primary: #1677ff;

lighten($primary, 20%)   // 变亮 20%
darken($primary, 20%)    // 变暗 20%
mix(#fff, $primary, 30%) // 30% 白 + 70% 主色 混合
rgba($primary, .5)       // 加透明度
opacify(rgba($p,.5), .3) // 提高不透明度 -> .8
transparentize($p, .3)   // 降低不透明度
grayscale($p)            // 变灰
adjust-hue($p, 60deg)    // 色相旋转 60 度
```

### 9.2 数字 / 字符串 / 列表 / map

```scss
// 数字
percentage(.5)  // 50%
round(4.6)      // 5
ceil(4.1)       // 5
floor(4.9)      // 4
abs(-5)         // 5
min(1px, 2px)   // 1px
max(1px, 2px)   // 2px
random(10)      // 1~10 随机数

// 字符串
to-upper-case('abc')   // 'ABC'
str-length('hello')    // 5
str-index('hello', 'l') // 3（首次出现位置）
quote(hello)           // 'hello'

// 列表
$list: 10px 20px 30px;
length($list)   // 3
nth($list, 2)   // 20px（下标从 1 开始！）
index($list, 30px) // 3
join(1px 2px, 3px) // 1px 2px 3px（合并）
append($list, 40px) // 10px 20px 30px 40px

// map
$map: (a: 1, b: 2);
map-get($map, a)      // 1
map-has-key($map, c)  // false
map-keys($map)        // a, b
map-values($map)      // 1, 2
map-merge($map, (c: 3)) // 合并
map-remove($map, a)   // 删除键
```

## 十、模块化 `@use`

```scss
// _variables.scss —— 下划线开头 = partial（不单独编译输出）
$primary: #1677ff;

// main.scss
@use 'variables';            // 默认以文件名为命名空间
@use 'mixins' as m;          // as 自定义命名空间
@use 'helpers' as *;         // as * 不用前缀（又变全局，慎用）

.button {
  color: variables.$primary; // 命名空间访问，来源清晰
  @include m.ellipsis(2);
}
```

**为什么取代 `@import`**：

| 问题 | @import | @use |
| --- | --- | --- |
| 命名空间 | 无（变量全混在一起易冲突） | ✅ 有 |
| 重复加载 | import 多次编译多次 | ✅ 只加载一次 |
| 私有成员 | 全部可见 | ✅ `$-` 开头的变量不导出 |

## 十一、实战案例

### 11.1 主题系统（map + @each + CSS 变量导出）

```scss
$themes: (
  primary: #1677ff,
  success: #52c41a,
  danger:  #ff4d4f
);

// 1. 生成按钮类
@each $name, $color in $themes {
  .btn-#{$name} {
    background: $color;
    &:hover { background: darken($color, 10%); }
    &:active { background: darken($color, 20%); }
  }
}

// 2. 同时导出为 CSS 变量（供运行时 JS 修改，做动态换肤）
:root {
  @each $name, $color in $themes {
    --color-#{$name}: #{$color};
  }
}
// 产物：:root { --color-primary: #1677ff; ... }
```

### 11.2 响应式断点管理（map + mixin + @content）

```scss
$breakpoints: (
  sm: 768px,
  md: 992px,
  lg: 1200px
);

@mixin bp($name) {
  @media (max-width: map-get($breakpoints, $name)) {
    @content;
  }
}

.sidebar {
  display: block;
  @include bp(sm) { display: none; }  // 平板以下隐藏
}
```

### 11.3 BEM 组件结构

```scss
.card {
  &__title { font-size: 16px; }        // .card__title
  &__body { padding: 12px; }           // .card__body

  &--highlight {                       // .card--highlight
    border-color: $primary;

    .card__title { color: $primary; }  // 修改类下的子元素
  }

  &--disabled { opacity: .5; }
}
```

## 十二、高频速答

| 问题 | 答案 |
| --- | --- |
| 变量符号？ | `$name` |
| `&` 是什么？ | 父选择器的字符串占位，可拼 BEM、伪类、兄弟 |
| mixin 和 extend 区别？ | mixin 复制声明可传参；extend 合并选择器更省 |
| `@content` 干嘛的？ | 接收 include 时传入的样式块（响应式封装用） |
| through 和 to？ | through 含终点，to 不含 |
| `#{}` 什么时候用？ | 变量要进选择器、属性名、媒体查询时 |
| @use 为什么取代 @import？ | 命名空间、单次加载、支持私有 |
| !default 干嘛的？ | 库给默认值，用户先赋值则不覆盖 |
| 想运行时换肤怎么办？ | SCSS 变量编译期定死；导出成 CSS 变量 |

## 十三、速记卡

```text
1. $变量有作用域；!default 库默认值；!global 强制全局
2. & = 父选择器字符串：&:hover / &--mod / & + &
3. #{} 把变量拼进选择器和属性名
4. mixin 可传参可 @content；extend 合并选择器
5. @each + map 生成主题；@for 生成工具类
6. @use 带命名空间，取代 @import
7. 换肤要 CSS 变量 —— SCSS 变量编译期就定死了
```
