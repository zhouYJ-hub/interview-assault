# 闭包与作用域

> 面试频率：⭐⭐⭐⭐⭐ | 关联考点：执行上下文、变量提升、垃圾回收、防抖节流

## 面试回答（开口版）

如果面试官问「作用域和闭包是什么」，可以这样回答：

> 作用域就是变量能被访问的范围，JS 采用**词法作用域（也叫静态作用域）**——由代码定义的位置决定，跟在哪里调用无关。JS 有三种作用域：**全局作用域、函数作用域、块级作用域**（let / const 所在的 `{}`）。找变量时先查当前层，没有就一层层往外找，直到全局，这条查找路径就是**作用域链**。
>
> 闭包就是：内层函数引用了外层函数的变量，又被 return 到外面用。外层函数执行完了，这些变量也**不会被回收**，等于被内层函数「随身带走」了。典型应用是私有变量、柯里化、缓存、防抖节流；注意变量会常驻内存，不用时要断掉引用。

**答题要点：** 词法作用域（定义位置决定）→ 三种作用域 → 作用域链逐层查找 → 闭包 → 应用 + 内存注意
## 一、为什么需要作用域？

### 1.1 没有作用域会怎样

程序里有成千上万个变量，如果**所有变量全局可见**：

- 命名冲突无法避免（`a` 到底是谁的 `a`？）；
- 变量随时可能被任何代码误改；
- 无法实现私有性。

作用域就是一套**「变量可见范围」的规则**：变量只在属于自己的区域内有效，出了区域就找不到。

### 1.2 词法作用域 

JS 采用**词法作用域（Lexical Scope，静态作用域）**：

- 由**代码书写（定义）的位置**决定；
- 编译阶段就能确定，与在哪里调用无关。

```js
let x = 10

function foo() {
  console.log(x) // 去哪找 x？看定义处：foo 外层是全局
}

function bar(fn) {
  let x = 20
  fn() // 依然打印 10，不受调用位置影响
}

bar(foo)
```

::: tip 划重点
「函数的作用域在定义时确定」——这句话是闭包的根基，先记住，后文反复用到。
:::

### 1.3 三种作用域

| 类型 | 说明 | 示例 |
| --- | --- | --- |
| 全局作用域 | 整个脚本可访问 | 最外层的 `var a = 1` |
| 函数作用域 | 函数内部可访问 | `function fn() { var b = 2 }` |
| 块级作用域 | `{}` 内可访问（let / const） | `if (true) { let c = 3 }` |

## 二、作用域的底层机制：执行上下文

### 2.1 执行上下文的生命周期

每调用一次函数，引擎就会为它创建一个**函数执行上下文**，分两个阶段：

```text
1. 创建阶段（进入函数，还没执行代码）
   - 创建变量对象：收集参数、函数声明、变量声明
   - 创建作用域链：[当前 VO, 外层 VO, ..., 全局 VO]
   - 确定 this

2. 执行阶段
   - 逐行执行代码，变量对象中的值被依次赋上
```

> ES3 规范中叫变量对象（VO）/活动对象（AO），ES5+ 改叫**词法环境（Lexical Environment）**：由「环境记录（存变量）+ 外部环境引用（指向上层）」组成。面试说 VO 或词法环境都可以。

### 2.2 变量提升的真相

变量提升不是「代码被移动到上面」，而是**创建阶段先完成了声明登记，赋值留在执行阶段**：

```js
console.log(a) // undefined（已声明，未赋值）
var a = 1

console.log(b) // ReferenceError（let 存在 TDZ）
let b = 2
```

### 2.3 函数声明 vs 函数表达式的提升

- **函数声明**：整体提升（名字和函数体都可用）；
- **函数表达式**：只提升变量名，赋值留在原地。

```js
fn1() // 'fn1' —— 函数声明整体提升
function fn1() { console.log('fn1') }

fn2() // TypeError: fn2 is not a function（undefined 不能调用）
var fn2 = function () { console.log('fn2') }
```

### 2.4 let / const 与暂时性死区（TDZ）

let/const **同样有提升**（引擎在创建阶段就知道它们存在），只是**不会初始化**：从作用域开头到声明语句之间访问就报错，这段区域叫**暂时性死区**。

```js
console.log(a) // undefined
var a = 1

console.log(b) // ReferenceError: Cannot access 'b' before initialization
let b = 2
```

### 2.5 作用域链

函数执行时查找变量：**先查当前作用域，找不到就沿「定义时的外层」逐级向上，直到全局**，这条链叫作用域链。

```js
let g = '全局'
function outer() {
  let o = 'outer'
  function inner() {
    let i = 'inner'
    console.log(i, o, g) // 三层作用域链都能访问
  }
  inner()
}
outer()
```

```text
inner 作用域链: [inner 的环境] -> [outer 的环境] -> [全局环境]
```

## 三、var / let / const 深度对比

| 特性 | var | let | const |
| --- | --- | --- | --- |
| 作用域 | 函数 | 块级 | 块级 |
| 变量提升 | 有（值为 undefined） | 有声明、无初始化（TDZ） | 有声明、无初始化（TDZ） |
| 重复声明 | 允许 | 不允许 | 不允许 |
| 重新赋值 | 允许 | 允许 | 不允许 |
| 全局声明挂到 window | 是 | 否 | 否 |
| 声明前访问 | undefined | ReferenceError | ReferenceError |

```js
var a = 1
console.log(window.a) // 1 —— var 全局变量挂到 window

let b = 2
console.log(window.b) // undefined —— let 不挂

const obj = {}
obj.name = '小明' // 允许：const 锁的是「绑定」，不是内容
obj = {}          // TypeError：不能重新赋值
```

::: tip 使用建议
默认用 `const`，需要重新赋值才用 `let`，`var` 只在维护老代码时出现。
:::

## 四、闭包

### 4.1 闭包的多种定义（面试可任选其一）

- 《JavaScript 高级程序设计》：**有权访问另一个函数作用域中变量的函数**；
- MDN：函数与其词法环境的引用捆绑在一起；
- 一句话：**内部函数引用了外部函数的变量，并把内部函数传到外部使用**。

### 4.2 形成条件

1. 函数嵌套；
2. 内部函数引用了外部函数的变量（自由变量）；
3. 内部函数被传递到外部函数作用域之外使用。

```js
function outer() {
  let count = 0 // 被 inner 引用
  function inner() {
    count++
    console.log(count)
  }
  return inner // 传到外部
}

const fn = outer() // outer 已执行完
fn() // 1
fn() // 2 —— count 依然活着
```

### 4.3 从执行上下文角度理解闭包（本质）

1. 调用 `outer()` 创建 outer 的执行上下文，其中保存了 `count`；
2. 定义 `inner` 时，inner 内部持有一个**对外层词法环境的引用**；
3. outer 执行完毕，其执行上下文本应销毁；
4. 但因为 inner 还引用着这个环境，**引擎保留被引用的那部分变量**；
5. 这个「函数 + 被保留的外层环境」就是闭包。

```text
outer() 调用结束后：
+--------------------------------+
|  inner 函数对象                 |
|   - 代码体                      |
|   - [[Scope]] --> outer 的环境   |
|                   { count: 2 }  |  <-- 被闭包保留
+--------------------------------+
```

验证「保存的是引用，不是快照」：

```js
function foo() {
  var a = 1
  function bar() {
    console.log(a)
  }
  a = 2 // 先改再 return，闭包看到的是最新值
  return bar
}
foo()() // 2，不是 1
```

### 4.4 为什么闭包变量不会被回收（GC 视角）

- 垃圾回收常用**标记清除**：从根（全局、当前调用栈）出发，标记所有可达对象，不可达的回收；
- 只要内部函数还存活（被外部引用），它引用的外层变量就是**可达的**，不会被回收；
- 现代引擎（V8）会做优化：只保留**真正被内部函数用到的变量**，没被用到的照常释放。

## 五、经典考题

### 5.1 循环与 setTimeout（三种解法）

```js
// 原题：输出什么？
for (var i = 0; i < 3; i++) {
  setTimeout(() => console.log(i), 0)
}
// 输出 3 3 3
// 原因：var 无块级作用域，三个回调共享同一个 i；
//       等异步执行时循环早已结束，i 已是 3
```

解法一：let（每轮循环生成新的块级变量）

```js
for (let i = 0; i < 3; i++) {
  setTimeout(() => console.log(i), 0) // 0 1 2
}
```

解法二：IIFE 每轮把 i 拷贝进参数 j，形成独立闭包

```js
for (var i = 0; i < 3; i++) {
  ;(function (j) {
    setTimeout(() => console.log(j), 0) // 0 1 2
  })(i)
}
```

解法三：setTimeout 第三个参数（额外参数直接传给回调）

```js
for (var i = 0; i < 3; i++) {
  setTimeout((j) => console.log(j), 0, i) // 0 1 2
}
```

### 5.2 返回函数数组

```js
function createFunctions() {
  var result = []
  for (var i = 0; i < 3; i++) {
    result[i] = function () {
      return i // 共享同一个 i
    }
  }
  return result
}

const fns = createFunctions()
console.log(fns[0]()) // 3
console.log(fns[1]()) // 3
console.log(fns[2]()) // 3
// 改成 let 即输出 0 1 2
```

### 5.3 闭包计数器

```js
function createCounter() {
  let count = 0 // 完全私有
  return {
    inc: () => ++count,
    dec: () => --count,
    get: () => count
  }
}

const counter = createCounter()
counter.inc()
counter.inc()
counter.dec()
console.log(counter.get()) // 1
console.log(counter.count) // undefined —— 外部无法直接访问
```

## 六、闭包的应用场景

### 6.1 私有变量 / 模块模式

```js
const userModule = (function () {
  let name = '小明' // 私有
  function getName() {
    return name
  }
  return { getName } // 只暴露需要的方法
})()

console.log(userModule.getName()) // '小明'
console.log(userModule.name)      // undefined
```

### 6.2 柯里化（参数复用）

```js
function add(a) {
  return function (b) {
    return a + b // a 被闭包保留
  }
}
add(1)(2) // 3

// 实际应用：预置配置
function createLogger(prefix) {
  return function (msg) {
    console.log(`[${prefix}] ${msg}`)
  }
}
const warn = createLogger('WARN')
warn('磁盘不足') // [WARN] 磁盘不足
```

### 6.3 函数缓存 / 记忆化

```js
function memoize(fn) {
  const cache = new Map()
  return function (...args) {
    const key = JSON.stringify(args)
    if (!cache.has(key)) cache.set(key, fn.apply(this, args))
    return cache.get(key)
  }
}

// 斐波那契从 O(2^n) 优化到 O(n)
const fib = memoize(function (n) {
  return n <= 1 ? n : fib(n - 1) + fib(n - 2)
})
```

### 6.4 防抖节流

```js
function debounce(fn, delay) {
  let timer = null // timer 被闭包保留，跨多次调用共享
  return function (...args) {
    clearTimeout(timer)
    timer = setTimeout(() => fn.apply(this, args), delay)
  }
}
```

## 七、闭包的问题与内存泄漏

### 7.1 内存占用

被闭包引用的变量**常驻内存**，直到闭包本身不可达。

### 7.2 意外泄漏场景

```js
// 场景 1：定时器持有闭包，忘记清理
function start() {
  const bigData = new Array(1000000).fill('x')
  setInterval(() => console.log(bigData.length), 1000) // bigData 无法回收
  // 应保存 interval id，不用时 clearInterval
}

// 场景 2：事件监听持有闭包
function bind() {
  const el = document.getElementById('btn')
  const data = { huge: new Array(1000000) }
  el.addEventListener('click', () => console.log(data)) // data 无法回收
  // 元素移除前应 removeEventListener
}
```

### 7.3 怎么避免

1. 不再使用的定时器：`clearInterval` / `clearTimeout`；
2. 元素销毁前：`removeEventListener`；
3. 不再需要闭包时：解除对内部函数的引用（如 `fn = null`），整条引用链变为不可达，GC 自然回收。

## 八、高频面试题速答

| 问题 | 参考答案 |
| --- | --- |
| 闭包是什么？ | 函数 + 其词法环境的引用，能让外部函数的变量在函数结束后仍被访问 |
| 闭包形成的条件？ | 函数嵌套 + 内部函数引用外部变量 + 内部函数被传到外部使用 |
| 闭包保存的是值的快照吗？ | 不是，保存的是变量的引用，外部修改内部可见 |
| 闭包的用途？ | 私有变量、模块模式、柯里化、缓存、防抖节流 |
| 闭包的缺点？ | 变量常驻内存，滥用或未清理定时器/监听可能导致内存泄漏 |
| var 循环 + setTimeout 为什么输出 3 3 3？ | var 无块级作用域，三个回调共享同一个 i，异步执行时循环已结束 |
| 怎么销毁闭包？ | 释放对内部函数的引用，使整体不可达，交给 GC |
| let 为什么能解决循环输出问题？ | 每轮循环生成新的块级变量，每个回调闭包引用各自的 i |
| 变量提升的原理？ | 创建阶段先登记声明，赋值留在执行阶段；let/const 有 TDZ |

## 九、速记卡

```text
1. 作用域在「定义时」确定，与调用位置无关（词法作用域）
2. 查找变量：当前作用域 -> 定义时外层 -> 全局（作用域链）
3. 闭包 = 内部函数 + 被保留的外层环境引用
4. 闭包保存的是引用，不是快照
5. 闭包变量可达就不回收，不可达时整体销毁
6. var 循环共享 i；let 每轮新 i；IIFE 传参拷贝 i
```
