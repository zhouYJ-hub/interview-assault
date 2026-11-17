# 深浅拷贝

> 面试频率：⭐⭐⭐⭐⭐（必默写手写版）| 关联考点：引用类型、递归、WeakMap、垃圾回收

## 面试回答（开口版）

如果面试官问「浅拷贝和深拷贝的区别」，可以这样回答：

> 我会先从内存模型讲起：原始值存在栈里，赋值就是复制值；而引用类型的变量存的是堆内存的地址，赋值只是复制地址，两个变量仍然指向同一个对象。在这个基础上，**浅拷贝**只复制对象的第一层，比如扩展运算符、`Object.assign`，嵌套的对象依然是共享的；**深拷贝**则递归复制所有层级，得到完全独立的副本。常见的 JSON 序列化方案有明显缺陷：`undefined`、函数、`Symbol` 会丢失，`Date` 变字符串、`RegExp` 变空对象，循环引用直接报错。所以手写深拷贝要抓住三个关键点：基本类型直接返回作为递归出口；用 `WeakMap` 缓存已拷贝对象解决循环引用；对 `Date`、`RegExp`、`Map`、`Set` 做特殊分支。现代环境也可以直接用 `structuredClone`，它原生支持循环引用，但不支持函数和 DOM 节点。

**答题要点：** 栈堆内存 → 三者区别 → JSON 八宗罪 → 手写三要素 → structuredClone
## 一、先搞懂内存：栈与堆

### 1.1 原始值 vs 引用值

| | 原始值 | 引用值 |
| --- | --- | --- |
| 类型 | Number / String / Boolean / null / undefined / Symbol / BigInt | Object / Array / Function / Date / RegExp / Map / Set |
| 存储位置 | **栈**中直接存值 | **栈**中存「引用地址」，数据本体在**堆**中 |
| 赋值行为 | 复制值，两份独立 | 复制地址，两个变量指向同一个堆对象 |

```js
// 原始值：复制内容
let a = 10
let b = a
b = 20
console.log(a) // 10 —— 互不影响

// 引用值：复制地址
let obj1 = { name: '小明' }
let obj2 = obj1
obj2.name = '小红'
console.log(obj1.name) // '小红' —— 同一个对象
```

### 1.2 内存示意图

```text
栈 (Stack)                 堆 (Heap)
+-----------+            +-------------------+
| obj1  0x01| ---------> | { name: '小明' }  |
+-----------+            +-------------------+
| obj2  0x01| ---------> ↑（同一个地址）
+-----------+
```

## 二、赋值 / 浅拷贝 / 深拷贝

### 2.1 三者对比

```js
const source = { name: '小明', info: { age: 18 } }

// 1. 赋值：连第一层都不复制，只是复制地址
const assigned = source

// 2. 浅拷贝：第一层独立，嵌套层共享
const shallow = { ...source }

// 3. 深拷贝：所有层级独立
const deep = structuredClone(source)
```

```text
赋值：       source 和 assigned       --> 同一个对象
浅拷贝：     shallow 是新对象，但 shallow.info 和 source.info --> 同一个子对象
深拷贝：     deep 是新对象，deep.info 也是全新子对象
```

### 2.2 验证代码

```js
const a = { info: { age: 18 }, tags: ['前端'] }

// 赋值
const b = a
b.info.age = 20
console.log(a.info.age) // 20 —— 完全共享

// 浅拷贝
const c = { ...a }
c.info.age = 30
c.tags.push('Vue')
console.log(a.info.age) // 30 —— 嵌套对象共享
console.log(a.tags)     // ['前端', 'Vue'] —— 嵌套数组共享
console.log(c.name === a.name) // 但第一层属性独立

// 深拷贝
const d = structuredClone(a)
d.info.age = 40
console.log(a.info.age) // 30 —— 完全独立
```

## 三、浅拷贝的常见方法

| 方法 | 适用 | 说明 |
| --- | --- | --- |
| `Object.assign({}, obj)` | 对象 | 第一层拷贝 |
| 展开运算符 `{ ...obj }` / `[...arr]` | 对象/数组 | 第一层拷贝 |
| `arr.slice()` | 数组 | 第一层拷贝 |
| `arr.concat()` | 数组 | 第一层拷贝 |
| `Array.from(arr)` | 类数组/数组 | 第一层拷贝 |

```js
const obj = { a: 1, nested: { b: 2 } }
const copy = Object.assign({}, obj)

copy.a = 100
copy.nested.b = 200

console.log(obj.a)            // 1 —— 第一层独立
console.log(obj.nested.b)     // 200 —— 嵌套共享
```

## 四、JSON 方案的八大缺陷（必背）

```js
const copy = JSON.parse(JSON.stringify(obj))
```

| # | 问题 | 表现 |
| --- | --- | --- |
| 1 | `undefined` | 属性直接丢失 |
| 2 | 函数 | 属性直接丢失 |
| 3 | `Symbol` | 属性直接丢失 |
| 4 | `Date` | 变成 ISO 字符串，不再是 Date 对象 |
| 5 | `RegExp` | 变成空对象 `{}` |
| 6 | `NaN` / `Infinity` | 变成 `null` |
| 7 | 循环引用 | 直接抛错 Maximum call stack |
| 8 | 原型链 | 丢失（constructor 变 Object） |

逐条演示：

```js
const obj = {
  u: undefined,
  f: function () {},
  s: Symbol('s'),
  d: new Date(),
  r: /hello/g,
  n: NaN,
  e: Infinity
}

const copy = JSON.parse(JSON.stringify(obj))
console.log(copy) 
// { d: '2026-01-01T00:00:00.000Z', r: {}, n: null, e: null }
// u、f、s 全部丢失；d 变字符串；r 变空对象；n、e 变 null

// 循环引用直接报错
const cyclic = { name: 'cyclic' }
cyclic.self = cyclic
JSON.parse(JSON.stringify(cyclic)) // TypeError: Converting circular structure to JSON
```

## 五、手写深拷贝

### 5.1 第一版：基础递归

```js
function deepClone(target) {
  // 基本类型和函数直接返回
  if (target === null || typeof target !== 'object') return target

  const clone = Array.isArray(target) ? [] : {}
  for (const key in target) {
    if (Object.prototype.hasOwnProperty.call(target, key)) {
      clone[key] = deepClone(target[key]) // 递归拷贝每一层
    }
  }
  return clone
}
```

问题一：**循环引用会栈溢出**（对象引用自己，递归死循环）。

```js
const a = {}
a.self = a
deepClone(a) // Maximum call stack size exceeded
```

问题二：Date、RegExp、Map、Set 等特殊类型被拷成普通对象。

### 5.2 完整版：面试推荐默写版

```js
function deepClone(target, map = new WeakMap()) {
  // 0. 递归出口：基本类型 / 函数 / null 直接返回
  if (target === null || typeof target !== 'object') return target

  // 1. 循环引用检查放最前面：任何类型都可能引用自己
  if (map.has(target)) return map.get(target)

  // 2. 特殊类型分支
  if (target instanceof Date) return new Date(target)
  if (target instanceof RegExp) return new RegExp(target.source, target.flags)

  if (target instanceof Map) {
    const clone = new Map()
    map.set(target, clone) // 先登记缓存，再递归
    target.forEach((value, key) => {
      clone.set(deepClone(key, map), deepClone(value, map))
    })
    return clone
  }

  if (target instanceof Set) {
    const clone = new Set()
    map.set(target, clone)
    target.forEach((value) => clone.add(deepClone(value, map)))
    return clone
  }

  // 3. 数组 / 普通对象：保留原型，类实例拷完还是那个类
  const clone = Array.isArray(target)
    ? []
    : Object.create(Object.getPrototypeOf(target))
  map.set(target, clone)

  // 4. Reflect.ownKeys：字符串键 + Symbol 键都能拷到
  for (const key of Reflect.ownKeys(target)) {
    clone[key] = deepClone(target[key], map)
  }
  return clone
}
```

**方法逐段解读：**

1. **递归出口（第 0 步）**：`null`、基本类型、函数直接返回——它们没有「内部结构」需要拷贝，同时也是递归的终止条件；
2. **循环引用检查（第 1 步）**：WeakMap 里维护着「原对象 → 拷贝对象」的映射，只要当前对象拷贝过，立刻返回缓存的那份。两个作用：**避免重复拷贝、防止循环引用导致无限递归**；
3. **特殊类型（第 2 步）**：
   - `Date`、`RegExp` 没法通过遍历属性拷贝，必须 `new` 一个新的出来；
   - `Map`、`Set` 的成员同样可能引用自己，所以**先创建克隆容器并登记缓存，再逐个深拷贝成员**；
4. **克隆载体（第 3 步）**：数组给 `[]`；对象用 `Object.create(Object.getPrototypeOf(...))` 创建——保留原型链，class 实例拷完还是那个类。老规矩：**先登记缓存，再开始递归**；
5. **递归拷贝（第 4 步）**：`Reflect.ownKeys` 同时拿到字符串键和 Symbol 键，每个键的值再走一遍 `deepClone`，一层层复制下去。

一句话总结流程：**判类型 → 查缓存 → 特殊类型单独建 → 新对象先登记 → 递归拷每个键**。
### 5.3 手写要点（面试官关注什么）

1. **基本类型直接返回**（递归出口）；
2. **缓存检查放在所有分支最前面**——不只是普通对象，Map/Set 同样可能循环引用；
3. **先登记缓存再递归**——先递归再登记的话，循环引用时还没来得及缓存就死循环了；
4. **Date / RegExp / Map / Set 单独分支**；
5. **`Object.create` 保留原型**——类实例拷完不丢类型；
6. **`Reflect.ownKeys` 连 Symbol 键一起拷**。
### 5.4 为什么用 WeakMap 而不是 Map？

- `Map` 对键是**强引用**：即使外部不再需要原对象，Map 依然拉着它不放，可能造成内存泄漏；
- `WeakMap` 的键是**弱引用**：不阻止垃圾回收，原对象销毁时对应条目自动消失。

深拷贝场景中，缓存只在拷贝过程中使用，用完就该可回收，所以 WeakMap 更合适。

### 5.5 验证

```js
const a = { name: 'a' }
a.self = a
a.list = [1, [2, 3]]

const b = deepClone(a)

console.log(b.name)        // 'a'
console.log(b.self === b)  // true —— 循环结构被正确还原
console.log(b.self === a)  // false —— 指向拷贝后的新对象
console.log(b.list[1] === a.list[1]) // false —— 深层独立

// Map 内部循环引用也不会死循环
const m = new Map()
m.set('self', m)
const m2 = deepClone(m)
console.log(m2.get('self') === m2) // true —— 指向拷贝后的新 Map

// 类实例保留原型
class Person {
  constructor(name) { this.name = name }
}
const p = new Person('小明')
const p2 = deepClone(p)
console.log(p2 instanceof Person) // true —— 原型还在

// Symbol 键也能拷到
const s = Symbol('id')
const obj = { [s]: 1 }
console.log(deepClone(obj)[s]) // 1
```
## 六、structuredClone：现代内置方案

浏览器 / Node 17+ 内置的深拷贝 API：

```js
const copy = structuredClone(obj)
```

支持：循环引用、Date、RegExp、Map、Set、TypedArray、Blob 等。

不支持：**函数、DOM 节点**，函数所在的属性会直接丢失（抛 DataCloneError）。

```js
structuredClone({ fn: () => {} }) // DataCloneError
```

## 七、各方案对比总结

| 方式 | 第一层独立 | 嵌套独立 | 循环引用 | 函数 | Date/RegExp/Map/Set |
| --- | --- | --- | --- | --- | --- |
| 赋值 | 否 | 否 | - | - | - |
| 浅拷贝 | 是 | 否 | - | - | - |
| JSON | 是 | 是 | 否，报错 | 丢失 | 变形/丢失 |
| 手写 deepClone | 是 | 是 | 是 | 原样返回 | 可支持 |
| structuredClone | 是 | 是 | 是 | 报错 | 支持 |

## 八、性能与选择建议

| 场景 | 推荐方案 |
| --- | --- |
| 只有一层结构的浅拷贝 | 展开运算符 / Object.assign |
| 需要深拷贝且环境支持 | structuredClone（最快最省心） |
| 需要保留函数 | 手写 deepClone 或 lodash.cloneDeep |
| 超大对象 + 频繁拷贝 | 考虑 Immutable 数据结构或共享引用代替拷贝 |

## 九、高频面试题速答

| 问题 | 参考答案 |
| --- | --- |
| 浅拷贝和深拷贝区别？ | 是否递归复制嵌套的引用类型 |
| JSON 深拷贝有什么问题？ | 丢失 undefined/函数/Symbol，Date/RegExp 变形，循环引用报错，原型丢失 |
| 手写深拷贝怎么处理循环引用？ | WeakMap 缓存已拷贝对象，再次遇到直接返回 |
| 为什么先 set 再递归？ | 防止递归进入循环引用时还未登记导致死循环 |
| 为什么用 WeakMap 不用 Map？ | 弱引用不阻止 GC，避免内存泄漏 |
| structuredClone 的局限？ | 不支持函数和 DOM 节点 |
| 赋值是浅拷贝吗？ | 不是，赋值连第一层都没复制，只复制了引用地址 |

## 十、速记卡

```text
1. 栈存原始值与引用地址，堆存引用值本体
2. 赋值 = 复制地址；浅拷贝 = 复制第一层；深拷贝 = 递归复制全部
3. JSON 方案八宗罪：undefined/函数/Symbol 丢失，Date/RegExp 变形，
   NaN/Infinity 变 null，循环引用报错，原型丢失
4. 手写三要素：基本类型终止 + WeakMap 防循环 + 特殊类型分支
5. WeakMap 键是弱引用，不阻止垃圾回收
```
