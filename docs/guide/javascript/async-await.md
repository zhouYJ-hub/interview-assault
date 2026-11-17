# async / await 专题

> 面试频率：⭐⭐⭐⭐⭐ | 关联考点：Promise、事件循环、Generator、并发控制

## 面试回答（开口版）

如果面试官问「讲讲 async/await」，可以这样回答：

> async/await 是 Promise 的语法糖，用**同步的写法处理异步**，解决了 then 链过长时的语义割裂问题。核心机制是：async 函数的返回值自动包装成 Promise；await 右侧的表达式**同步执行**，下面的代码进入**微任务**，相当于 then 的回调。错误处理用 try/catch，比链式 catch 更直观。底层原理是 Generator 加自动执行器——yield 暂停、next 恢复，引擎在 Promise resolve 后自动恢复执行。实战中最高的考点是**串行和并发**：多个无依赖的 await 是串行等待，必须用 Promise.all 包起来才能并发；需要限流时用「任务池 + Promise.race」做并发控制。

**答题要点：** 本质（Promise 语法糖）→ 执行机制（右侧同步、下面微任务）→ 错误处理 → Generator 原理 → 并发优化

## 一、概念：是什么、解决什么

### 1.1 从 then 链到同步写法

```js
// Promise 链：扁平但语义仍是「回调」
function load() {
  return getUser(1)
    .then((user) => getOrders(user.id))
    .then((orders) => getDetail(orders[0].id))
    .then((detail) => process(detail))
}

// async/await：把异步「拍平」成同步的样子
async function load() {
  const user = await getUser(1)
  const orders = await getOrders(user.id)
  const detail = await getDetail(orders[0].id)
  return process(detail)
}
```

对比优势：

1. 代码结构接近同步，**可读性高**；
2. 变量作用域统一在一个函数里，不需要层层透传；
3. 可以用 `try/catch/return/throw`，**控制流完整**。

### 1.2 本质

一句话：**async 函数 = 返回 Promise 的函数；await = 把「后面的代码」注册成 then 的微任务回调。**

```js
// 这两段近似等价
async function fn() {
  console.log('before')
  await promiseA
  console.log('after')
}

function fn() {
  console.log('before')
  return promiseA.then(() => {
    console.log('after')
  })
}
```

## 二、核心机制

### 2.1 async 函数的返回值

返回值**自动包装成 Promise**：

```js
async function foo() {
  return 1 // 等价于 return Promise.resolve(1)
}

console.log(foo() instanceof Promise) // true
foo().then(console.log)               // 1
```

内部抛错 -> 返回的 Promise 变为 rejected：

```js
async function bar() {
  throw new Error('fail')
}
bar().catch((e) => console.log(e.message)) // 'fail'
```

### 2.2 await 的执行时机（必背）

- `await` **右侧**表达式同步执行；
- `await` **下面一行**进入微任务（等右侧 Promise 落定后执行）；
- `await` 只暂停当前 async 函数，**不阻塞主线程**。

```js
async function foo() {
  console.log('async1 start')
  await Promise.resolve()
  console.log('async1 end') // 进入微任务
}
console.log('script start')
foo()
console.log('script end')
// 输出：script start -> async1 start -> script end -> async1 end
```

### 2.3 错误处理

`await` 的 Promise 变 rejected 时会「抛错」，用 try/catch 捕获：

```js
async function getData() {
  try {
    const res = await fetch('/api/user')
    const data = await res.json()
    return data
  } catch (err) {
    console.error('请求失败', err)
    throw err // 处理不了继续向上抛
  }
}
```

::: warning 常见坑
不写 try/catch 时，async 函数返回的 Promise 变 rejected，错误不会自动抛到全局，容易被「吞掉」。
:::

### 2.4 串行 vs 并发（最高频）

```js
// 串行：总耗时 = 1s + 2s + 3s = 6s
const a = await fetchA()
const b = await fetchB()
const c = await fetchC()

// 并发：总耗时约等于最慢的那个（3s）
const [a, b, c] = await Promise.all([fetchA(), fetchB(), fetchC()])
```

**陷阱：看似并发实则串行**

```js
// ❌ 错：await 在数组每一项上，三个请求一个接一个发出
const [a, b, c] = [
  await fetchA(),
  await fetchB(),
  await fetchC()
]

// ✅ 对：先全部发出（fetchA() 立刻执行返回 Promise），再统一 await
const [a, b, c] = await Promise.all([fetchA(), fetchB(), fetchC()])
```

### 2.5 循环中的 await

```js
// for...of：串行等待，适合有依赖的场景
for (const id of ids) {
  const user = await getUser(id) // 一个完成后才开始下一个
}

// 并发：无依赖时
const users = await Promise.all(ids.map((id) => getUser(id)))
```

## 三、原理：Generator + 自动执行器

### 3.1 对应关系

```text
async function main()  <-->  function* main()
await promise          <-->  yield promise
自动恢复执行            <-->  spawn(main) 自动执行器
```

### 3.2 手写 spawn 自动执行器

```js
// spawn：Generator 自动执行器 —— async/await 的底层原理
// 作用：自动「驱动」Generator——yield 暂停后自动恢复，
// 调用 spawn(main) 的效果等价于调用一个 async 函数
function spawn(genFn) {
  // 返回 Promise：和 async 函数一样，最终结果/错误都通过它交给外部
  return new Promise((resolve, reject) => {
    // 1. 调用 Generator 函数拿到迭代器
    //    此时函数体还没执行，暂停在「函数开头」等待第一次 next
    const gen = genFn()

    // 2. step 是驱动核心（递归）：
    //    负责「恢复 Generator -> 停在下一个 yield -> 等待结果 -> 再恢复」的循环
    //    fn:  恢复方式，'next'（正常恢复）或 'throw'（把错误抛回去）
    //    arg: 回填给上一个 yield 表达式的值（也就是 await 拿到的结果）
    function step(fn, arg) {
      let result
      try {
        // 3. 恢复执行，两种方式：
        //    step('next', v)  -> gen.next(v)  正常恢复，v 赋给上一个 yield 的返回值
        //    step('throw', e) -> gen.throw(e) 把错误抛进 Generator 内部，
        //                        相当于在 yield 那一行抛错，可被内部 try/catch 捕获
        result = gen[fn](arg)
      } catch (err) {
        // 4. Generator 内部抛错且没被捕获：
        //    让 spawn 返回的 Promise 失败（等价于 async 函数内 throw）
        return reject(err)
      }

      // 5. done 为 true：函数执行完（return 或自然结束）
      //    return 的值作为最终结果让 Promise 成功
      //    等价于 async 函数的 return 值
      if (result.done) return resolve(result.value)

      // 6. 还没执行完：当前停在某个 yield 处，result.value 是 yield 出来的值
      //    用 Promise.resolve 包装：兼容 yield 普通值（不是 Promise 也能走）
      //    落定后递归调用 step，形成「自动执行」：
      //      成功 -> step('next', v)   把结果回填给 yield，Generator 继续往下走
      //      失败 -> step('throw', e)  把错误抛回 Generator 内部
      Promise.resolve(result.value).then(
        (v) => step('next', v),
        (err) => step('throw', err)
      )
    }

    // 7. 启动引擎：第一次 next 不传参
    //    （第一个 yield 之前没有任何等待，传了也没地方接收）
    step('next')
  })
}
```

**执行流程图解（对照下面例子）：**

```js
function* main() {
  const user = yield getUser(1)
  const orders = yield getOrders(user.id)
  console.log(orders)
}
spawn(main)
```

```text
step('next')          启动：执行到第一个 yield，拿到 getUser(1) 返回的 Promise
    | Promise 成功
    v
step('next', user)    user 回填给第一个 yield -> 执行到第二个 yield
                      拿到 getOrders(...) 的 Promise
    | Promise 成功
    v
step('next', orders)  orders 回填给第二个 yield -> console.log -> 函数结束
                      done: true -> resolve(返回值)，外部拿到结果

异常路径（getUser 失败）：
step('throw', err)    错误在第一个 yield 处「抛出」
                      - 内部有 try/catch -> 走 catch，继续往下
                      - 没有 -> 冒泡到 step 的 try/catch -> reject(err)
```

**一句话总结引擎做的事：**

> **resolve 时自动 next、reject 时自动 throw，直到 done 再 resolve。**
## 四、实战：并发控制 limit（进阶高频）

限制同时最多 N 个请求，常用于批量上传、爬虫限流：

```js
async function limitConcurrency(tasks, limit) {
  const results = []
  const executing = new Set() // 正在执行的任务池

  for (const [index, task] of tasks.entries()) {
    const p = Promise.resolve().then(() => task()).then(
      (value) => {
        results[index] = value
        executing.delete(p) // 完成后移出任务池
      },
      (err) => {
        executing.delete(p)
        throw err
      }
    )
    executing.add(p)

    // 任务池满了：等任意一个完成，腾出位置再继续入队
    if (executing.size >= limit) {
      await Promise.race(executing)
    }
  }

  await Promise.all(executing) // 收尾：等剩余任务全部完成
  return results
}

// 用法：最多同时 3 个
const tasks = [
  () => fetch('/api/1'),
  () => fetch('/api/2'),
  () => fetch('/api/3'),
  () => fetch('/api/4')
]
limitConcurrency(tasks, 3).then(console.log)
```

核心思路：**for 循环快速发起 + Set 维护任务池 + 池满时 Promise.race 等最快完成者腾位置**。

## 五、输出题练手

### 题目 1：执行顺序

```js
async function foo() {
  console.log('C')
  await Promise.resolve()
  console.log('D')
}

console.log('A')
foo()
Promise.resolve().then(() => console.log('E'))
console.log('B')
// 输出：A C B D E
// 同步 A、C、B -> 微任务按注册顺序：D（await 后续）、E
```

### 题目 2：错误传递

```js
async function f() {
  await Promise.reject(new Error('fail'))
  console.log('不会执行') // await 抛错后跳过
}

f()
  .then(() => console.log('then 不执行'))
  .catch((e) => console.log('caught:', e.message)) // caught: fail
  .finally(() => console.log('finally'))           // finally
```

### 题目 3：async 返回值

```js
async function foo() {
  return 1
}
foo().then(console.log) // 1 —— return 值自动包装成 Promise

async function bar() {
  return Promise.resolve(2)
}
bar().then(console.log) // 2
```

## 六、高频面试题速答

| 问题 | 参考答案 |
| --- | --- |
| async/await 的本质？ | Generator + 自动执行器的语法糖，底层还是 Promise |
| async 函数返回什么？ | 永远返回 Promise，return 值自动包装 |
| await 的执行时机？ | 右侧同步执行，下面一行进入微任务 |
| await 会阻塞主线程吗？ | 不会，只暂停当前 async 函数并交出控制权 |
| await 的错误怎么处理？ | try/catch 捕获，或在外层 .catch() |
| 多个 await 请求怎么优化？ | 无依赖用 Promise.all 并发，别顺序 await |
| 数组解构里写 await 对吗？ | `[await a(), await b()]` 是串行；应 `await Promise.all([a(), b()])` |
| 循环里怎么并发请求？ | `Promise.all(ids.map(fn))`；for...of + await 是串行 |
| Generator 的 next 参数和 await 的关系？ | next(arg) 的 arg 赋给上个 yield，相当于 await 拿到的结果 |
| 怎么限制并发数？ | Set 任务池 + 池满 Promise.race 等最快完成者 |

## 七、速记卡

```text
1. async 返回值自动包 Promise
2. await 右侧同步，下面一行微任务
3. await 只暂停当前函数，不阻塞主线程
4. 错误用 try/catch，不处理会被吞
5. 无依赖请求用 Promise.all 并发
6. for...of + await 是串行，map + Promise.all 是并发
7. 原理 = Generator + spawn 自动执行器
```
