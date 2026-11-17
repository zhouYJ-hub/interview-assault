# Vue3 核心篇（Q1 - Q15）

> 每题五层结构：**为什么 -> 是什么（深讲）-> 代码 -> 坑 -> 面试回答（总-分）**

## Q1：Vue3 和 Vue2 的核心区别？（<span class="hot">超高频</span>）

### 为什么要有 Vue3

Vue 2 的 Options API 在大型组件里暴露了结构性问题——**同一个功能的代码被拆散到 data、methods、computed、watch 四处**，维护一个功能要在文件里上下跳几百行；逻辑复用靠 mixin 有命名冲突、来源不清的硬伤；defineProperty 响应式有无法监听新增删除属性、数组索引等根本缺陷。Vue 3 是**底层重写**，不是简单版本迭代。

### 区别一：响应式原理（底层重写，最本质的区别）

这直接决定了性能和能力边界。

```text
Vue 2：Object.defineProperty
┌─────────────────────────────────────────────────────┐
│  初始化时递归遍历所有属性，逐个劫持 getter/setter        │
│                                                      │
│  四大缺陷：                                           │
│  ① 新增/删除属性不响应 -> 必须 this.$set / $delete     │
│  ② 数组索引赋值不响应 -> 重写 push 等 7 个方法          │
│  ③ 初始化递归全量劫持 -> 大对象首次渲染慢               │
│  ④ 不支持 Map/Set                                    │
└─────────────────────────────────────────────────────┘

Vue 3：Proxy 代理整个对象
┌─────────────────────────────────────────────────────┐
│  Proxy 拦截任意操作（get/set/deleteProperty...）        │
│                                                      │
│  四大缺陷全解决：                                      │
│  ① 新增/删除属性 -> set/deleteProperty 天然拦截        │
│  ② 数组索引 -> set 拦截器直接生效                      │
│  ③ 惰性代理 -> get 访问到嵌套对象才递归包装              │
│  ④ 原生支持 Map/Set                                   │
│                                                      │
│  不再需要 $set / $delete API                          │
└─────────────────────────────────────────────────────┘
```

**为什么 Vue2 数组要重写 7 个方法**：`arr.push(1)` 是方法调用不是属性赋值——defineProperty 的 setter 拦不住方法调用，只能在原型链上覆盖 push/pop/shift/unshift/splice/sort/reverse 手动派发更新。Proxy 的 set 拦截器对一切赋值都生效，天然不需要。

### 区别二：代码组织方式（API 设计）

```js
// ========== Vue 2 Options API：逻辑分散 ==========
export default {
  data() {
    return { count: 0, user: { name: '' } }  // 「计数」的状态在这
  },
  computed: {
    double() { return this.count * 2 }        // 「计数」的计算在这
  },
  methods: {
    increment() { this.count++ },              // 「计数」的方法在这
    saveUser() { /* ... */ }                  // 「用户」的方法也在这
  },
  watch: {
    count(val) { /* 「计数」的监听也在这 */ }    // 又跳回「计数」
  }
}
// 维护「计数」功能要在 data -> computed -> methods -> watch 之间跳来跳去

// ========== Vue 3 Composition API：按功能聚拢 ==========
import { ref, computed, watch } from 'vue'

export function useCounter() {          // 整个功能提取成函数复用
  const count = ref(0)
  const double = computed(() => count.value * 2)
  const increment = () => count.value++
  watch(count, (val) => { console.log(val) })
  return { count, double, increment }
}

export function useUser() {
  const user = ref({ name: '' })
  const saveUser = () => { /* ... */ }
  return { user, saveUser }
}

// 组件里按功能组合
const { count, double, increment } = useCounter()
const { user, saveUser } = useUser()
```

**Composition API 解决的三个问题**：

| 问题 | Options API | Composition API |
| --- | --- | --- |
| 逻辑分散 | 同一功能拆到 4 处，来回跳 | 按功能聚拢，一目了然 |
| 逻辑复用 | mixin（命名冲突、来源不清） | 纯函数 composable（来源明确、TS 友好） |
| TS 支持 | this 类型推断困难 | 天然函数式，类型推断一流 |

**注意**：Vue 3 依然支持 Options API，并非强制替换——两种可以混用，但新项目推荐 Composition API。

### 区别三：性能与体积优化

**打包体积更小——Tree-shaking**：

```text
Vue 2：全局 API 挂在 Vue 对象上
  import Vue from 'vue'
  Vue.nextTick / Vue.set / Vue.directive ...
  -> 所有 API 都在包里，无法按需剔除

Vue 3：具名导出
  import { nextTick, ref, watch } from 'vue'
  -> 没用到的 API 不会打进包（Tree-shaking 生效）
  -> 只用 ref 不用 watch -> watch 相关代码不进产物
```

**渲染更快——编译优化**：

```text
Vue 2 Diff：全量比对
  新旧 VNode 树逐节点比对，不管节点是不是动态的

Vue 3 Diff：靶向更新
  ┌─────────────────────────────────────────────┐
  │ 优化一：静态提升（hoistStatic）                │
  │   纯静态节点提到 render 外只创建一次            │
  │   <div><span>静态</span>{{ name }}</div>     │
  │   -> span 只创建一次，diff 时直接跳过           │
  │                                             │
  │ 优化二：Patch Flag（补丁标记）                  │
  │   编译时标记节点的动态部分                       │
  │   <div :class="cls">{{ text }}</div>        │
  │   -> 标记 CLASS | TEXT                      │
  │   -> diff 时只比对 class 和 text             │
  │   -> 其他属性完全跳过                          │
  │                                             │
  │ 优化三：最长递增子序列                          │
  │   列表 diff 找出不需要移动的最长序列             │
  │   其他节点围绕它做最小化移动                     │
  └─────────────────────────────────────────────┘
```

### 
**Diff 算法的三层优化总结（面试重点）**：

| 优化 | Vue2 | Vue3 | 效果 |
| --- | --- | --- | --- |
| 静态提升 | 无，静态节点每次 render 重新创建 | 纯静态节点提到 render 外只创建一次 | diff 时直接跳过，零开销 |
| Patch Flag | 无标记，新旧 VNode 全量比对 | 编译时标记动态部分（CLASS/TEXT/PROPS） | diff 只比对标记处，跳过静态属性 |
| 最长递增子序列 | 简单头尾双向比对 | 找出不需要移动的最长序列 | 列表更新做最少量的 DOM 移动 |

> 三层叠加：静态的不碰、动态的只看标记的、列表移动走最优路径——更新性能大幅领先 Vue2。

区别四：关键新特性与破坏性变更

| 特性 | 说明 | Vue2 的情况 |
| --- | --- | --- |
| **Fragment** | 组件支持**多个根节点**，不再强制包 `<div>` | 必须单根节点 |
| **Teleport** | 弹窗渲染到 body 等指定位置，解决 overflow/z-index 层级问题 | 需手动操作 DOM |
| **Suspense** | 异步组件加载状态展示（配合 async setup） | 无 |
| **多个 v-model** | `v-model:title` + `v-model:page` 同时绑定 | 只支持一个 v-model |
| **生命周期改名** | beforeDestroy → beforeUnmount / destroyed → unmounted | - |
| **v-model prop 改名** | `value` → `modelValue`，事件 `input` → `update:modelValue` | value/input |
| **$listeners 移除** | 合并到 $attrs 中 | 独立存在 |
| **filter 移除** | 用 computed 或 methods 替代 | 支持 |

### 面试回答（总-分结构）

> **总起**：Vue3 不是简单的版本迭代，而是从响应式内核到 API 设计到编译优化的底层重写。我从四个层面讲。
>
> **第一，响应式重写——最本质的区别。** Vue2 用 defineProperty 逐属性劫持，有新增删除属性不响应、数组索引不监听、初始化递归全量劫持三大缺陷，必须靠 $set 和重写数组方法来补救；Vue3 换成 Proxy 代理整个对象，set/deleteProperty 拦截器天然覆盖一切操作，而且是惰性代理——访问到嵌套对象才递归包装，初始化只处理第一层。
>
> **第二，Composition API 解决逻辑组织问题。** Options 把一个功能拆散到 data/methods/computed/watch 四处，大组件维护困难；Composition 按功能聚拢，还能提取成 composable 函数复用，解决了 mixin 命名冲突和来源不清的问题。注意 Vue3 依然兼容 Options API。
>
> **第三，性能优化。** 体积上 Vue3 支持Tree-shaking，具名导出让没用到的 API 不进包；渲染上引入静态提升和 Patch Flag——静态节点只创建一次、动态节点标记了会变的部分、diff 只比对标记处，更新性能大幅提升。
>
> **第四，新特性。** Fragment 多根节点、Teleport 弹窗挂载、Suspense 异步组件、多个 v-model；生命周期改名 destroy 系列为 unmount 系列；v-model 的 prop 从 value 改为 modelValue。
>
## Q2：响应式原理：Proxy vs defineProperty？（<span class="hot">超高频</span>）

### Vue2 的 defineProperty 为什么不行

**实现方式**：递归遍历 data 的每个属性，逐个用 getter/setter 劫持：

```js
// Vue2 简化原理
function observe(obj) {
  Object.keys(obj).forEach((key) => {       // 只能遍历「已有」的属性
    Object.defineProperty(obj, key, {
      get() { /* 依赖收集 */ return val },
      set(newVal) { val = newVal; /* 派发更新 */ }
    })
  })
}
```

**四大缺陷（每个都能引出高频追问）**：

| 缺陷 | 原因 | Vue2 的临时方案 |
| --- | --- | --- |
| 新增/删除属性不响应 | 劫持只发生在初始化时，后来的属性没被劫持 | `this.$set / $delete` |
| 数组索引赋值不响应 | 同上，索引也是「后来的属性」 | 重写 push 等 7 个方法 |
| 初始化递归全量劫持 | 必须一开始就遍历所有层级 | 无（大对象首次渲染慢） |
| 不支持 Map/Set | defineProperty 只针对普通属性 | 无 |

**为什么数组要重写 7 个方法**——高频追问：`arr.push(1)` 是调用方法，不是属性赋值，defineProperty 的 setter 拦不住方法调用——只能在原型链上覆盖 push/pop/shift/unshift/splice/sort/reverse，在覆盖版里手动派发更新。

### Vue3 的 Proxy 怎么解决的

```js
// Proxy 代理「整个对象」而不是逐个属性
const proxy = new Proxy(target, {
  get(target, key, receiver) {
    track(target, key)                        // 依赖收集
    const result = Reflect.get(target, key, receiver)
    // 关键：嵌套对象在这里「惰性」递归——访问到才包装
    if (typeof result === 'object' && result !== null) {
      return reactive(result)
    }
    return result
  },
  set(target, key, value, receiver) {
    const result = Reflect.set(target, key, value, receiver)
    trigger(target, key)                      // 派发更新
    return result                             // 新增属性也走这里！
  },
  deleteProperty(target, key) {
    const result = Reflect.deleteProperty(target, key)
    trigger(target, key)                      // 删除也拦截！
    return result
  }
})
```

| Proxy 怎么解决 | 原理 |
| --- | --- |
| 新增/删除属性 | set / deleteProperty 拦截器天然覆盖 |
| 数组索引 | set 拦截器对 `arr[0] = x` 同样生效 |
| 惰性代理 | get 时才递归嵌套对象——初始化只代理第一层 |
| Map/Set | Proxy 能拦截任何操作 |

### 面试回答（总-分）

> **总起**：Vue2 用 defineProperty 逐属性劫持，Vue3 换成 Proxy 代理整个对象——解决了 Vue2 的四大缺陷。
>
> **第一，新增删除属性。** defineProperty 只能劫持初始化时已有的属性，所以 Vue2 要 $set/$delete；Proxy 的 set 和 deleteProperty 拦截器天然覆盖任何属性操作。
>
> **第二，数组。** defineProperty 拦不住 push 这类方法调用，Vue2 只能重写七个数组方法；Proxy 的 set 拦截器对索引赋值直接生效。
>
> **第三，性能。** Vue2 初始化要递归整棵数据树全量劫持，大对象首次渲染慢；Vue3 是惰性代理——get 访问到嵌套对象时才递归包装，初始化只处理第一层。
>
> **收尾**：所以 Vue3 响应式更快、能力更全，这也是 Vue3 能支持 Map/Set 的原因。

## Q3：ref 和 reactive 的区别？（<span class="hot">超高频</span>）

### 为什么有两个

Proxy 只能代理**对象**——基本类型（number/string）没有属性可以被 get/set 拦截，无法直接用 Proxy。所以 Vue3 用 ref **把基本类型包进一个对象**（`.value` 就是为了让 Proxy 能拦截到访问）。

### 本质区别

```js
// ref：把值包进 { value: x } 的壳——访问壳的 value 属性实现响应
const count = ref(0)
// 内部等价于 reactive({ value: 0 })
count.value++        // 触发 value 属性的 set -> 更新

// reactive：直接用 Proxy 代理对象
const state = reactive({ list: [], user: { name: 'x' } })
state.list.push(1)   // 直接操作，不用 .value
```

### 两个必须会的坑

```js
// 坑一：reactive 整体替换丢响应
const state = reactive({ list: [] })
state = reactive({ list: [1] })  // ❌ 替换变量，Proxy 断开
state.list = [1]                 // ✅ 改属性，Proxy 还在

// 坑二：reactive 解构丢响应
const { name } = state           // ❌ name 是拷贝出的普通字符串
const { name } = toRefs(state)   // ✅ toRefs 把每个属性变成保持引用的 ref
```

### 面试回答（总-分）

> **总起**：ref 和 reactive 的分工源于 Proxy 只能代理对象——基本类型没有属性可拦截，ref 的 .value 就是把它包成对象让 Proxy 能拦到。
>
> **第一，ref 包一切。** 基本类型、对象都行，JS 里访问要 .value，模板里自动解包；传参、解构、整体替换都不丢响应。
>
> **第二，reactive 只包对象。** 直接点访问不用 .value，写起来舒服；但有两个坑——整体替换丢响应、解构丢响应，后者用 toRefs 解决。
>
> **收尾**：我的习惯是全用 ref 最省心；表单这种聚合对象用 reactive 配 toRefs。

## Q4：toRef / toRefs 是干嘛的？

### 解决什么问题

reactive 解构（或把属性单独传给子组件）时，值被**拷贝**出去——脱离了 Proxy 代理，变成死数据。

### 怎么解决

```js
const state = reactive({ name: '小明', age: 18 })

// ❌ 解构 = 拷贝 = 丢响应
let { name } = state           // '小明' 字符串，改了视图不动

// ✅ toRefs：把每个属性变成「指向原属性的 ref」
const { name: nameRef, age } = toRefs(state)
nameRef.value = '小红'          // 视图更新 ✅
// 原理：nameRef 是 ref，但它内部引用的是 state.name —— 改它等于改原属性

// ✅ toRef：只转一个属性
const name2 = toRef(state, 'name')
```

### 面试回答（总-分）

> **总起**：toRefs 解决 reactive 解构丢响应的问题——解构是拷贝值，toRefs 把每个属性转成「指向原属性的 ref」，保持响应式关联。
>
> **关键认知**：toRefs 不创建新的响应式数据，只是建立到原属性的 ref 引用——改 toRefs 出来的值等于改原属性。最常见的用法是 setup 返回时展开 `...toRefs(state)`，让模板直接用属性名。

## Q5：computed 和 watch 的区别？（<span class="hot">超高频</span>）

### 本质定位不同

```js
// computed：从已有响应式数据「派生」新值 —— 是「值」
const double = computed(() => count.value * 2)
// 有缓存：count 不变，访问一百次只计算一次
// 依赖自动收集：回调里用了谁就依赖谁

// watch：数据变化时执行「副作用」—— 是「动作」
watch(count, (newVal, oldVal) => {
  saveToServer(newVal)          // 请求、操作 DOM、写 storage
})
```

### 深入：watch 的进阶用法

```js
// 监听对象某个属性：用 getter 函数
watch(() => state.user.name, (name) => {})

// 深度监听整个 reactive
watch(state, () => {}, { deep: true })

// 立即执行（进入页面先跑一次）
watch(query, fetchData, { immediate: true })

// 多源监听
watch([firstName, lastName], ([n1, n2]) => {})
```

### 面试回答（总-分）

> **总起**：computed 派生值，watch 执行副作用——定位完全不同。
>
> **第一，computed 有缓存。** 依赖不变多次访问只算一次，这是它和方法的本质区别；且必须同步返回，不能写异步。
>
> **第二，watch 是监听变化做副作用。** 能拿新旧值、能异步（防抖请求）、默认不立即执行、默认浅监听——对象要 deep 或用 getter 指定到属性。
>
> **第三，选型口诀。** 模板里要显示的加工数据用 computed；数据变了要发请求、存 storage、操作 DOM 用 watch。

## Q6：watchEffect 和 watch 的区别？

```js
// watchEffect：立即执行 + 自动收集依赖
watchEffect(() => {
  console.log(name.value)  // 回调里用了 name -> 自动监听 name
  // age 没用到 -> 不监听 age
})

// watch：显式指定，默认不立即执行
watch(name, (val) => {})
```

### 面试回答（总-分）

> **总起**：两者都能监听响应式数据执行逻辑，核心差异在「声明依赖的方式」和「执行时机」。
>
> **第一，依赖收集方式。** watch 显式指定监听谁，精确可控；watchEffect 自动收集——回调里用到谁就监听谁，不用列举。
>
> **第二，执行时机。** watch 默认变化才执行（immediate 可改）；watchEffect 立即执行一次再监听——适合「先跑一遍再说」的初始化场景。
>
> **第三，watchEffect 有 onCleanup。** 重新执行前自动清理上一次的副作用——搜索防抖的经典写法就靠它。

## Q7：Vue3 生命周期（对比 Vue2）（<span class="hot">超高频</span>）

### 映射表

| Vue2 | Vue3 | 时机与用途 |
| --- | --- | --- |
| beforeCreate / created | **setup 本身** | 初始化数据、注入 |
| beforeMount | onBeforeMount | 挂载前 |
| mounted | **onMounted** | DOM 就绪：请求、图表、绑事件 |
| beforeUpdate | onBeforeUpdate | 更新前 |
| updated | onUpdated | 更新完成 |
| beforeDestroy | onBeforeUnmount | 卸载前（改名） |
| destroyed | **onUnmounted** | 卸载完成：清定时器、解绑 |

**名字变化的原因**：destroy 改成 unmount 是为了统一「组件是挂载/卸载」的语义，且 Fragment 多根节点下 destroy 含义不准确。

### 请求数据放哪（高频追问）

```js
// 不依赖 DOM 的请求：放 setup 里——更早发出，更快渲染
setup() {
  fetchUser()              // 同步代码直接调用
}

// 需要 DOM 的操作：放 onMounted
onMounted(() => {
  initChart(el)            // 图表库需要拿到容器
})
```

### 面试回答（总-分）

> **总起**：Vue3 生命周期和 Vue2 一一对应，主要变化是 setup 替代了 beforeCreate 和 created，以及 destroy 系列改名 unmount。
>
> **三个关键认知**：第一，setup 在 beforeCreate 之前执行，此时拿不到 this；第二，请求数据不依赖 DOM 的放 setup 更早发出，需要 DOM 的放 onMounted；第三，onUnmounted 是清理定时器和事件解绑的标准位置——不清理就是内存泄漏。

## Q8：setup 的执行时机和特性

```js
export default {
  beforeCreate() { console.log('beforeCreate') },
  setup() {
    // 执行时机：在 beforeCreate 之前，this 为 undefined
    // 此时 props 已可用，data/methods 还没初始化
    // 所以 setup 里不能用 this 访问其他选项 —— 这也是 Composition API
    // 不依赖 this 的设计原因（TS 友好）
  }
}
```

**`<script setup>` 编译糖**：顶层变量自动暴露给模板、import 的组件自动注册、defineProps/defineEmits 是编译器宏（不用 import）。

### 面试回答（总-分）

> **总起**：setup 在 beforeCreate 之前执行一次，是 Composition API 的入口。
>
> **三个特性**：第一，执行时组件实例还没创建，this 是 undefined——这反而让 TS 推断更好；第二，`<script setup>` 是编译期语法糖，顶层变量自动暴露、组件自动注册；第三，defineProps 和 defineEmits 是编译器宏，不需要 import，编译时直接处理。

## Q9：组件通信有哪些方式？（<span class="hot">超高频</span>）

### 全景图（按关系分类）

```text
父 -> 子:  props / ref 模板引用 / attrs 透传 / slot
子 -> 父:  emit / v-model
跨多层:    provide / inject
任意组件:  Pinia（状态管理）/ mitt（事件总线）
```

### 逐个详解

**v-model 的本质（高频）**：

```html
<!-- 父组件 -->
<Child v-model="msg" />
<!-- 等价于： -->
<Child :modelValue="msg" @update:modelValue="msg = $event" />

<!-- 子组件里定义 modelValue prop + emit update:modelValue -->
<!-- Vue3 支持多个 v-model：v-model:title + v-model:page -->
```

**ref 模板引用**：

```vue
<script setup>
import { ref } from 'vue'
const childRef = ref(null)    // 变量名和模板 ref 同名
// onMounted 后才能访问
onMounted(() => childRef.value.reload())  // 直接调子组件方法
</script>
<template>
  <Child ref="childRef" />
</template>
```

### 面试回答（总-分）

> **总起**：我按「组件关系」分四类说通信选型。
>
> **第一，父子。** 父传子用 props，子传父用 emit；双向绑定 v-model 是 props 加 emit 的语法糖，Vue3 还支持多个 v-model；父要直接调子的方法用模板 ref。
>
> **第二，跨多层。** provide/inject——祖先后代直接传，避免逐级 props 透传；配合 readonly 防止后代篡改。
>
> **第三，无关系组件。** 全局状态用 Pinia，轻量事件通知用 mitt（Vue3 移除了 $on，事件总线要用第三方库）。
>
> **收尾**：核心原则是数据流单向——父子靠 props/emit，不要子组件直接改父传的数据。

## Q10：props / emit 怎么用（含类型）？

```vue
<!-- 子组件 -->
<script setup lang="ts">
// 运行时声明
const props = defineProps({
  title: String,
  count: { type: Number, default: 0, required: false }
})

// TS 泛型声明（更推荐）
// defineProps<{ title: string; count?: number }>()

const emit = defineEmits<{
  (e: 'change', value: number): void    // 带类型的事件声明
}>()

emit('change', 42)
</script>
```

**单向数据流**：props 是只读的——子组件不能直接改，要改就 emit 让父改，或者用计算属性转成本地副本。

## Q11：provide / inject 原理与场景？

**为什么存在**：层级太深时，中间组件被迫「接力」传 props 自己根本不用的数据（逐级透传问题）——provide/inject 让祖先和后代直接建立通道。

```vue
<!-- 祖先 -->
<script setup>
import { provide, ref, readonly } from 'vue'
const theme = ref('dark')
// readonly 包装：后代只能读不能改（防止数据流混乱）
provide('theme', readonly(theme))
</script>

<!-- 任意深度的后代 -->
<script setup>
import { inject } from 'vue'
const theme = inject<'dark' | 'light'>('theme', 'light')  // 第二参是默认值
</script>
```

**实战场景**：Element Plus 的 Form 给所有 FormItem 注入校验上下文——FormItem 不需要知道 Form 在哪一层。

## Q12：v-if 和 v-show 的区别？

| | v-if | v-show |
| --- | --- | --- |
| 本质 | 真条件渲染（不满足时 DOM 不存在） | display: none 切换（DOM 总在） |
| 切换开销 | 高（销毁/重建组件、事件监听器） | 低 |
| 初始开销 | false 时为零 | 总要渲染一次 |
| 状态 | 切回时重走生命周期（状态重置） | 状态保留 |

**深层认知**：v-if 切换会**销毁组件**——定时器、事件监听全部重建；v-show 只是视觉隐藏——组件实例还在跑。频繁切换 tab 用 v-show 保性能，条件渲染大块内容用 v-if 省内存。

## Q13：v-for 为什么要加 key？diff 原理？（<span class="hot">超高频</span>）

### key 的本质

key 是 Virtual DOM 节点的**身份证**——diff 算法靠 key 判断「新旧节点是不是同一个」：key 相同复用 DOM 只更新内容，key 不同销毁重建。

### index 当 key 的事故推演（必会）

```text
列表 [A, B, C]，key 用 index（0,1,2）
头部插入 X -> [X, A, B, C]，key 变成 0,1,2,3

diff 按 key 匹配新旧节点：
  key=0：旧 A vs 新 X -> 「同一个节点」-> 复用 A 的 DOM，改内容为 X
  key=1：旧 B vs 新 A -> 复用 B 的 DOM，改内容为 A
  ...

结果：明明只插入了一个节点，却触发全部节点更新——
更严重：每个 item 里有输入框（非受控），用户在 B 位置输入的内容
错位显示到 A 位置 —— 状态错乱
```

### Vue3 diff 的三个编译优化

```text
1. 静态提升：纯静态节点提到 render 外只创建一次
   <div><span>静态</span>{{ name }}</div>
   span 部分只创建一次，更新时直接复用引用

2. patchFlag：编译时给动态节点打标记
   <div :class="cls">{{ name }}</div>
   编译产物标记「class 和 text 会变」
   -> diff 时只比对这两处，跳过其他所有属性

3. 最长递增子序列：新旧 children diff 时
   找出「不需要移动的最长序列」，其他节点围绕它做最小移动
```

### 面试回答（总-分）

> **总起**：key 是 VDOM 节点的身份证，diff 靠它判断复用还是重建——key 用错会导致性能劣化和状态错乱。
>
> **第一，为什么不能用 index。** 头部插入时所有 index 都变了——diff 认为「每个位置的数据都换了」，全部复用改内容；更严重的是非受控输入框的内容会错位。所以 key 必须是稳定的业务 id。
>
> **第二，Vue3 的 diff 三个优化。** 静态提升——静态节点只创建一次；patchFlag——编译时标记动态部分，diff 只比对会变的地方；最长递增子序列——找出不用动的最长序列，其他节点围绕它最小化移动。
>
> **收尾**：一句话——diff 的目标是用 key 识别节点身份，做到「能复用就不重建、能不动就不移动」。

## Q14：nextTick 的原理和使用场景？

### 为什么需要

Vue 的 DOM 更新是**异步**的：改数据后，Vue 把更新任务放进微任务队列批量执行——所以「改完立刻读 DOM」读到的是旧值。

```js
const addItem = async () => {
  list.value.push('新项')
  console.log(liCount)   // 旧值——更新任务还在微任务队列里

  await nextTick()        // nextTick 也在微任务队列，但排在更新任务后面
  console.log(liCount)   // 新值 ✅
}
```

### 原理

```text
时间线：
  1. list.value.push() -> 触发响应式 set -> 更新任务入微任务队列
  2. await nextTick()   -> nextTick 的 Promise 入微任务队列（排在后面）
  3. 同步代码跑完 -> 清空微任务队列
  4. 先执行更新任务（DOM 更新了）
  5. 再执行 nextTick 的回调 -> 此时 DOM 一定是新的
```

**本质**：nextTick 没有魔法，只是把回调排在 DOM 更新任务**之后**的微任务里。

## Q15：自定义指令怎么写？

```js
// v-focus 自动聚焦（全局注册）
app.directive('focus', {
  mounted(el) { el.focus() }   // 指令钩子和组件生命周期同步
})

// v-loading 完整示例
app.directive('loading', {
  mounted(el, binding) {
    if (binding.value) appendMask(el)   // binding.value = 表达式的值
  },
  updated(el, binding) {
    binding.value ? appendMask(el) : removeMask(el)
  }
})
```

**钩子时机**：created（元素创建）-> beforeMount -> **mounted**（最常用）-> beforeUpdate -> updated -> beforeUnmount -> unmounted。

