# Vue 全家桶专题概览

> 面试频率：⭐⭐⭐⭐⭐（Vue 技术栈必考）| 30 道核心题，按「Vue3 核心 -> Router -> 状态管理」三篇组织

## 面试回答示范（总-分结构）

> **总起**：Vue 技术栈我按核心、路由、状态三层讲掌握情况。
>
> **第一，核心层面。** 熟悉 Vue3 的 Composition API——ref 和 reactive 的区别及选型、computed 和 watch 的原理级差异、组件间各种通信方式的适用场景；响应式能讲清 Proxy 相比 defineProperty 解决了什么；diff 算法能讲清静态提升、patchFlag 和最长递归子序列的优化思路。
>
> **第二，路由层面。** 掌握 hash 和 history 两种模式的实现原理与 Nginx 配置差异、完整的导航守卫执行流程、动态路由和路由懒加载的最佳实践。
>
> **第三，状态管理。** 新项目用 Pinia——能讲清它相比 Vuex 去掉 mutation 的设计理由、setup 风格的用法和持久化方案；老项目的 Vuex 能讲清核心流程和 mutation 与 action 的区别。

## 30 道核心题清单

| # | 题目 | 所在篇章 | 频率 |
| --- | --- | --- | --- |
| 1 | Vue3 和 Vue2 的核心区别？ | [Vue3 核心](./core) | ⭐⭐⭐⭐⭐ |
| 2 | 响应式原理：Proxy vs defineProperty？ | [Vue3 核心](./core) | ⭐⭐⭐⭐⭐ |
| 3 | ref 和 reactive 的区别？ | [Vue3 核心](./core) | ⭐⭐⭐⭐⭐ |
| 4 | toRef / toRefs 是干嘛的？ | [Vue3 核心](./core) | ⭐⭐⭐⭐ |
| 5 | computed 和 watch 的区别？ | [Vue3 核心](./core) | ⭐⭐⭐⭐⭐ |
| 6 | watchEffect 和 watch 的区别？ | [Vue3 核心](./core) | ⭐⭐⭐⭐ |
| 7 | Vue3 生命周期（对比 Vue2）？ | [Vue3 核心](./core) | ⭐⭐⭐⭐⭐ |
| 8 | setup 的执行时机和特性？ | [Vue3 核心](./core) | ⭐⭐⭐ |
| 9 | 组件通信有哪些方式？ | [Vue3 核心](./core) | ⭐⭐⭐⭐⭐ |
| 10 | props / emit 怎么用（含类型）？ | [Vue3 核心](./core) | ⭐⭐⭐⭐ |
| 11 | provide / inject 原理与场景？ | [Vue3 核心](./core) | ⭐⭐⭐⭐ |
| 12 | v-if 和 v-show 的区别？ | [Vue3 核心](./core) | ⭐⭐⭐⭐ |
| 13 | v-for 为什么要加 key？diff 原理？ | [Vue3 核心](./core) | ⭐⭐⭐⭐⭐ |
| 14 | nextTick 的原理和使用场景？ | [Vue3 核心](./core) | ⭐⭐⭐⭐ |
| 15 | 自定义指令怎么写？ | [Vue3 核心](./core) | ⭐⭐⭐ |
| 16 | hash 和 history 路由的区别？ | [Router](./router) | ⭐⭐⭐⭐⭐ |
| 17 | 完整的导航守卫执行流程？ | [Router](./router) | ⭐⭐⭐⭐⭐ |
| 18 | 三类路由守卫分别怎么用？ | [Router](./router) | ⭐⭐⭐⭐ |
| 19 | 路由传参：params vs query？ | [Router](./router) | ⭐⭐⭐⭐ |
| 20 | 路由懒加载怎么做？ | [Router](./router) | ⭐⭐⭐⭐ |
| 21 | 动态路由和 addRoute？ | [Router](./router) | ⭐⭐⭐ |
| 22 | keep-alive 路由缓存？ | [Router](./router) | ⭐⭐⭐⭐ |
| 23 | 路由 404 和匹配规则？ | [Router](./router) | ⭐⭐ |
| 24 | 为什么需要状态管理？ | [状态管理](./state) | ⭐⭐⭐ |
| 25 | Pinia 和 Vuex 的区别？ | [状态管理](./state) | ⭐⭐⭐⭐⭐ |
| 26 | Pinia 核心概念和用法？ | [状态管理](./state) | ⭐⭐⭐⭐⭐ |
| 27 | Pinia 在 setup 中怎么用？ | [状态管理](./state) | ⭐⭐⭐⭐ |
| 28 | Pinia 持久化怎么做？ | [状态管理](./state) | ⭐⭐⭐⭐ |
| 29 | Vuex 核心流程？mutation vs action？ | [状态管理](./state) | ⭐⭐⭐⭐ |
| 30 | 什么状态该放全局 store？ | [状态管理](./state) | ⭐⭐⭐ |

## 速记卡

```text
1. Vue3 三大升级：Composition API + Proxy 响应式 + 编译优化
2. ref 包装基本类型（.value），reactive 包对象；丢失响应用 toRefs
3. computed 有缓存；watch 可惰性；watchEffect 立即执行自动收集
4. 通信：props/emit 父子、provide/inject 跨级、v-model 双向
5. key 是 diff 的身份证——复用靠它，用 index 当 key 是隐患
6. hash 带 # 不用配置服务器；history 要 Nginx try_files 兜底
7. 守卫顺序：beforeRouteLeave -> beforeEach -> ... -> afterEach
8. Pinia 天然支持 TS、去 mutation、组合式写法；新项目首选
```
