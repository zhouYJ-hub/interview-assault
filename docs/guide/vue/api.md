# Vue3 API 详解：用法与场景

> 面试频率：⭐⭐⭐⭐⭐ | 按分类整理 Vue3 常用 API 和高频面试 API，每个都讲「是什么 + 怎么用 + 什么场景用」

## 面试回答示范（总-分结构）

> **总起**：Vue3 的 API 我按「响应式、副作用、编译器宏、依赖注入、高级」五类讲常用场景。
>
> **第一，响应式类。** ref 包一切（基本类型要 .value），reactive 包对象（不能解构），shallowRef/shallowReactive 大数据性能优化，readonly 防篡改，toRefs 解决 reactive 解构丢响应。
>
> **第二，副作用类。** computed 派生值有缓存，watch 监听变化执行副作用（能拿新旧值），watchEffect 立即执行自动收集依赖（配 onCleanup 做防抖）。
>
> **第三，编译器宏。** defineProps/defineEmits 声明组件接口，defineExpose 暴露子组件方法（配合父组件 ref 调用），withDefaults 给 props 设默认值。
>
> **第四，高级类。** customRef 自定义依赖控制（防抖 ref），markRaw 标记对象永不代理（三方实例/地图对象），shallowRef 大列表优化首选。

---

## 一、响应式 API

### ref —— 万能响应式包装

**是什么**：把任意值包成响应式对象，通过 `.value` 读写。

```js
import { ref } from 'vue'

const count = ref(0)           // 基本类型
count.value++                   // JS 里必须 .value
// 模板里自动解包：{{ count }}

const user = ref({ name: '小明' })  // 对象也行（内部自动调 reactive）
user.value.name = '小红'

const list = ref([])            // 数组
list.value.push(1)
```

**使用场景**：任何需要响应式的数据——计数器、表单值、列表、接口返回值。**新手建议全用 ref，省心**。

#### ref 的源码核心逻辑

```js
// ====== 简化版 ref 源码（packages/reactivity/src/ref.ts）======

// 判断是否对象（内部转 reactive 用）
function isObject(val) {
  return val !== null && typeof val === 'object'
}

// --------------------------------------------------
// 核心：RefImpl 类
// ref 的响应式能力全部来自这个类的 get/set 拦截
// --------------------------------------------------
class RefImpl {
  constructor(value) {
    // 存一份原始值：用于新旧比较（防止相同赋值触发无意义的更新）
    this._rawValue = value

    // ⚠️ 关键设计：如果传入的是对象，内部自动调用 reactive 包装
    // 这就是为什么 ref({ name }) 的嵌套属性也有响应式
    this._value = isObject(value) ? reactive(value) : value

    // 依赖集合：记录「谁在用我这个 ref」
    // 和 targetMap 里的 dep 是同一个东西（Set<effect>）
    this.dep = new Set()

    // 标记：让 isRef() 能识别这是个 ref
    this.__v_isRef = true
  }

  // ---------- get value：读取时收集依赖 ----------
  get value() {
    // 只有 effect 正在执行时才收集（render 执行到这里时 activeEffect 有值）
    if (activeEffect) {
      // 把当前 effect 加入这个 ref 的依赖集合
      this.dep.add(activeEffect)
      // 双向关联：effect 也记住这个 dep（组件卸载时清理用）
      activeEffect.deps.push(this.dep)
    }
    return this._value
  }

  // ---------- set value：赋值时派发更新 ----------
  set value(newVal) {
    // 值没变就不触发更新（Object.is 处理 NaN === NaN）
    if (Object.is(newVal, this._rawValue)) return

    this._rawValue = newVal
    // 新值如果是对象，同样转 reactive
    this._value = isObject(newVal) ? reactive(newVal) : newVal

    // 通知所有依赖这个 ref 的 effect 重新执行
    this.dep.forEach((effect) => {
      if (effect.scheduler) {
        effect.scheduler()   // 组件的更新走调度器 -> 微任务批量执行
      } else {
        effect.run()         // 普通 effect 直接执行
      }
    })
  }
}

// --------------------------------------------------
// 工厂函数：对外暴露的 ref()
// --------------------------------------------------
function ref(value) {
  // 已经是 ref 就直接返回（防止重复包装）
  if (isRef(value)) return value
  return new RefImpl(value)
}

// --------------------------------------------------
// isRef 的实现：就是检查 __v_isRef 标记
// --------------------------------------------------
function isRef(r) {
  return !!(r && r.__v_isRef === true)
}

// --------------------------------------------------
// unref 的实现：ref 则取 .value，否则原样返回
// --------------------------------------------------
function unref(r) {
  return isRef(r) ? r.value : r
}
```

**源码关键设计（面试口述）**：

| 设计 | 目的 |
| --- | --- |
| `_rawValue` 存原始值 | 配合 `Object.is` 做新旧比较——相同赋值不触发更新 |
| `_value` 对象自动调 reactive | `ref({})` 的嵌套属性也有响应式——这就是 ref 能包一切的原因 |
| `dep` 用 Set | 和 targetMap 的 dep 一致——同一 effect 只存一次（去重） |
| `__v_isRef = true` 标记 | isRef() 靠它识别；unref() 靠它判断要不要取 .value |
| `Object.is` 比较 | 能正确处理 `NaN === NaN` 为 true（=== 做不到） |

**高频追问：为什么基本类型要 .value**？Proxy 只能代理对象的属性——`.value` 就是把基本类型包进对象，`get value()` 和 `set value()` 就是拦截器。**RefImpl 类本质上是手写版的 Proxy 拦截**，只不过它只拦截一个属性：`value`。

**ref 和 reactive 的依赖收集区别**：

```text
reactive 的依赖收集：
  Proxy get 拦截 -> track(target, key)
  -> targetMap: WeakMap<对象, Map<属性, Set<effect>>>
  -> 按对象 + 属性两级查找

ref 的依赖收集：
  get value() -> this.dep.add(activeEffect)
  -> ref 自带 dep: Set<effect>
  -> 只有一级（ref 本身就是一个属性）
  -> 所以 ref 的依赖收集比 reactive 更简单、更快
```

---

### reactive —— 对象响应式代理

**是什么**：用 Proxy 直接代理对象，属性访问不需要 `.value`。

```js
import { reactive } from 'vue'

const form = reactive({
  username: '',
  password: '',
  remember: false
})

form.username = 'admin'   // 直接访问，不用 .value
```

**使用场景**：表单这种聚合对象；多个相关状态打包管理。

**两个坑**：

```js
// 坑一：整体替换丢响应
const state = reactive({ list: [] })
state = reactive({ list: [1] })  // ❌ 替换变量，Proxy 断开
state.list = [1]                 // ✅ 改属性

// 坑二：解构丢响应
const { username } = form        // ❌ 拷贝出去变普通值
const { username } = toRefs(form) // ✅ 保持响应式
```

---

### shallowRef / shallowReactive —— 浅层响应式（性能优化）

**是什么**：只代理第一层，嵌套属性不递归——**访问快、修改嵌套不触发更新**。

```js
import { shallowRef, triggerRef } from 'vue'

// 场景一：大列表只关心整体替换，不关心内部属性变化
const bigList = shallowRef([])
bigList.value = fetchAllData()       // ✅ 整体替换触发更新
bigList.value[0].name = 'x'          // ❌ 嵌套修改不触发
triggerRef(bigList)                   // 手动触发更新

// 场景二：只关心对象第一层属性
const state = shallowReactive({
  count: 0,          // ✅ 响应式（第一层）
  nested: {          // ❌ 内部不是响应式
    deep: 'value'
  }
})
state.count++         // 触发更新
state.nested.deep = 'x' // 不触发
```

**使用场景**：性能优化——大数据列表（几万条）、不需要深层响应的场景。深层嵌套改用整体替换 + triggerRef。

---

### readonly / shallowReadonly —— 只读保护

**是什么**：创建只读代理——修改会警告（开发环境）。

```js
import { readonly, reactive } from 'vue'

const original = reactive({ count: 0 })
const readOnly = readonly(original)

readOnly.count          // 0 ✅ 可以读
readOnly.count = 10     // ⚠️ Set operation on key "count" failed: target is readonly

// 经典场景：provide 给子组件时防止子组件篡改
provide('config', readonly(config))  // 后代只能读不能改
```

**使用场景**：provide/inject 防篡改、props 的只读保护、配置对象冻结。

---

### toRef / toRefs —— 保持响应式的解构

```js
import { reactive, toRefs, toRef } from 'vue'

const state = reactive({ name: '小明', age: 18 })

// ❌ 直接解构丢响应
const { name } = state   // 普通字符串

// ✅ toRefs：每个属性变成指向原属性的 ref
const { name: nameRef, age } = toRefs(state)
nameRef.value = '小红'   // 视图更新 ✅

// ✅ toRef：转单个属性
const name2 = toRef(state, 'name')

// 最常见的用法：setup 返回时展开
return { ...toRefs(state) }  // 模板直接用 name / age
```

**使用场景**：reactive 解构时、函数参数要传单个响应式属性时。

---

### unref / isRef / isReactive —— 类型判断工具

```js
import { ref, unref, isRef, isReactive, isProxy } from 'vue'

const count = ref(0)

isRef(count)        // true —— 判断是否是 ref
isReactive(obj)     // true —— 判断是否是 reactive 代理
isProxy(obj)        // true —— 判断是否任何 Proxy 代理

unref(count)        // 0 —— 如果是 ref 返回 .value，不是则原样返回
// 等价于：isRef(val) ? val.value : val
// 场景：封装通用函数，参数可能是 ref 也可能是普通值
function useValue(maybeRef) {
  return unref(maybeRef)  // 统一拿到值
}
```

---

### toRaw / markRaw —— 脱离响应式

```js
import { reactive, toRaw, markRaw } from 'vue'

// toRaw：拿到 Proxy 背后的原始对象（修改不触发更新）
const state = reactive({ list: [] })
const raw = toRaw(state)
raw.list.push(x)     // 不触发视图更新（跳过 Proxy）

// 场景：高频操作不想触发更新（如地图实例的大量坐标更新）

// markRaw：标记对象「永远不被代理」
const map = markRaw(new BMap.Map('container'))
const state2 = reactive({ map })  // map 不会被代理
// 场景：三方库实例（地图/图表/编辑器）——代理它们没有意义还浪费性能
```

---

## 二、副作用 API

### computed —— 派生值（有缓存）

```js
import { ref, computed } from 'vue'

const count = ref(1)

// 只读 computed
const double = computed(() => count.value * 2)

// 可写 computed（ getter + setter）
const fullName = computed({
  get: () => firstName.value + ' ' + lastName.value,
  set: (val) => {
    [firstName.value, lastName.value] = val.split(' ')
  }
})

// 场景：
// - 派生显示值：总价 = 单价 × 数量
// - 过滤/排序列表
// - 格式化显示
// - 双向绑定中间层（v-model 到 computed）
```

---

### watch —— 监听变化执行副作用

```js
import { ref, reactive, watch } from 'vue'

const count = ref(0)

// 基础用法
watch(count, (newVal, oldVal) => {
  console.log(`${oldVal} -> ${newVal}`)
})

// 监听对象属性（getter 函数）
const state = reactive({ user: { name: '' } })
watch(() => state.user.name, (name) => {})

// 深度监听整个 reactive
watch(state, () => {}, { deep: true })

// 立即执行（进页面先跑一次）
watch(searchKey, fetchList, { immediate: true })

// 监听多个源
watch([firstName, lastName], ([n1, n2]) => {})

// 场景：
// - 搜索关键词变化 -> 防抖请求
// - 路由参数变化 -> 重新拉数据
// - 表单数据变化 -> 自动保存草稿
```

---

### watchEffect —— 立即执行 + 自动收集依赖

```js
import { ref, watchEffect } from 'vue'

const keyword = ref('')

// 立即执行一次 + 自动监听回调里用到的响应式数据
watchEffect(() => {
  console.log(keyword.value)  // 用了 keyword -> 自动监听
})

// 经典场景：搜索防抖（onCleanup 清理）
watchEffect((onCleanup) => {
  const timer = setTimeout(() => search(keyword.value), 300)
  // 重新执行前自动清掉上一次的定时器
  onCleanup(() => clearTimeout(timer))
})

// watch vs watchEffect 选型：
// 需要旧值、精确控制监听谁 -> watch
// 「依赖变了就重跑」的场景 -> watchEffect
```

---

### watchPostEffect —— DOM 更新后执行

```js
import { watchPostEffect } from 'vue'

// 普通 watchEffect 在 DOM 更新前执行
// watchPostEffect 在 DOM 更新后执行（flush: 'post'）
watchPostEffect(() => {
  // 这里能拿到更新后的 DOM
  console.log(el.value.offsetHeight)
})
```

---

## 三、编译器宏（`<script setup>` 专用）

### defineProps —— 声明组件入参

```vue
<script setup lang="ts">
// 运行时声明
const props = defineProps({
  title: String,
  count: { type: Number, default: 0 },
  items: { type: Array, required: true }
})

// TS 类型声明（推荐）
const props = defineProps<{
  title: string
  count?: number
  items: Item[]
}>()

// 配 withDefaults 设默认值（TS 声明时）
const props = withDefaults(defineProps<{
  title: string
  count?: number
}>(), {
  count: 10
})
</script>
```

**注意**：props 是只读的——不能直接改，要改就 emit 通知父组件。

---

### defineEmits —— 声明组件事件

```vue
<script setup lang="ts">
const emit = defineEmits(['change', 'delete'])

// TS 类型声明
const emit = defineEmits<{
  (e: 'change', value: number): void
  (e: 'delete', id: string): void
}>()

const handleClick = () => {
  emit('change', 42)     // 子组件触发，父组件用 @change 接
}
</script>
```

---

### defineExpose —— 暴露子组件内部

```vue
<!-- 子组件 Child.vue -->
<script setup>
import { ref } from 'vue'

// ⚠️ <script setup> 的组件默认是「封闭的」
// 父组件通过 ref 拿不到内部任何东西
// 必须 defineExpose 暴露

const count = ref(0)
const reset = () => { count.value = 0 }

defineExpose({ count, reset })
</script>
```

```vue
<!-- 父组件 -->
<script setup>
import { ref, onMounted } from 'vue'

const childRef = ref(null)

onMounted(() => {
  childRef.value.count   // 读子组件状态
  childRef.value.reset() // 调子组件方法
})
</script>
<template>
  <Child ref="childRef" />
</template>
```

**使用场景**：表单组件暴露 validate/resetFields、弹窗组件暴露 open/close、列表组件暴露 refresh。

---

### defineOptions —— 定义组件选项（Vue 3.3+）

```vue
<script setup>
// <script setup> 里没有 this，也写不了 name/inheritAttrs
// defineOptions 解决这个问题
defineOptions({
  name: 'UserList',      // 组件名（keep-alive 的 include 依赖它）
  inheritAttrs: false    // 禁止 attrs 自动挂到根元素
})
</script>
```

---

## 四、依赖注入

### provide / inject —— 跨层级传参

```vue
<!-- 祖先组件 -->
<script setup>
import { provide, ref, readonly } from 'vue'

const theme = ref('dark')
const config = { apiBase: '/api' }

provide('theme', theme)                    // 传响应式数据
provide('config', readonly(config))        // 只读，防后代篡改
</script>

<!-- 任意深度的后代 -->
<script setup>
import { inject, ref } from 'vue'

const theme = inject<Ref<string>>('theme', ref('light'))  // 第二参默认值
const config = inject('config')

theme.value  // 'dark'
</script>
```

**使用场景**：主题系统、国际化、Form 向所有 FormItem 注入校验上下文、深层组件要改祖先状态。

---

## 五、内置组件

### Teleport —— 传送到指定位置

```vue
<template>
  <div>
    <!-- 弹窗渲染到 body 下，而不是当前组件内部 -->
    <Teleport to="body">
      <div class="modal" v-if="show">弹窗内容</div>
    </Teleport>
    <!-- 解决：父组件有 overflow:hidden / z-index 层级问题 -->
  </div>
</template>
```

**使用场景**：弹窗/下拉菜单（避免被父组件 overflow 裁剪、z-index 层级限制）、通知条。

---

### Suspense —— 异步组件 loading

```vue
<template>
  <Suspense>
    <template #default>
      <AsyncComponent />       <!-- 内部有 await 的组件 -->
    </template>
    <template #fallback>
      <Loading />              <!-- 加载中显示 -->
    </template>
  </Suspense>
</template>
```

**使用场景**：异步组件的加载状态展示（配合 `async setup()` 使用）。

---

### KeepAlive —— 组件缓存

```vue
<template>
  <router-view v-slot="{ Component }">
    <KeepAlive :include="['UserList', 'OrderList']">
      <component :is="Component" />
    </KeepAlive>
  </router-view>
</template>
```

**使用场景**：列表页缓存——跳详情再返回，保留滚动位置和筛选条件。

---

## 六、其他常用 API

### defineAsyncComponent —— 异步组件

```js
import { defineAsyncComponent } from 'vue'

// 带加载状态的异步组件
const AsyncComp = defineAsyncComponent({
  loader: () => import('./Heavy.vue'),   // 懒加载
  loadingComponent: Loading,             // 加载中
  errorComponent: Error,                 // 加载失败
  delay: 200,                            // 延迟显示 loading
  timeout: 10000                         // 超时
})
```

### useSlots / useAttrs —— 访问插槽和属性

```vue
<script setup>
import { useSlots, useAttrs } from 'vue'

const slots = useSlots()   // 插槽信息（判断是否有某个插槽）
const attrs = useAttrs()   // 未声明为 props 的属性（透传用）

// 场景：二次封装组件时透传属性
// <MyInput placeholder="请输入" /> placeholder 不在 props 里
// 会自动落到 attrs 上
</script>
```

### customRef —— 自定义响应式（防抖 ref）

```js
import { customRef } from 'vue'

// 经典场景：防抖 ref
function useDebouncedRef(value, delay = 300) {
  let timer
  return customRef((track, trigger) => {
    return {
      get() {
        track()           // 依赖收集
        return value
      },
      set(newVal) {
        clearTimeout(timer)
        timer = setTimeout(() => {
          value = newVal
          trigger()       // 延迟触发更新
        }, delay)
      }
    }
  })
}

const searchKey = useDebouncedRef('')
// searchKey 变化后延迟 300ms 才触发视图更新
```

---

## 七、高频 API 速答

| API | 一句话 |
| --- | --- |
| ref | 万能包装，基本类型要 .value |
| reactive | 对象代理，不能解构/整体替换 |
| shallowRef | 只代理第一层，大数据优化 |
| readonly | 只读代理，provide 防篡改 |
| toRefs | 解构 reactive 保持响应 |
| markRaw | 标记永不代理（地图/图表实例） |
| toRaw | 拿到原始对象（跳过 Proxy） |
| unref | ref 则取 .value，否则原样返回 |
| computed | 派生值有缓存（dirty 标记） |
| watch | 监听变化，能拿新旧值 |
| watchEffect | 立即执行 + 自动收集依赖 |
| defineExpose | 暴露子组件内部给父 ref 调用 |
| withDefaults | TS 声明 props 时设默认值 |
| Teleport | 弹窗渲染到 body，解决层级问题 |
| customRef | 自定义 get/set（防抖 ref） |
| defineAsyncComponent | 异步组件 + loading/error 状态 |

## 八、API 选型速记

```text
基本类型/不确定 -> ref
聚合表单对象   -> reactive（配 toRefs）
大数据列表     -> shallowRef（整体替换 + triggerRef）
只读配置       -> readonly + provide
三方库实例     -> markRaw（地图/图表永远不代理）
派生显示值     -> computed
变化发请求     -> watch（能拿新旧值）
初始化+自动追踪 -> watchEffect
暴露子组件方法  -> defineExpose + 父组件 ref
弹窗不被裁剪   -> Teleport to="body"
```
