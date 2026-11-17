# this 指向

> 面试频率：⭐⭐⭐⭐⭐ | 关联考点：call/apply/bind、箭头函数、new、手写题

## 面试回答（开口版）

如果面试官问「this 的指向规则」，可以这样回答：

> this 看**怎么调用**，有四种规则：独立调用指向 `window`（**默认绑定**）；谁调用指向谁（**隐式绑定**）；`call` / `apply` / `bind` 手动指定（**显式绑定**）；`new` 的时候指向新实例（**new 绑定**）。优先级是 **new > 显式 > 隐式 > 默认**。特例是箭头函数：没有自己的 this，取**定义时外层**的 this，call、bind 都改不动。一句话总结：**普通函数看怎么调用，箭头函数看在哪里定义**。

**答题要点：** 四大规则 → 优先级 → 箭头函数特例 → 判断口诀
## 一、为什么需要 this？

同一套函数逻辑，希望根据**调用者**不同操作不同对象：

```js
function sayName() {
  console.log(this.name) // this 到调用时才知道是谁
}

const p1 = { name: '小明' }
const p2 = { name: '小红' }

sayName.call(p1) // '小明'
sayName.call(p2) // '小红'
```

`this` 让函数可以在**不同对象间复用**，是 JS 面向对象的基础机制。

::: tip 核心认知
this 在**定义时**无法确定，在**调用时**才确定（箭头函数除外）。看 this，永远看「**谁在调用、怎么调用**」。
:::

## 二、四大绑定规则

### 2.1 规则一：默认绑定

函数被**独立调用**（前面没有任何对象），非严格模式指向 `window`（浏览器）/`globalThis`，严格模式为 `undefined`。

```js
function foo() {
  console.log(this)
}
foo() // window（非严格模式）

'use strict'
function bar() {
  console.log(this)
}
bar() // undefined
```

### 2.2 规则二：隐式绑定

函数作为**对象的方法**调用，this 指向**调用它的对象**（谁点出来的指向谁）。

```js
const obj = {
  name: 'obj',
  say() {
    console.log(this.name)
  }
}
obj.say() // 'obj' —— this 指向 obj

// 多级访问，只看最近一层
const outer = {
  inner: { name: 'inner', say() { console.log(this.name) } }
}
outer.inner.say() // 'inner' —— 指向最近的 inner
```

### 2.3 隐式丢失（高频陷阱，4 种场景）

隐式绑定的函数一旦**脱离对象独立调用**，就退化为默认绑定：

```js
const obj = {
  name: 'obj',
  say() {
    console.log(this.name)
  }
}

// 场景 1：赋值给变量
const fn = obj.say
fn() // undefined —— 独立调用

// 场景 2：作为参数传递（回调）
setTimeout(obj.say, 0) // undefined —— 回调独立执行

// 场景 3：立即调用
;(obj.say)() // 'obj' —— 这种不算丢失，注意区分
;(obj.say = obj.say)() // undefined —— 赋值表达式的值是函数本身

// 场景 4：解构
const { say } = obj
say() // undefined
```

解决方案：用箭头函数包裹、bind、或在调用处保持 `obj.method()` 形式。

```js
setTimeout(() => obj.say(), 0)       // 'obj'
setTimeout(obj.say.bind(obj), 0)     // 'obj'
```

### 2.4 规则三：显式绑定 —— call / apply / bind

三者都能指定 this，区别在于**调用方式与传参方式**：

| 方法 | 是否立即执行 | 参数形式 | 返回值 |
| --- | --- | --- | --- |
| call | 是 | 逐个传 `fn.call(obj, a, b)` | fn 的执行结果 |
| apply | 是 | 数组传 `fn.apply(obj, [a, b])` | fn 的执行结果 |
| bind | 否（返回新函数） | 可预置，后续可补 `fn.bind(obj, a)(b)` | 绑定后的新函数 |

```js
function intro(job, city) {
  console.log(this.name + ' - ' + job + ' - ' + city)
}
const p = { name: '小明' }

intro.call(p, '前端', '上海')    // 小明 - 前端 - 上海
intro.apply(p, ['前端', '上海']) // 小明 - 前端 - 上海
intro.bind(p, '前端')('上海')    // 小明 - 前端 - 上海
```

特殊传值：`call/apply/bind` 第一个参数传 `null/undefined`，非严格模式下 this 变为 window：

```js
function fn() { console.log(this) }
fn.call(null) // window（非严格模式）
```

### 2.5 规则四：new 绑定

构造函数中的 this 指向**新创建的实例**，优先级最高。

```js
function Person(name) {
  this.name = name // this 指向新实例
}
const p = new Person('小明')
console.log(p.name) // '小明'
```

## 三、优先级验证

```text
new 绑定 > bind/call/apply 显式绑定 > 隐式绑定(obj.fn) > 默认绑定
```

代码验证：

```js
function foo(name) {
  this.name = name
}

const obj = { foo }
obj.foo('隐式')
console.log(obj.name) // '隐式' —— 隐式绑定生效

const bound = foo.bind({ name: '初始' })
bound('显式')
console.log(bound === foo) // false

// new 优先级高于 bind
const inst = new bound('new 的')
console.log(inst.name) // 'new 的' —— new 时 this 指向新实例
```

## 四、箭头函数的 this（深度）

箭头函数**没有自己的 this**，它的 this 取**定义时所在外层作用域**的 this（词法 this）：

1. **定义时确定**，之后任何方式都无法修改；
2. call / apply / bind 对它**无效**（传了也忽略）；
3. 不能作为构造函数（无 `[[Construct]]`、无 prototype）；
4. 没有 arguments / super / new.target。

```js
const obj = {
  name: 'obj',
  sayArrow: () => {
    console.log(this) // 定义时外层是全局作用域 -> window
  }
}
obj.sayArrow()                       // window
obj.sayArrow.call({ name: '修改' })  // 依然是 window，改不动
```

最经典的应用 —— 回调里保持外层 this：

```js
const timer = {
  seconds: 0,
  start() {
    // 普通函数：this 指向 window，this.seconds 变 NaN
    // setInterval(function () { this.seconds++ }, 1000)

    // 箭头函数：this 取外层 start() 的 this，即 timer
    setInterval(() => {
      this.seconds++
      console.log(this.seconds)
    }, 1000)
  }
}
timer.start()
```

::: warning 不适合用箭头函数的场景
- 对象方法（this 需要指向对象本身）；
- 原型方法；
- 需要 arguments 的函数；
- 构造函数 / 事件绑定中需要指向 DOM 元素时。
:::

## 五、特殊场景的 this

| 场景 | this 指向 |
| --- | --- |
| DOM 事件处理函数（普通函数） | 绑定事件的元素 |
| DOM 事件（箭头函数） | 外层作用域（通常 window） |
| class 方法（普通调用） | 实例 |
| class 中把方法当回调传出去 | undefined（需 bind 或箭头包装） |
| setTimeout 普通函数回调 | window（非严格） |
| 立即执行函数 IIFE | 非严格 window |
| call/apply/bind 传 null/undefined | 非严格下 window |

```js
// class 方法丢失 this 的经典坑
class Logger {
  constructor() {
    this.name = 'logger'
  }
  print() {
    console.log(this.name)
  }
}
const logger = new Logger()
const p = logger.print
p() // TypeError —— class 内部严格模式，this 为 undefined

// 解决：构造函数中绑定
// this.print = this.print.bind(this)
// 或定义为箭头函数属性：print = () => { ... }
```

## 六、手写 call / apply / bind（必默写）

### 6.1 手写 call

思路：把函数临时挂到目标对象上，用 `obj.fn()` 隐式绑定，再删掉临时属性。

```js
Function.prototype.myCall = function (ctx, ...args) {
  ctx = ctx === null || ctx === undefined ? globalThis : Object(ctx)
  const key = Symbol('fn') // 防 key 冲突
  ctx[key] = this
  const result = ctx[key](...args) // 隐式绑定：this 指向 ctx
  delete ctx[key]
  return result
}
```

### 6.2 手写 apply

与 call 唯一区别：第二个参数是数组。

```js
Function.prototype.myApply = function (ctx, args) {
  ctx = ctx === null || ctx === undefined ? globalThis : Object(ctx)
  const key = Symbol('fn')
  ctx[key] = this
  const result = args ? ctx[key](...args) : ctx[key]()
  delete ctx[key]
  return result
}
```

### 6.3 手写 bind

```js
Function.prototype.myBind = function (ctx, ...args) {
  const fn = this
  return function (...rest) {
    return fn.apply(ctx, [...args, ...rest])
  }
}
```

面试加强版（考虑 new 调用返回的绑定函数）：

```js
Function.prototype.myBind2 = function (ctx, ...args) {
  const fn = this
  function bound(...rest) {
    // 用 new 调用时，this 指向新实例，应走普通调用逻辑
    return fn.apply(this instanceof bound ? this : ctx, [...args, ...rest])
  }
  bound.prototype = Object.create(fn.prototype)
  return bound
}
```

### 6.4 多次 bind 只生效一次

```js
function fn() { console.log(this.name) }
const a = { name: 'A' }
const b = { name: 'B' }

const bound1 = fn.bind(a)
const bound2 = bound1.bind(b)
bound2() // 'A' —— 第一次 bind 已永久绑定，后续无效
```

## 七、经典输出题

### 题目 1

```js
const name = 'window'

const obj = {
  name: 'obj',
  say: function () {
    console.log(this.name)
  },
  sayArrow: () => {
    console.log(this.name)
  }
}

obj.say()                      // 'obj'
const f = obj.say
f()                            // 'window'（隐式丢失）
obj.sayArrow()                 // 'window'（箭头不接收隐式绑定）
obj.say.call({ name: 'call' }) // 'call'
```

### 题目 2

```js
const foo = function () {
  console.log(this.a)
}.bind({ a: 1 })

const obj2 = { a: 2, foo }
obj2.foo() // 1 —— bind 优先级高于隐式绑定
```

### 题目 3：嵌套函数

```js
const obj = {
  name: 'obj',
  outer() {
    console.log(this.name)     // 'obj' —— outer 被 obj 调用
    const inner = function () {
      console.log(this.name)   // undefined —— inner 独立调用（默认绑定）
    }
    inner()
    const innerArrow = () => {
      console.log(this.name)   // 'obj' —— 继承 outer 的 this
    }
    innerArrow()
  }
}
obj.outer()
```

### 题目 4：对象方法返回箭头函数

```js
const obj = {
  name: 'obj',
  getArrow() {
    return () => console.log(this.name) // 箭头定义在 getArrow 内
  }
}

const arrow = obj.getArrow()
arrow()        // 'obj' —— 箭头捕获 getArrow 调用时的 this（obj）

const arrow2 = obj.getArrow.call({ name: 'other' })
arrow2()       // 'other' —— 定义时外层 this 已被 call 改变
```

## 八、高频面试题速答

| 问题 | 参考答案 |
| --- | --- |
| this 指向哪里？ | 看调用方式：new > 显式 > 隐式 > 默认；箭头函数看定义处 |
| 箭头函数 this？ | 没有自身 this，捕获定义时外层的 this，且不可被 call 改变 |
| call/apply/bind 区别？ | call 逐个传参；apply 数组传参；bind 返回绑定后的新函数不立即执行 |
| 多次 bind 会怎样？ | 只有第一次生效，后续 bind 无效 |
| call 传 null？ | 非严格模式 this 变 window，严格模式就是 null |
| 隐式丢失是什么？ | 方法被赋值/传参/解构后独立调用，this 退化为默认绑定 |
| 怎么固定 class 方法的 this？ | 构造函数中 bind，或定义为箭头函数属性 |
| 优先级顺序？ | new > bind/call/apply > 隐式 > 默认 |

## 九、速记卡

```text
1. this 在调用时确定（箭头函数在定义时确定）
2. new > 显式(bind/call/apply) > 隐式(obj.fn) > 默认
3. 隐式丢失三兄弟：赋值、传参、解构
4. 箭头函数没有 this，取外层，且改不动
5. call 逐个传参，apply 数组传参，bind 返回新函数
6. 多次 bind 只认第一次
```
