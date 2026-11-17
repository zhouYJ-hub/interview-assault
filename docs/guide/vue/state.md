# 状态管理篇（Q24 - Q30）：Pinia 与 Vuex

> 每题五层结构：**为什么 -> 是什么（深讲）-> 代码 -> 坑 -> 面试回答（总-分）**

## Q24：为什么需要状态管理？

### 没有状态管理的三大痛点

```text
1. 逐级透传：A -> B -> C -> D，B 和 C 只是"传递通道"
   自己根本不用这个 props，但必须声明和转发

2. 无关系组件通信：两个页面的兄弟组件要共享数据
   只能靠事件总线或 localStorage —— 不可追踪、难维护

3. 状态来源分散：数据在多个组件的 data 里各存一份
   谁改的、什么时候改的、为什么和另一份不一致 —— 无法回答
```

### Store 的解决方案

```text
把「需要共享的状态」集中到一个响应式仓库：

   组件 A ──┐
   组件 B ──┼──> Store（单一数据源） ──> DevTools 时间旅行调试
   组件 C ──┘

1. 单一数据源：状态只有一份，不存在不一致
2. 直接读写：任何组件 import store 就用，不用层层传递
3. 可追踪：谁改的、怎么改的，DevTools 全程记录
4. 生命周期独立：组件销毁状态不丢
```

### 面试回答（总-分）

> **总起**：状态管理解决的是「跨组件共享数据的组织和追踪问题」。
>
> **三个痛点对应三个收益**：第一，多层组件传递用 props 逐级透传，中间组件被迫接力——Store 让任何组件直接读写；第二，无关系组件靠事件总线通信难以维护——Store 提供单一数据源；第三，DevTools 能追踪每次修改做时间旅行调试——数据流可预测。

## Q25：Pinia 和 Vuex 的区别？（<span class="hot">超高频</span>）

### 为什么 Pinia 去掉了 mutation

**Vuex 的 mutation 存在的理由**：DevTools 需要同步的修改快照做时间旅行——mutation 强制同步，每个 commit 都是一个可快照的「事件」。但这带来了大量样板代码。

**Pinia 的突破**：换了追踪实现方式（Proxy 级追踪），不需要 mutation 这层中间人了——**改状态的代码量直接减半**。

```js
// Vuex：一个异步修改要写两层
mutations: {
  SET_USER(state, user) { state.user = user }   // 第一层：同步修改
},
actions: {
  async login({ commit }, data) {
    const user = await api.login(data)
    commit('SET_USER', user)                     // 第二层：触发
  }
}

// Pinia：同样的事，一步
actions: {
  async login(data) {
    this.user = await api.login(data)  // 直接改，内部自动追踪
  }
}
```

### 全面对比表

| 对比项 | Vuex | Pinia |
| --- | --- | --- |
| 核心概念 | state/getters/**mutations**/actions | state/getters/actions |
| 修改方式 | 必须 commit mutation | **直接改或 action** |
| 异步 | action 里（mutation 禁止） | action（无限制） |
| 模块化 | modules + namespace 嵌套 | **多个独立 store，扁平** |
| TS 支持 | 弱（命名空间类型复杂） | 天然友好 |
| 体积 | 较大 | ~1KB |
| 官方态度 | 维护模式 | **Vue3 官方推荐** |

### 面试回答（总-分）

> **总起**：Pinia 是 Vue3 官方推荐的下一代状态管理，核心改进是去掉 mutation 和扁平化 store 设计。
>
> **第一，去掉 mutation。** Vuex 的 mutation 是给 DevTools 做同步快照用的，代价是每个修改要写 mutation 加 action 两层；Pinia 换了追踪实现，直接改 state 就能被追踪——代码量减半。
>
> **第二，扁平化设计。** Vuex 的 modules 加 namespace 嵌套复杂；Pinia 的每个 store 天然独立，想拆就多定义几个，没有嵌套关系。
>
> **第三，TS 友好。** Pinia 源码 TS 重写，类型推断开箱即用；组合式写法甚至就是一个返回 ref/computed 的函数。

## Q26：Pinia 核心概念和用法（<span class="hot">超高频</span>）

```js
// stores/counter.js
import { defineStore } from 'pinia'

export const useCounterStore = defineStore('counter', {
  // 1. state：响应式数据（函数返回对象，保证每个实例独立）
  state: () => ({
    count: 0,
    list: []
  }),

  // 2. getters：计算属性（有缓存，等同 computed）
  getters: {
    double: (state) => state.count * 2,
    // 访问其他 getter 用 this
    doublePlusOne() { return this.double + 1 }
  },

  // 3. actions：同步异步都放这里（含修改 state）
  actions: {
    increment() { this.count++ },          // 直接改，不用 mutation
    async fetchList() {
      const res = await api.getList()
      this.list = res.data                  // 异步里直接改也行
    }
  }
})
```

```vue
<!-- 组件里使用 -->
<script setup>
import { useCounterStore } from '@/stores/counter'
import { storeToRefs } from 'pinia'

const store = useCounterStore()

// 读（直接解构 state 会丢响应，用 storeToRefs）
const { count } = storeToRefs(store)
// getters 和 actions 直接解构不丢响应（它们本身是 ref/函数）
const { double } = storeToRefs(store)
const { increment } = store

store.count++      // 直接改 state ✅（Pinia 允许）
store.increment()  // 调 action
</script>
```

**storeToRefs 是高频坑**：state 直接解构丢响应（和 reactive 同理），要用 `storeToRefs(store)`；actions 是函数不受影响。

### 面试回答（总-分）

> **总起**：Pinia 的三件套——state 存数据、getters 算派生值、actions 做同步异步逻辑。
>
> **三个实践要点**：第一，state 用函数返回对象，保证多实例数据独立；第二，直接改 state 完全合法（不需要 mutation）；第三，解构 state 要用 storeToRefs 保持响应式——这和 reactive 的 toRefs 是同一个原理。

## Q27：Pinia 在 setup 中怎么用？（组合式风格，推荐）

```js
// stores/user.js —— 像写组件的 setup 一样写 store
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useUserStore = defineStore('user', () => {
  // state = ref
  const token = ref('')
  const userInfo = ref(null)

  // getter = computed
  const isLogin = computed(() => !!token.value)

  // action = 普通函数
  async function login(data) {
    const res = await api.login(data)
    token.value = res.token
    userInfo.value = res.user
  }

  function logout() {
    token.value = ''
    userInfo.value = null
  }

  // 跨 store 调用：直接使用另一个 store
  // const cartStore = useCartStore()
  // cartStore.clearCart()

  return { token, userInfo, isLogin, login, logout }
})
```

**组合式的优势**：完全复用 Composition API 的知识——ref、computed、watch 想用就用；store 之间互相调用直接 useXxxStore()，没有模块边界问题。

## Q28：Pinia 持久化怎么做？

### 方案一：插件（工程化）

```js
// main.js
import { createPinia } from 'pinia'
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate'

const pinia = createPinia()
pinia.use(piniaPluginPersistedstate)

// stores/user.js —— 第三个参数开启
export const useUserStore = defineStore('user', {
  state: () => ({ token: '', userInfo: null }),
  actions: { /* ... */ }
}, {
  persist: true,                     // 整个 store 存 localStorage
  // 精细控制：
  // persist: {
  //   key: 'app-user',
  //   storage: sessionStorage,      // 换成 sessionStorage
  //   paths: ['token']              // 只持久化 token，不存 userInfo
  // }
})
```

### 方案二：手写（理解原理）

```js
export const useUserStore = defineStore('user', {
  state: () => ({
    token: localStorage.getItem('token') || '',  // 初始化时恢复
    name: ''
  }),
  actions: {
    setToken(t) {
      this.token = t
      localStorage.setItem('token', t)   // 每次修改时写入
    },
    logout() {
      this.token = ''
      localStorage.removeItem('token')
    }
  }
})
// 原理：初始化从 storage 读 + 修改时同步写回 —— 插件自动做了这两件事
```

### 面试回答（总-分）

> **总起**：Pinia 本身不带持久化（刷新丢数据），要配合 storage 实现。
>
> **两种做法**：第一，工程化方案用 pinia-plugin-persistedstate——配置 persist: true 自动同步 localStorage，还能按 paths 精细控制哪些字段持久化。第二，理解原理的话手写也很简单——初始化时从 storage 恢复、每次修改时同步写回，插件就是把这两步自动化了。

## Q29：Vuex 核心流程？mutation vs action？

### 单向数据流图

```text
组件 --dispatch--> action（可异步） --commit--> mutation（同步）--> state --> 视图更新
  |
  +-------------也可以直接 commit------------> mutation --> state
```

```js
export default createStore({
  state: { count: 0, user: null },

  getters: { double: (state) => state.count * 2 },

  mutations: {
    // 同步修改 state 的唯一合法途径
    INCREMENT(state) { state.count++ },
    SET_USER(state, user) { state.user = user }
  },

  actions: {
    // 异步操作放这里，完成后 commit mutation
    async login({ commit }, data) {
      const user = await api.login(data)
      commit('SET_USER', user)
    }
  }
})
```

| | mutation | action |
| --- | --- | --- |
| 能否异步 | ❌ 必须同步 | ✅ |
| 触发方式 | `commit('NAME')` | `dispatch('name')` |
| 能否改 state | ✅ 唯一途径 | ❌ 必须 commit |
| 定位 | 修改入口 | 异步流程容器 |

**为什么 mutation 不能异步**：DevTools 依赖同步 mutation 做**时间旅行**——异步会导致快照和实际状态错乱，调试失真。

### 面试回答（总-分）

> **总起**：Vuex 是严格单向数据流——组件 dispatch action，action 处理异步后 commit mutation，mutation 同步改 state 触发视图更新。
>
> **mutation 和 action 的区别**：mutation 是修改 state 的唯一入口、必须同步——这是 DevTools 时间旅行调试的前提；action 放异步逻辑，完成后必须 commit mutation 才能改状态。
>
> **收尾**：这套流程安全但样板代码多——Pinia 去掉 mutation 后，同样的逻辑代码量直接减半，这也是官方推荐迁移的原因。

## Q30：什么状态该放全局 store？

| 放 store ✅ | 不放 store ❌ |
| --- | --- |
| 用户信息 / token | 表单临时输入 |
| 主题 / 语言偏好 | 弹窗/抽屉开关 |
| 权限 / 动态菜单 | tab 选中项 |
| 购物车 | 只与单组件相关的数据 |
| 跨页面共享的筛选条件 | 一次性页面的局部状态 |

**判断标准一句话**：**多个不相关组件都要用，且页面销毁后仍需保留**——两个条件同时满足才进 store，其余留给组件局部状态。

### 面试回答（总-分）

> **总起**：判断标准就一条——多组件共享且需要跨页面保留的才进 store。
>
> **正例**：token 和用户信息——登录后所有接口都要用、刷新后不能丢；主题和语言——全局生效且要持久化。**反例**：表单输入、弹窗开关——只和一个组件相关，放 store 反而增加复杂度。
>
> **原则**：store 是共享状态的解决方案，不是数据垃圾场——什么都往里放会失控。

## 本篇速答

| 问题 | 一句话答案 |
| --- | --- |
| Pinia 和 Vuex 最大区别？ | 去掉 mutation 直接改 state；扁平化多 store |
| 为什么 Vuex 要 mutation？ | 同步修改才能被 DevTools 时间旅行追踪 |
| Pinia 解构 state 为什么要 storeToRefs？ | 和 reactive 解构同理——直接解构丢响应 |
| Pinia 怎么持久化？ | 插件 persist 或手写 storage 双写 |
| mutation 和 action 区别？ | mutation 同步改 state；action 放异步后 commit |
| 什么状态进 store？ | 多组件共享 + 页面销毁仍需保留，两个条件同时满足 |
| store 之间怎么调用？ | 组合式写法里直接 useXxxStore() |
