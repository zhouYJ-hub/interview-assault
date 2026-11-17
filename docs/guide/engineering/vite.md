# Vite 深度专题

> 面试频率：⭐⭐⭐⭐⭐（新项目必考）| 10 道核心题，每题深度讲解

## Q1：Vite 为什么快？（<span class="hot">超高频</span>）

### 核心原理

**开发环境不打包**——这是 Vite 和 Webpack 最本质的区别。

```text
┌──────────────────────────────────────────────────────────┐
│                Webpack 开发模式                             │
│                                                           │
│  启动 -> 从入口递归打包「所有」模块 -> 输出 bundle            │
│       -> 启动 Dev Server -> 浏览器加载                      │
│                                                           │
│  项目越大 -> 递归越深 -> 打包越久 -> 启动越慢                 │
│  （1000 个模块 = 全部编译完才能启动）                         │
│  典型：30s ~ 几分钟                                         │
└──────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────┐
│                Vite 开发模式                                │
│                                                           │
│  启动 -> 只做预构建（esbuild 极速处理 node_modules）          │
│       -> 立即启动 Dev Server（不需要打包业务代码）             │
│                                                           │
│  浏览器请求 /src/App.vue                                   │
│       -> Vite 即时编译「这一个文件」返回                      │
│       -> 浏览器原生 ESM 逐个 import                         │
│                                                           │
│  按需加载：用到哪个模块才编译哪个                             │
│  启动速度与项目大小「无关」-> 永远亚秒级                      │
│  典型：300ms                                               │
└──────────────────────────────────────────────────────────┘
```

### 三个层面的快

| 层面 | 技术手段 | 效果 |
| --- | --- | --- |
| **预构建快** | esbuild（Go 编写，多线程） | 处理 node_modules 比 Webpack 快 10-100 倍 |
| **启动快** | 不打包业务代码，按需编译 | 启动时间与项目大小无关 |
| **HMR 快** | 只编译修改的文件即时推送 | 热更新速度永远毫秒级 |

### 面试回答（总-分）

> **总起**：Vite 快在三个层面——预构建、启动、热更新。
>
> **第一，预构建用 esbuild。** node_modules 里的 CJS 包（react/lodash）需要转成 ESM——Vite 用 Go 编写的 esbuild 处理，比 JavaScript 编写的 Webpack 快 10 到 100 倍。
>
> **第二，启动不打包。** Webpack 要全量打包完才能启动，Vite 利用浏览器原生 ESM——启动时只做预构建，业务代码不打包，浏览器请求哪个模块就即时编译哪个。
>
> **第三，HMR 与项目大小无关。** Webpack 的 HMR 需要重新打包受影响的 chunk，模块多了就慢；Vite 只编译修改的那一个文件直接 WebSocket 推送，永远毫秒级。

---

## Q2：Vite 和 Webpack 的区别与选型？（<span class="hot">超高频</span>）

| 对比项 | Webpack | Vite |
| --- | --- | --- |
| 开发启动 | 全量打包，项目大慢 | **不打包**，亚秒级 |
| HMR 速度 | 与项目大小相关 | **恒定毫秒级** |
| 预构建 | 无 | esbuild（Go，极快） |
| 生产构建 | 自身打包 | **Rollup**（Tree-shaking 更优） |
| 配置复杂度 | 高（大量 loader/plugin） | 低（开箱即用） |
| 浏览器原生 ESM | 不用 | **核心依赖** |
| 生态 | 极其成熟（10年+） | 快速成熟中 |
| CSS 预处理 | 需要 sass-loader 等 | **内置支持** SCSS/Less |
| TS 支持 | 需要 ts-loader/fork-ts-checker | **内置支持** |
| 适合 | 老项目、复杂定制 | **新项目首选** |

### 面试回答（总-分）

> **总起**：核心差异在开发模式——Webpack 全量打包后启动，Vite 按需编译即启即用。
>
> **第一，开发体验。** Webpack 项目越大启动越慢；Vite 启动时间与项目大小无关，HMR 恒定毫秒级——这是浏览器原生 ESM 按需加载带来的。
>
> **第二，生产构建。** Vite 用 Rollup 而不是 Webpack——Rollup 的 Tree Shaking 和产物质量更优，输出的 JS 更小。
>
> **第三，选型。** 新项目无脑 Vite；老项目用 Webpack 没必要迁移——除非有性能瓶颈。两者也可以共存（微前端场景主应用 Webpack + 子应用 Vite）。

---

## Q3：Vite 的预构建（Pre-bundling）？

### 为什么需要预构建

```text
问题一：CJS 包不兼容 ESM
  node_modules 里的 react/lodash 是 CommonJS 格式
  浏览器原生 ESM 只认 import/export
  -> 必须把 CJS 转成 ESM

问题二：请求瀑布流
  lodash-es 有 600+ 个模块文件
  如果不预构建 -> 浏览器发 600+ 个请求逐个 import
  -> 网络开销巨大
  -> 预构建成一个文件 = 1 个请求
```

### 怎么做的

```js
// vite.config.js —— 自定义预构建
export default {
  optimizeDeps: {
    include: ['lodash-es', 'axios'],   // 强制预构建
    exclude: ['@my/local-package']     // 排除（本地包不需要）
  }
}

// 预构建结果缓存在 node_modules/.vite/ 目录
// 依赖不变 -> 直接用缓存（秒启动）
// lock 文件或 vite.config 变了 -> 自动重新预构建
```

**为什么用 esbuild 不用 Webpack 做预构建**：

| | esbuild | Webpack |
| --- | --- | --- |
| 语言 | **Go（编译为机器码）** | JavaScript |
| 并行 | 原生多线程 | 单线程（JS 限制） |
| 速度 | **快 10-100 倍** | 基准 |

---

## Q4：Vite 插件机制？

### 是什么

Vite 插件 = **Rollup 插件超集** + Vite 特有钩子。

```js
// vite-plugin-my-plugin.js —— 手写一个简单插件
export default function myPlugin() {
  return {
    name: 'my-plugin',

    // Vite 特有钩子：配置开发服务器
    configureServer(server) {
      server.middlewares.use('/api/mock', (req, res) => {
        res.end(JSON.stringify({ mock: true }))
      })
    },

    // Rollup 兼容钩子：转换模块代码
    transform(code, id) {
      if (id.endsWith('.md')) {
        // 把 .md 文件转成 Vue 组件
        return `export default ${JSON.stringify(code)}`
      }
    },

    // Rollup 兼容钩子：生成产物时触发
    generateBundle(options, bundle) {
      console.log('产物文件：', Object.keys(bundle))
    }
  }
}

// vite.config.js 使用
import { defineConfig } from 'vite'
import myPlugin from './vite-plugin-my-plugin'

export default defineConfig({
  plugins: [vue(), myPlugin()]
})
```

### 常用插件

| 插件 | 作用 |
| --- | --- |
| @vitejs/plugin-vue | Vue 3 单文件组件支持 |
| @vitejs/plugin-react | React JSX 支持 |
| vite-plugin-compression | Gzip/Brotli 压缩产物 |
| unplugin-auto-import | 自动导入 API（ref/computed） |
| unplugin-vue-components | 组件自动注册 |
| vite-plugin-svg-icons | SVG 雪碧图 |
| vite-plugin-pwa | PWA 支持 |

---

## Q5：Vite 生产构建为什么用 Rollup？

| 对比 | Webpack | Rollup |
| --- | --- | --- |
| 设计定位 | 应用打包（功能全） | **库打包（产物优）** |
| Tree Shaking | 支持 | **更彻底**（基于 ESM 分析更精确） |
| 产物质量 | 有 Webpack 运行时开销 | **纯净（无运行时注入）** |
| 代码分割 | 支持 | 支持 |
| HMR | 支持 | 不支持（所以开发时不用） |

**Vite 的策略**：开发用原生 ESM（快），生产用 Rollup（产物好）——两全其美。

---

## Q6：Vite HMR 原理？

```text
┌─────────────────────────────────────────────────────┐
│              Vite HMR 完整流程                        │
│                                                     │
│  1. chokidar 监听文件变化                             │
│          |                                          │
│  2. 文件修改 -> Vite 即时编译这一个文件                  │
│          |    （.vue -> 拆分 script/template/style）   │
│          |                                          │
│  3. 通过 WebSocket 推送消息给浏览器                     │
│          |    { type: 'update', updates: [...] }      │
│          |                                          │
│  4. 浏览器 HMR Client 收到消息                        │
│          |                                          │
│  5. 动态 import 新模块 + 执行 accept 回调              │
│          |                                          │
│  6. 效果：                                            │
│     - Vue 组件：替换组件实例 -> 保留状态（count 不丢）    │
│     - CSS：替换 style 标签内容 -> 无感更新              │
│     - JS 模块：整页刷新（没配 accept 的话）             │
└─────────────────────────────────────────────────────┘
```

**和 Webpack HMR 的关键区别**：Webpack 要重新打包受影响的 chunk；Vite 只编译修改的那一个文件直接推送——**HMR 速度与项目大小无关**。

---

## Q7：Vite 常用配置详解？

```js
// vite.config.ts
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'path'

export default defineConfig({
  // 插件
  plugins: [vue()],

  // 路径别名（等同 webpack alias）
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src')
    }
  },

  // CSS 预处理器
  css: {
    preprocessorOptions: {
      scss: {
        additionalData: `@import "@/styles/variables.scss";`
        // 全局注入变量文件，不用每个文件手动 @import
      }
    }
  },

  // 开发服务器
  server: {
    port: 3000,
    open: true,         // 自动打开浏览器
    proxy: {            // 代理（解决开发跨域）
      '/api': {
        target: 'https://backend.example.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, '')
      }
    }
  },

  // 构建配置
  build: {
    outDir: 'dist',
    sourcemap: false,      // 生产不生成 sourcemap
    rollupOptions: {
      output: {
        manualChunks: {    // 手动分包
          vendor: ['vue', 'vue-router', 'pinia'],
          utils: ['axios', 'dayjs']
        }
      }
    }
  }
})
```

---

## Q8：Vite 环境变量（.env）？

```bash
# .env                所有环境加载
VITE_APP_TITLE = My App

# .env.development    仅 dev 加载（npm run dev）
VITE_API_URL = http://localhost:3000

# .env.production     仅 build 加载（npm run build）
VITE_API_URL = https://api.example.com
```

```js
// 代码中使用（必须 VITE_ 开头才能暴露给客户端）
console.log(import.meta.env.VITE_API_URL)

// import.meta.env 内置变量：
// MODE: 'development' | 'production'
// BASE_URL: '/'
// DEV: boolean
// PROD: boolean
// SSR: boolean
```

**安全注意**：只有 `VITE_` 前缀的变量才会暴露给浏览器——**API 密钥等敏感信息绝不能加 VITE_ 前缀**。

---

## Q9：Vite 怎么解决开发跨域？

```js
// vite.config.js —— proxy 配置
export default {
  server: {
    proxy: {
      '/api': {
        target: 'https://backend.example.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, '')
      }
    }
  }
}

// 原理：
// 浏览器请求 localhost:3000/api/user（同源，不跨域）
//   -> Vite Dev Server 收到请求
//   -> 代理转发到 https://backend.example.com/user
//   -> 后端响应返回给 Vite -> Vite 转给浏览器
//
// 浏览器全程只跟 Vite 通信（同源），不存在跨域
// 跨域问题被「转移」到了服务器之间（服务器无同源策略）
```

---

## Q10：Vite 的浏览器原生 ESM 机制？

```html
<!-- 浏览器收到的 HTML（Vite 开发模式） -->
<script type="module" src="/src/main.js"></script>

<!-- main.js 里的 import 语句被浏览器原生解析 -->
<!-- main.js -->
import { createApp } from '/node_modules/.vite/vue.js'  // 预构建产物
import App from '/src/App.vue'                            // 即时编译

<!-- 浏览器逐个请求这些模块（HTTP/2 并行） -->
<!-- Vite 中间件拦截请求 -> 即时编译 -> 返回编译结果 -->
```

**这就是 Vite 不需要打包的原因**：现代浏览器原生支持 `<script type="module">` 和 import 语句——Vite 只需要**即时编译每个请求的文件**，不需要先打包成 bundle。

## 本篇速答

| 问题 | 答案 |
| --- | --- |
| Vite 为什么快？ | 开发不打包（原生ESM按需）+ esbuild 预构建 + HMR 恒定毫秒 |
| 预构建做什么？ | CJS 转 ESM + 合并请求（600个文件变1个） |
| 为什么用 esbuild？ | Go 编写多线程，比 JS 快 10-100 倍 |
| 生产为什么用 Rollup？ | Tree Shaking 更彻底 + 产物更纯净无运行时 |
| HMR 为什么与项目大小无关？ | 只编译修改的一个文件，不重新打包 chunk |
| 环境变量怎么用？ | .env 文件 + VITE_ 前缀 + import.meta.env |
| 跨域怎么解决？ | server.proxy 代理，浏览器只跟 Vite 通信 |
| 浏览器怎么加载模块？ | script type=module + 原生 import 逐个请求 |
