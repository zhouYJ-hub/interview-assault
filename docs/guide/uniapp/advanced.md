# UniApp 进阶篇（Q9 - Q15）

> 覆盖：条件编译、请求封装、分页、状态管理、登录支付、nvue

## Q9：条件编译怎么用？（<span class="hot">超高频</span>）

**答案**：同一份代码写平台专属逻辑，**编译时只打包对应平台**——这是处理多端差异的正确方式。

```vue
<template>
  <view>
    <!-- #ifdef MP-WEIXIN -->
    <button open-type="share">微信分享</button>
    <!-- #endif -->
    <!-- #ifdef H5 -->
    <view>H5 专属内容</view>
    <!-- #endif -->
  </view>
</template>

<script>
export default {
  methods: {
    pay() {
      // #ifdef MP-WEIXIN
      uni.requestPayment({ provider: 'wxpay' })
      // #endif
      // #ifdef MP-ALIPAY
      uni.requestPayment({ provider: 'alipay' })
      // #endif
    }
  }
}
</script>

<style>
/* #ifdef H5 */
.header { padding-top: 44px; } /* H5 有浏览器导航 */
/* #endif */
</style>
```

**常用平台标识**：

| 标识 | 平台 |
| --- | --- |
| H5 | 网页 |
| MP-WEIXIN | 微信小程序 |
| MP-ALIPAY | 支付宝小程序 |
| APP-PLUS | App（5+ App） |
| MP | 所有小程序 |

**为什么不用运行时 `if (platform)` 判断**：`#ifdef` 是**编译期裁剪**——其他平台的代码根本不进包；运行时 if 会全量打包，体积大且可能在小程序端调用到不存在的 API 报错。

## Q10：uni.request 怎么封装？（<span class="hot">超高频</span>）

```js
// utils/request.js
const BASE_URL = 'https://api.example.com'

// loading 计数：并发请求只显示一次加载框
let loadingCount = 0
const showLoading = () => {
  if (loadingCount === 0) uni.showLoading({ title: '加载中', mask: true })
  loadingCount++
}
const hideLoading = () => {
  if (loadingCount <= 1) uni.hideLoading()
  loadingCount = Math.max(0, loadingCount - 1)
}

const request = (options = {}) => {
  return new Promise((resolve, reject) => {
    showLoading()
    uni.request({
      url: BASE_URL + options.url,
      method: options.method || 'GET',
      data: options.data || {},
      header: {
        // 自动携带 token
        Authorization: uni.getStorageSync('token') || '',
        ...options.header
      },
      success: (res) => {
        if (res.data.code === 0) {
          resolve(res.data.data)              // 业务成功
        } else if (res.data.code === 401) {
          uni.removeStorageSync('token')       // 登录过期
          uni.reLaunch({ url: '/pages/login/login' })
          reject(res.data)
        } else {
          uni.showToast({ title: res.data.msg || '请求失败', icon: 'none' })
          reject(res.data)
        }
      },
      fail: (err) => {
        uni.showToast({ title: '网络异常', icon: 'none' }) // 断网/超时
        reject(err)
      },
      complete: () => hideLoading()
    })
  })
}
export default request
```

```js
// 业务使用
import request from '@/utils/request'
export const login = (data) => request({ url: '/login', method: 'POST', data })
```

**封装要点（面试口述）**：Promise 化统一 then/catch、loading 计数防闪烁、token 自动注入、401 统一拦截跳登录、错误统一 toast——思路等同 axios 拦截器。

## Q11：上拉加载 / 下拉刷新

```js
export default {
  data() {
    return { list: [], page: 1, hasMore: true }
  },
  methods: {
    async loadList() {
      if (!this.hasMore) return
      const res = await request({
        url: '/goods/list',
        data: { page: this.page, size: 10 }
      })
      // 分页核心：第一页替换，后续追加
      this.list = this.page === 1 ? res.list : [...this.list, ...res.list]
      this.hasMore = res.list.length === 10  // 不满一页说明到底了
      this.page++
    }
  },
  onReachBottom() {         // 上拉触底自动触发
    this.loadList()
  },
  async onPullDownRefresh() { // 需在 pages.json 开启 enablePullDownRefresh
    this.page = 1
    this.hasMore = true
    await this.loadList()
    uni.stopPullDownRefresh()  // 必须手动停止，否则一直转圈
  }
}
```

```json
// pages.json 中开启下拉刷新
{ "path": "pages/index/index", "style": { "enablePullDownRefresh": true } }
```

## Q12：状态管理 + 持久化

**简单场景**：`getApp().globalData`（App.vue 定义）。

**正式方案**：Pinia + Storage 双写持久化：

```js
// stores/user.js
import { defineStore } from 'pinia'

export const useUserStore = defineStore('user', {
  state: () => ({
    // 初始化时从 storage 恢复（实现持久化）
    token: uni.getStorageSync('token') || '',
    userInfo: uni.getStorageSync('userInfo') || null
  }),
  actions: {
    async login(data) {
      const res = await request({ url: '/login', method: 'POST', data })
      this.token = res.token
      this.userInfo = res.user
      // 同步写入 storage（下次打开还在）
      uni.setStorageSync('token', res.token)
      uni.setStorageSync('userInfo', res.user)
    },
    logout() {
      this.token = ''
      this.userInfo = null
      uni.removeStorageSync('token')
      uni.removeStorageSync('userInfo')
    }
  }
})
```

**为什么不用 storage 直接共享**：小程序是双线程（逻辑层/视图层），storage 读写是异步且不会触发响应式更新——**响应式共享必须靠状态管理库**。

## Q13：微信登录完整流程（<span class="hot">高频</span>）

```text
1. 前端 uni.login() 拿临时 code（5 分钟有效、一次性）
2. 前端把 code 发给自己的后端
3. 后端拿 code + AppSecret 调微信接口
   -> 换取 openid（用户唯一标识）+ session_key
4. 后端按 openid 查/建用户 -> 生成自己的 token
5. 前端存 token，之后请求自动携带
```

```js
async wxLogin() {
  // 1. 拿 code
  const { code } = await uni.login({ provider: 'weixin' })
  // 2. code 给后端（后端完成 3、4 步）
  const res = await request({
    url: '/auth/wx-login',
    method: 'POST',
    data: { code }
  })
  // 5. 存 token
  uni.setStorageSync('token', res.token)
}
```

**考点**：

1. **AppSecret 绝不能放前端**（等于把服务器密钥交出去）——所以必须后端换取；
2. code 只是换 openid 的凭证，登录态是后端发的自定义 token。

## Q14：支付完整流程（<span class="hot">高频</span>）

```text
1. 前端选商品 -> 调后端「创建订单」接口
2. 后端调微信统一下单 -> 返回支付参数
   （timeStamp / nonceStr / package / signType / paySign）
3. 前端 uni.requestPayment 调起收银台
4. 结果：前端 success 只做 UI 展示
   真实支付结果以微信服务器异步通知后端为准
```

```js
async pay(orderId) {
  // 1+2. 后端下单拿支付参数（签名必须后端做）
  const payParams = await request({
    url: '/order/pay',
    method: 'POST',
    data: { orderId }
  })
  // 3. 调起支付
  uni.requestPayment({
    provider: 'wxpay',
    timeStamp: payParams.timeStamp,
    nonceStr:  payParams.nonceStr,
    package:   payParams.package,
    signType:  'RSA',
    paySign:   payParams.paySign,
    success: () => uni.showToast({ title: '支付成功' }),
    fail:    () => uni.showToast({ title: '已取消', icon: 'none' })
  })
}
```

**考点**：支付参数必须后端生成（涉及商户密钥签名）；**不要信前端回调**——用户可能伪造，订单状态只能由后端收到微信异步通知后更新。

## Q15：nvue 和 vue 页面区别

| | vue 页面 | nvue 页面 |
| --- | --- | --- |
| 渲染方式 | 各端按自身方式（小程序原生/H5 DOM） | **App 端原生渲染**（weex 引擎） |
| 性能 | 够用 | 长列表/高频刷新更流畅 |
| CSS | 完整支持 | 子集（flex 为主，部分选择器不支持） |
| 场景 | 常规页面 | 直播弹幕、超长列表、复杂动画 |

**考点**：nvue 是 App 端的性能方案；全端项目通常用 vue 页面，性能热点局部用 nvue——不是整站 nvue。

## 本篇速答

| 问题 | 答案 |
| --- | --- |
| #ifdef 为什么优于运行时 if？ | 编译期裁剪，其他平台代码不进包 |
| request 封装核心？ | Promise + loading 计数 + token + 401 拦截 |
| 下拉刷新一直转圈？ | 忘了调 uni.stopPullDownRefresh |
| 登录态为什么要后端发？ | AppSecret 不能放前端；code 只是换 openid 的凭证 |
| 支付能信前端回调吗？ | 不能，以后端收到微信异步通知为准 |
| nvue 什么时候用？ | App 端长列表/弹幕等性能热点，不是整站用 |
