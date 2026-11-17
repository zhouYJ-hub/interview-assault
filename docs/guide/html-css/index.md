# HTML + CSS 面试题专题

> 面试频率：⭐⭐⭐⭐（一面必考）| 20 道最高频考点，按「HTML -> 布局 -> CSS 进阶」三篇组织

## 面试回答（开口版）

如果面试官问「HTML 和 CSS 掌握得怎么样」，可以这样回答：

> HTML 层面熟悉语义化标签的选择和好处、src 与 href 的区别、defer/async 的加载时机。CSS 层面，盒模型能讲清标准和怪异模式的区别与 box-sizing；BFC 能从「独立渲染容器」的原理讲到清浮动、margin 重叠、自适应布局三个应用；布局上 Flex 和 Grid 都熟练，常用的水平垂直居中、两栏三栏布局有多种实现方案；进阶层面熟悉选择器优先级计算、伪类伪元素的区别、rem/vw 响应式适配方案，动画上知道为什么用 transform 而不是 top/left（关联重排重绘原理）。

**答题要点：** 语义化 -> 盒模型/BFC -> Flex/Grid -> 居中与多栏 -> 优先级/单位 -> 动画性能

## 20 道高频考点清单

| # | 题目 | 所在篇章 | 频率 |
| --- | --- | --- | --- |
| 1 | 语义化标签是什么？有什么用？ | [HTML 篇](./basic) | ⭐⭐⭐⭐ |
| 2 | src 和 href 的区别？defer/async？ | [HTML 篇](./basic) | ⭐⭐⭐⭐⭐ |
| 3 | 行内元素、块级元素、inline-block？ | [HTML 篇](./basic) | ⭐⭐⭐ |
| 4 | HTML5 有哪些新特性？ | [HTML 篇](./basic) | ⭐⭐⭐ |
| 5 | meta viewport 的作用？ | [HTML 篇](./basic) | ⭐⭐⭐⭐ |
| 6 | iframe 的优缺点？ | [HTML 篇](./basic) | ⭐⭐ |
| 7 | 盒模型？标准与怪异模式？box-sizing？ | [布局篇](./layout) | ⭐⭐⭐⭐⭐ |
| 8 | BFC 是什么？怎么触发？解决什么问题？ | [布局篇](./layout) | ⭐⭐⭐⭐⭐ |
| 9 | Flex 布局核心属性？ | [布局篇](./layout) | ⭐⭐⭐⭐⭐ |
| 10 | Grid 和 Flex 的区别与选型？ | [布局篇](./layout) | ⭐⭐⭐⭐ |
| 11 | position 各值的定位原点？ | [布局篇](./layout) | ⭐⭐⭐⭐⭐ |
| 12 | 水平垂直居中几种方案？ | [布局篇](./layout) | ⭐⭐⭐⭐⭐ |
| 13 | 两栏 / 三栏布局怎么写？ | [布局篇](./layout) | ⭐⭐⭐⭐ |
| 14 | 选择器优先级怎么计算？ | [CSS 进阶篇](./advanced) | ⭐⭐⭐⭐⭐ |
| 15 | 伪类和伪元素的区别？ | [CSS 进阶篇](./advanced) | ⭐⭐⭐⭐ |
| 16 | px / em / rem / vw / vh 区别？ | [CSS 进阶篇](./advanced) | ⭐⭐⭐⭐⭐ |
| 17 | 响应式布局有哪些方案？ | [CSS 进阶篇](./advanced) | ⭐⭐⭐⭐ |
| 18 | 隐藏元素的几种方式及区别？ | [CSS 进阶篇](./advanced) | ⭐⭐⭐⭐ |
| 19 | transition 和 animation 区别？ | [CSS 进阶篇](./advanced) | ⭐⭐⭐⭐ |
| 20 | CSS 变量、:has、容器查询等新特性？ | [CSS 进阶篇](./advanced) | ⭐⭐⭐ |
| 21 | Sass/SCSS 知识点与用法？ | [Sass 详解](./sass) | ⭐⭐⭐ |
| 22 | Less 知识点与用法？ | [Less 详解](./less) | ⭐⭐⭐ |
| 23 | 移动端适配怎么做？ | [移动端适配](./mobile) | ⭐⭐⭐⭐ |

## 学习路径建议

1. **HTML 篇是送分题**：语义化、src/href、defer/async 必须秒答；
2. **布局篇是核心战场**：盒模型、BFC、Flex、定位、居中——每题都要能「讲原理 + 写代码」；
3. **进阶篇区分深度**：优先级计算、单位换算、动画性能关联重排重绘。

## 速记卡

```text
1. 语义化 = 可读性 + SEO + 无障碍
2. 盒模型：content-box 不含 padding，border-box 含
3. BFC 独立容器：清浮动 / 隔 margin / 防文字环绕
4. Flex 一维 Grid 二维；主轴 justify，交叉轴 align
5. 居中三件套：flex / grid / absolute + transform
6. 优先级：!important > 内联 > id > class > 标签
7. 动画只用 transform/opacity（只合成，不重排）
```
