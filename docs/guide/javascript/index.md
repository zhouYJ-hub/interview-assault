# JS核心 + 前端八股文

前端面试出现频率最高的核心专题：语言机制 + 必背手写题。

## 考点清单

| 序号 | 主题 | 核心内容 | 频率 |
| --- | --- | --- | --- |
| 1 | [原型与原型链](./prototype) | prototype / \_\_proto\_\_ / constructor、原型链查找、手写 new 与 instanceof | ⭐⭐⭐⭐⭐ |
| 2 | [闭包与作用域](./closure-scope) | 词法作用域、作用域链、闭包原理与应用场景 | ⭐⭐⭐⭐⭐ |
| 3 | [事件循环与宏微任务](./event-loop) | Event Loop 流程、宏任务 / 微任务、输出题套路 | ⭐⭐⭐⭐⭐ |
| 4 | [this 指向](./this) | 四大绑定规则、优先级、箭头函数 | ⭐⭐⭐⭐⭐ |
| 5 | [深浅拷贝](./deep-copy) | 浅拷贝方案对比、手写深拷贝、循环引用 | ⭐⭐⭐⭐ |
| 6 | [防抖与节流](./debounce-throttle) | 手写 debounce / throttle 及变体 | ⭐⭐⭐⭐ |
| 7 | [Promise 专题](./promise) | 三态、then 规则、静态方法，手写 A+ 规范版 Promise | ⭐⭐⭐⭐⭐ |
| 8 | [async/await 专题](./async-await) | 执行机制、Generator 原理、并发控制 | ⭐⭐⭐⭐⭐ |
| 9 | [ES6+ 核心特性](./es6-features) | 解构、箭头函数、Symbol、Map/Set、Iterator/Generator、Proxy/Reflect、ESM | ⭐⭐⭐⭐ |
| 10 | [WebWorker](./web-worker) | 多线程通信、使用限制、应用场景 | ⭐⭐⭐ |

## 学习路径建议

1. **先机制后手写**：先理解原型链、作用域、事件循环的运行机制；
2. **手写必须默写**：`new`、`instanceof`、深拷贝、防抖、节流、Promise 属于「必默写」级别；
3. **输出题靠刷**：事件循环与 this 的输出题，反复练习形成条件反射；
4. **概念能一句话讲清**：每个考点先准备 30 秒版本回答，再展开细节。

## 面试官最爱追问的 10 个问题

1. `__proto__` 和 `prototype` 的区别？
2. 原型链的终点是什么？
3. 闭包是什么？举一个实际应用场景，会有什么问题？
4. `var` 循环 + `setTimeout` 输出什么？怎么改？
5. 宏任务和微任务的区别？请说明事件循环执行顺序？
6. 箭头函数和普通函数的区别？
7. `call`、`apply`、`bind` 的区别？
8. `JSON.parse(JSON.stringify(obj))` 深拷贝有什么问题？
9. 防抖和节流的区别？分别用在什么场景？
10. `Promise.all` 和 `Promise.allSettled` 的区别？
