# TypeScript 进阶篇（Q8 - Q14）

> 每题五层结构：**为什么存在 -> 是什么（逐个深讲）-> 怎么用（场景+注释）-> 常见坑 -> 面试怎么答（总-分）**

## Q8：什么是类型收窄？（<span class="hot">超高频</span>，实战核心）

### 8.1 为什么存在

Q5 说过：联合类型的值只能访问**公共成员**——因为 TS 不确定它是哪个成员，只敢保证大家都有的能力。但业务里我们**必然要用具体成员的独有属性**，怎么办？答案是：向 TS 提供「证据」，它就还你精确的类型——这个证据就是收窄手段。

### 8.2 是什么

类型收窄 = **通过类型守卫（代码层面的判断），把宽类型在某个代码块内缩小成具体类型**。TS 的控制流分析会自动跟踪你的 if/switch，进入不同分支就自动切换类型。

```text
value: string | number  （宽：只能用公共成员）
        |
        | if (typeof value === 'string')
        v
value: string          （窄：字符串方法随便用）✅
```

### 8.3 五种手段

```ts
// ============ 手段一：typeof —— 判断基础类型 ============
function format(value: string | number) {
  if (typeof value === 'string') {
    // TS 控制流分析：进入这个分支 = value 一定是 string
    return value.toUpperCase() // ✅ 独有方法解锁
  }
  // 走到这里 = 排除法，只剩 number
  return value.toFixed(2) // ✅
}
// 适用：string / number / boolean / undefined / function

// ============ 手段二：instanceof —— 判断实例的类 ============
function log(err: Error | Date) {
  if (err instanceof Error) {
    return err.message // ✅ 收窄成 Error
  }
  return err.getTime() // 剩下 Date
}
// 适用：类实例判断（Error、Date、RegExp、自定义类、数组不行——数组也是对象）

// ============ 手段三：in —— 判断属性是否存在 ============
interface Bird { fly: () => void }
interface Fish { swim: () => void }

function move(animal: Bird | Fish) {
  if ('fly' in animal) {
    animal.fly()   // 有 fly 属性 -> 一定是 Bird
  } else {
    animal.swim()  // 否则只剩 Fish
  }
}
// 适用：两个接口没有判别字段、但有独有属性时

// ============ 手段四：判别联合 —— 最推荐的方式 ============
// 核心思想：给每个成员加一个「身份证」（字面量标签字段）
interface Loading { status: 'loading' }
interface Success { status: 'success'; data: string }
interface Failure { status: 'error'; message: string }
type State = Loading | Success | Failure
//                                    ^ 每个成员的 status 是不同的字面量

function render(state: State) {
  switch (state.status) {  // 用身份证字段判断
    case 'loading':
      return '加载中'       // 这里 state 收窄成 Loading
    case 'success':
      return state.data    // ✅ 自动知道这是 Success，有 data
    case 'error':
      return state.message // ✅ 自动知道这是 Failure
  }
}
// 为什么它是「最推荐」：
// 1. 一次 switch 覆盖所有情况，漏分支编译器提示（配 never 穷尽检查）
// 2. 前端状态管理的标准建模方式（loading/success/error 三态）
// 3. status 同时可以当运行时的判断条件，类型和逻辑统一

// ============ 手段五：自定义守卫 —— is 类型谓词 ============
// 当判断逻辑复杂（要调方法、多层检查）时，封装成守卫函数
function isFish(pet: Bird | Fish): pet is Fish {
  //                    ^^^^^^^^^^ 类型谓词：返回 true 时，TS 认定 pet 是 Fish
  return 'swim' in pet
}

if (isFish(animal)) {
  animal.swim() // ✅ 守卫生效
}
// 和普通返回 boolean 的区别：
// boolean: TS 只知道「真或假」，不知道 pet 是什么
// pet is Fish: 返回 true 的位置直接「改写」pet 的类型
```

### 8.4 常见坑

```ts
// 坑一：truthiness 判断可能不够精确
function fn(value: string | null) {
  if (value) {
    // 注意：空字符串 '' 也是 falsy！这里排除了 null 和 ''
    value.toUpperCase() // 收窄成 string，但 '' 进不来 —— 逻辑上可能不符合预期
  }
}
// 更准确：if (value !== null) —— 只排除 null，空字符串正常处理

// 坑二：收窄会被赋值「冲掉」
let x: string | number = 'hi'
if (typeof x === 'string') {
  x = 123          // 赋值后类型又变宽/变窄
  x.toUpperCase()  // Error：此时 x 已经是 number 了
}

// 坑三：回调里的收窄会丢失
function process(cb: () => void) {
  let s: string | null = 'x'
  if (s !== null) {
    cb()           // TS 不知道回调什么时候执行
    s.toUpperCase() // Error：s 可能又被改成 null 了
  }
}
```

### 8.5 面试回答示范（总-分结构）

> **总起**：类型收窄就是把宽泛的联合类型，在某个代码块内缩小成具体类型——因为联合类型只能访问公共成员，要用独有属性就必须先「证明」它是什么，TS 的控制流分析会根据判断自动完成收窄。
>
> **常用五种手段**：
>
> **第一，typeof。** 判断 string、number 这些基础类型，最简单直接。
>
> **第二，instanceof。** 判断类实例，比如 Error、Date 或自定义类。
>
> **第三，in。** 判断对象有没有某个属性，适合接口各有独有属性的场景。
>
> **第四，判别联合——我最推荐的方式。** 给每个成员加一个字面量标签字段当「身份证」，一次 switch 自动收窄所有分支；它是前端状态建模的标准做法，还能配合 never 做穷尽检查。
>
> **第五，自定义守卫。** 用 `pet is Fish` 类型谓词封装复杂判断，返回 true 的位置 TS 直接认定类型——这是它比返回 boolean 强的地方。

## Q9：字面量类型和 as const（<span class="hot">高频</span>）

### 9.1 为什么存在

两个问题引出这套机制：

```ts
// 问题一：string 太宽了，我只想允许几个特定值
let status: string = 'loading'
status = '随便什么'   // 合法 —— 但业务上不该有别的值

// 问题二：const 的「锁定」其实不够彻底
const config = { endpoint: '/api' }
config.endpoint = '/v2'  // 竟然不报错！
// 因为 const 只锁「变量本身不能重新赋值」，没锁对象内部属性的类型
```

### 9.2 是什么

- **字面量类型**：把「具体的值」当成类型用——类型 `'up'` 的值空间只有字符串 `'up'` 一个；
- **as const**：「as + const」断言——把整个对象的推断**锁死**：值全部变字面量、数组变只读元组、属性全 readonly。

### 9.3 怎么用

```ts
// ============ 字面量类型：值即类型 ============
type Direction = 'up' | 'down' | 'left' | 'right'
//     值空间只有这四个字符串

let dir: Direction = 'up'    // ✅
dir = 'top'                  // Error：'top' 不在值空间里

// 应用一：代替枚举做状态管理（零运行时成本）
type Status = 'idle' | 'loading' | 'success' | 'error'

// 应用二：函数参数防呆
function setAlign(align: 'left' | 'center' | 'right') {}
setAlign('middle')  // Error：传错立刻发现

// ============ as const：一键冻结 ============
// 对比不加 as const：
const routes = ['/home', '/about']
// routes 的类型：string[]（普通字符串数组，内容可改可增）
routes.push('/x')          // 合法！
routes[0] = 'whatever'     // 合法！

// 加上 as const：
const routes2 = ['/home', '/about'] as const
// routes2 的类型：readonly ['/home', '/about']
routes2.push('/x')         // Error：readonly 不能 push
routes2[0] = 'whatever'    // Error：元素也是只读的

// 对象 + as const：
const config = {
  endpoint: '/api',
  timeout: 3000,
  nested: { debug: true }
} as const
// 类型：{ readonly endpoint: '/api'; readonly timeout: 3000; readonly nested: { readonly debug: true } }
// 三层全部锁死：属性 readonly + 值是字面量 + 嵌套对象也冻结
```

### 9.4 const vs as const（高频追问）

| | const x = ... | ... as const |
| --- | --- | --- |
| 锁什么 | 变量**绑定**（不能重新赋值） | **类型**（值锁字面量、深层 readonly） |
| x = 1 报错吗 | ✅ 报错 | ✅（const 也在生效） |
| x.foo = 1 报错吗 | ❌ 不报（对象内容没锁） | ✅ 报错（深层 readonly） |

### 9.5 面试回答示范（总-分结构）

> **总起**：字面量类型是把「具体的值」当类型用，as const 是把推断结果一键冻结——两者组合是现代项目替代枚举的首选方案。
>
> **分三点**：
>
> **第一，字面量类型的值空间是封闭的。** `type Status = 'idle' | 'loading'` 只有这几个字符串合法，传别的值编译期就拦住，比裸用 string 安全得多。
>
> **第二，as const 有三连效果。** 值的类型锁成字面量、数组变成 readonly 元组、对象所有属性变 readonly——而且是深层的，嵌套对象也冻结。
>
> **第三，它和 const 的区别是锁的层面不同。** const 只锁变量绑定，对象内部属性照样能改；as const 锁的是类型层面。所以我做主题配置、路由表这类「常量数据源」时都用 as const，配合 typeof 一份定义同时供值和类型使用。

## Q10：可选属性、只读属性、索引签名

### 10.1 为什么存在

描述对象时有三类常见需求：某个属性「可以没有」（表单选填项）、某个属性「创建后不许改」（id）、对象「允许携带任意额外键」（透传配置）——三种修饰符分别对应这三种需求。

### 10.2 是什么 + 怎么用

```ts
interface Article {
  // 1. 只读：初始化后不能再改（编译期约束）
  readonly id: number

  // 2. 普通必填
  title: string

  // 3. 可选：可以不传，类型自动 | undefined
  author?: string

  // 4. 索引签名：允许任意字符串键，值是 unknown
  [key: string]: unknown
}

const a: Article = { id: 1, title: 'TS 入门' }  // author 没传，合法

a.id = 2
// ~~~ Error: id 是只读属性

// 可选属性在 strict 模式下的正确处理：
a.author?.toUpperCase()   // 方式一：可选链（是 undefined 就不调用）
const name = a.author ?? '匿名'  // 方式二：空值合并给默认值
if (a.author) { a.author.length }  // 方式三：if 收窄

// 索引签名放行任意键：
a.anything = 123      // ✅ 合法（unknown 类型）
a['whatever'] = {}    // ✅
```

### 10.3 常见坑

```ts
// 坑一：readonly 只是编译期约束！
const arr: readonly number[] = [1, 2, 3]
arr.push(4)  // Error
// 但编译成 JS 后 readonly 不存在 —— 运行时 push 照样能执行
// TS 的类型保护全部只存在于编译期

// 坑二：索引签名会「稀释」精确提示
interface Loose { [key: string]: string }
const l: Loose = {}
l.foo  // 提示是 string，但 l 实际有什么键完全不知道
// 业务接口推荐写具体字段；确实需要字典用 Record<string, string> 更规范

// 坑三：exactOptionalPropertyTypes（严格可选）
// 开启后 a.author = undefined 也报错（可选 ≠ 可以显式传 undefined）
```

### 10.4 面试回答示范（总-分结构）

> **总起**：这三个修饰符解决对象描述的三种常见需求——可选应对「可以没有」、只读应对「不许修改」、索引签名应对「任意额外键」。
>
> **分三点**：
>
> **第一，可选属性的值自动带 undefined。** strict 模式下必须处理，我用 `?.` 或 `??` 兜底，复杂场景 if 收窄。
>
> **第二，readonly 是编译期约束。** 编译成 JS 后就没了，运行时其实拦不住——TS 所有类型保护都只存在于编译期，这点和断言一样。
>
> **第三，索引签名要克制使用。** 它让类型失去精确补全，业务接口我写具体字段；字典场景用 `Record<string, T>` 语义更清晰。

## Q11：映射类型（<span class="hot">高频</span>）

### 11.1 为什么存在

看一个真实需求：已有 `User` 接口，现在需要「所有属性都可选」的更新类型：

```ts
interface User { name: string; age: number; email: string }

// 手写：属性少还行，20 个属性呢？
interface UpdateUser1 {
  name?: string
  age?: number
  email?: string
}
// 而且 User 加字段时这里必须同步改 —— 双重维护
```

映射类型就是解决「**按原类型批量变换生成新类型**」——写一次，User 怎么变它自动跟着变。

### 11.2 是什么 + 语法拆解

```ts
type MyPartial<T> = {
  [K in keyof T]?: T[K]
}
// 一行代码拆开读：
// keyof T       -> 拿到 T 的所有键，组成联合类型 'name' | 'age' | 'email'
// [K in ...]    -> 遍历这个联合的每个成员 K（类似数组的 for...of）
// ?             -> 给每个生成的属性加可选修饰
// T[K]          -> 索引访问：取 T 里键 K 对应的值类型

type UpdateUser = MyPartial<User>
// 自动得到 { name?: string; age?: number; email?: string }
// User 以后加字段，UpdateUser 自动包含 —— 单一数据源！
```

### 11.3 三种进阶用法

```ts
// ============ 修饰符加减：+ / - readonly / ? ============
type Required2<T> = {
  [K in keyof T]-?: T[K]     // 减号：去掉可选（变必填）
}
type Mutable<T> = {
  -readonly [K in keyof T]: T[K]  // 去掉只读（+readonly 加只读，+可省略）
}

// ============ 键重命名：as 子句 ============
type Getters<T> = {
  // as 后面是模板字面量：把键名改造成 getter 方法名
  [K in keyof T as `get${Capitalize<K & string>}`]: () => T[K]
}
// User -> { getName: () => string; getAge: () => number; getEmail: () => string }
// 一行生成整个 getter 层！

// ============ 过滤键：as never 丢弃 ============
type RemoveId<T> = {
  [K in keyof T as K extends 'id' ? never : K]: T[K]
  // 键等于 'id' 的映射成 never（被丢弃）-> 相当于剔除 id
}
```

### 11.4 面试回答示范（总-分结构）

> **总起**：映射类型解决的是「按原类型批量变换生成新类型」——像 forEach 遍历数组生成新数组一样，它遍历键生成新类型，是所有工具类型的实现基石。
>
> **核心语法一行拆开**：
>
> **第一，`keyof T` 拿到键的联合类型**，这是遍历的原料。
>
> **第二，`[K in ...]` 遍历每个键**，每遍历一个就生成一个同名属性。
>
> **第三，`T[K]` 索引访问取值类型**——新属性的值还是原来那个键对应的类型。
>
> **再补充两个进阶**：`?` 和 `readonly` 前面可以加减号来增删修饰（Required 就是 `-?` 写的）；`as` 子句能重命名甚至用 never 过滤键——Partial、Required、Omit 这些内置工具的源码全是这几招的组合。

## Q12：条件类型与 infer（<span class="hot">超高频</span>）

### 12.1 为什么存在

两个需求催生了这套机制：

```ts
// 需求一：类型层面做判断
// 「如果 T 是数组，取它的元素类型；否则原样返回」—— 类型层面的 if/else

// 需求二：从复杂类型里「提取」内部类型
// 「拿到函数的返回值类型」「拿到 Promise 里面的类型」
// —— 需要在类型模式匹配里挖一个「坑」让 TS 填
```

### 12.2 条件类型：类型版三元表达式

```ts
type IsString<T> = T extends string ? true : false
//                ^^^^^^^^^^^^^^^ 条件    ^^^^ 成立时的结果  ^^^^^^ 不成立的结果

type A = IsString<'hello'>  // true（'hello' 满足 string 结构）
type B = IsString<number>   // false
```

**最容易翻车的点——分发条件类型**：

```ts
type ToArray<T> = T extends any ? T[] : never

type R = ToArray<string | number>
// 你以为：(string | number)[]
// 实际：string[] | number[]  ← 分发了！

// 分发的规则：裸类型参数（T 没被包住）+ T 是联合类型
// = 联合的每个成员分别代入判断，结果再合并：
//   string extends any -> string[]
//   number extends any -> number[]
//   合并: string[] | number[]

// 怎么阻止分发？用元组把 T 包住：
type ToArrayNoDistribute<T> = [T] extends [any] ? T[] : never
type R2 = ToArrayNoDistribute<string | number>
// (string | number)[]  ← 整体判断了
```

### 12.3 infer：在匹配中「挖坑取类型」

```ts
// ============ 提取函数返回值（ReturnType 的原理） ============
type MyReturnType<T> =
  T extends (...args: any[]) => infer R ? R : never
  //                        ^^^^^^^^
  //  读法：如果 T 能匹配「任意参数的函数」这个形状，
  //        返回值的位置挖个坑叫 R，让 TS 自动填上

type F = () => { id: number }
type R = MyReturnType<F>  // { id: number } —— R 被自动填成返回值类型

// ============ 提取数组元素 ============
type Element<T> = T extends (infer E)[] ? E : never
//                            ^^^^^^^ 元素位置挖坑
type E1 = Element<string[]>   // string
type E2 = Element<number[]>   // number
type E3 = Element<string>     // never（string 不是数组，走 false 分支）

// ============ 提取 Promise 内部类型（递归剥洋葱） ============
type Deep<T> = T extends Promise<infer V> ? Deep<V> : T
//             是 Promise 就剥一层再看 ^^^^^^^
type P = Deep<Promise<Promise<string>>>  // string（剥了两层）

// ============ 提取元组的第一个元素 ============
type First<T extends any[]> = T extends [infer F, ...any[]] ? F : never
type F1 = First<[string, number]>  // string
```

### 12.4 面试回答示范（总-分结构）

> **总起**：条件类型是「类型层面的三元表达式」，infer 是在模式匹配里挖坑提取类型的手段——两者组合是 ReturnType、Awaited 这些内置工具的底层原理。
>
> **第一，条件类型的语法就是三元。** `T extends U ? X : Y`，问「T 满不满足 U 的结构」来决定结果类型。
>
> **第二，有个必知的坑叫分发。** 裸类型参数遇到联合类型会逐个成员判断再合并——`ToArray<string | number>` 得到的是 `string[] | number[]` 而不是联合数组；想阻止分发就用元组把 T 包住。
>
> **第三，infer 的本质是「挖坑让 TS 填」。** 在 extends 后面的形状里，想提取哪个位置就把那个位置写成 `infer 名字`——函数返回值、数组元素、Promise 内部值、元组第一项都能这样提取，还能递归配合剥 Promise 的洋葱。

## Q13：keyof / typeof / in（<span class="hot">超高频</span>）

### 13.1 为什么存在

TS 的世界里「类型」和「值」是分开的两个空间，经常需要互相取材：

```text
类型空间 --keyof--> 拿到类型的键（变成联合类型）
值空间   --typeof--> 拿到值的类型（进入类型空间）
```

没有这两个操作符，映射类型、安全属性访问这些玩法全部玩不转。

### 13.2 keyof：从类型抽键

```ts
interface User {
  name: string
  age: number
  email: string
}

type UserKeys = keyof User
// 'name' | 'age' | 'email' —— 三个键名的联合类型

// ============ 杀手级应用：安全的属性访问 ============
function getProp<T, K extends keyof T>(obj: T, key: K): T[K] {
  //             ^^^^^^^^^^^^^^^^ 约束：key 只能是 T 的键之一
  return obj[key]
  //         ^^^^^ 返回值自动是「那个键对应的类型」
}

const user = { name: '小明', age: 18, email: 'x@x.com' }

getProp(user, 'name')   // 返回类型：string ✅
getProp(user, 'age')    // 返回类型：number ✅ —— 不同键不同返回类型！
getProp(user, 'nmae')
// Error: '"nmae"' 不存在于参数类型中
// —— 拼错键名编译期直接拦住，这就是 keyof 的价值
```

### 13.3 typeof：从值抽类型

```ts
// ============ 场景一：配置对象的「单一数据源」 ============
const config = {
  host: 'localhost',
  port: 3000,
  env: 'dev'
}

type Config = typeof config
// { host: string; port: number; env: string }
// 值和类型都从 config 一处生成 —— 改配置自动同步类型

// ============ 场景二：配合 typeof 拿函数返回值 ============
function createUser() {
  return { id: 1, name: 'x' }
}

type User = ReturnType<typeof createUser>
//          ^^^^^^^^^ 先 typeof 拿函数类型，ReturnType 提取返回值
// -> { id: number; name: string }
// 不用再手写一遍接口！

// ============ 场景三：enum 转联合类型 ============
enum Direction { Up, Down }
type Dir = keyof typeof Direction  // 'Up' | 'Down'
```

### 13.4 in 的两张面孔

```ts
// 面孔一：类型空间 —— 映射类型里遍历联合（Q11）
type Flags = { [K in 'a' | 'b' | 'c']: boolean }
// -> { a: boolean; b: boolean; c: boolean }

// 面孔二：值空间 —— 运行时判断属性存在（Q8 收窄）
if ('fly' in animal) { /* ... */ }
```

### 13.5 面试回答示范（总-分结构）

> **总起**：keyof 和 typeof 是类型空间和值空间之间的「传送门」——keyof 从类型抽取键，typeof 从值抽取类型，方向相反；配合起来是工具类型的核心原料。
>
> **第一，keyof 生成键的联合类型。** 它最好的应用是 `K extends keyof T` 的属性访问函数——key 被约束为合法键，拼错编译报错，返回值还自动精确到那个键的类型。
>
> **第二，typeof 实现「单一数据源」。** 一个 config 对象，typeof 一下既是运行时配置又是类型来源，改一处两边同步；配合 ReturnType 还能直接复用函数返回值的类型。
>
> **第三，in 有两张面孔。** 类型空间里配合映射类型遍历联合生成新类型；值空间里就是运行时的属性存在判断、做收窄——面试时要能说清它两边都在干活。

## Q14：TS 的类型兼容规则（结构化类型）

### 14.1 为什么存在

TS 怎么判断「类型 A 能不能赋给类型 B」？世界上有两种流派：

```text
名义类型系统（Java/C#）：
  类名叫 Dog 才是 Dog —— 看出身

结构化类型系统（TS）：
  长得像 Dog 就是 Dog —— 看长相（鸭子类型）
```

TS 选了结构化——因为 JS 本身就是鸭子类型的，TS 顺着来。

### 14.2 结构兼容的规则演示

```ts
interface Point { x: number; y: number }

// 规则一：多属性可以赋给少属性（多的不影响）
const p1 = { x: 1, y: 2, name: '多余' }
const point1: Point = p1  // ✅ 结构满足 x、y 即可

// 规则二：少属性不能赋给多属性
const p2 = { x: 1 }
const point2: Point = p2  // Error: 缺少 y

// 规则三：名字完全不重要
interface Position { x: number; y: number }  // 名字不同
const pos: Point = { x: 1, y: 2 } as Position  // 结构相同就兼容

// 规则四：函数参数兼容（多参数的函数不能赋给少参数的接口）
type Fn1 = (a: number) => void
type Fn2 = (a: number, b: string) => void

const f1: Fn1 = (a, b) => {}  // Error：b 没人传
const f2: Fn2 = (a) => {}     // ✅ 少接收参数没关系
```

### 14.3 经典现象：字面量的「多余属性检查」

```ts
interface Point { x: number; y: number }

// 字面量直接赋值：多一个键就报错！
const a: Point = { x: 1, y: 2, z: 3 }
//                        ~ Error: 'z' 不存在于类型 'Point'

// 先存变量再赋值：同样的结构却通过！
const obj = { x: 1, y: 2, z: 3 }
const b: Point = obj  // ✅

// 为什么？
// 字面量直赋通常是「正在构造目标类型的对象」，多属性大概率是写错了 -> 严格检查
// 变量已有自己的类型，只做结构兼容判断 -> 宽松处理
// 这个不一致是 TS 有意的权衡，不是 bug
```

### 14.4 面试回答示范（总-分结构）

> **总起**：TS 是结构化类型系统——判断兼容只看结构不看名字，走的是鸭子类型路线，这和 Java 那种名义类型系统是本质区别。
>
> **三条核心规则**：
>
> **第一，多可以赋给少。** 目标要 x 和 y，你给了 x、y、name，多的不影响兼容——这在传对象给函数时很常用。
>
> **第二，少不能赋给多。** 缺了必需属性直接报错。
>
> **第三，字面量直接赋值有额外的「多余属性检查」。** 同样的对象，直赋多一个键报错、先存变量再赋就通过——因为字面量直赋通常意味着你在构造目标对象，多属性很可能是手滑，TS 特意收紧了。能讲清这个不一致的权衡，就是真的懂结构化类型了。

## 本篇速答

| 问题 | 一句话答案 |
| --- | --- |
| 收窄五种手段？ | typeof / instanceof / in / 判别联合 / 自定义守卫 is |
| 判别联合为什么推荐？ | 字面量标签一次 switch 全收窄，配 never 穷尽检查 |
| is 谓词比 boolean 强在哪？ | 返回 true 的位置直接改写变量类型 |
| as const 三连？ | 值锁字面量 + 数组变 readonly 元组 + 属性深层 readonly |
| const 和 as const 区别？ | const 锁变量绑定；as const 锁类型（深层） |
| readonly 运行时有效吗？ | 无效，纯编译期，编译后擦除 |
| 映射类型三步曲？ | keyof 拿键 -> in 遍历 -> T[K] 取值（as 换名） |
| 条件类型遇联合会？ | 裸类型参数分发逐个判断，元组包裹可阻止 |
| infer 的本质？ | 在形状匹配里挖坑，让 TS 自动填上类型 |
| keyof 和 typeof 方向？ | keyof 类型->键；typeof 值->类型 |
| 字面量直赋为何多属性报错？ | 多余属性检查——只对直赋生效的特意收紧 |
