# 事件循环与宏微任务

> 面试频率：⭐⭐⭐⭐⭐ | 关联考点：Promise 输出题、async/await、浏览器渲染、Node.js

## 面试回答（开口版）

如果面试官问「事件循环是怎么回事」，可以这样回答：

> 这个要结合 JS 单线程来讲。JS 当初的设计目标是操作 DOM，为了避免多线程同时改 DOM 的冲突，就设计成了单线程；但单线程不能被耗时任务卡住，所以浏览器把定时器、网络请求这些交给其他线程处理，完成后把回调放入任务队列，由事件循环调度。完整流程是：先执行同步代码（整体 script 是一个宏任务）；调用栈清空后，**清空全部微任务**，比如 Promise.then；接着如果需要渲染，先执行 requestAnimationFrame 再渲染页面；最后取出**下一个宏任务**，比如 setTimeout 的回调，如此循环。核心规律就一句：**微任务永远优先于下一个宏任务，而且是清空全部，不是只执行一个**。浏览器和 Node 的差异在于 Node 分了 timers、poll、check 等阶段，且 `process.nextTick` 优先级高于普通微任务。

**答题要点：** 单线程原因 → 任务队列 → 循环四步 → 宏微任务顺序 → Node 差异
## 一、为什么 JS 是单线程？

JS 诞生的主要任务是操作 DOM、处理用户交互。如果多线程：

- 线程 A 给某个节点添加内容，线程 B 同时删除该节点，浏览器无法裁决；
- 需要引入锁机制，复杂度剧增。

所以设计者选择**单线程**：同一时间只执行一段代码，简单可靠。代价是**耗时任务会阻塞后续所有代码**，于是需要异步与事件循环来化解。

## 二、浏览器的多线程架构

「JS 是单线程」指**JS 引擎执行代码的线程只有一个**，但浏览器是**多线程**的：

| 线程 | 职责 |
| --- | --- |
| JS 引擎线程 | 解析执行 JS（调用栈所在线程） |
| GUI 渲染线程 | 解析 HTML/CSS、布局、绘制 |
| 定时器触发线程 | setTimeout / setInterval 计时 |
| 事件触发线程 | 等待点击、滚动等事件，回调入队 |
| 网络线程（HTTP） | 处理网络请求 |

两个关键结论：

1. **JS 引擎线程与 GUI 渲染线程互斥**：JS 执行时页面不渲染，长任务导致掉帧、白屏；
2. `setTimeout` 的计时由**定时器线程**完成，到期后才把回调放入任务队列，所以 JS 卡顿时定时器回调照样延迟。

## 三、调用栈（Call Stack）

JS 引擎用**调用栈**管理函数执行：函数调用入栈，执行完出栈。

```js
function a() {
  console.log('a')
}
function b() {
  a()
  console.log('b')
}
b()
```

```text
1. b() 入栈
2.   a() 入栈 -> 打印 a -> a() 出栈
3. 打印 b
4. b() 出栈，栈空
```

**栈溢出**：递归没有出口，栈帧不断堆叠：

```js
function loop() {
  loop()
}
loop() // RangeError: Maximum call stack size exceeded
```

## 四、同步与异步：任务队列

- **同步任务**：在调用栈中依次执行，前一个不结束，后一个不开始；
- **异步任务**：交给其他线程处理，**回调**进入任务队列；调用栈一空，事件循环就从队列取任务执行。

```js
console.log('start')

setTimeout(() => {
  console.log('timeout') // 宏任务
}, 0)

fetch('/api').then(() => {
  console.log('fetch') // 微任务
})

console.log('end')
```

```text
打印 start -> 打印 end -> 微任务 fetch -> 宏任务 timeout
```

## 五、事件循环完整流程（含浏览器渲染）

```text
+---------------------------------------------------+
| 1. 取出一个宏任务（首次是整体 script）执行           |
|              |                                     |
|              v                                     |
| 2. 执行完毕，清空【全部微任务队列】                  |
|    （微任务执行中产生的新微任务也在本轮清空）          |
|              |                                     |
|              v                                     |
| 3. 判断是否需要渲染（通常 16ms 一帧）                |
|    是 -> 执行 requestAnimationFrame 回调            |
|       -> Style 计算 -> Layout -> Paint              |
|              |                                     |
|              v                                     |
| 4. 回到第 1 步，取下一个宏任务，循环往复              |
+---------------------------------------------------+
```

::: tip requestAnimationFrame 的位置
rAF 回调在**渲染前**执行，且紧跟屏幕刷新频率，做动画应优先使用 rAF 而不是 setTimeout。
:::

## 六、宏任务 vs 微任务

### 6.1 分类表

| | 宏任务（Macrotask） | 微任务（Microtask） |
| --- | --- | --- |
| 常见来源 | `script` 整体代码、`setTimeout`、`setInterval`、`setImmediate`(Node)、I/O、UI 事件、MessageChannel | `Promise.then/catch/finally`、`queueMicrotask`、`MutationObserver`、`process.nextTick`(Node) |
| 执行时机 | 每轮事件循环取**一个** | 每轮宏任务后**全部清空** |
| 插队能力 | 新产生的宏任务排到下一轮 | 执行中产生的新微任务也在本轮清空 |

### 6.2 为什么需要微任务？

宏任务（如 setTimeout）回调要等**下一轮循环**才能执行；而异步回调经常需要**尽快、且插在渲染之前**执行（例如 Promise 链）。微任务队列在每轮宏任务后立刻清空，保证：

- 优先级高于下一个宏任务；
- 又在渲染之前执行，避免布局抖动。

一句话：**微任务 = 高优先级的「插队通道」**。

### 6.3 执行顺序总结

```text
同步代码（script） -> 全部微任务 -> 渲染 -> 下一个宏任务 -> 全部微任务 -> ...
```

## 七、经典输出题（五道）

### 题目 1：基础版

```js
console.log('1')

setTimeout(() => console.log('2'), 0)

Promise.resolve().then(() => console.log('3'))

console.log('4')
```

**输出：`1 4 3 2`**

解析：同步 `1 4` -> 清微任务 `3` -> 取宏任务 `2`。

### 题目 2：async/await 版（必背）

```js
async function async1() {
  console.log('async1 start')
  await async2()
  console.log('async1 end')
}
async function async2() {
  console.log('async2')
}

console.log('script start')
async1()
setTimeout(() => console.log('setTimeout'), 0)
Promise.resolve().then(() => console.log('promise'))
console.log('script end')
```

**输出：`script start → async1 start → async2 → script end → async1 end → promise → setTimeout`**

解析：

1. `async1()` 被调用，`await async2()` **之前**的代码同步执行：打印 `async1 start`、调用 async2 打印 `async2`；
2. 遇到 await，`async1 end` 进入微任务，async1 暂停让出主线程；
3. 继续同步：注册 setTimeout、注册 promise 微任务、打印 `script end`；
4. 清微任务：`async1 end`（先注册）-> `promise`；
5. 取宏任务：`setTimeout`。

### 题目 3：嵌套微任务

```js
Promise.resolve()
  .then(() => {
    console.log('then1')
    Promise.resolve().then(() => console.log('then3'))
  })
  .then(() => console.log('then2'))
```

**输出：`then1 → then3 → then2`**

解析：`then2` 依赖第一个 then 执行完才注册，排在新产生的 `then3` 之后。

### 题目 4：setTimeout 嵌套

```js
setTimeout(() => {
  console.log('outer')
  setTimeout(() => {
    console.log('inner')
  }, 0)
}, 0)

Promise.resolve().then(() => console.log('micro'))
console.log('sync')
```

**输出：`sync → micro → outer → inner`**

解析：inner 是在 outer 宏任务执行时才注册的新宏任务，排在下一轮。

### 题目 5：综合大乱斗

```js
console.log('A')

setTimeout(() => console.log('B'), 0)

async function foo() {
  console.log('C')
  await Promise.resolve()
  console.log('D')
}

foo()

Promise.resolve()
  .then(() => console.log('E'))
  .then(() => console.log('F'))

queueMicrotask(() => console.log('G'))

console.log('H')
```

**输出：`A C H D E G F B`**

解析：

1. 同步：`A` -> 调用 foo 打印 `C`（await 前同步）-> `H`；
2. 微任务队列按注册顺序：`D`（await 后续）-> `E` -> `G` -> `F`（E 完成后才注册）；
3. 宏任务：`B`。

## 八、async/await 转换规则（背下来）

```js
async function fn() {
  console.log('before')
  await promiseA
  console.log('after')
}
// 等价于：
function fn() {
  console.log('before')
  return promiseA.then(() => {
    console.log('after')
  })
}
```

- `await` **右侧**表达式同步执行；
- `await` **下面**的代码进入微任务；
- `async` 函数返回值自动被包装成 Promise。

## 九、Node.js 事件循环（加分项）

Node 的事件循环分为六个阶段，每个阶段结束后都会清空微任务：

```text
timers(setTimeout/setInterval)
  -> pending callbacks(系统级回调)
  -> idle, prepare
  -> poll(取新 I/O 事件，可能阻塞)
  -> check(setImmediate)
  -> close callbacks(close 事件)
```

与浏览器的差异：

| 差异点 | 说明 |
| --- | --- |
| `process.nextTick` | 优先级**高于**普通微任务，微任务之前执行 |
| `setImmediate` vs `setTimeout(0)` | 在主模块中顺序不确定；在 I/O 回调中 setImmediate 先执行 |
| 渲染 | Node 无渲染，没有 rAF |

## 十、常见坑

### 坑 1：setTimeout(fn, 0) 不是 0ms

HTML 规范嵌套 setTimeout 最小 4ms（浏览器实现各异），且必须等当前宏任务与微任务全部执行完。精确计时用 `performance.now()`，动画用 rAF。

### 坑 2：微任务队列必须「清空」

不是每轮只执行一个微任务，而是**全部清空**，包括执行过程中新产生的。

### 坑 3：then 的回调注册时机

`.then()` 链上后面的回调要等前面回调执行后才注册，输出顺序容易误判（见题目 3）。

### 坑 4：await 不阻塞主线程

await 只暂停当前 async 函数并交出控制权，主线程继续执行其他代码。

## 十一、高频面试题速答

| 问题 | 参考答案 |
| --- | --- |
| 宏任务和微任务区别？ | 宏任务每轮取一个，微任务每轮清空全部；微任务优先于下一宏任务 |
| 常见宏任务/微任务有哪些？ | 宏：script、setTimeout、setInterval、I/O、UI 事件；微：then、queueMicrotask、MutationObserver |
| setTimeout(fn, 0) 是立即执行吗？ | 不是，有最小延迟且要等当前同步代码与微任务执行完 |
| Promise.then 是微任务还是宏任务？ | 微任务 |
| await 会阻塞吗？ | 不阻塞主线程，只暂停当前 async 函数 |
| JS 单线程为什么能异步？ | 耗时任务交给浏览器其他线程，回调进队列，事件循环调度 |
| 长任务导致页面卡顿怎么办？ | 拆分任务（分批/切片）、用 requestIdleCallback、或移入 WebWorker |
| Node 里 nextTick 和 Promise.then 谁先？ | nextTick 先于普通微任务 |

## 十二、速记卡

```text
1. 同步代码 -> 清空全部微任务 -> (可能渲染) -> 下一个宏任务
2. 微任务 = then / catch / finally / queueMicrotask / MutationObserver
3. 宏任务 = script / setTimeout / setInterval / I/O / UI 事件
4. await 右侧同步执行，下面一行进微任务
5. async 函数返回值自动包 Promise
6. 微任务清空是「全部」，不是「一个」
```
