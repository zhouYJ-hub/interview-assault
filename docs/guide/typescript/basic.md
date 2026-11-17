# TypeScript 基础篇（Q1 - Q7）

> 每题五层结构：**为什么存在 -> 是什么（逐个深讲）-> 怎么用（场景+注释）-> 常见坑 -> 面试怎么答**

## Q1：为什么用 TypeScript？

### 1.1 先看 JS 的三宗罪

**罪名一：错误只能在运行时暴露**

```js
// JS：这三行代码写的时候毫无异常，全是上线后炸
const user = JSON.parse('{"name": "小明"}')

user.adress.city   // TypeError: Cannot read properties of undefined
//      ^^^^^^ 拼错了！如果有人提前告诉你，这行根本活不到上线

getUser(123)       // 参数应该是对象，传了个数字，运行时才炸
```

**罪名二：重构像拆盲盒**

```js
// 产品说：把 user 的 name 改成 userName
// JS 里你只能全局搜索 "name" —— 搜出 800 个，改漏一个就是线上事故
// TS 里：改掉接口定义，所有引用处的属性访问立刻标红，一个都漏不掉
```

**罪名三：协作没有契约**

```js
// 同事写的函数，不看源码你根本不知道：
fetchList(page, size)   // page 从 0 还是从 1 开始？返回什么结构？
// TS 的函数签名就是自解释的契约：
fetchList(page: number, size: number): Promise<{ list: Item[]; total: number }>
```

### 1.2 TypeScript 是什么

**一句话：TS 是 JS 的超集 + 静态类型系统，编译成 JS 运行。**

```text
JavaScript 的所有语法          TypeScript 在此之上增加
┌──────────────────┐      ┌──────────────────────────┐
│ let a = 1        │      │ 接口 interface            │
│ function fn() {} │      │ 泛型 <T>                  │
│ class A {}       │      │ 枚举 enum                 │
│ (全部合法)       │      │ 类型收窄 / 条件类型 / ...  │
└──────────────────┘      └──────────────────────────┘
              \                    /
               v                  v
        ┌────────────────────────────┐
        │   .ts 源码（人写）          │
        └────────────┬───────────────┘
                     | tsc / Vite 编译（自动完成）
                     v
        ┌────────────────────────────┐
        │   .js 产物（浏览器运行）     │  <- 类型全部被擦除
        └────────────────────────────┘      浏览器不知道 TS 存在
```

**关键认知：类型是「编译期的检查工具」，编译后全部被擦除**——运行时没有任何类型信息，这就是为什么 TS 检查叫「静态类型」。

### 1.3 亲眼看一次 TS 拦截错误

```ts
interface User {
  name: string
  age: number
}

function getUserName(user: User): string {
  return user.nmae
  //     ~~~~~~~~ 红色波浪线，鼠标悬停：
  //     属性 "nmae" 不存在于类型 "User" 中。你是否指的是 "name"？
  //     —— 编辑器不仅报错，还帮你猜出了正确答案
}

getUserName({ name: '小明' })
// Error: 缺少属性 "age"，类型 "User" 中需要该属性
// —— 传参不完整也在编写时拦下
```

### 1.4 渐进式：不是全部重写才能用

TS 是**渐进式**的：`.ts` 文件里的 JS 代码本身就合法；可以一个文件一个文件迁移。未标注的变量会被推断成any（可先关 strict，再逐步打开）——这是老项目迁移的常规路径。

### 1.5 也要知道代价（面试体现辩证）

| 代价 | 说明 |
| --- | --- |
| 学习成本 | 泛型、高级类型有门槛 |
| 编译时间 | 大项目全量编译慢（可用增量编译 / Vite 秒级启动解决） |
| 类型定义成本 | 三方库要装 @types，偶尔要自己补 .d.ts |

**面试回答示范（总-分结构）**：

> **总起**：我用 TypeScript 的核心原因，是把错误从「运行时」提前到「编码时」，让大型项目的协作和重构变得可控。
>
> **分三层说**：
>
> **第一，安全层面。** JS 是动态类型，拼错属性、传错参数都要上线才暴露；TS 在写代码时实时标红，相当于每一行都提前过了一遍检查。
>
> **第二，效率层面。** 类型即文档——函数签名就是最好的 API 契约，看定义就知道怎么传参；IDE 的补全也能精确到属性级别。
>
> **第三，工程层面。** 重构时改一处接口定义，所有引用处立刻报错，一个都漏不掉；而且 TS 支持渐进式迁移，老项目可以一个文件一个文件地改。
>
> **收尾**：当然它也有学习成本和编译时间的代价，但现代构建工具基本抹平了这些。

## Q2：any / unknown / never 的区别？（<span class="hot">超高频</span>）

### 2.1 为什么会有这三个类型

TS 的类型系统有一条「安全光谱」：从「完全不检查」到「必须是某个具体类型」，中间需要几个特殊值来描述极端情况：

```text
完全不管              未知待验证           不可能存在
   |                     |                  |
  any  ────────────►  unknown  ─────────►  never
（放弃监控）        （收下但必须证明）      （这个位置永远没有值）
```

### 2.2 any：类型系统的逃生舱

**是什么**：告诉 TS「这个值我不管了，随便当什么类型都行」。

**能干什么（以及为什么危险）**：

```ts
let a: any = 'hello'

a.foo()        // 不报错！运行时 TypeError
a.bar.baz      // 不报错！运行时直接炸
a = 123        // 随便换类型
a = { x: 1 }   // 还是随便换

const n: number = a  // ✅ any 能赋给任何类型 —— 检查被绕过
n.toFixed()          // 编译器以为 n 是 number，实际运行时可能是字符串
```

**any 的传染性（很多人不知道）**：any 接触过的东西会被污染成 any：

```ts
const list: any[] = [1, 2, 3]
const x = list[0]   // x 的类型是 any（被传染）

function fn(p: any) {
  return p   // 返回值也是 any
}
const result = fn('hi')  // result 是 any —— 污染扩散
```

**什么时候不得不用 any**：

1. 老项目迁移，逐个消灭 any 成本太高；
2. `JSON.parse()` 返回值（历史版本）；
3. 引入完全没有类型定义的三方库（更好的做法是给它写 .d.ts）。

### 2.3 unknown：any 的安全替代品

**是什么**：什么值都能接收，但**使用前必须先向 TS 证明它是什么**。

**关键差异：unknown 能做的不多**：

```ts
let b: unknown = '可能来自接口的数据'

b.toUpperCase()
// ~~~~~~~~~~~ Error: 'b' 的类型为 'unknown'
// 为什么？TS 只知道它「未知」，不敢保证有 toUpperCase

b.length        // Error，同理
b + 1           // Error，同理（unknown 不参与运算）

// ✅ unknown 只允许「安全的操作」：
b === 'x'       // 比较可以
typeof b        // typeof 检查可以
b = 123         // 重新赋值可以
```

**使用前必须收窄——四种方式**：

```ts
// 方式一：typeof 收窄
if (typeof b === 'string') {
  b.toUpperCase()  // ✅ 证明了是 string
}

// 方式二：instanceof 收窄
if (b instanceof Date) {
  b.getTime()      // ✅
}

// 方式三：断言（你确定的时候）
;(b as string).toUpperCase()

// 方式四：自定义守卫
function isString(v: unknown): v is string {
  return typeof v === 'string'
}
```

**实战场景——接收外部数据的正确姿势**：

```ts
// 接口返回的数据形状不确定 -> 先用 unknown 接住
async function fetchApi(url: string): Promise<unknown> {
  const res = await fetch(url)
  return res.json()
}

const data = await fetchApi('/api/user')
// data 是 unknown，你不能直接 data.name（被强制验证）
if (typeof data === 'object' && data !== null && 'name' in data) {
  // 层层验证后才能安全使用 —— 这就是 unknown 的价值
}
```

**catch 的 error 推荐标 unknown**（TS 4.4+ 的 useUnknownInCatchVariables，strict 已包含）：

```ts
try {
  riskyOp()
} catch (e: unknown) {
  // e 是 unknown，必须收窄才能用，防止直接 e.message 报错
  if (e instanceof Error) console.log(e.message)
}
```

### 2.4 never：永不存在的值

**是什么**：这个类型**没有任何一个值能属于它**——表示「逻辑上不可能到达的位置」。

**用途一：抛错 / 死循环函数的返回类型**

```ts
function fail(): never {
  throw new Error('这个函数永远不会正常返回')
}

function forever(): never {
  while (true) {}  // 死循环，永远走不到 return
}
```

**用途二：穷尽检查（面试杀手锏）**

```ts
type Shape =
  | { kind: 'circle'; radius: number }
  | { kind: 'square'; size: number }

function area(shape: Shape): number {
  switch (shape.kind) {
    case 'circle': return Math.PI * shape.radius ** 2
    case 'square': return shape.size ** 2
    default: {
      // 所有成员都处理完了，shape 在这里被收窄成 never
      // 「不可能有剩下的值」
      const _exhaustive: never = shape
      return _exhaustive
    }
  }
}

// 现在需求变更，新增 triangle：
// type Shape = ... | { kind: 'triangle'; base: number; height: number }
//
// area 函数忘记处理 triangle 会怎样？
// switch 走到 default 时，shape = triangle 分支，不是 never！
// const _exhaustive: never = shape  <- 立刻编译报错
// 错误信息直接告诉你漏了哪个分支 —— 这就是 never 的威力
```

**用途三：过滤联合类型**（配合条件类型，见进阶篇）：

```ts
type NonNever = 'a' | never | 'b'  // never 在联合中自动消失 -> 'a' | 'b'
```

### 2.5 对比总结表

| | any | unknown | never |
| --- | --- | --- | --- |
| 语义 | 放弃检查 | 未知，待验证 | 永不出现 |
| 什么值能赋给它 | 任何 | 任何 | **没有任何值** |
| 它能赋给什么 | 任何类型 | 仅 any / unknown | 任何类型（never 是万物子类型） |
| 能直接调方法吗 | ✅ | ❌ 必须收窄 | ❌（没有值可调） |
| 传染性 | **有**（污染接触者） | 无 | 无 |
| 推荐度 | 尽量消灭 | **推荐**（替代 any） | 按语义使用 |

### 2.6 面试回答示范（总-分结构）

> **总起**：这三个类型处在「类型安全光谱」的三个位置——any 是完全放弃检查，unknown 是收下但强制验证，never 是表示不可能存在，性质完全不同。
>
> **逐个说**：
>
> **第一，any 是逃生舱。** 什么操作都不报错，而且有传染性——它接触过的变量会被污染成 any，错误会静默扩散，所以新代码里要尽量消灭它。
>
> **第二，unknown 是 any 的安全替代。** 什么值都能接收，但使用前必须先收窄证明类型，比如 typeof、instanceof 或断言；接口返回值和 catch 的 error 我都习惯标 unknown。
>
> **第三，never 表示永不存在的值。** 抛错函数的返回类型是它；更重要的用途是穷尽检查——switch 处理联合类型时在 default 里用 never 接住，将来新增分支忘了处理会直接编译报错，等于给类型系统上了保险。
## Q3：interface 和 type 的区别？（<span class="hot">超高频</span>）

### 3.1 为什么会有两种描述方式

历史原因：interface 是 TS 早期就有的「对象形状描述」；type 是后来加入的「类型别名」——不止对象，任何类型都能起名。**两者在「描述对象」这件事上能力重叠**，所以才会被反复对比。

### 3.2 interface 深讲

**基础：描述对象形状**

```ts
interface User {
  name: string          // 必填属性
  age?: number          // 可选属性（可能没有）
  readonly id: number   // 只读属性（创建后不能改）
}

const u: User = { id: 1, name: '小明' }  // age 不传也合法
```

**描述函数形状**

```ts
interface Comparator {
  (a: number, b: number): number  // 调用签名：这是个函数
}

const sortFn: Comparator = (a, b) => a - b
```

**extends 继承（单继承 & 多继承）**

```ts
interface Animal {
  name: string
}

interface Bird extends Animal {          // 继承一个
  fly: () => void
}

interface Fish {
  swim: () => void
}

interface FlyingFish extends Animal, Fish {  // 继承多个，逗号分隔
  maxAltitude: number
}
```

**声明合并（interface 独有能力！）**

```ts
// 同名 interface 会自动合并成一个
interface Window {
  __APP_CONFIG__: { apiBase: string }
  // 你在自己项目的 d.ts 里写这段
}
// 全局 Window 就多了这个属性，任何文件直接 window.__APP_CONFIG__ 不报错

// 实际用途：扩展三方库类型、给全局对象补充字段
```

**type 做不到声明合并**——同名 type 重复定义直接报错。

### 3.3 type 深讲

**本质：给「任何类型」起别名**

```ts
// 1. 对象（和 interface 等价）
type User = { name: string; age: number }

// 2. 联合类型（type 独有！interface 写不了）
type Status = 'loading' | 'success' | 'error'
type ID = string | number

// 3. 元组（type 独有）
type Point = [number, number]  // 长度固定 2 的数组

// 4. 基础类型起别名（type 独有）
type Milliseconds = number     // 语义化别名，代码可读性更好

// 5. 交叉类型组合（type 独有）
type Named = { name: string }
type Aged = { age: number }
type Person = Named & Aged     // { name: string } & { age: number }

// 6. 后面进阶篇的映射/条件类型，全部是 type 的形式
type PartialUser = { [K in keyof User]?: User[K] }
```

### 3.4 能力对照表（背熟）

| 能力 | interface | type |
| --- | --- | --- |
| 描述对象 | ✅ | ✅ |
| 描述函数 | ✅ | ✅ |
| 扩展 | extends 继承 | `&` 交叉合并 |
| **声明合并** | ✅ 同名自动合并 | ❌ 重复定义报错 |
| **联合类型** | ❌ | ✅ |
| **元组 / 基础类型别名** | ❌ | ✅ |
| 映射 / 条件类型 | ❌ | ✅ |

### 3.5 选型策略（团队规范怎么定）

```text
描述对象结构          -> interface（可被 extends，未来可扩展）
联合 / 交叉 / 元组    -> type（别无选择）
扩展三方库 / Window   -> interface（用声明合并）
工具类型 / 类型体操   -> type（必须）
团队没历史包袱       -> 定一条：对象 interface、其余 type，统一就好
```

### 3.6 面试回答示范（总-分结构）

> **总起**：两者在「描述对象」上能力等价，选型的核心就看两点——需不需要声明合并、需不需要非对象类型的能力。
>
> **三个关键差异**：
>
> **第一，声明合并是 interface 独有的。** 同名 interface 自动合并，典型场景是在 .d.ts 里给 Window 或三方库补自定义属性，全局直接可用；type 重复定义会直接报错。
>
> **第二，联合、交叉、元组、映射这些能力是 type 独有的。** 比如 `type Status = 'a' | 'b'` 这种联合，interface 写不出来；Partial 的映射语法也只有 type 能表达。
>
> **第三，扩展方式不同。** interface 用 extends 继承（支持多继承），type 用 `&` 交叉合并。
>
> **收尾**：所以我的习惯是——对象结构用 interface（可被继承、可声明合并），联合交叉和工具类型必须用 type，团队统一规范比选哪个更重要。
## Q4：类型断言（as / 双断言 / satisfies）（<span class="hot">高频</span>）

### 4.1 为什么需要断言

TS 的推断不是万能的——有些信息只有**你**知道，编译器不知道：

```ts
// TS 只知道 getElementById 返回 HTMLElement | null（它没看过你的 HTML）
// 但你知道页面上 id="age-input" 的确实是 <input>
const el = document.getElementById('age-input')
// el 的类型: HTMLElement | null —— 太宽了，没有 value 属性

el.value  // Error：HTMLElement 上没有 value
```

类型断言就是**向编译器出示证件**：「相信我，它是这个类型」。

### 4.2 as 单断言（最常用）

```ts
const el = document.getElementById('age-input') as HTMLInputElement
//                                                          ^^^^^^^^^^^^^^^^
// 断言成更具体的 input 元素类型

el.value          // ✅ 现在有 value 了
el.checked        // ✅ checkbox 相关属性也有

// 注意：断言必须「有依据」——两种类型有重叠关系才允许直接断言
const n = 'hello' as number
// Error: 类型 "string" 与类型 "number" 没有足够的重叠
// 骗得太离谱 TS 会拒绝
```

### 4.3 双断言 as unknown as（逃生舱，慎用）

```ts
// 类型完全不相关时，先转 unknown 再转目标（两步骗过编译器）
const s = 'hello' as unknown as number
// ✅ 能编译过
// 但运行时 s 还是字符串 —— 编译器被骗了，运行时不会陪你演戏

// 什么时候用：类型定义确实错了 / 三方库类型有 bug，临时绕过
// 出现双断言 = 类型设计有问题的信号，应该去修类型而不是堆断言
```

### 4.4 非空断言 !（另一个常用断言）

```ts
function greet(name: string | null) {
  console.log(name!.length)
  //            ^ 告诉 TS：我保证 name 这里不是 null
  // 如果运行时真的是 null —— TypeError，TS 不背锅
}

// 对比更安全的写法（推荐）：
name?.length ?? 0
```

### 4.5 satisfies（TS 4.9+，新趋势）

**解决什么问题**：类型标注 `:` 会把推断**放宽**，断言 `as` 会**骗过**检查——satisfies 两全其美：**既校验又保留精确推断**。

```ts
type Direction = 'up' | 'down'

// 方式一：类型标注 —— 校验了，但推断被放宽
const config1: Record<'dir', Direction> = { dir: 'up' }
type T1 = typeof config1.dir   // 'up' | 'down'（被放宽，丢了 'up'）

// 方式二：satisfies —— 校验了，且保留字面量
const config2 = { dir: 'up' } satisfies Record<'dir', Direction>
//                     ^^^^^ 检查：'up' 是合法的 Direction ✅
type T2 = typeof config2.dir   // 'up'（保留了精确字面量！）

// 写错时照样报错：
const bad = { dir: 'left' } satisfies Record<'dir', Direction>
//                          ~~~~~~~~~ Error: 'left' 不能赋给 Direction
```

### 4.6 断言使用原则

```text
1. 断言不改变运行时 —— 只骗过编译器，运行时该是什么还是什么
2. 有类型守卫就别用断言（if 判断比 as 可靠）
3. 双断言出现 = 类型设计有味道，去修类型
4. 新代码里 satisfies 优于裸 as（能校验还能保留推断）
```

### 4.7 面试回答示范（总-分结构）

> **总起**：断言的本质是「告诉编译器我比你知道得多」——它只作用于编译期，运行时什么都不变，所以我的核心原则是：有类型守卫就不用断言。
>
> **分三种情况**：
>
> **第一，常规 as 断言。** 用于 TS 推断过宽的场景，比如 getElementById 返回 HTMLElement，但我确定它是 input，就 as 成 HTMLInputElement 去拿 value 属性。
>
> **第二，双断言 as unknown as。** 类型完全不相干时先转 unknown 再转目标，能编译过但运行时不变——它的出现往往说明类型设计有问题，应该去修类型而不是堆断言。
>
> **第三，satisfies 是新趋势。** 它两全其美：既校验类型合法性，又保留字面量的精确推断，比类型标注（会放宽）和裸 as（会骗过检查）都好。
## Q5：联合类型 | 和交叉类型 &（<span class="hot">高频</span>）

### 5.1 联合：多选一

**是什么**：值只能是列出的几种类型**之一**。

```ts
type Status = 'loading' | 'success' | 'error'
// 值空间：只有这三个字符串，其他都不合法

let s: Status = 'loading'  // ✅
s = 'pending'              // Error: 'pending' 不能赋给 Status
```

**核心规则：只能访问公共成员（很多人栽在这）**

```ts
function format(id: string | number) {
  id.length
  // ~~~~~~ Error
  // 为什么？TS 的逻辑：
  //   id 可能是 string（有 length），也可能是 number（没有 length）
  //   我不敢保证是哪个 -> 只敢用「两个都有的能力」
  //   string 和 number 的公共能力：toString、valueOf

  return id.toString()  // ✅ 公共方法没问题

  // 想用 length？先证明它是 string（引出 Q8 类型收窄）：
  // if (typeof id === 'string') return id.length
}
```

**判别联合（最重要的用法，Q8 详讲）**：

```ts
// 给每个成员加「身份证字段」（字面量标签）
type State =
  | { status: 'loading' }
  | { status: 'success'; data: string }
  | { status: 'error'; message: string }
// 这是前端状态管理的标准建模方式
```

### 5.2 交叉：全都要

**是什么**：必须**同时满足**所有成员的要求——对象交叉时属性合并。

```ts
interface Named { name: string }
interface Aged { age: number }

type Person = Named & Aged
// 等价于 { name: string; age: number }
// 通俗：既是 Named 又是 Aged -> 两个的属性都得有

const p: Person = { name: '小明', age: 18 }  // ✅ 两个都有
const bad: Person = { name: '小明' }          // Error: 缺 age
```

**主要用途：组合复用接口**（类似 interface 的 extends，但写法更灵活）：

```ts
type WithLoading = { loading: boolean }
type WithError = { error: string | null }

type AsyncState = WithLoading & WithError
// { loading: boolean; error: string | null }
```

### 5.3 两个必知的坑

**坑一：原始类型交叉 = never**

```ts
type X = string & number   // never！
// 一个值不可能既是 string 又是 number -> 不存在 -> never
// 常见于错误的交叉（接口设计错了），要能看懂这个信号
```

**坑二：同名属性类型冲突**

```ts
type A = { value: string }
type B = { value: number }
type C = A & B
// C['value'] = string & number = never
// 编译不报错（定义时），但使用 value 时发现是 never —— 设计冲突了
```

### 5.4 对比与记忆

| | 联合 \| | 交叉 & |
| --- | --- | --- |
| 语义 | 或（其一） | 且（全部） |
| 对象效果 | 「身份证」区分成员 | 属性合并 |
| 能访问什么 | 仅公共成员 | 全部属性 |
| 典型用途 | 状态建模、参数多态 | 能力组合、接口复用 |

**面试回答（总-分结构）**：

> **总起**：联合是多选一，交叉是全都要——这一个区别就决定了它们各自能访问什么、用在什么场景。
>
> **第一，联合 | 是「或」。** 值只能是几种之一，但只能访问所有成员的公共属性——因为 TS 不确定具体是哪个，只敢保证大家都有的能力；想用独有属性要先收窄，判别联合就是给每个成员加字面量标签来解决这个问题的。
>
> **第二，交叉 & 是「且」。** 必须同时满足所有成员，对象交叉等于属性合并，常用来组合复用接口，比如 Loading 和 Error 两个能力交叉出一个异步状态类型。
>
> **第三，注意两个坑。** 原始类型交叉会得到 never；同名属性类型冲突交叉也会得到 never——代码里看到 never 交叉，基本是类型设计冲突的信号。
## Q6：enum 枚举 与 const enum

### 6.1 为什么需要枚举：消灭魔法数字

```ts
// 魔法数字：三天后没人记得 0、1、2 是什么
if (state === 0) { /* 0 是什么？ */ }

// 枚举：给常量起组名
enum LoadState { Idle, Loading, Success, Error }
if (state === LoadState.Loading) { /* 一眼看懂 */ }
```

### 6.2 数字枚举：自增 + 反向映射

```ts
enum Direction {
  Up,     // 0 —— 第一个不赋值，从 0 开始
  Down,   // 1 —— 自动 +1
  Left,   // 2
  Right   // 3
}

Direction.Up      // 0（名字 -> 值）
Direction[0]      // 'Up'（值 -> 名字，反向映射！）
```

**看编译产物，理解反向映射怎么来的**：

```js
// tsc 编译 Direction 后生成的 JS：
var Direction;
(function (Direction) {
  Direction[Direction['Up'] = 0] = 'Up'   // 正向：Up=0；反向：0='Up'
  Direction[Direction['Down'] = 1] = 'Down'
  // ...
})(Direction || (Direction = {}))
// 普通 enum 是真实存在的运行时对象！
```

### 6.3 字符串枚举：更推荐

```ts
enum ApiStatus {
  Loading = 'LOADING',   // 每项都要显式赋值
  Success = 'SUCCESS',
  Error   = 'ERROR'
}

// 为什么推荐字符串：
// 1. 打印日志看到 'SUCCESS' 一眼懂；数字 2 要去查
// 2. 没有反向映射（编译产物更干净）
// 3. 序列化/传输时值稳定（数字自增可能因插入新项而变化！）
```

### 6.4 const enum：零运行时

```ts
const enum Color { Red, Green }

const c = Color.Red
// 编译产物就一行：const c = 0
// 不生成对象，所有引用直接替换成常量值 —— 零运行时成本
// 适合纯内部使用的常量集合
```

**注意**：isolatedModules 模式（Vite 等单文件编译）下 const enum 可能受限，各构建工具支持度在改善，用之前确认项目环境。

### 6.5 现代替代方案：字面量联合 + as const

```ts
type Status = 'idle' | 'loading' | 'success' | 'error'

// 对比：
// ✅ 零运行时（type 编译后完全消失）
// ✅ 更好的 tree-shaking
// ✅ 联合类型直接收窄（switch 自动提示所有分支）
// ❌ 没有命名空间组织、没有反向映射
```

### 6.6 四种方案对比

| | 数字 enum | 字符串 enum | const enum | 字面量联合 |
| --- | --- | --- | --- | --- |
| 运行时产物 | 真实对象 | 真实对象 | 内联常量 | 无 |
| 反向映射 | ✅ | ❌ | ❌ | ❌ |
| 值可读性 | 差 | 好 | 看定义 | 好 |
| 现代推荐 | 少用 | 常用 | 可用 | **首选** |

**面试回答（总-分结构）**：

> **总起**：enum 解决的是「魔法数字」问题，但具体到新项目，我的选择是「字面量联合 + as const」优先。
>
> **分四种方案看**：
>
> **第一，普通数字 enum。** 有反向映射（值查名字），但会编译成真实的 JS 对象，存在运行时成本。
>
> **第二，字符串 enum。** 日志可读性好、值稳定，是 enum 里更推荐的形式。
>
> **第三，const enum。** 编译期内联成常量、零运行时成本，但要注意 isolatedModules 环境下的限制。
>
> **第四，字面量联合。** 零运行时、能配合类型收窄、tree-shaking 友好——所以我新代码首选它；只有需要命名空间组织或反向映射时才用 enum。
## Q7：函数类型与函数重载

### 7.1 定义函数类型的四种方式

```ts
// 方式一：函数声明（最常见）
function add(a: number, b: number): number {
  return a + b
}

// 方式二：类型别名（把「函数形状」起名复用）
type Handler = (event: string) => void
//    读法：接收 string 参数、无返回值的函数
const onClick: Handler = (e) => {}

// 方式三：interface 描述（调用签名）
interface Comparator {
  (a: number, b: number): number
}
const sortFn: Comparator = (x, y) => x - y

// 方式四：内联（一次性使用）
function process(cb: (data: string) => boolean) {}
```

### 7.2 参数的三种特殊形态

```ts
function greet(
  name: string,        // 1. 必选参数
  greeting = '你好',    // 2. 默认值参数（不传用默认）
  ...tags: string[]    // 3. 剩余参数（多余实参收成数组）
) {
  return `${greeting}, ${name} ${tags.join('/')}`
}

greet('小明')                    // '你好, 小明'
greet('小明', 'Hello')           // 'Hello, 小明'
greet('小明', 'Hi', 'a', 'b')   // 'Hi, 小明 a/b'

// 规则：必选 -> 可选/默认 -> rest，顺序不能乱
```

### 7.3 void 和 undefined 的区别（细节考点）

```ts
// void：调用方不应该使用返回值（函数可以返回任何东西，但没意义）
type Callback = () => void

const cb: Callback = () => 123   // ✅ 不报错（返回值被忽略）

// undefined：明确「返回值就是 undefined」
const fn2 = (): undefined => {}  // 必须显式 return undefined
```

### 7.4 函数重载：参数和返回值的对应关系

**为什么需要重载**——联合参数表达不了「不同参数对应不同返回值」：

```ts
// 问题：这样写返回值只能标注成宽泛的联合，调用方要自己判断
function pad(value: string | number, len: number): string | number

// 传 string 时调用方其实确定返回 string！但类型上看不出来
```

**重载写法：签名列表 + 实现签名**

```ts
// 对外可见的签名 1：value 是 string -> 返回 string
function pad(value: string, len: number): string
// 对外可见的签名 2：value 是 number -> 返回 number
function pad(value: number, len: number): number
// 实现签名（对外不可见，只约束内部实现）
function pad(value: any, len: number): any {
  return String(value).padStart(len, '0')
}

pad('abc', 5)   // 调用提示：返回 string ✅（匹配签名 1）
pad(123, 5)     // 返回 number ✅（匹配签名 2）
```

**三条匹配规则**：

1. 外部调用只匹配**重载签名列表**，实现签名不可见；
2. 从上到下匹配，精确的签名写前面（否则会被宽泛签名提前截胡）；
3. 实现签名的参数要兼容所有重载签名（用 any 或联合兜底）。

**什么时候不用重载**：参数类型不同但处理一致时，联合参数就够——重载是为了表达「参数与返回值的对应关系」。

### 7.5 面试回答示范（总-分结构）

> **总起**：函数类型就是描述「参数和返回值」的契约；而重载解决的是一个联合参数表达不了的问题——不同参数对应不同返回值。
>
> **分三点**：
>
> **第一，参数有三种特殊形态。** 可选参数、默认值参数、rest 剩余参数，顺序固定不能乱。
>
> **第二，重载的写法是「签名列表 + 实现签名」。** 对外只暴露多个重载签名，实现签名对外不可见；调用方按签名从上往下匹配，所以精确的签名要写在前面。
>
> **第三，使用边界要清楚。** 如果只是参数类型不同、返回值一致，用联合参数就够；只有「传 string 返回 string、传 number 返回 number」这种对应关系，才需要上重载。
## 本篇速答

| 问题 | 一句话答案 |
| --- | --- |
| any 的传染性？ | any 接触过的变量/返回值都变成 any，错误静默扩散 |
| unknown 怎么才能用？ | typeof / instanceof / 断言 / 自定义守卫，先证明类型 |
| never 的三大用途？ | 抛错函数返回、穷尽检查 default、联合中消失 |
| interface 独有能力？ | 声明合并（扩展 Window 常用） |
| type 独有能力？ | 联合、交叉、元组、映射、条件类型 |
| 断言改变运行时吗？ | 不改变，纯编译期信任 |
| satisfies 的优势？ | 既校验合法性又保留字面量精确推断 |
| 联合为什么只能用公共成员？ | TS 不确定是哪个成员，只敢保证都有 |
| 原始类型交叉结果？ | never（不可能同时是两个） |
| enum 的运行时成本？ | 普通 enum 编译成对象；const enum 内联零成本 |
| 实现签名能被调用匹配吗？ | 不能，外部只按重载签名列表匹配 |
