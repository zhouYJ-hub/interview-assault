# Vue 源码分析

> 面试频率：⭐⭐⭐⭐（大厂中高级必考）| 从架构到模块逐层拆解 Vue 源码的核心实现

## 面试回答示范（总-分结构）

> **总起**：我把 Vue 源码按「编译、运行时、响应式」三大模块来讲理解。
>
> **第一，整体架构。** Vue 分编译时和运行时——编译时把 template 转成带优化标记的 render 函数（静态提升、patchFlag）；运行时执行 render 生成 VNode，patch 成真实 DOM；响应式贯穿全程做依赖收集和派发更新。
>
> **第二，响应式核心。** Proxy 的 get 拦截做 track 依赖收集，数据结构是 WeakMap -> Map -> Set 三层；set 拦截做 trigger 派发更新——但不是同步执行，而是通过调度器把 effect 放进微任务队列，同一个 tick 内去重合并，实现批量更新。
>
> **第三，diff 优化。** Vue3 的 patch 依赖编译时的 patchFlag 只比对动态部分；子节点 diff 用最长递增子序列找出不需要移动的节点，最小化 DOM 操作。

## 一、整体架构：三大模块协作

```text
┌─────────────────────────────────────────────────────────────┐
│                      Vue 应用启动                             │
│                                                              │
│      createApp(App).mount('#app')                            │
└──────────────────────────┬──────────────────────────────────┘
                           |
                           v
┌─────────────────────────────────────────────────────────────┐
│              编译模块（编译时，构建阶段完成）                    │
│                                                              │
│   template 字符串                                            │
│       |                                                      │
│       v  parse（词法+语法分析）                                │
│   AST（抽象语法树）                                            │
│       |                                                      │
│       v  transform + 优化                                     │
│   优化后的 AST                                                │
│       ├── 静态提升标记（hoistable）                             │
│       └── patchFlag 标记（标记动态部分）                         │
│       |                                                      │
│       v  generate（代码生成）                                  │
│   render 函数                                                 │
│       （带优化标记的 VNode 创建函数）                             │
└──────────────────────────┬──────────────────────────────────┘
                           |
                           v
┌─────────────────────────────────────────────────────────────┐
│                运行时模块（运行时，浏览器执行）                   │
│                                                              │
│   执行 render()                                               │
│       |     ┌────────────────────────────────┐              │
│       |     │ render 过程中读取响应式数据       │              │
│       |     │ {{ count }} -> Proxy get 拦截    │              │
│       |     │              -> track 收集依赖   |              │
│       |     └────────────────────────────────┘              │
│       v                                                      │
│   VNode（虚拟DOM树）                                          │
│       |                                                      │
│       v  patch（首次挂载全量创建 / 更新时最小diff）               │
│   真实 DOM                                                    │
└──────────────────────────┬──────────────────────────────────┘
                           |
                           v
┌─────────────────────────────────────────────────────────────┐
│              响应式模块（贯穿整个运行时）                        │
│                                                              │
│   Proxy 拦截 get / set                                        │
│       |                    |                                 │
│       v                    v                                 │
│   get 拦截               set 拦截                              │
│       |                    |                                 │
│       v                    v                                 │
│   track 收集依赖         trigger 派发更新                       │
│       |                    |                                 │
│       v                    v                                 │
│   记录「谁用了我」         通知所有依赖 -> 微任务队列              │
│   (effect 集合)          -> 批量重新 render -> diff -> patch    │
│                                                              │
│   ┌─────────────────────────────────────────────┐            │
│   │  闭环：数据变 -> trigger -> 重新 render        │            │
│   │        -> 新 VNode -> diff -> 最小 patch DOM  │            │
│   │        -> render 过程再 track（新一轮收集）     │            │
│   └─────────────────────────────────────────────┘            │
└─────────────────────────────────────────────────────────────┘
```

**核心认知**：编译时把模板变成 render 函数；运行时执行 render 生成 VNode 再 patch 成 DOM；响应式在 render 过程中收集「谁用了这个数据」，数据变了通知谁重新 render。

**源码目录对应**（vue/core 仓库）：

```text
packages/
├── compiler-core/     编译核心（平台无关的 AST 转换）
├── compiler-dom/      DOM 平台编译（v-model 等指令处理）
├── compiler-sfc/      .vue 单文件组件编译
├── runtime-core/      运行时核心（VNode、patch、组件系统）
├── runtime-dom/       DOM 平台运行时（DOM API 封装）
├── reactivity/        响应式系统（可独立发布 @vue/reactivity）
└── vue/               整合包（完整 Vue）
```

## 二、初始化挂载流程（首次渲染）

```text
┌──────────────────────────────────────────────────────────┐
│                    createApp(App)                         │
│                                                           │
│  创建 app 实例（注册全局 API：component/directive/use）      │
└──────────────────────────┬───────────────────────────────┘
                           |
                           v
┌──────────────────────────────────────────────────────────┐
│                   mount('#app')                           │
│                                                           │
│  1. 获取容器 container = querySelector('#app')              │
│  2. 清空容器内容                                            │
│  3. 创建根组件 VNode = createVNode(App)                     │
└──────────────────────────┬───────────────────────────────┘
                           |
                           v
┌──────────────────────────────────────────────────────────┐
│              render(vnode, container)                      │
│                                                           │
│  调用 patch(null, vnode, container)                        │
│  （n1 = null 表示首次挂载，全量创建）                          │
└──────────────────────────┬───────────────────────────────┘
                           |
                           v
┌──────────────────────────────────────────────────────────┐
│           processComponent（处理组件类型 VNode）              │
│                                                           │
│  ┌─────────────────────────────────────────────────────┐  │
│  │  createComponentInstance()                          │  │
│  │                                                     │  │
│  │  创建组件实例 instance，包含：                          │  │
│  │    ├── props（父传子属性）                             │  │
│  │    ├── slots（插槽内容）                               │  │
│  │    ├── ctx（渲染上下文）                               │  │
│  │    ├── setupState（setup 返回值）                      │  │
│  │    ├── mounted: []（生命周期钩子队列）                   │  │
│  │    └── subTree（渲染产物 VNode，初始 null）             │  │
│  └─────────────────────────────────────────────────────┘  │
└──────────────────────────┬───────────────────────────────┘
                           |
                           v
┌──────────────────────────────────────────────────────────┐
│              setupComponent（执行 setup）                   │
│                                                           │
│  ┌─────────────────────────────────────────────────────┐  │
│  │  执行用户写的 setup() 函数                             │  │
│  │                                                     │  │
│  │    ├── ref()        -> 创建响应式包装对象               │  │
│  │    ├── reactive()   -> Proxy 代理对象                  │  │
│  │    ├── computed()   -> lazy effect（脏标记缓存）        │  │
│  │    ├── watch()      -> effect + scheduler 回调        │  │
│  │    ├── onMounted()  -> 钩子 push 进 instance.mounted  │  │
│  │    └── return { ... }  -> 暴露给模板的数据              │  │
│  │                                                     │  │
│  │  ⚠️ 此时 activeEffect = null                          │  │
│  │     setup 里的代码不触发 track 收集                     │  │
│  │     （只有 render 执行时才收集依赖）                      │  │
│  └─────────────────────────────────────────────────────┘  │
└──────────────────────────┬───────────────────────────────┘
                           |
                           v
┌──────────────────────────────────────────────────────────┐
│        setupRenderEffect（创建渲染 effect）★ 最核心 ★       │
│                                                           │
│  ┌─────────────────────────────────────────────────────┐  │
│  │  instance.update = effect(renderFn, {                │  │
│  │    scheduler: () => queueJob(instance.update)        │  │
│  │  })                                                 │  │
│  │                                                     │  │
│  │  将「组件的 render + patch」绑定为 effect               │  │
│  │  数据变化时通过 scheduler -> 微任务批量执行              │  │
│  │  这就是组件能自动重新渲染的根源！                          │  │
│  └─────────────────────────────────────────────────────┘  │
│                                                           │
│  effect 立即执行（首次渲染）：                                │
│    |                                                      │
│    v                                                      │
│  ┌─────────────────────────────────────────────────────┐  │
│  │  1. activeEffect = instance.update                   │  │
│  │                                                     │  │
│  │  2. 执行 instance.render()                           │  │
│  │     ┌─────────────────────────────────────┐         │  │
│  │     │ render 中访问 {{ count }}            │         │  │
│  │     │   -> Proxy get 拦截                  │         │  │
│  │     │   -> track(target, 'count')          │         │  │
│  │     │   -> activeEffect(instance.update)   │         │  │
│  │     │      被记录到 count 的依赖集合         │         │  │
│  │     └─────────────────────────────────────┘         │  │
│  │   -> 返回子树 VNode（subTree）                        │  │
│  │                                                     │  │
│  │  3. patch(null, subTree, container)                  │  │
│  │     首次挂载：                                        │  │
│  │       ├── createElement('div')                       │  │
│  │       ├── 设置属性/事件（patchProp）                    │  │
│  │       ├── createText / setTextContent                │  │
│  │       └── insert(el, container) 挂载到容器            │  │
│  │                                                     │  │
│  │  4. instance.subTree = subTree                      │  │
│  │     （保存旧 VNode 供下次更新 diff 用）                  │  │
│  │                                                     │  │
│  │  5. activeEffect = null（清理现场）                    │  │
│  └─────────────────────────────────────────────────────┘  │
└──────────────────────────┬───────────────────────────────┘
                           |
                           v
┌──────────────────────────────────────────────────────────┐
│                  触发 onMounted                           │
│                                                           │
│  遍历 instance.mounted 数组，逐个调用钩子                     │
│  （此时 DOM 已就绪，可以做初始化操作）                          │
└──────────────────────────┬───────────────────────────────┘
                           |
                           v
                     ✅ 页面呈现
```

**源码关键函数链**：

```js
createApp(App) -> app.mount(container)
  -> createVNode(App)
  -> render(vnode, container)
    -> patch(null, vnode, container)
      -> processComponent()
        -> mountComponent()
          -> createComponentInstance()
          -> setupComponent()
          -> setupRenderEffect()  // ★ 核心：绑定渲染 effect
            -> effect(render, scheduler)
            -> run() -> render() -> subTree VNode
            -> patch(null, subTree)
```

## 三、响应式系统（核心中的核心）

### 3.1 reactive 的实现

```js
const reactiveMap = new WeakMap()  // 缓存：防止同一对象重复代理

function reactive(target) {
  if (typeof target !== 'object') return target
  if (reactiveMap.has(target)) return reactiveMap.get(target)

  const proxy = new Proxy(target, {
    get(target, key, receiver) {
      track(target, key)                  // 依赖收集
      const result = Reflect.get(target, key, receiver)
      // 惰性递归：嵌套对象在「被访问时」才代理
      if (typeof result === 'object' && result !== null) {
        return reactive(result)
      }
      return result
    },
    set(target, key, value, receiver) {
      const oldValue = target[key]
      const result = Reflect.set(target, key, value, receiver)
      if (!Object.is(oldValue, value)) {  // 值变了才触发
        trigger(target, key)
      }
      return result
    },
    deleteProperty(target, key) {
      const result = Reflect.deleteProperty(target, key)
      if (result) trigger(target, key)
      return result
    }
  })
  reactiveMap.set(target, proxy)
  return proxy
}
```

### 3.2 依赖收集的完整数据结构

```text
┌──────────────────────────────────────────────────────────────┐
│                     targetMap（全局依赖表）                     │
│                     类型：WeakMap                              │
│                                                              │
│  ┌───────────────────────────────────────────────────────┐   │
│  │  key: target（原对象，如 { name, count } ）              │   │
│  │  value: depsMap（Map）                                  │   │
│  │                                                        │   │
│  │    ┌────────────────────────────────────────────────┐   │   │
│  │    │  key: 'name'          value: dep (Set)         │   │   │
│  │    │    ┌─────────────────────────────────┐         │   │   │
│  │    │    │ ├── effect_组件A的update          │         │   │   │
│  │    │    │ └── effect_computed_double        │         │   │   │
│  │    │    └─────────────────────────────────┘         │   │   │
│  │    │                                                  │   │   │
│  │    │  key: 'count'         value: dep (Set)         │   │   │
│  │    │    ┌─────────────────────────────────┐         │   │   │
│  │    │    │ └── effect_组件A的update          │         │   │   │
│  │    │    └─────────────────────────────────┘         │   │   │
│  │    └────────────────────────────────────────────────┘   │   │
│  └───────────────────────────────────────────────────────┘   │
│                                                              │
│  ┌───────────────────────────────────────────────────────┐   │
│  │  key: 另一个对象 ...                                     │   │
│  └───────────────────────────────────────────────────────┘   │
│                                                              │
│  为什么用 WeakMap？                                           │
│  -> 键是弱引用：原对象被销毁时整个依赖树自动被 GC                 │
│  -> 防止内存泄漏                                              │
└──────────────────────────────────────────────────────────────┘
```

### 3.3 track 的执行流程

```text
┌──────────────────────────────────────────────────────────┐
│              track(target, key) 依赖收集                    │
│                                                           │
│  前提：activeEffect 不为 null                               │
│  （只有 effect 正在执行时，才知道是谁在用这个数据）                │
└──────────────────────────┬───────────────────────────────┘
                           |
                           v
┌──────────────────────────────────────────────────────────┐
│  第一层：按「对象」找                                         │
│                                                           │
│  let depsMap = targetMap.get(target)                       │
│  没有 -> new Map() 并存入 targetMap                          │
└──────────────────────────┬───────────────────────────────┘
                           |
                           v
┌──────────────────────────────────────────────────────────┐
│  第二层：按「属性」找                                         │
│                                                           │
│  let dep = depsMap.get(key)                                │
│  没有 -> new Set() 并存入 depsMap                            │
│  （Set 自动去重：同一 effect 只存一次）                         │
└──────────────────────────┬───────────────────────────────┘
                           |
                           v
┌──────────────────────────────────────────────────────────┐
│  第三层：把「当前 effect」加入集合                              │
│                                                           │
│  dep.add(activeEffect)          // effect 记住 dep          │
│  activeEffect.deps.push(dep)    // dep 也记住 effect         │
│                                                           │
│  双向关联 -> 组件卸载时可以精确清理所有依赖                      │
└──────────────────────────────────────────────────────────┘
```

### 3.4 trigger 的执行流程

```text
┌──────────────────────────────────────────────────────────┐
│            trigger(target, key) 派发更新                    │
│                                                           │
│  数据被修改 -> Proxy set 拦截 -> 调用 trigger                 │
└──────────────────────────┬───────────────────────────────┘
                           |
                           v
┌──────────────────────────────────────────────────────────┐
│  1. 从 targetMap 找到依赖集合                                │
│                                                           │
│  const dep = targetMap.get(target)?.get(key)               │
└──────────────────────────┬───────────────────────────────┘
                           |
                           v
┌──────────────────────────────────────────────────────────┐
│  2. 复制一份再遍历                                           │
│                                                           │
│  const effectsToRun = new Set(dep)                         │
│  （防止遍历过程中 effect 执行又修改 dep 导致死循环）               │
└──────────────────────────┬───────────────────────────────┘
                           |
                           v
┌──────────────────────────────────────────────────────────┐
│  3. 逐个执行 effect                                         │
│                                                           │
│  effectsToRun.forEach(effect => {                          │
│    if (effect !== activeEffect) {      // 防递归            │
│      if (effect.scheduler) {                               │
│        effect.scheduler()  // 组件更新 -> queueJob 微任务     │
│      } else {                                              │
│        effect.run()        // 普通 effect 直接执行            │
│      }                                                     │
│    }                                                       │
│  })                                                        │
│                                                           │
│  ⚠️ 关键：有 scheduler 不直接执行，                            │
│     而是交给调度器 -> 微任务批量合并                             │
└──────────────────────────────────────────────────────────┘
```

## 四、调度系统：批量更新的实现

```text
┌──────────────────────────────────────────────────────────────┐
│                    批量更新完整流程                              │
│                                                               │
│  用户代码（同步执行）：                                          │
│  ┌────────────────────────────────────────────────────────┐   │
│  │  state.a = 1                                           │   │
│  │    -> Proxy set 拦截                                    │   │
│  │    -> trigger(target, 'a')                              │   │
│  │    -> 找到 effect，有 scheduler                          │   │
│  │    -> queueJob(update)                                  │   │
│  │       Set.add(update)  ✅ 入队成功                       │   │
│  │                                                        │   │
│  │  state.b = 2                                           │   │
│  │    -> trigger(target, 'b')                              │   │
│  │    -> queueJob(update)                                  │   │
│  │       Set.add(update)  ❌ 已存在，跳过（Set 去重！）        │   │
│  │                                                        │   │
│  │  state.c = 3                                           │   │
│  │    -> 同上 -> Set 去重跳过                                │   │
│  │                                                        │   │
│  │  （三次修改 -> 只入队一次 update）                          │   │
│  └────────────────────────┬───────────────────────────────┘   │
│                           |                                   │
│                           v                                   │
│  ┌────────────────────────────────────────────────────────┐   │
│  │  queueJob 里的微任务调度                                  │   │
│  │                                                        │   │
│  │  let isFlushing = false                                │   │
│  │                                                        │   │
│  │  function queueJob(job) {                              │   │
│  │    queue.add(job)          // Set 去重                   │   │
│  │    if (!isFlushing) {                                  │   │
│  │      isFlushing = true                                 │   │
│  │      Promise.resolve().then(flushJobs)  // 微任务！       │   │
│  │    }                                                   │   │
│  │  }                                                     │   │
│  │                                                        │   │
│  │  // 当前同步代码全部跑完之后才执行 flushJobs                 │   │
│  └────────────────────────┬───────────────────────────────┘   │
│                           |                                   │
│                           v                                   │
│  ┌────────────────────────────────────────────────────────┐   │
│  │  flushJobs（微任务队列中执行）                             │   │
│  │                                                        │   │
│  │  1. 执行 update（组件的 render + patch）                  │   │
│  │     -> render() 生成新 VNode                             │   │
│  │     -> diff(旧VNode, 新VNode)                            │   │
│  │     -> patch 最小更新 DOM                                 │   │
│  │                                                        │   │
│  │  2. queue.clear()                                       │   │
│  │  3. isFlushing = false                                  │   │
│  │                                                        │   │
│  │  ✅ 三次数据修改 -> 只执行了一次 render + patch            │   │
│  └────────────────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────────────┘
```

## 五、编译系统

### 5.1 编译流程

```text
┌──────────────────────────────────────────────────────────┐
│              template 字符串                                │
│              <div>{{ name }}</div>                         │
└──────────────────────────┬───────────────────────────────┘
                           |
                           v
┌──────────────────────────────────────────────────────────┐
│  parse（词法分析 + 语法分析）                                 │
│                                                           │
│  把字符串解析成 AST（抽象语法树）                               │
│  每个标签/属性/文本都变成树节点                                 │
└──────────────────────────┬───────────────────────────────┘
                           |
                           v
┌──────────────────────────────────────────────────────────┐
│  transform（转换 + 优化）                                    │
│                                                           │
│  遍历 AST 做两件事：                                          │
│                                                           │
│  ┌─────────────────────┐  ┌─────────────────────────┐     │
│  │  优化一：静态提升标记    │  │  优化二：patchFlag 标记   │     │
│  │                     │  │                         │     │
│  │  纯静态节点标记为      │  │  动态节点标记哪些部分会变    │     │
│  │  hoistable          │  │  PatchFlags.TEXT        │     │
│  │  -> 提到 render 外   │  │  PatchFlags.CLASS       │     │
│  │  -> 只创建一次        │  │  PatchFlags.PROPS       │     │
│  └─────────────────────┘  └─────────────────────────┘     │
└──────────────────────────┬───────────────────────────────┘
                           |
                           v
┌──────────────────────────────────────────────────────────┐
│  generate（代码生成）                                        │
│                                                           │
│  把优化后的 AST 转成 render 函数代码字符串                      │
│  再 new Function(...) 变成可执行函数                          │
└──────────────────────────────────────────────────────────┘
```

### 5.2 patchFlag 在 diff 中的作用

```js
// 有 patchFlag 的节点：只比对标记的属性，其他全部跳过
if (patchFlag & PatchFlags.CLASS) {
  // 只更新 class，跳过 style/event/其他属性
  if (nextProps.class !== prevProps.class) {
    hostPatchProp(el, 'class', nextProps.class)
  }
}
if (patchFlag & PatchFlags.TEXT) {
  // 只更新文本
  if (nextChildren !== prevChildren) {
    hostSetText(el, nextChildren)
  }
}
// 没标记的属性完全跳过 —— 大幅减少比对次数
```

### 5.3 最长递增子序列（列表 diff）

```text
┌──────────────────────────────────────────────────────────────┐
│                列表 diff 的最小移动策略                          │
│                                                               │
│  旧顺序: [A, B, C, D, E]                                      │
│  新顺序: [D, A, B, E, C]   （D 移到最前，C 移到后面）             │
│                                                               │
│  第 1 步：新序列各节点在旧序列中的位置                             │
│          D=3, A=0, B=1, E=4, C=2                              │
│          -> [3, 0, 1, 4, 2]                                   │
│                                                               │
│  第 2 步：求最长递增子序列（LIS）                                │
│          [3, 0, 1, 4, 2] 中 LIS = [0, 1, 4]                   │
│          即 A(0), B(1), E(4) 的位置递增 -> 不需要移动             │
│                                                               │
│  第 3 步：LIS 以外的节点做最小移动                               │
│          D(3) 移到最前面 -> 移 1 次                             │
│          C(2) 移到最后面  -> 移 1 次                             │
│                                                               │
│  结果：只移动 2 次，而不是全部重建                                │
│  ✅ 时间复杂度 O(n log n)                                       │
└──────────────────────────────────────────────────────────────┘
```

## 六、完整闭环

```text
┌──────────────────────────────────────────────────────────────┐
│                     Vue 底层核心闭环                            │
│                                                               │
│   ┌──────────┐    read     ┌──────────┐    ┌──────────┐      │
│   │  响应式   │ ─────────> │  render  │──> │  VNode   │      │
│   │  数据     │  Proxy get │  生成    │    │  虚拟DOM  │      │
│   │(Proxy)   │  + track   │  函数执行 │    └────┬─────┘      │
│   └────┬─────┘            └──────────┘         |             │
│        |                                            | diff        │
│        |                                      ┌────v─────┐      │
│        |                                      │  patch   │      │
│        | set                                  │  最小更新 │      │
│        | + trigger                            └────┬─────┘      │
│        |                                           |             │
│  ┌─────v───────────────────────────────────────────┴──────┐     │
│  │                                                        │     │
│  │   trigger -> queueJob -> 微任务 -> 重新 render            │     │
│  │          -> 新 VNode -> diff -> 最小 patch -> DOM 更新    │     │
│  │          -> 新一轮 render 时再 track（循环收集）            │     │
│  │                                                        │     │
│  │   一句话：数据驱动视图                                     │     │
│  │   数据变 -> 找到用它的 effect -> 批量更新 -> 最小 DOM 操作   │     │
│  └────────────────────────────────────────────────────────┘     │
└──────────────────────────────────────────────────────────────┘
```

## 七、computed / watch 的源码实现

### 7.1 computed：lazy effect + 脏标记

```js
function computed(getter) {
  let value          // 缓存值
  let dirty = true   // 脏标记：true 表示需要重新计算

  const runner = effect(getter, {
    lazy: true,
    scheduler() {
      dirty = true           // 依赖变了只标脏！不执行 getter
      trigger(computedObj, 'value')  // 通知用 computed 的组件更新
    }
  })

  const computedObj = {
    get value() {
      if (dirty) {
        value = runner()     // 脏了才重新计算
        dirty = false        // 算完标干净
      }
      track(computedObj, 'value')
      return value           // 不脏直接返回缓存
    }
  }
  return computedObj
}
```

**缓存机制**：依赖变 -> 只标脏不重算 -> 下次有人读 .value 才重算。

### 7.2 watch：effect + scheduler 回调

```js
function watch(source, cb, options = {}) {
  // 根据 source 类型构造 getter
  let getter
  if (isRef(source)) {
    getter = () => source.value
  } else if (isReactive(source)) {
    getter = () => traverse(source)  // 深层遍历触发所有依赖收集
  } else {
    getter = source  // 函数形式
  }

  let oldValue
  const job = () => {
    const newValue = runner()  // 重新执行 getter 拿新值
    cb(newValue, oldValue)     // 调用用户回调（新旧值都在）
    oldValue = newValue
  }

  const runner = effect(getter, {
    lazy: true,
    scheduler: job  // 数据变化 -> 执行 job 而不是直接跑 getter
  })

  if (options.immediate) {
    job()  // 立即执行一次
  } else {
    oldValue = runner()  // 先跑一次记录旧值
  }
}
```

## 八、nextTick 的实现

```text
┌──────────────────────────────────────────────────────────────┐
│                  nextTick 时序图                                │
│                                                               │
│  时间线 ─────────────────────────────────────────────>        │
│                                                               │
│  同步阶段：                                                     │
│    state.count = 10                                           │
│      -> trigger -> queueJob(update)                           │
│      -> Promise.resolve().then(flushJobs)   ← 入微任务（第1个） │
│                                                               │
│    nextTick(callback)                                         │
│      -> p.then(callback)                    ← 入微任务（第2个） │
│                                                               │
│  同步代码继续...                                                │
│  ...                                                          │
│  同步结束 ──────────────────────────────────────────           │
│                                                               │
│  微任务队列执行（按入队顺序）：                                   │
│                                                               │
│    第 1 个：flushJobs                                          │
│      -> 执行 update（render + diff + patch）                   │
│      -> ✅ DOM 更新完成                                         │
│                                                               │
│    第 2 个：callback（nextTick 的回调）                          │
│      -> 此时 DOM 已经是新的 ✅                                   │
│      -> 可以安全地读取 DOM 尺寸/滚动位置                          │
│                                                               │
│  本质：nextTick 没有魔法 ——                                      │
│  只是把回调排在 flushJobs（DOM更新）之后的微任务里                  │
└──────────────────────────────────────────────────────────────┘
```

## 九、生命周期钩子的实现

```js
// 钩子的本质：往实例的钩子数组里 push 回调
function onMounted(hook) {
  if (currentInstance) {
    const hooks = currentInstance[MountedHook] || []
    hooks.push(hook)
    currentInstance[MountedHook] = hooks
  }
}

// mountComponent 完成后统一遍历执行
function invokeMounted(instance) {
  const hooks = instance[MountedHook]
  if (hooks) {
    hooks.forEach((hook) => hook.call(instance.proxy))
  }
}
```

## 十、高频面试题速答

| 问题 | 答案 |
| --- | --- |
| Vue 三大模块？ | 编译（template→render）、运行时（VNode→patch→DOM）、响应式（track/trigger） |
| targetMap 为什么要 WeakMap？ | 弱引用防内存泄漏——对象销毁依赖树自动回收 |
| track 的三层结构？ | WeakMap(对象) -> Map(属性) -> Set(effect 集合) |
| 为什么惰性递归？ | 初始化只代理第一层，嵌套访问到才包装——首屏快 |
| 批量更新怎么实现？ | queueJob + Set 去重 + Promise.then 微任务 |
| patchFlag 是什么？ | 编译时标记动态部分——diff 只比对标记处 |
| 最长递增子序列干嘛的？ | 列表 diff 找不移动的最长序列，最小化 DOM 移动 |
| computed 缓存原理？ | dirty 脏标记——依赖变只标脏，下次读取才计算 |
| watch 怎么拿新旧值？ | scheduler 里重跑 getter 拿新值，配合存的 oldValue |
| nextTick 为什么有效？ | flushJobs 先入队先执行，nextTick 回调排在后面 |
| 生命周期钩子的本质？ | 注册到实例上的回调数组，特定时机遍历调用 |
| setupRenderEffect 做了什么？ | 把 render+patch 绑成 effect，数据变通过 scheduler 触发 |

## 十一、速记卡

```text
1. 三模块：编译（template→render）、运行时（patch）、响应式（track/trigger）
2. reactive：Proxy + WeakMap 缓存 + 惰性递归
3. ref：包对象 + 拦截 .value —— 让 Proxy 能拦基本类型
4. track 三层：WeakMap -> Map -> Set，双向关联
5. 批量更新：Set 去重队列 + 微任务 flushJobs
6. patchFlag 编译标记 -> diff 只比对动态部分
7. 最长递增子序列 -> 列表 diff 最小化移动
8. computed 缓存 = dirty 脏标记
9. watch = effect + scheduler 回调（拿新旧值）
10. nextTick = 微任务排在 flushJobs 之后
```
