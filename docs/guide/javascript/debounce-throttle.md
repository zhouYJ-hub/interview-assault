# 防抖与节流

> 面试频率：⭐⭐⭐⭐⭐（必默写）| 关联考点：闭包、this、apply、定时器

## 面试回答（开口版）

如果面试官问「防抖和节流的区别」，可以这样回答：

> 都是优化高频事件的手段，核心区别一句话：**防抖只执行最后一次，节流按固定频率执行**。防抖是停止触发 delay 毫秒后才执行，期间再触发就重新计时，像电梯关门或者打游戏回城；节流是每 interval 毫秒最多执行一次，像地铁按班次发车或者打游戏技能CD。
>
> 实现上，防抖靠闭包存 timer，每次触发先 `clearTimeout` 再重新 `setTimeout`；节流有两种思想：**时间戳版**——记下上次执行时间，本次触发时时间差够 interval 才执行（首次立即执行、结束不补）；**定时器版**——用 timer 占位，定时器还在就直接跳过，到期执行后清空（首次延迟、结束会补一次）。
>
> 场景：搜索联想、resize、防重复提交用防抖；滚动加载、拖拽用节流。手写时注意用 `apply(this, args)` 透传 this 和参数。

**答题要点：** 核心区别 → 比喻 → 两者实现机制（含节流两种思想）→ 场景选择
## 一、为什么需要：高频事件的问题

scroll、resize、input、mousemove 等事件每秒可触发几十上百次。如果每次都执行复杂逻辑（请求接口、重排布局），会导致：

- 大量无效请求（用户还没输完就搜索）；
- 页面卡顿掉帧（每帧都在计算布局）；
- CPU 资源浪费。

防抖和节流就是**降低事件执行频率**的两种策略。

## 二、防抖（debounce）

### 2.1 原理时间轴

```text
事件触发:   ---1----1--1---1----------------------(停止)--------
计时器:     重置  重置 重置 重置                  从最后一次触发开始计时
执行:                                          ......delay 后----> 执行一次
```

特点：频繁触发期间**一直不执行**，只有安静 delay 毫秒后才执行一次（所以叫「只执行最后一次」）。

### 2.2 基础版（trailing 后置执行）

```js
function debounce(fn, delay = 300) {
  let timer = null // 闭包保存定时器
  return function (...args) {
    clearTimeout(timer) // 再触发就重置计时
    timer = setTimeout(() => {
      fn.apply(this, args) // 保证 this 与参数正确
    }, delay)
  }
}
```

**考点拆解（面试时口述）：**

1. `timer` 存在闭包中，多次调用共享同一个定时器；
2. `clearTimeout` 取消上一次，实现「重新计时」；
3. 回调用箭头函数继承外层 this，`fn.apply(this, args)` 透传 this 和参数。

### 2.3 立即执行版（leading 前置执行）

第一次触发立刻执行，之后冷却期内无效——适合按钮防重复点击。标准写法：

```js
function debounce(fn, delay = 1000, immediate = true) {
  let timer = null
  return function (...args) {
    if (timer) clearTimeout(timer) // 取消上一次等待
    if (immediate && !timer) {
      fn.apply(this, args) // 立即执行
    }
    timer = setTimeout(() => {
      timer = null // 等待期结束，重置状态
    }, delay)
  }
}
```

**逻辑解读：**

1. `if (timer) clearTimeout(timer)`：冷却期内再次触发，先取消上一次的等待计时；
2. `immediate && !timer`：开启立即执行，且当前**不在冷却期**（timer 为空）才执行 fn——「第一次立刻执行、冷却期内无效」的关键；
3. `setTimeout` 到期时**不执行 fn**，只把 timer 置 null——它只负责标记「冷却结束」，让下一次触发又能立即执行。

> 后置执行（停止触发 delay 后才执行）见 2.2 基础版；leading / trailing 可配置的完整版见 2.4 合并版。
### 2.4 合并版（leading + trailing 选项）

underscore / lodash 的思路：支持配置首次是否立即执行（leading）、结束时是否补执行（trailing）：

```js
function debounce(fn, delay = 300, { leading = false, trailing = true } = {}) {
  let timer = null // null 表示当前不在冷却期

  function debounced(...args) {
    if (timer) clearTimeout(timer) // 冷却期内再次触发：取消上一次等待

    // 本次是否走 leading：开启立即执行 且 当前不在冷却期
    const callNow = leading && timer === null

    // 无论是否执行 leading，都进入冷却期；到期只重置状态、按需补执行
    timer = setTimeout(() => {
      timer = null // 冷却结束
      // trailing 补执行的唯一条件：本次触发没有走 leading（callNow 为 false）
      // 隐藏含义：单次调用且已 leading 执行过时，结束时不会再补一次
      if (trailing && !callNow) fn.apply(this, args)
    }, delay)

    if (callNow) fn.apply(this, args) // 立即执行
  }

  debounced.cancel = function () {
    clearTimeout(timer)
    timer = null
  }
  return debounced
}
```

**逻辑解读：**

1. **`timer = null` 表示不在冷却期**：timer 存在就说明上一次触发还在等待中；
2. **`clearTimeout`**：冷却期内再次触发，先取消上一次等待——「重新计时」的实现；
3. **`callNow = leading && timer === null`**：开启立即执行 且 当前不在冷却期，本次才走 leading 立即执行；
4. **设置新 timer 进入冷却期**：无论走没走 leading 都会设置；到期时先把 timer 置 null，代表冷却结束；
5. **`trailing && !callNow` 补执行**：本次没走 leading（说明是冷却期内的重复触发）且开启 trailing，到期补一次，参数用的是**最后一次**的 args；
6. **防双触发**：单次调用走了 leading 后，到期时 `!callNow` 为 false 不会再补——一次触发最多执行一次。

**四种配置的行为：**

| leading | trailing | 行为 | 等价于 |
| --- | --- | --- | --- |
| false | true（默认） | 停止触发后执行一次 | 2.2 基础版 |
| true | false | 首次立即执行，冷却期内忽略 | 2.3 立即执行版 |
| true | true | 首次立即执行；冷却期内若又有触发，结束时再补一次 | lodash 默认风格 |
| false | false | 永不执行（无意义配置，lodash 同样如此） | - |
### 2.5 带取消功能

防抖期间用户切换了搜索词/离开了页面，应取消未执行的回调：

```js
const debounced = debounce(fn, 300)

debounced.cancel() // 手动取消
window.addEventListener('beforeunload', () => debounced.cancel())
```

## 三、节流（throttle）

### 3.1 原理时间轴

```text
事件触发:  ---1----1--1---1----1-----1--1------(停止)
执行:       执行...等..等..等-->执行....等..等-->执行
            |<--- interval --->|
```

特点：不管触发多频繁，**每 interval 毫秒最多执行一次**。

### 3.2 写法一：时间戳版（首次立即执行）

```js
function throttle(fn, interval = 300) {
  let last = 0 // 上次执行时间
  return function (...args) {
    const now = Date.now()
    if (now - last >= interval) {
      last = now
      fn.apply(this, args)
    }
  }
}
```

特点：第一次立刻执行；停止触发后，**最后一次不补执行**。

### 3.3 写法二：定时器版（首次延迟执行）

```js
function throttle(fn, interval = 300) {
  let timer = null
  return function (...args) {
    if (timer) return // 定时器还在，本轮不执行
    timer = setTimeout(() => {
      fn.apply(this, args)
      timer = null // 释放，允许下一轮
    }, interval)
  }
}
```

特点：第一次延迟 interval 执行；停止触发前，**最后一次会执行**（定时器到期兜底）。

### 3.4 合并版（时间戳 + 定时器，首尾都执行）

```js
function throttle(fn, interval = 300) {
  let last = 0        // 上次执行的时间戳，初始 0 保证首次立即执行
  let timer = null    // 兜底定时器
  let savedArgs = null
  let savedThis = null

  return function (...args) {
    const now = Date.now()
    const remaining = interval - (now - last) // 距离下次可执行还剩多久

    if (remaining <= 0) {
      // 时间到了：清掉可能残留的兜底定时器，立即执行
      if (timer) {
        clearTimeout(timer)
        timer = null
      }
      last = now
      fn.apply(this, args)
    } else {
      // 没到时间：记住最新的 this 和参数（后续触发会不断覆盖）
      savedArgs = args
      savedThis = this
      // 一个窗口只设一个兜底定时器：窗口结束时用「最新」参数补一次
      if (!timer) {
        timer = setTimeout(() => {
          last = Date.now()
          timer = null
          fn.apply(savedThis, savedArgs)
        }, remaining)
      }
    }
  }
}
```

**逻辑解读：**

1. **`last = 0` 保证首次立即执行**：第一次调用时 `now - last` 是巨大的正数，`remaining` 必然小于等于 0，直接走立即执行分支（leading）；
2. **`remaining <= 0` 时间到了**：先清掉可能残留的兜底定时器，更新 `last`，立即执行（时间戳逻辑）；
3. **没到时间**：先把本次的 `this` 和 `args` 存起来——**每次触发都会覆盖**，所以兜底执行时拿到的一定是「最后一次」的参数；
4. **`!timer` 才设兜底定时器**：一个窗口只设一个，到期补执行一次（trailing），保证停止触发前最后一次不丢；
5. **兜底执行后 `last = Date.now()`**：以实际执行时刻重置窗口起点，下一轮重新计时。

**为什么要存 savedArgs / savedThis（原版隐藏 Bug）：**

兜底定时器只在窗口内**第一次**触发时创建，定时器闭包里的 `args` 从那一刻就固定了；如果后面还有触发，到期执行的其实是「旧参数」。实测对比（interval=200ms，依次触发 1、2、3、4）：

```text
直接闭包 args：执行 [1, 2]  —— 兜底用了设置定时器那次的参数 2
保存最新参数  ：执行 [1, 4]  —— 兜底用了最后一次触发的参数 4
```

lodash 也是这个思路：每次触发先更新保存的 this 和参数，兜底时再取出来执行。
## 四、防抖 vs 节流 对比表

| | 防抖 | 节流 |
| --- | --- | --- |
| 执行时机 | 停止触发 delay 后执行一次 | 每 interval 最多执行一次 |
| 执行次数（持续触发时） | 一直不执行 | 固定频率执行 |
| 停止触发后 | 最后一次（延迟后执行） | 时间戳版不补执行；定时器版可能补一次 |
| 适合 | 只关心最终状态 | 过程中也要持续反馈 |
| 比喻 | 电梯关门 | 地铁班次 |

## 五、实战示例

### 5.1 搜索联想（防抖）

```html
<input id="search" placeholder="输入关键词" />
```

```js
const input = document.getElementById('search')

function search(keyword) {
  console.log('请求接口：', keyword)
  // fetch(`/api/search?q=${keyword}`)
}

const debouncedSearch = debounce(search, 500)

input.addEventListener('input', (e) => {
  debouncedSearch(e.target.value.trim())
})

// 用户快速输入 "前端面试"：只在停顿 500ms 后请求一次
```

### 5.2 窗口 resize（防抖）

```js
function layout() {
  console.log('重新计算布局', window.innerWidth)
}

window.addEventListener('resize', debounce(layout, 300))
// 拖动窗口过程中不计算，松手稳定后算一次
```

### 5.3 滚动加载（节流）

```js
function loadMore() {
  const { scrollTop, clientHeight, scrollHeight } = document.documentElement
  if (scrollTop + clientHeight >= scrollHeight - 100) {
    console.log('触底，请求下一页')
  }
}

window.addEventListener('scroll', throttle(loadMore, 500))
// 滚动过程中每 500ms 最多检查一次
```

### 5.4 按钮防重复提交（防抖立即执行版）

```js
const submitBtn = document.getElementById('submit')

const submit = debounce(function (data) {
  console.log('提交', data)
}, 2000) // immediate 默认 true

submitBtn.addEventListener('click', () => submit(formData))
// 第一次点击立刻提交，2 秒冷却期内点击全部忽略
```
## 六、应用场景速查表

| 场景 | 选择 | 原因 |
| --- | --- | --- |
| 搜索框输入联想 | 防抖 | 停止输入后再请求，减少无效请求 |
| 窗口 resize 计算布局 | 防抖 | 拖动结束算一次即可 |
| 按钮防重复提交 | 防抖（leading） | 立刻响应 + 冷却时间 |
| 表单输入实时校验 | 防抖 | 停止输入再校验 |
| 滚动加载更多 / 懒加载 | 节流 | 滚动过程中按频率检查 |
| 拖拽时更新位置 | 节流 | 高频事件按固定频率执行 |
| 鼠标跟随动画 | 节流 | 每帧/固定间隔更新 |
| 视频播放进度上报 | 节流 | 固定间隔上报 |

## 七、常见坑

### 坑 1：忘了闭包保存 timer

```js
// 错误：timer 是局部变量，每次调用都新建，无法重置
function debounce(fn, delay) {
  return function (...args) {
    let timer = null // 每次 return 的函数调用都重新创建！
    clearTimeout(timer)
    timer = setTimeout(() => fn(...args), delay)
  }
}
```

timer 必须定义在**外层函数作用域**，被闭包保留。

### 坑 2：丢失 this

```js
// 偷懒写法：fn(...args) 丢 this
timer = setTimeout(() => fn(...args), delay)
// 严格写法：
timer = setTimeout(() => fn.apply(this, args), delay)
```

### 坑 3：React 中直接在组件里定义防抖函数

组件每次渲染都生成新的 debounced 函数，定时器无法跨次共享。应使用 `useRef` 保存或 `useMemo` / 自定义 Hook（如 `useDebounce`）。

### 坑 4：组件销毁不清理

用完记得 `cancel()`，否则定时器回调可能在组件卸载后执行。

## 八、高频面试题速答

| 问题 | 参考答案 |
| --- | --- |
| 防抖和节流的区别？ | 防抖：重置计时，只执行最后一次；节流：固定频率执行一次 |
| 共同解决什么问题？ | 高频事件导致的性能问题（重复计算 / 重复请求） |
| 怎么保证 this 和参数？ | 箭头函数 + `fn.apply(this, args)` 透传 |
| 防抖定时器为什么要存在闭包里？ | 多次调用共享同一个 timer，才能实现重置 |
| 时间戳版和定时器版节流的区别？ | 前者首次立即执行、结束不补；后者首次延迟、结束补执行 |
| 按钮防重复点击用哪个？ | 防抖立即执行版（leading） |

## 九、速记卡

```text
1. 防抖 = 只执行最后一次（clearTimeout + 重置）
2. 节流 = 固定频率执行一次（时间差判断 / 定时器占位）
3. 基础防抖：闭包 timer + clearTimeout + apply(this, args)
4. 时间戳节流：首次立即、末次不补
5. 定时器节流：首次延迟、末次补执行
6. 场景口诀：搜索 resize 用防抖，滚动拖拽用节流
```
