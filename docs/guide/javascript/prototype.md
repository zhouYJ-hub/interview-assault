# 原型与原型链

> 面试频率：⭐⭐⭐⭐⭐ | 关联考点：`new`、`instanceof`、继承、`class`、`Object.create`

## 面试回答（开口版）

如果面试官问「原型和原型链是什么」，可以这样回答：

> 我是这样理解的：JavaScript 是基于原型的语言，每个函数都有一个 `prototype` 属性，指向一个原型对象，上面存放所有实例共享的方法；而每个对象都有一个 `__proto__`，指向它构造函数的 `prototype`。访问对象属性时，如果自身没有，引擎就沿 `__proto__` 逐级向上查找，一直到 `Object.prototype`，而它的 `__proto__` 是 `null`，这就是原型链的终点。所以 JS 的继承本质就是基于这条查找链——实例链接到构造函数的原型，构造函数的原型再链接到 `Object.prototype`。ES6 的 `class` 和 `extends` 底层也是寄生组合式继承的语法糖。

**答题要点：** `prototype` / `__proto__` / `constructor` 三件套 → 属性查找规则 → 终点 `null` → 与继承、class 的关系
## 一、为什么需要原型？

### 1.1 问题：方法放在实例上太浪费内存

如果方法定义在构造函数内部（挂在 this 上），每个实例都会复制一份：

```js
function Person(name) {
  this.name = name
  this.sayHi = function () { // 每个实例各有一份
    console.log('Hi, ' + this.name)
  }
}

const p1 = new Person('小明')
const p2 = new Person('小红')

console.log(p1.sayHi === p2.sayHi) // false —— 两个不同的函数对象
```

一万个实例 = 一万个 `sayHi`，浪费内存。

### 1.2 解决：共享方法放到原型上

JS 把**所有实例共享的内容**放到构造函数的 `prototype` 上，实例通过原型链共用一份：

```js
function Person(name) {
  this.name = name // 每个实例独有
}
Person.prototype.sayHi = function () { // 所有实例共享
  console.log('Hi, ' + this.name)
}

const p1 = new Person('小明')
const p2 = new Person('小红')

console.log(p1.sayHi === p2.sayHi) // true —— 共享同一个函数
```

::: tip 划重点
- **实例独有**的属性（如 name）→ 写在构造函数里；
- **共享**的方法 → 写在原型上。

原型的意义：**省内存 + 实现代码复用**。
:::

## 二、核心三件套

### 2.1 `prototype`（显式原型）—— 函数独有

每个函数创建时都会自动带上 `prototype` 属性，指向一个普通对象，用于存放**所有实例共享**的属性和方法。

```js
function Person(name) {
  this.name = name
}

Person.prototype.sayHi = function () {
  console.log('Hi, I am ' + this.name)
}
```

三个细节：

1. `prototype` 默认只有一个 `constructor` 属性；
2. 它本质是普通对象（原型对象）；
3. **不是所有函数都有**：箭头函数、`bind` 返回的函数没有 `prototype`，所以不能当构造函数。

```js
const arrow = () => {}
console.log(arrow.prototype) // undefined

const bound = (function () {}).bind(null)
console.log(bound.prototype) // undefined
```

### 2.2 `__proto__`（隐式原型）—— 所有对象都有

实例通过 `__proto__`（规范内部叫 `[[Prototype]]`）指向其构造函数的 `prototype`。

```js
const p = new Person('小明')

console.log(p.__proto__ === Person.prototype) // true
```

::: warning 注意
`__proto__` 是历史遗留的非标准写法，实际开发请使用 `Object.getPrototypeOf(obj)` / `Object.setPrototypeOf(obj, proto)`。
:::

### 2.3 `constructor` —— 指回构造函数

原型对象默认包含一个 `constructor` 属性，指回构造函数，形成闭环。

```js
console.log(Person.prototype.constructor === Person) // true
console.log(p.constructor === Person)                // true（沿原型链找到）
```

注意：`constructor` 是一个普通属性，**可以被改写**，用它判断类型并不可靠（详见后文「常见坑」）。

### 2.4 三角关系图

```text
         constructor
Person   <-------------------   Person.prototype
   |                                   ^
   | new                               | __proto__
   v                                   |
   p   ------------__proto__-----------+
```

验证：

```js
console.log(p.__proto__ === Person.prototype)              // true
console.log(Person.prototype.constructor === Person)       // true
console.log(p.constructor === Person)                      // true
console.log(Person.__proto__ === Function.prototype)       // true
```

## 三、原型链查找详解

### 3.1 读取属性的查找规则

1. 先查**对象自身**属性；
2. 没有则沿 `__proto__` 到原型对象上找；
3. 依次向上，直到 `Object.prototype`；
4. `Object.prototype.__proto__ === null`，查找终止，返回 `undefined`。

```js
function Person(name) {
  this.name = name // 自身属性
}
Person.prototype.type = '人类'                 // 原型第一层
Object.prototype.belongsTo = '万物'             // 原型链顶层

const p = new Person('小明')

console.log(p.name)       // '小明'     —— 自身找到
console.log(p.type)       // '人类'     —— Person.prototype 找到
console.log(p.belongsTo)  // '万物'     —— Object.prototype 找到
console.log(p.notExist)   // undefined  —— 链路尽头没找到
```

链路示意：

```text
p --> Person.prototype --> Object.prototype --> null
```

### 3.2 属性遮蔽（Shadowing）—— 读写不对称

**读**属性会沿原型链向上找；**写**属性永远只写在对象自身，不会修改原型：

```js
function Person() {}
Person.prototype.name = '原型上的名字'

const p = new Person()
console.log(p.name) // '原型上的名字' —— 自身没有，去原型找

p.name = '自己的名字' // 在自身创建同名属性，遮蔽原型属性
console.log(p.name)                      // '自己的名字'
console.log(p.hasOwnProperty('name'))    // true
console.log(Person.prototype.name)       // '原型上的名字' —— 原型没被改

delete p.name // 删除自身属性，解除遮蔽
console.log(p.name) // '原型上的名字' —— 又能看到了
```

::: tip 面试要点
读写不对称：赋值 `p.x = 1` 会在 p 自身创建 x（除非原型链上有 setter），**绝不会沿链向上覆盖**原型上的 x。
:::

### 3.3 怎么判断属性在自身还是原型上？

| 写法 | 查找范围 |
| --- | --- |
| `p.hasOwnProperty(key)` | 仅自身 |
| `key in p` | 自身 + 整条原型链 |
| `Object.keys(p)` | 仅自身**可枚举**属性 |
| `for...in` | 自身 + 原型链上的**可枚举**属性 |

```js
function Person() {
  this.age = 18 // 自身
}
Person.prototype.name = '原型名'

const p = new Person()

console.log(p.hasOwnProperty('age'))  // true
console.log(p.hasOwnProperty('name')) // false
console.log('name' in p)              // true
console.log(Object.keys(p))           // ['age']
// for...in 输出：age、name（包含原型上的可枚举属性）
for (const key in p) console.log(key)
```

### 3.4 常见内置类型的原型链

```js
// 普通对象字面量
// {} --> Object.prototype --> null
const obj = {}
console.log(obj.__proto__ === Object.prototype) // true

// 数组：注意 Array.prototype 重写了自己的 toString
// [] --> Array.prototype --> Object.prototype --> null
const arr = [1, 2, 3]
console.log(arr.__proto__ === Array.prototype)            // true
console.log(arr.__proto__.__proto__ === Object.prototype) // true
console.log(arr.valueOf === Object.prototype.valueOf)     // true（沿链找到）

// 函数
// function --> Function.prototype --> Object.prototype --> null
function fn() {}
console.log(fn.__proto__ === Function.prototype)          // true
console.log(fn.hasOwnProperty === Object.prototype.hasOwnProperty) // true

// 字符串原始值（访问属性时被临时包装成 String 对象）
// 'abc' --> String.prototype --> Object.prototype --> null
const str = 'abc'
console.log(str.__proto__ === String.prototype) // true
```

规律总结：

```text
对象字面量:  {}          --> Object.prototype     --> null
数组:        [1, 2]      --> Array.prototype      --> Object.prototype --> null
函数:        function(){}--> Function.prototype   --> Object.prototype --> null
实例:        new P()     --> P.prototype          --> Object.prototype --> null
字符串:      'abc'       --> String.prototype     --> Object.prototype --> null
```

**所有原型链的终点都是 `Object.prototype`，而 `Object.prototype.__proto__ === null`。**

## 四、Function 与 Object 的终极关系

这五条是面试中的「送命题」，务必逐条背熟：

```js
function Person() {}

// 1. 所有函数都是 Function 的实例
console.log(Person.__proto__ === Function.prototype)   // true
console.log(Object.__proto__ === Function.prototype)   // true

// 2. Function 也是自己的实例
console.log(Function.__proto__ === Function.prototype) // true

// 3. Function.prototype 的原型来自 Object.prototype
console.log(Function.prototype.__proto__ === Object.prototype) // true

// 4. 原型链终点
console.log(Object.prototype.__proto__ === null)       // true
```

为什么会这样？

- Person、Object、Function **都是函数**，而函数都是 `Function` 的实例，所以它们的 `__proto__` 都指向 `Function.prototype`；
- `Function.prototype` 是引擎创造的特殊函数（`typeof Function.prototype === 'function'`），但它没有 `prototype` 属性，不能被 new；
- `Object.prototype` 是「万物之祖」，它的原型是 `null`。

```text
Person    --> Function.prototype --> Object.prototype --> null
Object    --> Function.prototype --> Object.prototype --> null
Function  --> Function.prototype --> Object.prototype --> null
Object.prototype --> null
```

## 五、原型相关 API 家族

| API | 作用 |
| --- | --- |
| `Object.getPrototypeOf(obj)` | 标准读取 `__proto__` |
| `Object.setPrototypeOf(obj, proto)` | 标准设置原型（性能差，不推荐） |
| `Object.create(proto)` | 创建一个指定原型的新对象 |
| `Object.create(null)` | 创建**没有原型**的纯净对象 |
| `parent.isPrototypeOf(child)` | parent 是否在 child 的原型链上 |

### 5.1 Object.create 与手写 polyfill

```js
// 原理：创建空构造函数，偷换其 prototype，再 new
function myCreate(proto) {
  function F() {}
  F.prototype = proto
  return new F()
}

const parent = { name: '父' }
const child = myCreate(parent)
console.log(child.name)                     // '父'
console.log(Object.getPrototypeOf(child) === parent) // true
```

### 5.2 Object.create(null) —— 无原型的字典

```js
const dict = Object.create(null)
dict.name = '小明'

console.log(dict.toString) // undefined —— 连 toString 都没有
```

用途：做**纯净字典 / Map**，不担心 `toString`、`constructor`、`hasOwnProperty` 等原型链属性名与业务键冲突。

## 六、手写 new 的过程

`new Constructor(...args)` 做了四件事：

1. 创建一个全新的空对象；
2. 将新对象的 `__proto__` 指向构造函数的 `prototype`；
3. 以新对象为 this 执行构造函数；
4. 构造函数若**显式返回对象**则用该对象，否则返回新对象。

```js
function myNew(Constructor, ...args) {
  // 1 & 2. 创建空对象并链接原型
  const obj = Object.create(Constructor.prototype)
  // 3. 以 obj 为 this 执行构造函数
  const result = Constructor.apply(obj, args)
  // 4. 显式返回对象时优先，否则返回 obj
  return result instanceof Object ? result : obj
}
```

验证：

```js
function Person(name) {
  this.name = name
}
Person.prototype.sayHi = function () {
  return 'Hi, ' + this.name
}

const p = myNew(Person, '小明')
console.log(p.name)            // '小明'
console.log(p.sayHi())         // 'Hi, 小明' —— 原型方法可用
console.log(p instanceof Person) // true

// 显式返回对象的情况
function Weird() {
  this.a = 1
  return { b: 2 } // 显式返回对象
}
console.log(myNew(Weird).b) // 2 —— 用返回的对象
console.log(new Weird().b)  // 2 —— 原生行为一致
```

## 七、手写 instanceof

原理：沿左侧对象的 `__proto__` 链查找，看是否能找到右侧构造函数的 `prototype`。

```js
function myInstanceof(left, right) {
  if (left === null || typeof left !== 'object') return false
  let proto = Object.getPrototypeOf(left)
  while (proto !== null) {
    if (proto === right.prototype) return true
    proto = Object.getPrototypeOf(proto)
  }
  return false
}

console.log(myInstanceof([], Array))     // true
console.log(myInstanceof([], Object))    // true（数组也是对象）
console.log(myInstanceof('abc', String)) // false（原始值直接 false）
```

::: info 延伸：Symbol.hasInstance
ES6 允许通过 `Symbol.hasInstance` 自定义 instanceof 的行为，实际是 `right[Symbol.hasInstance](left)` 的语法糖。
:::

## 八、继承方式详解（六种演进）

### 8.1 原型链继承

核心：`Child.prototype = new Parent()`

```js
function Parent() {
  this.name = '父'
  this.colors = ['red', 'blue'] // 引用类型属性！
}
Parent.prototype.getName = function () {
  return this.name
}

function Child() {}
Child.prototype = new Parent()

const c1 = new Child()
const c2 = new Child()

c1.colors.push('green')
console.log(c2.colors) // ['red', 'blue', 'green'] —— 被污染！
```

缺点：

1. **引用类型属性被所有实例共享**，一个改动全部遭殃；
2. 创建 Child 实例时**无法向 Parent 传参**。

### 8.2 借用构造函数继承

核心：在 Child 里 `Parent.call(this)`，借父构造函数初始化自己的 this。

```js
function Parent(name) {
  this.name = name
  this.colors = ['red']
}
function Child(name) {
  Parent.call(this, name) // 关键
}

const c1 = new Child('小明')
const c2 = new Child('小红')
c1.colors.push('green')
console.log(c2.colors) // ['red'] —— 独立，不共享
console.log(c1.name)   // '小明' —— 可以传参
```

优点：解决共享 + 传参问题。

缺点：**只能继承实例属性，无法继承 `Parent.prototype` 上的方法**；方法只能写在构造函数里，每个实例又复制一份。

### 8.3 组合继承

核心：原型链继承（继承原型方法）+ 借用构造函数（继承实例属性）。

```js
function Parent(name) {
  this.name = name
  this.colors = ['red']
}
Parent.prototype.getName = function () {
  return this.name
}

function Child(name, age) {
  Parent.call(this, name) // 第二次调用 Parent
  this.age = age
}
Child.prototype = new Parent()           // 第一次调用 Parent
Child.prototype.constructor = Child

const c1 = new Child('小明', 18)
const c2 = new Child('小红', 20)
c1.colors.push('green')

console.log(c2.colors)    // ['red'] —— 独立
console.log(c1.getName()) // '小明'  —— 原型方法可用
```

优点：功能完整，曾经的主流方案。

缺点：**父构造函数被调用了两次**；`Child.prototype`（即那个 `new Parent()`）上还留着一份多余的 `name`、`colors`，只是被实例自身属性遮蔽了。

### 8.4 原型式继承

核心：不创建构造函数，直接基于现有对象造新对象（`Object.create` 的思路）。

```js
function object(o) {
  function F() {}
  F.prototype = o
  return new F()
}

const parent = { name: '父', colors: ['red'] }
const child = object(parent)
child.colors.push('green')
console.log(parent.colors) // ['red', 'green'] —— 引用共享
```

缺点：引用类型属性依然共享。ES5 的 `Object.create` 就是这个思路的规范化。

### 8.5 寄生式继承

核心：在原型式继承基础上「包一层」，增强对象后返回。

```js
function createAnother(original) {
  const clone = Object.create(original)
  clone.sayHi = function () {
    console.log('hi')
  }
  return clone
}

const person = { name: '父' }
const anotherPerson = createAnother(person)
anotherPerson.sayHi() // 'hi'
```

缺点：方法每次都新建，无法复用（类似构造函数模式的问题）。

### 8.6 寄生组合式继承（最优解）⭐

核心：用 `Object.create(Parent.prototype)` 代替 `new Parent()`，父构造函数只在 `Parent.call` 时调用一次。

```js
function inherit(Child, Parent) {
  Child.prototype = Object.create(Parent.prototype)
  Child.prototype.constructor = Child
}

function Parent(name) {
  this.name = name
  this.colors = ['red']
}
Parent.prototype.getName = function () {
  return this.name
}

function Child(name, age) {
  Parent.call(this, name) // 唯一一次调用 Parent
  this.age = age
}
inherit(Child, Parent)
Child.prototype.getAge = function () {
  return this.age
}

const c1 = new Child('小明', 18)
const c2 = new Child('小红', 20)
c1.colors.push('green')

console.log(c2.colors)              // ['red'] —— 实例属性独立
console.log(c1.getName())           // '小明' —— 原型方法共享
console.log(c1 instanceof Child)    // true
console.log(c1 instanceof Parent)   // true —— 原型链正确
console.log(Child.prototype.__proto__ === Parent.prototype) // true
```

为什么最优（面试标准答案）：

1. **只调用一次**父构造函数；
2. 不会在 `Child.prototype` 上留下多余的父实例属性；
3. 原型链关系完全正确，`instanceof` 与 `constructor` 都正常。

### 8.7 ES6 class extends（最终形态）

```js
class Parent {
  constructor(name) {
    this.name = name
    this.colors = ['red']
  }
  getName() {
    return this.name
  }
}

class Child extends Parent {
  constructor(name, age) {
    super(name) // 等价于 Parent.call(this, name)
    this.age = age
  }
  getAge() {
    return this.age
  }
}

const c1 = new Child('小明', 18)
console.log(c1.getName())          // '小明'
console.log(c1 instanceof Parent)  // true
```

`class extends` 内部就是寄生组合式继承的语法糖，推荐日常使用；但面试常要求先写出 ES5 版本。

## 九、class 与原型的关系

### 9.1 class 本质仍是「函数 + 原型」

```js
class Foo {
  constructor() {}
  bar() {}
}

console.log(typeof Foo)                          // 'function'
console.log(Foo.prototype.constructor === Foo)   // true
console.log(typeof new Foo().bar === 'function') // bar 在 Foo.prototype 上
```

与 ES5 构造函数的区别：

| 特性 | ES5 构造函数 | class |
| --- | --- | --- |
| 调用方式 | 可不用 new（结果诡异） | **必须 new**，否则报错 |
| 方法可枚举性 | prototype 上方法可枚举 | 默认**不可枚举** |
| 严格模式 | 取决于外部 | 内部自动严格模式 |
| 提升 | 函数声明有提升 | 有 TDZ（暂时性死区），先定义后用 |
| static 方法 | 需手动挂 `Foo.xxx` | `static` 关键字原生支持 |

### 9.2 双原型链（重要！）

`class B extends A` 会同时建立**两条**原型链：

```js
class A {
  static hello() {
    return 'hello'
  }
}
class B extends A {}

// 链 1：实例方法查找链（原型对象层面）
console.log(B.prototype.__proto__ === A.prototype) // true

// 链 2：静态成员查找链（构造函数层面）
console.log(B.__proto__ === A)                     // true

// 所以 B 能直接继承 A 的静态方法
console.log(B.hello()) // 'hello'
```

```text
链 1（实例方法）：B.prototype --> A.prototype --> Object.prototype --> null
链 2（静态方法）：B --> A --> Function.prototype --> Object.prototype --> null
```

这就是为什么 `B.hello()` 能用、而 `B.prototype.hello` 是 `undefined`：`static` 方法挂在构造函数自身，不挂在原型对象上。

## 十、常见坑与易错点

### 坑 1：整体重写 prototype 后 constructor 丢失

```js
function Person() {}
Person.prototype = {
  sayHi() {}
}

console.log(new Person().constructor) // [Function: Object] —— 指向了 Object！

// 修正：手动补回
Person.prototype.constructor = Person
```

原因：新写的对象字面量的原型是 `Object.prototype`，其 `constructor` 自然是 `Object`。

### 坑 2：`Child.prototype = Parent.prototype` 是错的

```js
Child.prototype = Parent.prototype // 两者指向同一个对象！
Child.prototype.getChildFlag = function () {}
// Parent 的实例也能访问 getChildFlag，互相污染
```

正确做法：`Child.prototype = Object.create(Parent.prototype)`，**新建一层**原型对象。

### 坑 3：把共享方法写在构造函数里

每个实例复制一份，浪费内存；需要闭包状态的场景除外。

### 坑 4：用 constructor 判断类型不可靠

`constructor` 可被随意改写（见坑 1），判断类型请用 `instanceof` 或 `Object.prototype.toString.call(obj)`。

### 坑 5：原型上的引用类型数据

```js
function Person() {}
Person.prototype.hobbies = [] // 共享！

const p1 = new Person()
const p2 = new Person()
p1.hobbies.push('游戏')
console.log(p2.hobbies) // ['游戏'] —— 被 p1 污染
```

规则：**引用类型数据放实例（构造函数里），函数放原型**。

## 十一、高频面试题速答

| 问题 | 参考答案 |
| --- | --- |
| `__proto__` 和 `prototype` 区别？ | `prototype` 是函数属性，用于构建实例原型；`__proto__` 是对象属性，指向其构造函数的 `prototype` |
| 原型链终点？ | `Object.prototype.__proto__ === null` |
| new 做了什么？ | 创建对象、链接原型、绑定 this 执行构造函数、按返回值规则返回 |
| instanceof 原理？ | 沿左边对象的 `__proto__` 链查找右边函数的 `prototype`，找到即 true |
| constructor 是什么？可靠吗？ | 原型上指回构造函数的属性；可被改写，判断类型不可靠 |
| `Function instanceof Object` 与 `Object instanceof Function`？ | 都是 `true`（互为实例与构造的特殊关系） |
| 为什么方法要放原型上？ | 所有实例共享一份函数，节省内存 |
| 怎么判断属性是自身的还是原型上的？ | `hasOwnProperty` 仅查自身；`in` 查整条原型链 |
| 怎么创建没有原型的对象？ | `Object.create(null)`，适合做纯净字典 |
| class 是语法糖吗？ | 是，本质仍是函数 + 原型；但强制 new、方法不可枚举、内部严格模式 |
| class 继承建立了几条原型链？ | 两条：`B.prototype --> A.prototype`（实例方法）与 `B --> A`（静态方法） |
| 最优的 ES5 继承方式？ | 寄生组合式：`Object.create(Parent.prototype)` + `Parent.call(this)` |

## 五行速记卡

```text
1. 实例.__proto__ === 构造函数.prototype
2. 构造函数.prototype.constructor === 构造函数
3. 构造函数.__proto__ === Function.prototype
4. Function.prototype.__proto__ === Object.prototype
5. Object.prototype.__proto__ === null（终点）
```
