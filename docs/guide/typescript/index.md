# TypeScript 面试题专题

> 面试频率：⭐⭐⭐⭐⭐（中高级前端必考）| 20 道最高频 TS 题，按「基础 -> 进阶 -> 泛型工具」三篇组织

## 面试回答（开口版）

如果面试官问「你 TypeScript 熟吗」，可以这样回答：

> 比较熟。基础层面能分清 any、unknown、never 的区别，知道 interface 和 type 各自的适用场景；进阶层面熟悉类型收窄（typeof、instanceof、判别联合、自定义守卫），会字面量类型配合 as const 模拟枚举，理解映射类型和条件类型加 infer 的推导；泛型层面掌握泛型约束、keyof/typeof 的组合使用，常用内置工具类型都手写过，比如用映射类型加索引签名实现 MyPartial，用条件类型加 infer 实现 MyReturnType。项目配置上一直开 strict 模式，理解 noImplicitAny 和 strictNullChecks 各自拦住什么问题。

**答题要点：** 基础三兄弟 -> interface/type 选型 -> 收窄手段 -> 映射/条件/infer -> 工具类型手写 -> strict 模式

## 20 道高频题清单

| # | 题目 | 所在篇章 | 频率 |
| --- | --- | --- | --- |
| 1 | 为什么用 TypeScript？ | [基础篇](./basic) | ⭐⭐⭐ |
| 2 | any / unknown / never 的区别？ | [基础篇](./basic) | ⭐⭐⭐⭐⭐ |
| 3 | interface 和 type 的区别？ | [基础篇](./basic) | ⭐⭐⭐⭐⭐ |
| 4 | 类型断言（as / 双断言 / satisfies）？ | [基础篇](./basic) | ⭐⭐⭐⭐ |
| 5 | 联合类型和交叉类型的区别？ | [基础篇](./basic) | ⭐⭐⭐⭐ |
| 6 | enum 枚举？const enum 呢？ | [基础篇](./basic) | ⭐⭐⭐ |
| 7 | 函数类型怎么定义？重载呢？ | [基础篇](./basic) | ⭐⭐⭐ |
| 8 | 什么是类型收窄？有哪些手段？ | [进阶篇](./advanced) | ⭐⭐⭐⭐⭐ |
| 9 | 字面量类型和 as const？ | [进阶篇](./advanced) | ⭐⭐⭐⭐ |
| 10 | 可选属性、只读属性、索引签名？ | [进阶篇](./advanced) | ⭐⭐⭐ |
| 11 | 什么是映射类型？ | [进阶篇](./advanced) | ⭐⭐⭐⭐ |
| 12 | 条件类型？infer 关键字？ | [进阶篇](./advanced) | ⭐⭐⭐⭐⭐ |
| 13 | keyof / typeof / in 的作用？ | [进阶篇](./advanced) | ⭐⭐⭐⭐⭐ |
| 14 | TS 的类型兼容规则（结构化类型）？ | [进阶篇](./advanced) | ⭐⭐⭐ |
| 15 | 泛型是什么？怎么写？ | [工具篇](./utility) | ⭐⭐⭐⭐ |
| 16 | 泛型约束怎么用？ | [工具篇](./utility) | ⭐⭐⭐⭐ |
| 17 | 常用内置工具类型？ | [工具篇](./utility) | ⭐⭐⭐⭐⭐ |
| 18 | 手写工具类型？ | [工具篇](./utility) | ⭐⭐⭐⭐⭐ |
| 19 | declare 和 .d.ts 文件？ | [工具篇](./utility) | ⭐⭐⭐ |
| 20 | tsconfig 核心配置？strict 模式？ | [工具篇](./utility) | ⭐⭐⭐ |

## 学习路径建议

1. **先基础后推导**：any/unknown/never、interface/type 这些「名词题」必须秒答；
2. **收窄是实战核心**：业务代码里 80% 的 TS 报错都靠收窄解决；
3. **工具类型手写是分水岭**：能手写 MyPartial / MyReturnType，说明真的理解映射类型和 infer。

## 速记卡

```text
1. any 放弃检查 / unknown 收窄后才能用 / never 永不出现
2. 对象用 interface，联合交叉用 type
3. 收窄四板斧：typeof / instanceof / in / 判别联合
4. keyof 拿键联合，typeof 拿值的类型
5. 映射类型遍历键，条件类型做判断，infer 提取类型
6. 工具类型 = 映射 + keyof + 条件 + infer 的组合
```
