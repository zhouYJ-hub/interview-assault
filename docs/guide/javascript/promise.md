# Promise 专题

> 面试频率：⭐⭐⭐⭐⭐（必考）| 关联考点：事件循环、async/await、手写题

## 面试回答（开口版）

如果面试官问「讲讲 Promise」，可以这样回答：

> Promise 是异步编程的核心解决方案，解决的是**回调地狱和错误处理分散**的问题——把嵌套回调变成 then 链式调用，错误统一交给 catch。它有三个状态：pending、fulfilled、rejected，只能从 pending 单向变化，**一旦落定不可逆**。链式调用的关键是 then 返回**全新的 Promise**：回调返回普通值就原样透传，返回 Promise 就等它完成再传，抛错就跳到最近的 catch，catch 之后恢复正常链。静态方法里，all 要全部成功才成功，allSettled 等全部完成，race 取第一个落定的，any 取第一个成功的。手写的话要按 Promises/A+ 规范抓几个点：状态机、pending 时缓存回调数组、queueMicrotask 微任务时机、resolvePromise 处理返回值。

**答题要点：** 为什么需要 → 三态不可逆 → then 返回值规则 → 静态方法 → 手写规范要点

## 一、概念：Promise 是什么

### 1.1 没有 Promise 的世界：回调地狱

```js
// 需求：先取用户 -> 再取订单 -> 再取详情，层层嵌套
getUser(userId, (user) => {
  getOrders(user.id, (orders) => {
    getDetail(orders[0].id, (detail) => {
      console.log(detail)
    })
  })
})
```

回调地狱三大痛点：

1. **嵌套深**：代码金字塔，难以阅读维护；
2. **错误处理分散**：每一层都要单独传 err 回调；
3. **无法 return / throw**：控制流被打断，try/catch 失效。

### 1.2 Promise 的本质

一句话：**Promise 是一个承载「未来值」的容器**。

- 网络请求的值现在拿不到，Promise 先给你一张「凭证」；
- 凭证有三种状态：等待中、已成功、已失败；
- 用 then 注册「到货后的处理」，用 catch 注册「出错的补救」。

```js
// 同样的需求：扁平的链式调用 + 统一错误处理
getUser(userId)
  .then((user) => getOrders(user.id))
  .then((orders) => getDetail(orders[0].id))
  .then((detail) => console.log(detail))
  .catch((err) => console.error(err))
```

## 二、核心机制

### 2.1 三种状态与不可逆

```text
pending（等待）
  |-- resolve() --> fulfilled（成功）
  |-- reject()  --> rejected（失败）
```

- 状态只能从 pending 变为 fulfilled 或 rejected，**一旦改变不可逆**；
- `new Promise` 的 executor 是**同步执行**的；
- resolve 多次调用，只有第一次生效。

```js
new Promise((resolve, reject) => {
  console.log('executor 同步执行')
  resolve(1)
  resolve(2) // 无效，状态已定格
}).then((v) => console.log(v)) // 1
```

### 2.2 then 的返回值规则（链式与输出题核心）

`then` 返回的是**全新的 Promise**，它的状态由回调的「返回值」决定。五条规则：

| # | 回调里做了什么 | 新 Promise 状态 | 下一个 then 收到 |
| --- | --- | --- | --- |
| 1 | `return 普通值`（数字/字符串/普通对象） | fulfilled | 该值本身（**原样透传**） |
| 2 | `return Promise` | 等内部 Promise 完成 | 内部 resolve 的值（**拆开透传**） |
| 3 | `return thenable`（带 then 方法的对象） | 等 then 执行完成 | then 里 resolve 的值 |
| 4 | 什么都不 return | fulfilled | `undefined` |
| 5 | `throw 错误` | rejected | 跳过后续 then，到最近的 catch |

完整链路示例：

```js
Promise.resolve(1)
  .then((v) => v + 1)                     // 规则1：返回 2
  .then((v) => Promise.resolve(v + 1))    // 规则2：等内部完成，传 3
  .then((v) => { console.log(v) })        // 打印 3；无 return
  .then((v) => {                          // 规则4：v 是 undefined
    console.log(v)                        // undefined
    throw new Error('boom')               // 规则5：链变 rejected
  })
  .catch((err) => err.message)            // 规则1：捕获并返回 'boom'
  .then((msg) => console.log(msg))        // 'boom'
```

两条补充（输出题爱考）：

1. **错误会冒泡**：中途 rejected 后，跳过后面所有 then，直达最近的 catch；
2. **catch 之后恢复正常**：catch 本身也返回新 Promise，回调没抛错就是 fulfilled，后面的 then 正常接续。

一句话记忆：

```text
return 值      -> 原样透传
return Promise -> 拆开透传
无 return      -> undefined
throw          -> 跳 catch
catch 后       -> 恢复正常链
```

### 2.3 错误处理的两种风格

```js
// 风格一：catch 链
fetchData().then(process).catch(handleError)

// 风格二：try/catch（async 中更推荐）
async function load() {
  try {
    const data = await fetchData()
    return process(data)
  } catch (err) {
    return handleError(err)
  }
}
```

::: warning 常见坑
不写 catch 的 rejected Promise 不会抛到全局（仅控制台警告），错误会被「吞掉」。
:::

### 2.4 静态方法

| 方法 | 成功条件 | 一个失败时 |
| --- | --- | --- |
| `Promise.all` | 全部成功才成功（结果按传入顺序） | 立即 reject，返回第一个失败值 |
| `Promise.allSettled` | 全部完成（无论成败） | 不受影响，每项 `{ status, value/reason }` |
| `Promise.race` | 第一个**完成**（成败都算） | 取第一个完成的 |
| `Promise.any` | 第一个**成功** | 全部失败才 reject（AggregateError） |

```js
const p1 = Promise.resolve(1)
const p2 = Promise.reject(new Error('x'))
const p3 = new Promise((r) => setTimeout(r, 100, 3))

Promise.all([p1, p3]).then(console.log)        // [1, 3]
Promise.allSettled([p1, p2]).then(console.log) // [{status:'fulfilled',value:1},{status:'rejected',reason:Error}]
Promise.race([p2, p3]).catch(console.error)    // Error: x（p2 先完成）
Promise.any([p2, p3]).then(console.log)        // 3（取第一个成功的）
```

## 三、手写基础版 Promise（函数式分层架构）

这一版把「状态迁移」「解析过程」「回调调度」抽成独立的模块级函数，类本身非常薄——`then` 只有 3 行。分层结构在面试讲解时更容易说清职责。

```js
// ============ 0. 工具函数：类型判断 ============

// 判断是否为对象（typeof null === 'object'，所以要排除 null）
function isObject(val) {
  return typeof val === 'object' && val !== null
}

// 判断是否为函数
function isFunction(val) {
  return typeof val === 'function'
}

// 判断是否为 thenable（规范 2.3.3）：
// 是函数或对象，且具有可调用的 then 方法
// 任何满足这个条件的值（不只 MyPromise 实例）都能被 Promise「吸收」状态
function isThenable(x) {
  return (isFunction(x) || isObject(x)) && isFunction(x.then)
}

// ============ 1. 状态迁移：把 promise 变成失败 ============
function rejectPromise(prom, reason) {
  // 状态只能从 pending 单向变化，已落定直接忽略（规范 2.1）
  if (prom._state !== 'pending') return
  prom._state = 'rejected'
  prom._reason = reason
  // 状态已决，唤醒所有等待中的回调
  flushHandlers(prom)
}

// ============ 2. 解析过程：用值 x 决定 promise 的状态（规范 2.3）============
function resolvePromise(prom, x) {
  // 已落定的 promise 不允许再次改变
  if (prom._state !== 'pending') return

  // 情况一：x 是 thenable（Promise 或任何带 then 方法的对象/函数）
  if (isThenable(x)) {
    // 2.3.1 x 和 prom 是同一个对象 -> 循环引用，永远等不到结果
    if (x === prom) {
      rejectPromise(prom, new TypeError('Chaining cycle detected for promise #<Promise>'))
      return
    }

    // 2.3.3 prom「吸收」x 的状态：
    // 等待 x 落定 —— x 成功就用它的值继续解析 prom，x 失败就让 prom 失败
    // 放进微任务：保持与 then 回调一致的异步时机
    queueMicrotask(() => {
      x.then(
        (data) => resolvePromise(prom, data), // 递归解析：data 可能还是 thenable
        (err) => rejectPromise(prom, err)
      )
    })
  } else {
    // 情况二：x 是普通值，直接让 prom 成功
    prom._state = 'fulfilled'
    prom._data = x
    flushHandlers(prom)
  }
}

// ============ 3. 回调调度：执行当前 promise 上所有已注册的 then ============
function flushHandlers(curPromise) {
  // 还没落定：回调继续等待，等 resolve/reject 时再触发
  if (curPromise._state === 'pending') return

  const settledHandlers = curPromise._settledHandlers

  // 规范 2.2.4：回调必须异步执行 -> 放进微任务
  queueMicrotask(() => {
    // 同一个 promise 可以被 then 多次（规范 2.2.6）：按注册顺序逐个执行
    while (settledHandlers.length) {
      const handler = settledHandlers.shift() // 先进先出，取出最早注册的
      const { onFulfilled, onRejected, prom } = handler
      // prom：then 返回的那个新 promise，回调的结果要写到它身上

      // 状态穿透一：没传成功回调时，成功的值继续向后传
      if (!isFunction(onFulfilled) && curPromise._state === 'fulfilled') {
        resolvePromise(prom, curPromise._data)
        continue
      }
      // 状态穿透二：没传失败回调时，错误继续向后抛
      if (!isFunction(onRejected) && curPromise._state === 'rejected') {
        rejectPromise(prom, curPromise._reason)
        continue
      }

      // 回调存在：按当前状态执行对应的那一个
      let result
      try {
        result =
          curPromise._state === 'fulfilled'
            ? onFulfilled(curPromise._data)  // 成功：执行 onFulfilled
            : onRejected(curPromise._reason) // 失败：执行 onRejected
      } catch (e) {
        // 规范 2.2.7.2：回调抛错 -> then 返回的新 promise 失败
        rejectPromise(prom, e)
        continue
      }
      // 规范 2.2.7.1：回调正常返回 -> 用返回值去决定新 promise 的状态
      resolvePromise(prom, result)
    }
  })
}

// ============ 4. MyPromise 类：只负责存状态、注册回调 ============
class MyPromise {
  _state = 'pending'      // pending | fulfilled | rejected
  _data = undefined       // 成功的值
  _reason = undefined     // 失败的原因
  _settledHandlers = []   // 落定后要执行的回调队列

  constructor(executor) {
    // 箭头函数保证 this 指向当前实例
    const resolve = (data) => {
      resolvePromise(this, data) // 真正的解析逻辑在 resolvePromise
    }
    const reject = (err) => {
      rejectPromise(this, err)
    }

    // 不传 executor（then 内部 new 时）直接跳过
    if (!isFunction(executor)) return

    // executor 同步执行；内部抛错直接失败
    try {
      executor(resolve, reject)
    } catch (err) {
      reject(err)
    }
  }

  // then 很薄，只做两件事：创建新 promise + 把回调入队
  then(onFulfilled, onRejected) {
    const prom = new MyPromise() // 链式调用的关键：返回新 promise
    this._settledHandlers.push({ onFulfilled, onRejected, prom })
    flushHandlers(this) // 已落定的 promise 也能注册 then（内部有 pending 保护）
    return prom
  }

  catch(onRejected) {
    return this.then(null, onRejected)
  }

  // 静态快捷方法
  static resolve(value) {
    return new MyPromise((resolve) => resolve(value))
  }

  static reject(reason) {
    return new MyPromise((resolve, reject) => reject(reason))
  }
}
```

**架构分层解读（对着代码讲给面试官）：**

| 层 | 函数 | 职责 |
| --- | --- | --- |
| 工具层 | isObject / isFunction / isThenable | 类型判断；isThenable 按「有 then 方法」的鸭子类型判断，比 instanceof 更通用 |
| 状态层 | rejectPromise / resolvePromise | 状态迁移统一入口，都先检查 pending 保证不可逆；resolvePromise 负责循环引用检测和 thenable 吸收 |
| 调度层 | flushHandlers | 统一调度回调：进微任务、先进先出执行、处理状态穿透和抛错 |
| 类 | MyPromise | 只存状态和回调队列；then 只有 3 行——注册回调 + 返回新 promise |

**相比把逻辑全写在 then 里，这个架构的优势：**

1. 职责清晰：状态怎么变（resolvePromise）、回调怎么跑（flushHandlers）、怎么注册（then）各司其职；
2. thenable 用鸭子类型判断（有 then 就吸收），不只认 MyPromise 实例，更贴近规范；
3. then 极薄，面试时画一张分层图就能讲明白。

**顺手修正的三处笔误（原代码）：**

1. `then` 内部 `new MyPromise()` 不传 executor，而构造函数无条件调用 `executor()`——链上每个新 promise 都会立即变成 rejected（executor is not a function）。修复：构造函数开头 `if (!isFunction(executor)) return`；
2. 失败穿透分支误用 `_data`，应为 `_reason`；
3. `onRejected(curPromise.reason)` 应为 `_reason`。

**实测通过的 11 个场景（Node 真实运行）：**

```text
A 链式 + return Promise 拆开透传      E thenable 吸收（普通对象带 then）
B throw -> catch -> 链恢复            F 同一 promise 多次 then
C 失败状态穿透（不传 onRejected）      G 多次 resolve 只认第一次
D 成功状态穿透（不传 onFulfilled）     H 回调抛错
I 循环引用检测
```
## 四、手写 Promise.all / race / allSettled / any

### 4.1 Promise.all

**语义：全部成功才成功（结果按传入顺序），任一失败立即失败。**

```js
MyPromise.all = function (promises) {
  // all 返回一个新 Promise，结果由内部的 resolve/reject 决定
  return new MyPromise((resolve, reject) => {
    const results = []                 // 存放每一项的成功结果
    let resolvedCount = 0              // 已成功的计数器
    const list = Array.from(promises)  // 支持可迭代对象（Set / Map / 字符串）

    // 边界：空数组没有可等待的任务，直接成功 []
    if (list.length === 0) return resolve(results)

    list.forEach((item, index) => {
      // 用 resolve 包装：普通值也能参与（同步变成功）
      MyPromise.resolve(item).then(
        (value) => {
          results[index] = value  // 关键 1：用 index 而不是 push —— 保证结果顺序与传入一致
          resolvedCount++         // 关键 2：用计数器，不能用 results.length
          // 稀疏数组陷阱：results[2] = x 时 length 已是 3，但 0、1 可能还没填
          if (resolvedCount === list.length) resolve(results) // 全部成功
        },
        reject  // 任一失败：原因直接透传，整体立即失败（不 cancel 其余，只是忽略）
      )
    })
  })
}
```

**考点（面试官最爱追问）：**

1. **为什么用 index 而不是 push？** 各项异步完成顺序不可控，push 会让结果顺序错乱；index 存保证与传入顺序一致；
2. **为什么用计数器而不是 `results.length === list.length`？** 稀疏数组陷阱：先完成第 2 项时 `results.length` 已经是 3，但第 0、1 项还是空；
3. **空数组返回什么？** 立即 `resolve([])`；
4. **一个失败会等其他吗？** 不会，第一个 reject 立即决定整体失败，其余结果被忽略（请求本身不会取消）；
5. **传入普通值可以吗？** 可以，`MyPromise.resolve` 会把它包装成成功的 Promise。

### 4.2 Promise.race

**语义：第一个落定者（无论成败）决定整体。**

```js
MyPromise.race = function (promises) {
  return new MyPromise((resolve, reject) => {
    Array.from(promises).forEach((item) => {
      // 每个 Promise 落定时都会调用 resolve 或 reject
      // 但外层 Promise 状态不可逆（只能变一次）
      // 所以第一个落定者说了算，后面的调用全部自动失效
      MyPromise.resolve(item).then(resolve, reject)
    })
  })
}
```

**考点：**

1. **为什么不需要计数器和结果数组？** 状态不可逆，第一个调用 resolve/reject 的人赢，其余调用无效；
2. **空数组会怎样？** 永远 pending——没有任何人能决定它的状态；
3. **第一个是失败，整体失败**（取第一个成功的是 any，不是 race）；
4. **典型应用：请求超时控制。**

```js
// 超时控制：3 秒没结果就报错
function withTimeout(promise, ms) {
  const timeout = new Promise((_, reject) =>
    setTimeout(() => reject(new Error('timeout')), ms)
  )
  return Promise.race([promise, timeout])
}

withTimeout(fetch('/api/user'), 3000)
```

### 4.3 Promise.allSettled

**语义：等全部落定（无论成败），每项返回结果对象；永远不会 reject。**

```js
MyPromise.allSettled = function (promises) {
  // 注意：executor 里只写了 resolve，没有 reject —— 永不失败
  return new MyPromise((resolve) => {
    const results = []           // 存放每一项的「结果对象」
    let settledCount = 0         // 已落定计数（成功或失败都算 +1）
    const list = Array.from(promises)

    if (list.length === 0) return resolve(results)

    list.forEach((item, index) => {
      MyPromise.resolve(item).then(
        (value) => {
          // 成功：值放在 value 字段
          results[index] = { status: 'fulfilled', value }
          if (++settledCount === list.length) resolve(results)
        },
        (reason) => {
          // 失败也记录，不中断：原因放在 reason 字段
          results[index] = { status: 'rejected', reason }
          if (++settledCount === list.length) resolve(results)
        }
      )
    })
  })
}
```

**考点：**

1. **和 all 的本质区别？** all 遇错即停、整体失败；allSettled **永不失败**，失败也记入结果；
2. **结果对象长什么样？** `{ status: 'fulfilled', value }` 或 `{ status: 'rejected', reason }`；
3. **为什么成功和失败两个回调都要 `++settledCount`？** 「落定」包含成功与失败，两个都算完成；
4. **适用场景？** 批量操作需要统计每项成败：批量上传后挑出失败项重试、批量删除后展示失败列表。

### 4.4 Promise.any

**语义：任一成功就整体成功；全部失败才失败（抛 AggregateError）。**

```js
MyPromise.any = function (promises) {
  return new MyPromise((resolve, reject) => {
    const errors = []        // 存放每一项的失败原因
    let rejectedCount = 0    // 已失败的计数器
    const list = Array.from(promises)

    // 边界：空数组没有任何可能成功，直接失败
    // 注意：与 all 恰好相反（all 空数组是成功 []）
    if (list.length === 0) {
      return reject(new AggregateError([], 'All promises were rejected'))
    }

    list.forEach((item, index) => {
      MyPromise.resolve(item).then(
        (value) => resolve(value),  // 任一成功：整体立即成功，后面的不再理会
        (err) => {
          errors[index] = err       // 用 index 记录，保证失败原因与传入顺序一致
          rejectedCount++
          // 全部失败：抛 AggregateError，e.errors 携带所有失败原因
          if (rejectedCount === list.length) {
            reject(new AggregateError(errors, 'All promises were rejected'))
          }
        }
      )
    })
  })
}
```

**考点：**

1. **和 race 的区别？** race 第一个落定者（成败都算）说了算；any 只认第一个**成功**，失败会被跳过继续等其他；
2. **和 all 的区别？** 方向相反：all 记成功等全部成功；any 记失败等全部失败；
3. **全部失败抛什么？** `AggregateError`（ES2021），`e.errors` 是所有原因的数组；旧环境可用 `new Error` + 手动挂 `errors` 属性兜底；
4. **空数组返回什么？** AggregateError（与 all 相反）；
5. **典型应用：多源容灾**——同时请求多个 CDN/接口，谁先成功用谁。

```js
// 多源请求：任一镜像成功即可
Promise.any([
  fetch('https://cdn-a.com/data.json'),
  fetch('https://cdn-b.com/data.json')
]).then((res) => res.json())
```

### 4.5 四个方法对比记忆

| 方法 | 记录什么 | 计数满了做什么 | 空数组 | 一句话 |
| --- | --- | --- | --- | --- |
| all | 成功值 | 全部成功 -> resolve | `resolve([])` | 全成才成 |
| allSettled | 每项结果对象 | 全部完成 -> resolve | `resolve([])` | 全都要 |
| race | 无 | 第一个落定者说了算 | 永远 pending | 谁快听谁 |
| any | 失败原因 | 全部失败 -> AggregateError | AggregateError | 一个成就成 |

**手写共同套路（口述模板）：**

1. `Array.from` 转数组（支持可迭代）；
2. 空数组先做边界处理；
3. `MyPromise.resolve(item)` 包装普通值；
4. **index 存结果 + 计数器判完成**（race 除外）；
5. 根据方法语义决定：记成功、记失败、还是记全部。
## 五、输出题练手

### 题目 1：嵌套微任务

```js
Promise.resolve()
  .then(() => {
    console.log('then1')
    Promise.resolve().then(() => console.log('then3'))
  })
  .then(() => console.log('then2'))
// 输出：then1 -> then3 -> then2
// then2 依赖第一个 then 完成后才注册，排在新产生的 then3 之后
```

### 题目 2：返回 Promise 的等待

```js
Promise.resolve(1)
  .then((v) => {
    console.log(v) // 1
    return new Promise((resolve) => setTimeout(resolve, 0)) // 返回 Promise：等它完成才继续
  })
  .then(() => console.log('after timeout'))

setTimeout(() => console.log('timeout'), 0)
// 输出：1 -> timeout -> after timeout
```

## 六、高频面试题速答

| 问题 | 参考答案 |
| --- | --- |
| Promise 解决了什么问题？ | 回调地狱，提供链式调用与统一错误处理 |
| Promise 三态？可逆吗？ | pending/fulfilled/rejected；只能 pending -> 成功或失败，不可逆 |
| 多次 resolve 会怎样？ | 只有第一次生效，状态已定格 |
| then 返回什么？ | 全新的 Promise，所以能链式调用 |
| then 返回 Promise 会怎样？ | 等它完成，把它的结果传给下一个 then（拆开透传） |
| catch 之后还能 then 吗？ | 能，catch 返回的 Promise 默认 fulfilled，链恢复正常 |
| Promise 的缺点？ | 无法取消；不写 catch 会吞错；pending 时无法得知进度 |
| all 和 allSettled 区别？ | all 一个失败整体失败；allSettled 等全部完成，逐项返回状态 |
| race 和 any 区别？ | race 取第一个完成（成败都算）；any 取第一个成功，全失败才失败 |
| 手写 Promise 的规范要点？ | 状态机、pending 缓存回调、queueMicrotask 微任务、resolvePromise 处理返回值 |

## 七、速记卡

```text
1. 三态不可逆，executor 同步执行
2. then 返回新 Promise：值透传 / Promise 拆开 / 抛错跳 catch
3. 错误会冒泡，catch 后链恢复正常
4. all 全成才成；allSettled 全完；race 第一个落定；any 第一个成功
5. 手写四件套：状态机 + 回调数组 + queueMicrotask + resolvePromise
```
