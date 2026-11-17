# ES6+ 核心特性

> 面试频率：⭐⭐⭐⭐ | 覆盖：解构、箭头函数、Symbol、Map/Set/WeakMap、Iterator/Generator、Proxy/Reflect、ES Module

## 面试回答（开口版）

如果面试官问「你熟悉 ES6 的哪些特性」，可以这样回答：

> 用得最多的语法层面是解构赋值、扩展运算符、模板字符串；理解比较深的是新增数据结构：Symbol 解决键名冲突，Map/Set 补齐了真正的键值对和集合类型，WeakMap 的弱引用能防止内存泄漏。再往底层是迭代协议 Iterator 和 Generator——for...of 能遍历的底层就是 `Symbol.iterator`，async/await 本质是 Generator 加自动执行器。Proxy 和 Reflect 是元编程能力，Vue3 的响应式就是 Proxy 拦截 get/set 加依赖收集实现的。模块化上 ES Module 是编译时静态确定依赖、导出的是引用，CommonJS 是运行时加载、导出的是值的拷贝，这也是 tree shaking 只对 ESM 生效的原因。

**答题要点：** 语法层 → 新增数据结构 → 迭代协议/Generator → Proxy/Reflect → 模块化

## 一、解构赋值

**一句话：按「对应位置」（数组）或「同名属性」（对象）把值取出来，直接声明变量。**

### 1.1 数组解构——按位置

```js
const [a, b] = [1, 2]
console.log(a, b) // 1 2

// 跳过某些位置
const [first, , third] = [1, 2, 3]
console.log(first, third) // 1 3

// 默认值：对应位置严格等于 undefined 才生效
const [x = 10, y = 20] = [1]
console.log(x, y) // 1 20

// 嵌套解构
const [m, [n]] = [1, [2]]
console.log(m, n) // 1 2
```

### 1.2 对象解构——按属性名

```js
const { name, age } = { name: '小明', age: 18 }

// 重命名：原属性名: 新变量名
const { name: userName } = { name: '小明' }

// 重命名 + 默认值
const { name: nick = '无名' } = { age: 18 }
console.log(nick) // '无名'

// 嵌套解构
const { info: { city } } = { info: { city: '上海' } }
console.log(city) // '上海'
```

### 1.3 函数参数解构（高频）

```js
// 参数对象解构 + 默认值，调用时更清晰、无需记参数顺序
function createUser({ name, age = 18, role = 'user' } = {}) {
  console.log(name, age, role)
}
createUser({ name: '小明' }) // 小明 18 user
createUser()                 // undefined 18 user（外层默认 {} 兜底）
```

### 1.4 经典应用

```js
// 变量交换（不用临时变量）
let a = 1, b = 2
;[a, b] = [b, a]

// 提取接口返回
const { data: { list, total } } = await res.json()

// rest 搭配解构：去掉敏感字段
const { password, ...safeUser } = user

// 模块按需导入
import { ref, computed } from 'vue'
```

### 1.5 易错点与技巧

```js
// 1. 已声明的变量再解构必须加括号（否则 {} 被解析为块语句）
let x
// { x } = { x: 1 }  // SyntaxError
({ x } = { x: 1 })   // 正确

// 2. 字符串也可以解构（可迭代就能解构）
const [c1, c2] = 'hi' // 'h' 'i'

// 3. 函数返回多值
function usePoint() {
  return [10, 20]
}
const [px, py] = usePoint()

// 4. 嵌套太深时建议分步解构，可读性优先
const { data } = await fetchUser()
const { user } = data
const { profile } = user
// 而不是一次性 const { data: { user: { profile } } } = ...
```
## 二、模板字符串

```js
const name = '小明'
const score = 92

// 1. 嵌入变量与任意表达式
const msg = `${name} 的分数是 ${score > 90 ? '优秀' : '良好'}`

// 2. 多行字符串（保留换行与缩进）
const html = `
  <div class="card">
    <h2>${name}</h2>
  </div>
`

// 3. 标签模板：函数名 + 模板字符串，自定义拼接逻辑
function tag(strings, ...values) {
  return strings.reduce((res, str, i) => res + str + (values[i] ?? ''), '')
}
tag`你好, ${name}, 分数 ${score}` // '你好, 小明, 分数 92'
```

::: tip 标签模板的实际应用
styled-components、防 XSS 转义等库都基于标签模板实现。
:::

### 2.1 嵌套模板（列表渲染）

模板里可以再嵌模板，配合 map / join 渲染列表：

```js
const users = [
  { name: '小明', vip: true },
  { name: '小红', vip: false }
]

const html = `
  <ul>
    ${users
      .map(
        (u) => `
        <li class="${u.vip ? 'vip' : ''}">${u.name}</li>`
      )
      .join('')}
  </ul>
`
```
## 三、参数默认值 / rest / spread

### 3.1 参数默认值

```js
function greet(name = '游客') {
  console.log(`你好, ${name}`)
}
greet()          // 你好, 游客
greet('小明')    // 你好, 小明
greet(undefined) // 你好, 游客（undefined 触发默认值）
greet(null)      // 你好, null（null 不触发默认值！）
```

要点：

- 只有**严格等于 `undefined`** 才触发默认值，`null` / `0` / `''` 都不会；
- 默认值表达式是**惰性求值**：不触发就不执行；
- 有默认值的参数之后的参数都可以省略。

### 3.2 rest 参数——收集

```js
function sum(...nums) { // 把多余参数「收集」成数组
  return nums.reduce((a, b) => a + b, 0)
}
sum(1, 2, 3) // 6

// rest 必须是最后一个参数
function f(a, ...rest) {}  // 正确
// function f(...rest, a) {} // SyntaxError
```

### 3.3 扩展运算符——展开

```js
// 数组展开
Math.max(...[3, 1, 2]) // 3

// 合并（浅拷贝）
const merged = [...arr1, ...arr2]
const obj = { ...obj1, ...obj2 }

// 把字符串拆成字符（依赖 Iterator）
const chars = [...'abc'] // ['a', 'b', 'c']
```

### 3.4 rest vs spread vs arguments

同一个符号 `...`，方向相反：

```text
rest   在函数参数位置 —— 把多个值「收集」成数组
spread 在调用/字面量位置 —— 把数组/对象「展开」成多个值
```

| 对比项 | rest 参数 | arguments |
| --- | --- | --- |
| 类型 | 真数组 | 类数组（无 map/filter） |
| 箭头函数 | 可用 | 不可用（箭头函数没有 arguments） |
| 可自定义名字 | `...args` | 只能叫 arguments |

### 3.5 高频用法

```js
// 1. 替代 apply 展开传参
Math.max.apply(null, [3, 1, 2]) // 旧写法
Math.max(...[3, 1, 2])          // 新写法

// 2. 对象合并：后展开的覆盖先展开的（默认值合并常用）
const defaults = { theme: 'light', size: 12 }
const config = { ...defaults, size: 14 } // size 覆盖为 14

// 3. 展开是浅拷贝：嵌套对象仍然共享
const a = { info: { x: 1 } }
const b = { ...a }
b.info.x = 2
console.log(a.info.x) // 2 —— 嵌套层共享
```
## 四、箭头函数

### 4.1 与普通函数的区别（必背）

| 特性 | 普通函数 | 箭头函数 |
| --- | --- | --- |
| this | 调用时确定 | 定义时继承外层，不可被 call/bind 改变 |
| arguments | 有 | 没有（可用 `...rest` 替代） |
| 构造函数 | 可以 new | 不可以 new（无 prototype） |
| 变量提升 | 函数声明有提升 | 无提升（const 赋值，有 TDZ） |
| yield | 可作 Generator 函数 | 不可以 |

```js
const obj = {
  name: 'obj',
  say: function () {
    console.log(this.name) // 'obj'，谁调用指向谁
  },
  sayArrow: () => {
    console.log(this && this.name) // 外层作用域（全局）
  }
}
```

### 4.2 不适合箭头函数的场景

- 对象方法（this 需指向对象本身）；
- 原型方法；
- DOM 事件中需要 this 指向元素时；
- 需要 arguments 的函数。

> this 相关的深入讲解见《this 指向》。
## 五、Symbol——第七种基本类型

### 5.1 是什么

表示**独一无二的值**，核心用途是**防止属性名冲突**。

```js
const s1 = Symbol('id')
const s2 = Symbol('id')
console.log(s1 === s2) // false —— 描述相同，值依然唯一
```

### 5.2 特性

```js
const key = Symbol('secret')
const obj = { [key]: '隐藏值', name: '小明' }

// 1. 常规遍历拿不到 Symbol 键
console.log(Object.keys(obj))       // ['name']
for (const k in obj) console.log(k) // 'name'

// 2. 但不是真正的私有
console.log(Object.getOwnPropertySymbols(obj)) // [Symbol(secret)]
console.log(obj[key])                          // '隐藏值'

// 3. Symbol.for 走全局注册表：相同 key 返回同一个 Symbol
console.log(Symbol.for('a') === Symbol.for('a')) // true
```

### 5.3 应用场景

1. 对象的「内部」属性，避免与外部属性名冲突；
2. 定义不会重复的常量：`const COLOR_RED = Symbol()`；
3. 框架源码中标记内部属性（Vue 源码大量使用）。

### 5.4 内置 Symbol（常考）

**内置 Symbol（Well-Known Symbols）是什么？**

语言规范**预先定义在 Symbol 构造函数上**的一批 Symbol 值，充当对象与 JS 引擎之间的「协议接口」：引擎在执行 for...of、instanceof、toString 这些底层操作时，会先到对象上找对应的内置 Symbol 方法，找到就调用你的实现。

**一句话：改写语言底层行为的钩子（hook）。**

#### Symbol.iterator —— 最常考

定义对象的**默认迭代器**。`for...of`、扩展运算符 `[...obj]`、数组解构在执行前都会先找它：

```js
const obj = {
  data: [1, 2, 3],
  [Symbol.iterator]() {
    let i = 0
    const data = this.data
    return {
      next: () =>
        i < data.length
          ? { value: data[i++], done: false }
          : { value: undefined, done: true }
    }
  }
}

for (const v of obj) console.log(v) // 1 2 3 —— for...of 走它
console.log([...obj])               // [1, 2, 3] —— 展开走它
const [a, b] = obj                  // 解构也走它
```

> 这就是「普通对象为什么不能 for...of」的完整答案：没实现 `Symbol.iterator`。

#### Symbol.hasInstance —— 自定义 instanceof

机制：`a instanceof B` 并不是黑魔法，等价于 `B[Symbol.hasInstance](a)`。重写它就能自定义判断逻辑：

```js
class Even {
  static [Symbol.hasInstance](num) {
    return typeof num === 'number' && num % 2 === 0
  }
}

console.log(2 instanceof Even) // true —— 走我们自定义的判断
console.log(3 instanceof Even) // false
```

> 关联考点：手写 instanceof 时，若右值实现了 `Symbol.hasInstance` 应优先调用它。

#### Symbol.toStringTag —— 自定义类型标签

修改 `Object.prototype.toString.call(obj)` 返回的标签：

```js
class Person {}
console.log(Object.prototype.toString.call(new Person())) // '[object Object]'

class User {
  [Symbol.toStringTag] = 'User'
}
console.log(Object.prototype.toString.call(new User())) // '[object User]'
```

内置类型也在用它：`Object.prototype.toString.call(new Map())` 得到 `'[object Map]'`。

#### Symbol.asyncIterator —— for await...of

定义**异步迭代器**，配合 `for await...of` 逐个消费异步数据（分页拉取的经典写法）：

```js
const pager = {
  current: 0,
  total: 3,
  async *[Symbol.asyncIterator]() {
    while (this.current < this.total) {
      this.current++
      const res = await fetch(`/api/page/${this.current}`)
      yield await res.json()
    }
  }
}

for await (const page of pager) {
  console.log(page) // 一页一页地拿到数据
}
```

#### Symbol.toPrimitive —— 自定义隐式转换（加分项）

对象参与 `+`、`*`、比较等运算时，引擎调用它把对象转成原始值：

```js
const money = {
  value: 100,
  [Symbol.toPrimitive](hint) {
    // hint 有三种：'number' | 'string' | 'default'
    if (hint === 'number') return this.value
    if (hint === 'string') return `¥${this.value}`
    return this.value // default：如 + 拼接、== 比较
  }
}

console.log(money * 2)  // 200 —— 数字场景
console.log(`${money}`) // '¥100' —— 字符串场景
```

#### 记忆表：引擎的操作与对应的钩子

| 你做的操作 | 引擎去找谁 |
| --- | --- |
| `for...of` / `[...obj]` / 解构 | `Symbol.iterator` |
| `a instanceof B` | `B[Symbol.hasInstance]` |
| `Object.prototype.toString.call(obj)` | `Symbol.toStringTag` |
| `for await...of` | `Symbol.asyncIterator` |
| 隐式类型转换（+、*、==） | `Symbol.toPrimitive` |

**面试一句话：**

> 内置 Symbol 是规范预定义的协议钩子——引擎执行 for...of、instanceof、toString 这些底层操作时，会先到对象上找对应的 Symbol 方法，找到就用你的实现，找不到才走默认行为。
## 六、Map / Set / WeakMap / WeakSet

### 6.1 Set——值唯一的集合

```js
const s = new Set([1, 2, 2, 3, 3])
console.log(s.size) // 3

s.add(4).delete(1)
console.log(s.has(2)) // true

// 经典应用：数组去重
const unique = [...new Set([1, 1, 2, 3, 3])] // [1, 2, 3]

// 判重规则是 SameValueZero：NaN 也算相等
new Set([NaN, NaN]).size // 1
```

**判重细节（考点）：**

1. Set 判重用的是 **SameValueZero**：`NaN` 等于 `NaN`（区别于 `===`），`+0` 与 `-0` 视为相同；
2. **对象永远不重复**——比较的是引用地址，内容一样的两个对象也是不同的值：

```js
new Set([{ id: 1 }, { id: 1 }]).size // 2 —— 引用不同，不算重复
```

**核心应用：**

```js
// 1. 数组 / 字符串去重
[...new Set([1, 1, 2, 3])]        // [1, 2, 3]
[...new Set('aabbcc')].join('')   // 'abc'

// 2. 权限 / 标签管理（存在性判断 O(1)）
const can = new Set(['edit', 'delete'])
can.has('edit') // true

// 3. 请求去重：进行中的接口不重复发
const pending = new Set()
if (!pending.has(url)) {
  pending.add(url)
  fetch(url).finally(() => pending.delete(url))
}
```
### 6.2 Map——键可以是任意类型的键值对

```js
const m = new Map()
m.set('name', '小明')
m.set(123, '数字键')
m.set({ id: 1 }, '对象键') // Object 做不到：对象键会被转成 '[object Object]'

console.log(m.get('name')) // '小明'
console.log(m.size)        // 3
```

Map vs Object：

| 对比项 | Object | Map |
| --- | --- | --- |
| 键的类型 | 字符串 / Symbol | 任意类型 |
| 键的顺序 | 数字键在前，其余按插入序 | 严格按插入顺序 |
| 获取大小 | 手动计算 | `size` |
| 频繁增删 | 未优化 | 性能更好 |
| JSON 直接序列化 | 支持 | 不支持 |

**键相等规则（考点）：** 同样是 SameValueZero——`NaN` 作为键可以取到，`+0` / `-0` 是同一个键：

```js
const m = new Map()
m.set(NaN, '找到了')
m.get(NaN) // '找到了' —— 普通对象做不到（NaN 会被转成字符串 'NaN'）
```

**核心应用——用对象做键（Object 做不到）：**

```js
// 给 DOM 节点关联元数据
const panels = new Map()
panels.set(btnEl, { clicked: 0, config: {} })

btnEl.addEventListener('click', () => {
  const meta = panels.get(btnEl)
  meta.clicked++
})
```

**get 与 has 的区别（高频坑）：** `get` 返回 `undefined` 不代表不存在——值本身可能就是 undefined；**判断键是否存在一律用 `has`**。
### 6.3 WeakMap——弱引用键

```js
const wm = new WeakMap()
let obj = { id: 1 }
wm.set(obj, '缓存数据')

obj = null // 外部引用断开
// { id: 1 } 无其他强引用 -> GC 可回收，WeakMap 条目自动消失
```

特点：

1. **键只能是对象**（值任意）；
2. **弱引用**：不阻止键被垃圾回收，防内存泄漏；
3. **不可遍历**、没有 size；
4. 典型应用：私有数据、缓存（如手写深拷贝里的 map）、DOM 关联数据。

**WeakMap 三大核心应用（面试重点）：**

```js
// 1. 模拟私有属性：外部拿不到内部数据
const privateData = new WeakMap()
class Person {
  constructor(name) {
    privateData.set(this, { name }) // 键是实例本身
  }
  getName() {
    return privateData.get(this).name
  }
}
// 实例被回收时，私有数据跟着自动回收，不泄漏

// 2. 计算结果缓存（memoize 的正确姿势）
const cache = new WeakMap()
function getHeight(el) {
  if (!cache.has(el)) {
    cache.set(el, el.getBoundingClientRect().height) // 耗时计算
  }
  return cache.get(el)
}
// 元素销毁 -> 缓存条目自动消失

// 3. DOM 监听绑定关系管理：节点删除后记录自动释放
const listeners = new WeakMap()
```

Vue3 响应式的依赖容器 `targetMap` 就是 WeakMap（见第九节）。

**为什么 WeakMap 不能遍历？** 键随时可能被 GC 回收，遍历过程中成员可能凭空消失、结果不可靠，所以规范干脆不提供 size 和遍历方法。
### 6.4 四种结构对比

| | Set | Map | WeakSet | WeakMap |
| --- | --- | --- | --- | --- |
| 存的内容 | 值 | 键值对 | 对象 | 键(对象) + 值 |
| 唯一性 | 值唯一 | 键唯一 | 值唯一 | 键唯一 |
| 可遍历 | 是 | 是 | 否 | 否 |
| 弱引用 | 否 | 否 | 是 | 是 |
| 典型场景 | 去重 | 高频增删的字典 | 存对象不阻止回收 | 私有数据 / 缓存 |

### 6.5 Set 交并差集（高频手写）

```js
const A = new Set([1, 2, 3])
const B = new Set([2, 3, 4])

// 并集
new Set([...A, ...B]) // {1,2,3,4}

// 交集
new Set([...A].filter((x) => B.has(x))) // {2,3}

// 差集（A 有 B 没有）
new Set([...A].filter((x) => !B.has(x))) // {1}
```

口诀：**并集直接拼，交集 filter has，差集 has 前加感叹号**。

### 6.6 Map 的遍历与互转

```js
const m = new Map([
  ['a', 1],
  ['b', 2]
])

// 遍历：Map 本身可迭代，直接解构键值对
for (const [key, value] of m) {
  console.log(key, value)
}

// forEach 注意：参数顺序是「值在前，键在后」
m.forEach((value, key) => console.log(key, value))

// Map -> Object
const obj = Object.fromEntries(m) // { a: 1, b: 2 }

// Object -> Map
const m2 = new Map(Object.entries(obj))
```
### 6.7 选型指南：Object / Map / WeakMap / Set

| 场景 | 选择 | 原因 |
| --- | --- | --- |
| 需要 JSON 序列化、固定结构配置 | Object | 直接 JSON.stringify，Map 不行 |
| 键不是字符串、频繁增删、需要 size | Map | 键类型任意 + 增删性能更好 |
| 需要遍历键值对 | Map | 自带迭代器；Object 要 Object.entries |
| 以对象为键、随对象销毁自动释放 | WeakMap | 弱引用防泄漏 |
| 值去重、存在性判断 | Set | 引用级唯一 + O(1) has |

**一句话选型：能序列化用 Object，当字典用 Map，怕泄漏用 WeakMap，要去重用 Set。**
## 七、Iterator 与 for...of

### 7.1 迭代协议

对象要能被 `for...of` 遍历，必须实现 `[Symbol.iterator]` 方法，调用后返回带 `next()` 的迭代器；`next()` 返回 `{ value, done }`。

```js
// 手写一个可迭代对象
const counter = {
  from: 1,
  to: 3,
  [Symbol.iterator]() {
    let cur = this.from
    const last = this.to
    return {
      next() {
        return cur <= last
          ? { value: cur++, done: false }
          : { value: undefined, done: true }
      }
    }
  }
}

for (const num of counter) console.log(num) // 1 2 3
console.log([...counter])                   // [1, 2, 3]
```

### 7.2 原生可迭代的对象

Array、String、Map、Set、arguments、NodeList——所以它们都能用 for...of、扩展运算符、数组解构。**普通对象默认不可迭代**（没有实现 Symbol.iterator）。

### 7.3 for...of vs for...in

| | for...of | for...in |
| --- | --- | --- |
| 遍历什么 | **值**（调用迭代协议） | **键名**（字符串） |
| 适用对象 | 可迭代对象（数组/字符串/Map/Set） | 任意对象 |
| 原型链 | 不涉及 | 包含继承的可枚举属性 |

```js
Array.prototype.foo = '污染' // 仅演示，别这么干

const arr = [1, 2, 3]
for (const v of arr) console.log(v) // 1 2 3
for (const k in arr) console.log(k) // '0' '1' '2' 'foo' —— 还会拿到原型上的键
```

### 7.4 底层关联

数组解构 `[a, b] = arr` 和展开 `[...arr]` 依赖 Iterator；**对象展开 `{ ...obj }` 是 ES2018 的独立语法，不走 Iterator**。

### 7.5 用 class 实现可迭代对象（Range 类）

```js
class Range {
  constructor(from, to) {
    this.from = from
    this.to = to
  }
  [Symbol.iterator]() {
    let cur = this.from
    const last = this.to
    return {
      next: () =>
        cur <= last
          ? { value: cur++, done: false }
          : { value: undefined, done: true }
    }
  }
}

const r = new Range(1, 3)
console.log([...r])               // [1, 2, 3]
for (const n of r) console.log(n) // 1 2 3
```

> 手写 next 有点繁琐？下一节用 Generator 三行就能实现迭代器。
### 7.6 迭代器是一次性的 + return 方法（深度考点）

**1. 迭代器是一次性消费品**：遍历完（done: true）就耗尽。可迭代对象每次调用 `[Symbol.iterator]()` 会返回**新的**迭代器，所以数组能反复遍历：

```js
const arr = [1, 2]
const it = arr[Symbol.iterator]() // 手动拿一个迭代器

for (const v of it) console.log(v) // 1 2
for (const v of it) console.log(v) // 空！这个迭代器已耗尽
for (const v of arr) console.log(v) // 1 2 —— 数组每次返回新迭代器
```

**2. break 时引擎会调用 `iterator.return()`**：用于清理资源（如关闭文件流）：

```js
const it2 = {
  [Symbol.iterator]() {
    return {
      next: () => ({ value: 1, done: false }),
      return() {
        // break / throw / return 提前退出时被调用
        console.log('清理资源')
        return { done: true }
      }
    }
  }
}

for (const v of it2) break // 打印：清理资源
```
## 八、Generator——可暂停的函数

### 8.1 基本语法

```js
function* gen() {
  console.log('start')
  const a = yield 1
  console.log('a =', a)
  const b = yield 2
  console.log('b =', b)
  return 3
}

const it = gen()
console.log(it.next())    // 打印 start，返回 { value: 1, done: false }
console.log(it.next(100)) // 打印 a = 100，返回 { value: 2, done: false }
console.log(it.next(200)) // 打印 b = 200，返回 { value: 3, done: true }
```

### 8.2 执行机制

- `next()` 执行到下一个 `yield` 处**暂停**，返回 `{ value: yield表达式的值, done }`；
- `next(param)` 的参数会**赋给上一个 yield 表达式的返回值**（第一次 next 传参无效）；
- Generator 是「惰性执行、可暂停、可恢复」的函数，天然适合表示异步流程。

### 8.3 与 async/await 的关系

```js
// async/await 的等价 Generator 写法
async function fn() {
  const a = await promise1
  const b = await promise2
}

function* fnGen() {
  const a = yield promise1
  const b = yield promise2
}
// spawn(fnGen()) 自动执行（实现见《async / await 专题》第三节）
```

区别：Generator 的恢复时机由外部 `next()` 控制；async/await 由引擎在 Promise resolve 后自动恢复。

### 8.4 yield* 委托

`yield*` 把另一个可迭代对象的值**逐个交出来**，常用于组合生成器：

```js
function* inner() {
  yield 1
  yield 2
}
function* outer() {
  yield 0
  yield* inner() // 委托给 inner
  yield 3
}
console.log([...outer()]) // [0, 1, 2, 3]
```

### 8.5 用 Generator 实现迭代器（最简写法）

yield 会自动生成 `{ value, done }`，实现 `Symbol.iterator` 不用手写 next：

```js
const counter = {
  from: 1,
  to: 3,
  *[Symbol.iterator]() {
    for (let i = this.from; i <= this.to; i++) {
      yield i
    }
  }
}

console.log([...counter]) // [1, 2, 3]
```

对比上一节手写 next 的版本：生成器版只要 3 行核心代码。

### 8.6 惰性求值（无限序列）

Generator 按需生成，可以表示「无限」序列而不死循环：

```js
function* naturals() {
  let i = 1
  while (true) yield i++ // 无限循环，但每次只产出一个
}

const [a, b, c] = naturals() // 1 2 3 —— 拿几个算几个
```
### 8.7 Generator 考点小结

| 考点 | 一句话 |
| --- | --- |
| 本质 | 可以暂停/恢复的函数，调用返回迭代器 |
| 返回值 | 既是迭代器又是可迭代对象（`[Symbol.iterator]()` 返回自身） |
| next(param) | 参数赋给**上一个** yield 的返回值，第一次传参无效 |
| done 判定 | return 的值出现在最后一次 next 的 value 里，done 为 true |
| yield* | 委托给另一个可迭代对象逐个交值 |
| 惰性 | `while(true) + yield` 表示无限序列，按需取值 |
| 与 async/await | Generator + 自动执行器（spawn）就是它的原理 |
| 手写迭代器 | `*[Symbol.iterator]()` 三行搞定，不用手写 next |
## 九、Proxy / Reflect——元编程

### 9.1 Proxy 基本用法

Proxy 在目标对象外层加一层「拦截」，外界访问都要经过这层：

```js
const user = { name: '小明', age: 18 }

const proxy = new Proxy(user, {
  get(target, key, receiver) {
    console.log(`读取 ${key}`)
    return Reflect.get(target, key, receiver)
  },
  set(target, key, value, receiver) {
    console.log(`设置 ${key} = ${value}`)
    return Reflect.set(target, key, value, receiver)
  }
})

proxy.name     // 打印：读取 name，返回 '小明'
proxy.age = 20 // 打印：设置 age = 20
```

### 9.2 常用拦截操作

| trap | 拦截时机 |
| --- | --- |
| get | 读取属性 |
| set | 设置属性 |
| has | `in` 操作符 |
| deleteProperty | `delete` 操作 |
| apply | 函数调用（目标本身是函数） |
| construct | `new` 操作 |

### 9.3 Reflect 是什么

与 Proxy 的 trap **一一对应**的「默认行为」集合：`Reflect.get` 就是取属性的默认行为、`Reflect.set` 就是赋值的默认行为。

好处：

1. API 统一（不再混用 `Object.defineProperty` 等历史方法）；
2. 失败返回 `false` 而不是抛错，方便处理；
3. 第三个参数 `receiver` 能正确处理继承场景的 this。

**经验法则：Proxy 拦截时，用 Reflect 执行对应的默认行为。**

### 9.4 Vue3 响应式原理（简化版）

```js
const targetMap = new WeakMap() // 依赖收集容器

function track(target, key) {
  /* 把当前副作用函数记录到 targetMap */
}
function trigger(target, key) {
  /* 取出依赖并重新执行 */
}

function reactive(obj) {
  return new Proxy(obj, {
    get(target, key, receiver) {
      track(target, key) // 读取时收集依赖
      return Reflect.get(target, key, receiver)
    },
    set(target, key, value, receiver) {
      const result = Reflect.set(target, key, value, receiver)
      trigger(target, key) // 修改时触发更新
      return result
    }
  })
}
```

对比 Vue2 的 `Object.defineProperty`：Proxy 能监听**新增/删除属性和数组索引变化**，不再需要 `$set`，初始化时也无需递归整棵对象树，性能更好。

### 9.5 嵌套对象的响应式（惰性递归）

真实对象的属性往往是嵌套对象。Vue3 的做法是**取到时才递归代理**：

```js
function reactive(obj) {
  return new Proxy(obj, {
    get(target, key, receiver) {
      track(target, key)
      const value = Reflect.get(target, key, receiver)
      // 惰性递归：访问到嵌套对象时才包装，而不是初始化时全量递归
      if (value !== null && typeof value === 'object') {
        return reactive(value)
      }
      return value
    },
    set(target, key, value, receiver) {
      const result = Reflect.set(target, key, value, receiver)
      trigger(target, key)
      return result
    }
  })
}
```

**对比 Vue2 的关键性能差异：**

| | Vue2 defineProperty | Vue3 Proxy |
| --- | --- | --- |
| 初始化 | 递归整棵对象树，全量劫持 | 只代理第一层，访问到才递归 |
| 新增/删除属性 | 监听不到，需要 $set / $delete | get/set/deleteProperty 天然支持 |
| 数组 | 需要重写七个方法 | 直接监听索引和 length |
### 9.6 Proxy 高频应用场景（面试加分）

#### 应用一：数据校验

```js
const user = new Proxy(
  {},
  {
    set(target, key, value) {
      if (key === 'age' && typeof value !== 'number') {
        throw new TypeError('age 必须是数字')
      }
      if (key === 'age' && (value < 0 || value > 150)) {
        throw new RangeError('age 超出范围')
      }
      target[key] = value
      return true
    }
  }
)

user.age = 18  // 正常
user.age = 'x' // TypeError: age 必须是数字
```

#### 应用二：负索引数组（Python 风格）

```js
function negativeArray(arr) {
  return new Proxy(arr, {
    get(target, key, receiver) {
      const index = Number(key)
      if (index < 0) key = String(target.length + index) // -1 -> 最后一位
      return Reflect.get(target, key, receiver)
    }
  })
}

const arr = negativeArray([10, 20, 30])
arr[-1] // 30
```

#### 应用三：私有属性保护（_ 开头禁止访问）

```js
function protect(obj) {
  return new Proxy(obj, {
    get(target, key, receiver) {
      if (key.startsWith('_')) throw new Error('禁止访问私有属性 ' + key)
      return Reflect.get(target, key, receiver)
    },
    has(target, key) {
      if (key.startsWith('_')) return false // '_x' in obj 也返回 false
      return Reflect.has(target, key)
    }
  })
}

const s = protect({ _secret: 1, name: 'ok' })
s.name          // 'ok'
s._secret       // Error: 禁止访问私有属性 _secret
'_secret' in s  // false —— has 拦截也生效
```
## 十、ES Module

### 10.1 基本语法

```js
// 导出
export const name = '小明'
export default function createUser() {}

// 导入
import createUser, { name } from './user.js'
import * as userModule from './user.js'
import('./dynamic.js') // 动态导入：返回 Promise，用于懒加载
```

### 10.2 与 CommonJS 区别（必背）

| 对比项 | ES Module | CommonJS |
| --- | --- | --- |
| 加载时机 | **编译时**静态确定依赖 | **运行时**加载 |
| 导出的内容 | **值的引用**（实时绑定） | **值的拷贝** |
| 语法位置 | import 必须顶层静态声明 | require 可在任意位置动态调用 |
| 顶层 this | `undefined` | `module.exports` |
| 循环依赖 | 拿到实时绑定，可能遇到未初始化（TDZ） | 拿到已执行部分的导出 |
| Tree shaking | 支持（静态分析） | 不支持 |

值的引用 vs 值的拷贝：

```js
// ESM: counter.js
export let count = 0
export function inc() { count++ }

// main.js
import { count, inc } from './counter.js'
console.log(count) // 0
inc()
console.log(count) // 1 —— 拿到的是同一份引用（实时绑定）

// CommonJS 里同样的代码，count 依然是 0（拿到的是导入时的拷贝）
```

### 10.3 tree shaking 原理

打包器（Webpack / Rollup / Vite）在**编译阶段**分析 import/export 的静态结构，把没被任何地方导入的导出直接剔除。所以 tree shaking 只对 ESM 生效——CommonJS 的 `require(变量)` 是运行时才知道路径，无法静态分析。

### 10.4 动态 import 实战（路由懒加载）

静态 import 必须在顶层，动态 `import()` 返回 **Promise**，按需加载：

```js
// Vue Router 路由懒加载的底层就是动态 import
const routes = [
  { path: '/', component: () => import('./views/Home.vue') },
  { path: '/about', component: () => import('./views/About.vue') }
]
// 用户访问 /about 时才下载 About.vue 对应的 chunk
```

### 10.5 循环依赖的表现

```js
// a.js
import { b } from './b.js'
export const a = 'a'

// b.js
import { a } from './a.js'
export const b = () => a // 延迟访问
```

- **ESM**：导出的是「引用」，`b()` 被调用时 `a` 已初始化，能拿到 `'a'`；
- **CommonJS**：导出的是值的拷贝，如果 b 在 a 完成赋值前就访问，拿到的可能是 `undefined`。
### 10.6 ESM 考点深挖

**1. export default 的本质**：default 只是一个**名为 `default` 的导出**，一个模块只能有一个，但可以和具名导出共存：

```js
// user.js
export default function createUser() {}
export const name = '小明'

// main.js —— default 写法是具名写法的语法糖
import createUser, { name } from './user.js'
import { default as createUser2 } from './user.js' // 完全等价
```

**2. import 进来的是只读绑定**：不能重新赋值（类似 const），但对象内部属性可以改（引用不变）：

```js
import { count } from './counter.js'
count = 5 // TypeError: Assignment to constant variable
```

**3. 静态 import 会被提升**：import 在编译阶段处理，写在模块任何位置都相当于在最顶部——这也是它必须顶层静态声明的原因（引擎要先建依赖图）。

**4. 副作用导入**：只执行模块、不取任何值时，常用于 polyfill 和样式：

```js
import './polyfill.js'
import './style.css'
```
## 十一、其他常用新特性

### 11.1 可选链 ?. / 空值合并 ??

```js
// 可选链：左侧为 null/undefined 时短路，不报错
const city = user?.address?.city
const fn = obj?.method?.() // 函数调用也可以可选

// 空值合并：只有 null/undefined 才用右侧默认值
const count = props.count ?? 0

// 对比 || 的坑：0、''、false 都会被 || 误跳过
const num1 = 0 ?? 100 // 0  ✅ 语义正确
const num2 = 0 || 100 // 100 ❌ 0 被误当成「空值」
```

**考点补充：**

1. `?.` 是**短路**操作：左侧为 null / undefined 时，右侧完全不求值（函数也不会被调用）；
2. 不能用于赋值左侧：`obj?.a = 1` 是语法错误；
3. `??` 不能和 `&&` / `||` 直接混用，必须加括号：`(a ?? b) || c`，否则语法报错。
### 11.2 常用新增方法速查

| 方法 | 作用 | 示例 |
| --- | --- | --- |
| `Array.from` | 类数组/可迭代转真数组 | `Array.from({ length: 3 }, (_, i) => i)` |
| `arr.includes` | 是否包含（能判断 NaN） | `[NaN].includes(NaN) // true` |
| `arr.find / findIndex` | 按条件找第一个 | `[1, 2].find((n) => n > 1) // 2` |
| `arr.flat / flatMap` | 扁平化 | `[1, [2, [3]]].flat(Infinity)` |
| `Object.assign` | 合并对象（浅拷贝） | `Object.assign({}, a, b)` |
| `Object.entries` | 键值对数组 | `Object.entries({ a: 1 })` |
| `str.padStart / padEnd` | 补齐长度 | `'1'.padStart(2, '0') // '01'` |
| `str.trimStart / trimEnd` | 去首/尾空格 | `' a '.trimStart()` |
| `arr.at` | 按索引取（支持负数） | `[1, 2, 3].at(-1) // 3` |

### 11.3 逻辑赋值运算符（ES2021）

```js
// ||=：左边为 falsy 才赋值
user.count ||= 1

// &&=：左边为 truthy 才赋值
state.loaded &&= true

// ??=：左边为 null/undefined 才赋值（比 ||= 更安全）
options.size ??= 10 // size 为 0 时不会被覆盖（||= 会）
```
## 十二、高频面试题速答

| 问题 | 参考答案 |
| --- | --- |
| 解构默认值何时生效？ | 对应位置严格等于 undefined 时；null 不触发 |
| Symbol 有什么用？ | 唯一值防止键名冲突；常规遍历拿不到；Symbol.for 走全局注册表 |
| Map 和 Object 区别？ | Map 键可为任意类型、按插入顺序、有 size、频繁增删性能更好 |
| WeakMap 为什么能防内存泄漏？ | 键是弱引用不阻止 GC，键对象被回收时条目自动消失 |
| Set 怎么去重？ | `[...new Set(arr)]`；SameValueZero 规则下 NaN 也算相等 |
| for...of 和 for...in 区别？ | of 遍历值、走迭代协议、不涉及原型链；in 遍历字符串键、含继承可枚举属性 |
| 普通对象为什么不能 for...of？ | 没有实现 `[Symbol.iterator]`，手动实现即可遍历 |
| Generator 的 next(param) 参数去哪了？ | 赋给上一个 yield 表达式的返回值，第一次 next 传参无效 |
| Proxy 和 Reflect 的关系？ | Proxy 负责拦截，Reflect 提供与 trap 一一对应的默认行为 |
| Vue3 为什么用 Proxy 替代 defineProperty？ | 能监听新增/删除属性和数组变化，不需要 $set，性能更好 |
| ESM 和 CommonJS 最核心的区别？ | ESM 编译时静态加载、导出引用；CJS 运行时加载、导出拷贝 |
| ?? 和 \|\| 的区别？ | ?? 只对 null/undefined 生效；\|\| 会把 0、''、false 也当空值跳过 |
| 已声明的变量解构为什么要加括号？ | 不加括号时 `{}` 会被解析为块语句，导致语法错误 |
| Set 怎么求交集/并集/差集？ | 并：`[...A, ...B]`；交：`[...A].filter(x => B.has(x))`；差：条件加 `!` |
| yield* 是什么？ | 委托语法，把另一个可迭代对象的值逐个交出来 |
| 怎么最快给对象实现迭代器？ | `*[Symbol.iterator]() { yield ... }`，yield 自动生成 next |
| 动态 import 返回什么？ | Promise，resolve 的值是加载完成的模块对象 |
| Object.fromEntries 作用？ | 键值对数组转对象，是 Object.entries 的逆操作 |
| ??= 和 \|\|= 区别？ | ??= 只在 null/undefined 时赋值；\|\|= 对所有 falsy 赋值（0、' 会误触发） |
| Map.get 返回 undefined 能说明键不存在吗？ | 不能，值可能就是 undefined；判断存在用 has |
| 为什么 WeakMap 不能遍历？ | 键随时可能被 GC 回收，遍历结果不可靠 |
| 迭代器可以重复使用吗？ | 一次性，耗尽后要重新调用 Symbol.iterator 获取新的 |
| for...of 中 break 会发生什么？ | 调用迭代器的 return 方法做清理（如有） |
| export default 的本质？ | 一个名为 'default' 的具名导出 |
| import 的绑定能重新赋值吗？ | 不能，只读绑定；对象内部属性可以改 |

## 十三、速记卡

```text
1. 解构：数组按位置、对象按名字，默认值只在 undefined 时生效
2. Symbol：唯一、防键名冲突、常规遍历拿不到
3. Set 去重、Map 任意键、WeakMap 弱引用防泄漏
4. for...of 走 Symbol.iterator，for...in 走键名且含原型链
5. Generator = 可暂停函数，next 参数赋给上一个 yield
6. Proxy 拦截 + Reflect 默认行为 = Vue3 响应式
7. ESM 静态加载导出引用，CJS 运行时加载导出拷贝
8. ?? 只管 null/undefined，|| 会误伤 0、''、false
```
