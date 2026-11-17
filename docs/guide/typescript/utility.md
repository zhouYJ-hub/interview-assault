# TypeScript 泛型与工具类型（Q15 - Q20）

> 每题五层结构：**为什么存在 -> 是什么（逐个深讲）-> 怎么用（场景+注释）-> 常见坑 -> 面试怎么答（总-分）**

## Q15：泛型是什么？怎么用？（<span class="hot">高频</span>）

### 15.1 为什么存在

先看不用泛型的困境：

```ts
// 方案一：写死类型 —— 一个类型写一份
function firstString(arr: string[]): string { return arr[0] }
function firstNumber(arr: number[]): number { return arr[0] }
// 20 种类型写 20 份？维护噩梦

// 方案二：用 any —— 能复用但类型丢了
function first(arr: any[]): any { return arr[0] }
const n = first([1, 2, 3])   // n 是 any，没有提示、没有保护
// 等于回到了 JS
```

需要一种机制：**逻辑写一份，类型「调用时再决定」，同时保留精确推断**——这就是泛型。

### 15.2 是什么

泛型 = **类型的参数**。普通函数把「值」作为参数传入，泛型把「类型」作为参数传入：

```text
function fn(a: number)         值参数：调用时传值
function fn<T>(a: T)           类型参数：调用时传类型（大多自动推断）
```

### 15.3 怎么用

```ts
// ============ 泛型函数：T 是类型占位符 ============
function first<T>(arr: T[]): T {
  //       ^^^ 声明类型参数 T
  //             ^^^^^ T 类型的数组
  //                    ^^ 返回 T 类型
  return arr[0]
}

first<string>(['a', 'b'])  // 显式指定 T = string
first([1, 2, 3])           // ✅ 自动推断 T = number
// 返回值自动是 number —— 有提示、有保护，两全其美

// ============ 泛型接口：一个接口适配多种数据 ============
interface ApiResponse<T = unknown> {
  //                    ^^^^^^^^^ 默认类型：不传 T 时用 unknown
  code: number
  data: T    // data 的类型由调用方决定
}

type UserRes   = ApiResponse<{ name: string }>  // data 是 { name: string }
type ListRes   = ApiResponse<string[]>          // data 是 string[]
type PlainRes  = ApiResponse                   // 不传 -> data 是 unknown

// ============ 泛型类 ============
class Stack<T> {
  private items: T[] = []
  push(item: T) { this.items.push(item) }
  pop(): T | undefined { return this.items.pop() }
}

const s = new Stack<number>()
s.push(1)
// s.push('x')  // Error：T 已经锁定 number

// ============ 实战：类型安全的请求封装 ============
async function request<T>(url: string): Promise<T> {
  const res = await fetch(url)
  return res.json() as Promise<T>
  // 函数本身不知道返回什么 —— 由调用方告诉它
}

const user = await request<{ name: string }>('/api/user')
user.name  // ✅ 完整提示
```

### 15.4 常见坑

```ts
// 坑一：能推断就不要手写
first<string>(['a'])   // 冗余
first(['a'])           // ✅ 自动推断更简洁

// 坑二：T 在函数体内是「未知类型」，不能乱用
function bad<T>(v: T) {
  v.length  // Error：T 可能是 number，不一定有 length
  // 想用要先约束 -> 见 Q16
}

// 坑三：泛型不写默认值时，不传泛型的调用可能拿到 unknown
ApiResponse                 // data: unknown（有默认值）
ApiResponse2<T>             // 不传 T 编译报错（没有默认值）
```

### 15.5 面试回答示范（总-分结构）

> **总起**：泛型是「类型的参数」——把类型像值一样传进函数/接口/类，让一份逻辑适配多种类型，同时保留精确的类型推断。
>
> **分三点**：
>
> **第一，它解决的是 any 和重载的两难。** 写死类型要复制 N 份函数；用 any 复用了但类型信息全丢。泛型两头都要：调用时才决定 T 是什么，返回值类型自动跟着精确。
>
> **第二，调用时大多不用显式传。** TS 会根据实参自动推断 T，比如 `first([1,2,3])` 自动知道 T 是 number。
>
> **第三，实战里我最多用在请求封装和容器类型。** `request<T>` 让每个接口的返回值类型由调用方声明，一个函数服务所有接口；ApiResponse 这种带默认泛型的接口也是标准做法。

## Q16：泛型约束（extends）（<span class="hot">高频</span>）

### 16.1 为什么存在

泛型 T 默认是「任意类型」——TS 对它一无所知，连属性都访问不了（上面的坑二）。想使用 T 的某些能力，必须先**划底线**：约束。

### 16.2 是什么

`T extends 某结构` 的读法是「T 至少满足这个结构」——不是类的继承，是**结构上的要求**。

```ts
// 没约束：T 上什么都干不了
function logLength<T>(value: T) {
  value.length  // Error：T 不一定有 length
}

// 有约束：保证 T 有 length
function logLength<T extends { length: number }>(value: T) {
  //           ^^^^^^^^^^^^^^^^^^^^^^^^^^^^ T 至少是「有 length: number」的形状
  value.length  // ✅ 有底线保证，敢用了
}

logLength('hello')  // ✅ string 有 length
logLength([1, 2])   // ✅ 数组有 length
logLength(123)      // Error：number 没有 length —— 编译期拦住
```

### 16.3 两个高频组合

```ts
// ============ 组合一：K extends keyof T（安全属性访问） ============
function getProp<T, K extends keyof T>(obj: T, key: K): T[K] {
  //             ^^^^^^^^^^^^^^^^ key 只能是 T 的合法键
  return obj[key]
}

const user = { name: 'x', age: 18 }
getProp(user, 'name')  // string
getProp(user, 'age')   // number —— 每个键返回类型都不同
getProp(user, 'foo')   // Error：拼错键编译报错

// ============ 组合二：多泛型互相约束 ============
function merge<T extends object, U extends object>(a: T, b: U): T & U {
  //              ^^^^^^^^^^^^^^ 保证是对象，才能展开合并
  return { ...a, ...b }
}

// 约束字面量：只允许特定的几个值
function setDirection<T extends 'up' | 'down'>(dir: T) {}
setDirection('up')     // ✅
setDirection('left')   // Error
```

### 16.4 面试回答示范（总-分结构）

> **总起**：泛型约束就是给 T 划底线——默认的 T 是「任意类型」什么都干不了，用 extends 要求它至少满足某个结构，才能安全使用对应能力。
>
> **分两点**：
>
> **第一，约束的读法是「至少满足」而不是继承。** `T extends { length: number }` 意思是 T 至少得有 length 属性——string、数组都符合，number 不符合直接报错。
>
> **第二，最高频的组合是 K extends keyof T。** 把 key 约束为 T 的合法键，拼错键名编译期拦截，返回值还能精确到具体键的类型——这是 keyof 约束的标准应用，工具类型 Pick 的签名里就有它。

## Q17：常用内置工具类型（<span class="hot">超高频</span>，必背 8 个）

### 17.1 为什么存在

业务里大量类型是「从已有类型变换来的」：User 去掉 id 变成创建参数、全部属性变可选变成更新参数——手写重复且要双重维护。TS 把这些常见变换内置成了工具类型。

### 17.2 八个工具逐个讲（每个带真实场景）

```ts
interface User {
  id: number
  name: string
  age?: number
}

// ============ 1. Partial<T>：全部变可选 ============
// 场景：PATCH 更新——只传要改的字段
type UpdateUser = Partial<User>
// { id?: number; name?: string; age?: number }

async function updateUser(id: number, data: Partial<User>) {
  // 只传 name 也合法：updateUser(1, { name: '新名字' })
}

// ============ 2. Required<T>：全部变必填 ============
// 场景：某个流程里 age 不允许缺省
type FullUser = Required<User>  // age 变必填

// ============ 3. Pick<T, K>：挑出指定键 ============
// 场景：列表页只需要 id 和 name，不想把整个 User 传下去
type UserBrief = Pick<User, 'id' | 'name'>
// { id: number; name: string }

// ============ 4. Omit<T, K>：去掉指定键（最常用！） ============
// 场景：创建用户不需要传 id（后端生成）
type CreateUserDTO = Omit<User, 'id'>
// { name: string; age?: number }
// 一个 User 派生出「列表用」「创建用」「更新用」三种类型 —— 单一数据源

// ============ 5. Record<K, V>：构造字典类型 ============
// 场景：id 索引到用户
type UserMap = Record<string, User>
// 等价于 { [key: string]: User } 但语义更明确

// ============ 6. Exclude<T, U>：联合中排除 ============
type AllStatus = 'all' | 'loading' | 'success' | 'error'
type ConcreteStatus = Exclude<AllStatus, 'all'>
// 'loading' | 'success' | 'error'

// ============ 7. Extract<T, U>：联合中提取 ============
type AB = Extract<'a' | 'b' | 'c', 'a' | 'b'>
// 'a' | 'b'

// ============ 8. ReturnType<T>：提取函数返回值 ============
function createUser() {
  return { id: 1, name: 'x' }
}
type NewUser = ReturnType<typeof createUser>
// typeof createUser 先拿函数类型，ReturnType 提取返回值
// -> { id: number; name: string } —— 不用再手写一遍接口
```

### 17.3 记忆口诀 + 关系

```text
改必填：Partial（变可选）/ Required（变必填）
挑去键：Pick（挑出）/ Omit（去掉） —— 互补关系
玩联合：Exclude（排除）/ Extract（提取） —— 互补关系
造字典：Record
拿返回：ReturnType

Omit<T, K> ≈ Pick<T, Exclude<keyof T, K>>  // 可以互相实现
```

### 17.4 面试回答示范（总-分结构）

> **总起**：内置工具类型是 TS 帮我们写好的「类型变换函数」，从已有类型派生新类型，避免手写重复接口、实现单一数据源。
>
> **按四组记**：
>
> **第一组，改必填：Partial 和 Required。** 更新接口用 Partial 只传要改的字段，这是最高频的用法。
>
> **第二组，挑去键：Pick 和 Omit。** Omit 我用得最多——User 去掉 id 就是创建参数、去掉敏感字段就是对外 DTO，一个源类型派生整套。
>
> **第三组，玩联合：Exclude 和 Extract。** 在联合类型里做减法和筛选，比如状态集合去掉 all。
>
> **第四组，Record 造字典、ReturnType 拿函数返回值类型。** 尤其 ReturnType 配 typeof，函数返回值直接复用成接口，不用维护两份定义。

## Q18：手写工具类型（<span class="hot">超高频</span>，面试分水岭）

### 18.1 为什么这是分水岭

只会用 Partial 是「会用 API」；能手写 MyPartial 是「懂原理」——它证明你真的掌握映射类型、泛型约束、条件类型、infer 这四大能力。

### 18.2 四件套逐行拆解

```ts
// ============ 一、MyPartial —— 考映射类型 ============
type MyPartial<T> = {
  [K in keyof T]?: T[K]
}
// 逐行读：
// keyof T         -> 'name' | 'age'（拿到键的联合）
// [K in ...]      -> 遍历每个键，生成同名属性
// ?               -> 每个属性加可选
// T[K]            -> 值类型取原来那个键的类型
// User -> { name?: string; age?: number } ✅

// ============ 二、MyPick —— 考泛型约束 + 映射 ============
type MyPick<T, K extends keyof T> = {
  //           ^^^^^^^^^^^^^^^^ 约束：K 只能从 T 的键里选
  [P in K]: T[P]
  // ^^^^^ 注意遍历的是 K（你挑的键），不是 keyof T（全部键）
}
// MyPick<User, 'id' | 'name'> -> { id: number; name: string } ✅

// ============ 三、MyRecord —— 考 keyof any ============
type MyRecord<K extends keyof any, V> = {
  //           ^^^^^^^^^^^^^^^^^ keyof any = string | number | symbol
  //                          （JS 里能当对象键的全部类型）
  [P in K]: V
}
// MyRecord<'a' | 'b', number> -> { a: number; b: number } ✅

// ============ 四、MyReturnType —— 考条件类型 + infer ============
type MyReturnType<T> =
  T extends (...args: any[]) => infer R ? R : never
  // ^ 先问：T 能不能匹配「任意参数的函数」这个形状？
  //                        ^^^^^^^ 能 -> 把返回值位置的类型抓出来叫 R
  //                                  结果就是 R
  // 不是函数 -> 走 never 分支
// MyReturnType<() => string> = string ✅

// ============ 五、MyExclude —— 考分发条件类型（附加） ============
type MyExclude<T, U> = T extends U ? never : T
//                 满足 U 丢弃(never)    否则保留

// 推导过程（联合分发逐个判断）：
// MyExclude<'a' | 'b', 'a'>
// = ('a' extends 'a' ? never : 'a')    // 'a' 满足 -> never
// | ('b' extends 'a' ? never : 'b')    // 'b' 不满足 -> 'b'
// = never | 'b'
// = 'b'  ✅（never 在联合中自动消失 —— 这就是它能"删类型"的原理）
```

### 18.3 面试回答示范（总-分结构）

> **总起**：手写工具类型我按「四件套」准备——MyPartial、MyPick、MyRecord、MyReturnType，它们正好对应映射类型、泛型约束、keyof any、条件类型加 infer 这四大底层能力。
>
> **逐个说**：
>
> **第一，MyPartial 一行映射类型。** `[K in keyof T]?: T[K]`——keyof 拿键、in 遍历、问号加可选、T[K] 取值。
>
> **第二，MyPick 多一个约束。** K extends keyof T 保证只能挑合法键，映射时遍历的是 K 而不是全部键。
>
> **第三，MyReturnType 用 infer 挖坑。** 让 T 去匹配函数形状，返回值位置写 infer R，匹配上就把返回值类型抓出来。
>
> **第四，MyExclude 靠联合分发删类型。** 满足条件的映射成 never，never 在联合里自动消失——这就是 Exclude 能「删除」联合成员的原理。能边写边讲出分发过程，才算真正吃透。

## Q19：declare 与 .d.ts 文件

### 19.1 为什么存在

两个现实问题：

```ts
// 问题一：构建工具注入的全局变量，TS 不认识
console.log(window.__APP_CONFIG__)  // Error：__APP_CONFIG__ 不在 Window 上

// 问题二：三方库是纯 JS 写的，没有任何类型
import { init } from 'legacy-lib'   // Error: 找不到声明文件
init({ id: 'app' })                 // 什么提示都没有
```

.d.ts + declare 就是**给运行时存在、但 TS 看不见的东西补类型描述**。

### 19.2 是什么

- **`.d.ts`**：声明文件——只有类型、零实现代码，编译后不产出任何 JS；
- **`declare`**：告诉编译器「这个东西运行时存在，类型听我描述」。

### 19.3 四种典型用法

```ts
// ============ 用法一：扩展 Window ============
// types/global.d.ts
declare interface Window {
  __APP_CONFIG__: { apiBase: string }
}
// 任何文件里 window.__APP_CONFIG__ 直接用，不报错

// ============ 用法二：给 JS 库补声明 ============
declare module 'legacy-lib' {
  export function init(options: { id: string }): void
  export const version: string
}

// ============ 用法三：声明全局常量 ============
declare const __DEV__: boolean    // Vite/Webpack 注入的环境变量
declare const VERSION: string

// ============ 用法四：让 TS 认识 .vue 文件 ============
// Vue 项目的 env.d.ts（脚手架自带）：
declare module '*.vue' {
  import type { DefineComponent } from 'vue'
  const component: DefineComponent<{}, {}, any>
  export default component
}
```

### 19.4 三方库的类型从哪来（高频追问）

```text
库自带类型（现代库标配）
    package.json 里有 "types" 字段指向 .d.ts
    例：axios、vue3

社区包 @types/xxx（库没有类型时）
    npm i -D @types/lodash
    由 DefinitelyTyped 社区维护

都没有 -> 自己写 declare module（上面用法二）
```

### 19.5 面试回答示范（总-分结构）

> **总起**：.d.ts 是纯类型声明文件，declare 负责告诉编译器「运行时存在、类型听我描述」——它们解决的是 TS 看不见运行时实体的类型补充问题。
>
> **分三种场景**：
>
> **第一，扩展全局对象。** 项目里给 Window 补自定义配置字段，在 global.d.ts 里 declare interface Window，全局生效。
>
> **第二，给无类型的 JS 库补声明。** declare module 加导出签名，或者装社区的 @types 包——所以三方库类型有三个来源：自带、@types、自己写。
>
> **第三，框架集成。** Vue 项目里 declare module '*.vue' 让 TS 认识 .vue 导入，这是脚手架标准配置。要点是 .d.ts 编译后零产出，纯编译期资产。

## Q20：tsconfig 核心配置与 strict 模式

### 20.1 为什么重要

tsconfig 是编译器的「规则书」——检查多严格、编译成什么、路径怎么找全在这配置。**strict 是否开启，直接决定项目的类型安全水位**，面试也常拿它考察工程实践。

### 20.2 strict 全家桶（最重要的部分）

```jsonc
{
  "compilerOptions": {
    "strict": true
    // 一键开启下面全部严格检查（现代项目标配）
  }
}
```

**strict 包含的两个明星选项**：

```ts
// ============ noImplicitAny：隐式 any 直接报错 ============
function fn(a) { return a }
//           ~ Error: 隐式 any
// 开启前：a 默认 any（等于没检查）
// 开启后：必须显式标注 -> a: string
// 价值：堵住「忘了写类型」这个最大的漏洞

// ============ strictNullChecks：null 不能乱赋 ============
let name: string = getUserInput()
//             ~ Error: getUserInput 返回 string | null
// 开启前：null 可以赋给任何类型 -> 运行时 null.length 炸
// 开启后：必须处理 null -> ?. / ?? / 显式判断
// 价值：消灭 JS 时代一大半的 "Cannot read property of undefined"
```

### 20.3 其他高频配置逐个讲

```jsonc
{
  "compilerOptions": {
    // ===== 编译目标与模块 =====
    "target": "ES2020",            // 编译成 ES2020 语法的 JS
    "module": "ESNext",            // 用 ES Module 组织代码
    "moduleResolution": "bundler", // 按 Vite/Webpack 的规则解析模块

    // ===== 路径别名 =====
    "baseUrl": ".",
    "paths": { "@/*": ["src/*"] }  // import x from '@/utils' 的来源
    // 注意：Vite 项目还要在 vite.config 里配同样的 alias（两边同步）

    // ===== 效率与产出 =====
    "skipLibCheck": true,          // 跳过三方库内部检查
    // 价值：node_modules 里老库的类型问题不再阻塞自己项目，编译大幅提速

    "noEmit": true                 // 只类型检查、不产出 JS
    // Vite 项目标准配置：esbuild 负责转译，tsc 只做检查

    // ===== 其他有用的 =====
    "noUnusedLocals": true,        // 没用的变量报错（清理死代码）
    "forceConsistentCasingInFileNames": true // 文件名大小写敏感
  }
}
```

### 20.4 面试回答示范（总-分结构）

> **总起**：tsconfig 是编译规则书，其中 strict 一键开启全家桶严格检查，是现代项目的标配——它直接决定项目的类型安全水位。
>
> **重点讲 strict 里的两个**：
>
> **第一，noImplicitAny。** 没标注类型的参数不再默认 any，堵住「忘了写类型等于没检查」的最大漏洞。
>
> **第二，strictNullChecks。** null 和 undefined 不能随便赋给其他类型，配合 `?.`、`??` 处理，直接消灭 JS 时代大半的「Cannot read property of undefined」。
>
> **再补两个工程实践**：Vite 项目里 tsc 只负责检查（noEmit: true），转译交给 esbuild；skipLibCheck 跳过三方库内部检查，解决老库类型问题阻塞编译的痛点。路径别名要 tsconfig 和 vite.config 两边同步配。

## 本篇速答

| 问题 | 一句话答案 |
| --- | --- |
| 泛型解决什么两难？ | 写死类型要复制 N 份 vs any 丢类型——泛型两全 |
| T 能直接访问属性吗？ | 不能，要先 extends 约束保证有 |
| K extends keyof T 干嘛的？ | 把 key 约束为合法键，拼错编译报错 |
| Omit 最常用场景？ | User 去 id 生成创建参数 DTO |
| 手写四件套考什么？ | 映射 / 约束 / keyof any / 条件+infer |
| MyExclude 靠什么删类型？ | 联合分发 + never 在联合中自动消失 |
| 三方库类型三个来源？ | 自带 types 字段 / @types 社区包 / 自己 declare |
| strict 两个明星选项？ | noImplicitAny 堵隐式 any；strictNullChecks 管 null |
