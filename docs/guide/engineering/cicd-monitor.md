# CI/CD 与监控篇（Q19 - Q25）

> 覆盖：CI/CD 流程、测试、错误监控、性能监控、微前端、组件库、SSR

## Q19：CI/CD 完整流程？（<span class="hot">高频</span>）

```text
完整流水线（以 GitLab CI 为例）：

开发者 push 代码
    |
    v
┌──────────────────────────────────────────┐
│  CI（持续集成）                             │
│                                           │
│  Stage 1: Install    -> npm ci            │
│  Stage 2: Lint       -> eslint + prettier │
│  Stage 3: Test       -> vitest --coverage │
│  Stage 4: Build      -> vite build        │
│                                           │
│  任一 Stage 失败 -> 阻止合并               │
└──────────────────────┬───────────────────┘
                       | 全部通过
                       v
                  Merge to main
                       |
                       v
┌──────────────────────────────────────────┐
│  CD（持续部署）                             │
│                                           │
│  自动部署到测试环境 -> 自动跑 E2E           │
│  -> 手动确认 -> 部署生产                    │
└──────────────────────────────────────────┘
```

```yaml
# .gitlab-ci.yml
stages:
  - install
  - lint
  - test
  - build
  - deploy

install:
  stage: install
  script: npm ci
  cache:
    paths: [node_modules/]

lint:
  stage: lint
  script: npm run lint

test:
  stage: test
  script: npm run test

build:
  stage: build
  script: npm run build
  artifacts:
    paths: [dist/]

deploy:
  stage: deploy
  script: rsync -avz dist/ server:/var/www/app
  only: [main]      # 只有 main 分支部署
```

**面试回答**：CI 是提交后自动执行 lint/test/build 保证代码质量；CD 是合并后自动部署到测试/生产环境。核心价值——**早发现问题、快速交付、减少人为失误**。

---

## Q20：前端测试金字塔？

```text
        /  E2E  \           10%  模拟真实用户操作（慢、贵）
       /─────────\
      / 集成测试  \          20%  多组件协作是否正确
     /───────────\
    /  单元测试    \         70%  纯函数/composable/store（快、便宜）
   /──────────────\
```

```js
// Vitest 单元测试示例（语法同 Jest）
import { describe, it, expect } from 'vitest'
import { useCounter } from './useCounter'

describe('useCounter', () => {
  it('increments count', () => {
    const { count, increment } = useCounter()
    increment()
    expect(count.value).toBe(1)
  })
})

// Vue 组件测试（@vue/test-utils）
import { mount } from '@vue/test-utils'
import Counter from './Counter.vue'

it('renders count', () => {
  const wrapper = mount(Counter)
  expect(wrapper.text()).toContain('0')
})
```

---

## Q21：前端错误监控方案？（<span class="hot">高频</span>）

```js
// ====== 1. JS 运行时错误 ======
window.onerror = (msg, url, line, col, error) => {
  reportError({ type: 'js', msg, url, line, col, stack: error?.stack })
}

// ====== 2. Promise 未捕获异常 ======
window.addEventListener('unhandledrejection', (e) => {
  reportError({ type: 'promise', reason: e.reason?.message })
})

// ====== 3. 资源加载失败（图片/CSS/JS） ======
window.addEventListener('error', (e) => {
  if (e.target !== window) {  // 资源错误不冒泡，用捕获
    reportError({ type: 'resource', tag: e.target.tagName, url: e.target.src })
  }
}, true)  // 第三个参数 true = 捕获阶段

// ====== 4. 接口异常（拦截 fetch/XHR） ======
const originalFetch = window.fetch
window.fetch = async (...args) => {
  const res = await originalFetch(...args)
  if (!res.ok) reportError({ type: 'api', url: args[0], status: res.status })
  return res
}

// ====== 5. 上报函数 ======
function reportError(data) {
  // 用 sendBeacon 不阻塞页面（页面关闭也能发出去）
  navigator.sendBeacon('/api/error-report', JSON.stringify({
    ...data,
    ua: navigator.userAgent,
    url: location.href,
    ts: Date.now()
  }))
}
```

**SourceMap 反解**：生产代码是压缩过的——上传 SourceMap 到监控平台（如 Sentry），报错的压缩堆栈自动还原成源码位置。

---

## Q22：前端性能监控（Web Vitals）？

```js
// web-vitals 库（Google 官方）
import { onLCP, onINP, onCLS, onFCP, onTTFB } from 'web-vitals'

function sendMetric(metric) {
  navigator.sendBeacon('/api/vitals', JSON.stringify({
    name: metric.name,
    value: metric.value,
    rating: metric.rating  // 'good' | 'needs-improvement' | 'poor'
  }))
}

onLCP(sendMetric)   // 最大内容绘制（< 2.5s 为 good）
onINP(sendMetric)   // 交互到下一帧（< 200ms 为 good）
onCLS(sendMetric)   // 累积布局偏移（< 0.1 为 good）
onFCP(sendMetric)   // 首次内容绘制
onTTFB(sendMetric)  // 首字节时间
```

---

## Q23：微前端原理与实践？

**是什么**：多个独立的前端应用组合成一个整体——各团队独立开发、独立部署。

```text
主应用（Shell/Container）
├── 子应用A（Vue 3，独立仓库）
├── 子应用B（React 18，独立仓库）
└── 子应用C（老项目 jQuery，独立仓库）
```

**核心问题与方案**：

| 问题 | 方案 | 代表框架 |
| --- | --- | --- |
| JS 沙箱隔离 | Proxy 代理 window | qiankun |
| CSS 隔离 | Shadow DOM / scoped | qiankun / 无界 |
| 路由分发 | 拦截 URL 变化加载对应子应用 | qiankun |
| 通信 | CustomEvent / SharedState | qiankun（initGlobalState） |
| 公共依赖 | externals + CDN 共享 | manual |

**qiankun 快速上手**：

```js
// 主应用注册
import { registerMicroApps, start } from 'qiankun'

registerMicroApps([
  {
    name: 'vue-app',
    entry: '//localhost:7100',    // 子应用地址
    container: '#subapp',          // 挂载容器
    activeRule: '/vue',            // 路由匹配规则
  },
  {
    name: 'react-app',
    entry: '//localhost:7200',
    container: '#subapp',
    activeRule: '/react',
  }
])
start()
```

---

## Q24：组件库从 0 到 1？

```text
技术选型：
  构建 -> vite + vite-plugin-lib（打包 ES/CJS/UMD）
  样式 -> SCSS 变量 + BEM 命名
  文档 -> vitepress / storybook
  测试 -> vitest + @vue/test-utils
  发布 -> npm + changesets（版本管理）

目录结构：
  my-ui/
  ├── src/
  │   ├── components/
  │   │   ├── Button/
  │   │   │   ├── index.ts        # 导出
  │   │   │   ├── Button.vue      # 组件
  │   │   │   └── Button.test.ts  # 测试
  │   │   └── index.ts            # 统一导出所有组件
  │   ├── styles/                  # 全局样式/主题变量
  │   │   └── variables.scss
  │   └── index.ts                 # 库入口
  ├── package.json
  └── vite.config.ts               # 库模式构建配置
```

```json
// package.json 关键配置
{
  "name": "@my/ui",
  "main": "./dist/ui.js",
  "module": "./dist/ui.mjs",
  "sideEffects": ["**/*.css"],    // CSS 有副作用不能 Tree Shaking
  "peerDependencies": { "vue": "^3.0.0" }  // 避免 Vue 重复打包
}
```

---

## Q25：SSR / SSG / BFF？

```text
SSR（服务端渲染）：
  服务端把 Vue 组件渲染成 HTML 字串返回 -> 浏览器显示
  -> 首屏快（不用等 JS 下载执行）、SEO 好
  -> 代表：Nuxt 3

SSG（静态站点生成）：
  构建时预渲染所有页面成静态 HTML -> CDN 直接返回
  -> 最快最省，但内容固定（构建时确定）
  -> 代表：VitePress、Next.js（export）

BFF（Backend for Frontend）：
  前端和后端之间的中间层 -> 前端自己写
  -> 聚合多个微服务接口、裁剪数据、缓存
  -> 减少前端请求数、按需返回数据

CSR vs SSR 对比：
  CSR: 请求 -> 返回空 HTML -> 下载 JS -> 执行 -> 渲染 -> 可交互
  SSR: 请求 -> 服务端渲染 -> 返回含内容HTML -> 立即可见 -> 水合(hydrate) -> 可交互
```

## 本篇速答

| 问题 | 答案 |
| --- | --- |
| CI 和 CD 区别？ | CI 自动测试构建保质量；CD 自动部署到环境 |
| lint-staged 检查什么文件？ | 只检查 Git 暂存区（staged）文件 |
| 前端错误监控用什么 API？ | onerror + unhandledrejection + 资源 error 捕获 |
| 怎么上报不阻塞页面？ | navigator.sendBeacon |
| Web Vitals 三个核心指标？ | LCP（最大内容）/ INP（交互响应）/ CLS（布局偏移） |
| 微前端解决什么？ | 多团队独立开发部署 -> JS/CSS 沙箱 + 路由分发 |
| qiankun 沙箱原理？ | Proxy 代理 window，子应用操作被拦截 |
| SSR 首屏为什么快？ | 服务端返回含内容的 HTML，不等 JS 下载执行 |
