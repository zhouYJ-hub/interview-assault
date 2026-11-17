# Webpack 5 深度专题

> 面试频率：⭐⭐⭐⭐（老项目维护 + 中高级必考）| 10 道核心题，每题深度讲解

## Q1：Webpack 核心概念？（<span class="hot">高频</span>）

### 是什么

Webpack 是**静态模块打包器**——把项目中一切资源（JS/CSS/图片/字体）都视为模块，从入口出发递归构建**依赖图（Module Graph）**，最终输出浏览器可运行的静态资源。

### 五大核心概念

```js
// webpack.config.js
const path = require('path')
const HtmlWebpackPlugin = require('html-webpack-plugin')

module.exports = {
  // ① 入口：打包的起点（依赖图的根）
  entry: './src/index.js',

  // ② 输出：产物配置
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'js/[name].[contenthash:8].js',
    // contenthash：文件内容变 -> hash 变 -> 配合缓存策略
    clean: true  // Webpack 5 新增：自动清空 dist（替代 CleanWebpackPlugin）
  },

  // ③ Loader：处理非 JS 文件（文件转换器）
  module: {
    rules: [
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader', 'postcss-loader']
        // 链式调用，从右到左执行：
        // postcss 加前缀 -> css 解析 @import -> style 注入 DOM
      },
      {
        test: /\.(png|jpg|gif)$/,
        type: 'asset',           // Webpack 5 内置资源模块
        parser: { dataUrlCondition: { maxSize: 8 * 1024 } }
        // 小于 8KB 转 base64 内联，大于输出文件
      }
    ]
  },

  // ④ Plugin：扩展构建流程（比 Loader 能做的事多得多）
  plugins: [
    new HtmlWebpackPlugin({ template: './public/index.html' })
    // 自动生成 HTML 并注入打包后的 JS/CSS
  ],

  // ⑤ 模式
  mode: 'production'  // development / production / none
  // production 自动开启：压缩、Tree Shaking、Scope Hoisting
}
```

### 面试回答（总-分）

> **总起**：Webpack 五大核心概念——entry、output、loader、plugin、mode，本质是「从入口构建依赖图再打包」。
>
> **第一，entry 是起点**——Webpack 从这里递归找所有依赖模块，构建 ModuleGraph。
>
> **第二，output 控制产物**——filename 的 contenthash 让文件内容变则 URL 变，配合强缓存策略实现按需更新。
>
> **第三，loader 做文件转换**——Webpack 原生只认识 JS，CSS/图片/Vue 都需要对应 loader 转成 JS 模块。链式调用从右到左。
>
> **第四，plugin 做流程扩展**——基于 Tapable 事件流，可以介入编译的任何阶段（生成 HTML、压缩、拷贝、定义变量）。

---

## Q2：Loader 和 Plugin 的区别？（<span class="hot">超高频</span>）

### 本质区别

```text
Loader = 文件转换器               Plugin = 流程扩展器
┌─────────────────────┐          ┌─────────────────────────┐
│ 输入：文件源码字符串     │          │ 输入：compiler对象        │
│ 输出：JS模块字符串       │          │       （完整编译上下文）    │
│ 时机：模块解析阶段        │          │ 时机：构建生命周期任意阶段   │
│ 特点：单一职责、链式调用  │          │ 能力：可以改一切           │
└─────────────────────┘          └─────────────────────────┘

通俗理解：
  Loader 是流水线上的「加工工人」——给你原材料，你负责转成半成品
  Plugin 是车间里的「质检员/调度员」——监控整条流水线，随时介入
```

### 手写 Loader

```js
// loaders/remove-console.js —— 删除 console.log
module.exports = function (source) {
  // source 是文件的原始内容（字符串）
  return source.replace(/console\.log\(.*?\);?/g, '')
}

// webpack.config.js 中使用
module: {
  rules: [{
    test: /\.js$/,
    use: path.resolve('./loaders/remove-console.js')
  }]
}
```

**Loader 的执行顺序**：**从右到左、从下到上**——`use: ['style-loader', 'css-loader', 'sass-loader']` 先执行 sass 转 css，再 css 解析 import，最后 style 注入 DOM。

### 手写 Plugin

```js
// plugins/file-list-plugin.js —— 构建完成后生成文件清单
class FileListPlugin {
  constructor(options) {
    this.filename = options?.filename || 'filelist.md'
  }

  apply(compiler) {
    // compiler：Webpack 全局唯一的编译器实例
    // hooks：Tapable 提供的事件钩子（生命周期）

    // emit 钩子：即将输出文件到 dist 目录
    compiler.hooks.emit.tapAsync('FileListPlugin', (compilation, callback) => {
      // compilation：本次编译的上下文（包含所有模块、资源）

      let content = '# Build File List\n\n'
      for (const filename of Object.keys(compilation.assets)) {
        content += `- ${filename}\n`
      }

      // 往产物中添加一个新文件
      compilation.assets[this.filename] = {
        source: () => content,
        size: () => content.length
      }

      callback()
    })
  }
}

module.exports = FileListPlugin
```

### 面试回答（总-分）

> **总起**：一句话——Loader 管文件转换，Plugin 管流程扩展，能力和介入范围完全不同。
>
> **第一，Loader 是单一职责的转换函数。** 输入文件字符串、输出 JS 模块，在模块解析阶段触发。链式调用从右到左，每个 Loader 只做一件事（sass-loader 只管 SCSS 转 CSS）。
>
> **第二，Plugin 是基于 Tapable 事件流的扩展。** 通过 apply(compiler) 拿到编译器实例，在 emit、optimize、afterEmit 等钩子上注册回调——可以介入构建的任何阶段，改产物、优化模块、生成额外文件。
>
> **第三，选型口诀。** 需要转文件格式用 Loader（.vue/.scss/.ts），需要改构建流程用 Plugin（生成 HTML/压缩/拷贝/定义变量）。

---

## Q3：Webpack 构建流程（原理）？

```text
┌──────────────────────────────────────────────────────────┐
│                  Webpack 构建完整流程                       │
│                                                           │
│  1. 初始化参数                                              │
│     合并配置文件 + shell 参数 -> 得到最终配置对象               │
└────────────────────────┬─────────────────────────────────┘
                         |
┌────────────────────────v─────────────────────────────────┐
│  2. 开始编译                                               │
│     创建 Compiler 对象 -> 注册所有 Plugin -> 执行 run         │
└────────────────────────┬─────────────────────────────────┘
                         |
┌────────────────────────v─────────────────────────────────┐
│  3. 确定入口                                               │
│     根据 entry 配置找到所有入口文件                            │
└────────────────────────┬─────────────────────────────────┘
                         |
┌────────────────────────v─────────────────────────────────┐
│  4. 编译模块（最核心的步骤）                                  │
│                                                           │
│     从入口出发 -> 读取文件内容                                │
│       -> 匹配 Loader 规则 -> 调用 Loader 转换                │
│       -> 用 acorn 解析成 AST                                │
│       -> 遍历 AST 找到 import/require 依赖                   │
│       -> 递归处理每个依赖模块                                  │
│       -> 递归完成 -> 得到 ModuleGraph（依赖图）               │
└────────────────────────┬─────────────────────────────────┘
                         |
┌────────────────────────v─────────────────────────────────┐
│  5. 完成编译                                               │
│     根据依赖图组装 Chunk -> 再把 Chunk 转成 Bundle           │
│     （optimization 阶段：Tree Shaking/压缩/代码分割）         │
└────────────────────────┬─────────────────────────────────┘
                         |
┌────────────────────────v─────────────────────────────────┐
│  6. 输出文件                                               │
│     根据 output 配置写入文件系统（emit 钩子）                   │
└──────────────────────────────────────────────────────────┘
```

---

## Q4：Webpack 5 新特性？

| 特性 | 说明 | 面试要点 |
| --- | --- | --- |
| **持久化缓存** | `cache: { type: 'filesystem' }` | 二次构建只编译变化的模块，**速度提升 90%+** |
| **模块联邦** | 多个独立构建的 应用共享模块 | 微前端的一种实现方式 |
| **资源模块** | `type: 'asset'` 替代 file-loader/url-loader | 不再需要额外 Loader |
| **Tree Shaking 增强** | 嵌套的无用导出也能摇掉 | 支持 CommonJS 的部分分析 |
| **顶层 await** | 模块顶层可以使用 await | 异步初始化更简洁 |

```js
// 模块联邦示例：主应用远程加载子应用的模块
// 子应用（提供方）
new ModuleFederationPlugin({
  name: 'components',
  filename: 'remoteEntry.js',
  exposes: {
    './Button': './src/Button.vue'  // 暴露按钮组件
  }
})

// 主应用（消费方）
new ModuleFederationPlugin({
  remotes: {
    components: 'components@http://localhost:3001/remoteEntry.js'
  }
})

// 主应用代码里直接 import 子应用的组件
import Button from 'components/Button'
```

---

## Q5：Webpack 性能优化？（<span class="hot">高频</span>）

### 构建速度优化

```js
module.exports = {
  // ① 持久化缓存（效果最显著）
  cache: {
    type: 'filesystem',
    buildDependencies: { config: [__filename] }
    // 配置文件变了缓存失效
  },

  // ② 缩小 Loader 处理范围
  module: {
    rules: [{
      test: /\.js$/,
      include: path.resolve('src'),       // 只处理 src
      exclude: /node_modules/,            // 排除三方库
      use: 'babel-loader'
    }]
  },

  // ③ 减少 resolve 搜索范围
  resolve: {
    extensions: ['.js', '.vue'],  // 不要放太多后缀
    alias: { '@': path.resolve('src') },
    modules: [path.resolve('node_modules')]  // 指定查找位置
  },

  // ④ 多线程打包（大项目）
  module: {
    rules: [{
      test: /\.js$/,
      use: [
        { loader: 'thread-loader' },    // 开启 worker 池
        { loader: 'babel-loader' }
      ]
    }]
  }
}
```

### 产物体积优化

```js
module.exports = {
  // ① 代码分割
  optimization: {
    splitChunks: {
      chunks: 'all',
      cacheGroups: {
        vendor: {
          test: /[\\/]node_modules[\\/]/,
          name: 'vendors',
          priority: 10       // 三方库独立打包（利用浏览器缓存）
        }
      }
    }
  },

  // ② 外部化（CDN 引入不打包）
  externals: {
    vue: 'Vue',              // import vue from 'vue' 不打包
    'vue-router': 'VueRouter' // 页面通过 script 标签引入
  },

  // ③ 压缩（production 自动开启）
  optimization: {
    minimize: true,
    minimizer: [new TerserPlugin()],   // JS 压缩
    // CSS 压缩用 CssMinimizerPlugin
  }
}
```

### 面试回答（总-分）

> **总起**：Webpack 优化分构建速度和产物体积两个方向。
>
> **构建速度五板斧**：第一，`cache: { type: 'filesystem' }` 持久化缓存——二次构建只编译变化模块，效果最显著；第二，include/exclude 缩小 Loader 范围——node_modules 不走 babel；第三，resolve 缩小搜索范围——extensions 别放太多；第四，thread-loader 多线程——babel/ts 转换并行；第五，DllPlugin 预编译——第三方库只编译一次（Webpack 5 缓存已部分替代）。
>
> **产物体积三板斧**：第一，splitChunks 分包——vendor 独立利用缓存；第二，externals + CDN——vue/vue-router 不打进包；第三，动态 import 懒加载——路由级别按需下载。

---

## Q6：Tree Shaking 原理与 sideEffects？

### 前提条件

```text
1. 必须是 ESM（import/export）
   -> CJS 的 require 是运行时执行，无法静态分析

2. package.json 配 sideEffects: false
   -> 告诉打包器「我的模块没有副作用，放心删」
   -> 有副作用的文件单独列出："sideEffects": ["*.css"]

3. production 模式
   -> development 模式不开启 Tree Shaking
```

### 原理

```js
// math.js
export function add(a, b) { return a + b }      // 被使用 -> 保留
export function multiply(a, b) { return a * b } // 未使用 -> 删除
export function sideEffect() { console.log('执行了') } // 未使用但有副作用

// main.js
import { add } from './math.js'
console.log(add(1, 2))

// 打包过程：
// 1. Webpack 构建依赖图时标记：add 被使用，multiply 未被使用
// 2. Terser 压缩时：multiply 没有被引用 -> 安全删除
// 3. sideEffect 虽然也没被 import，但函数体有 console.log
//    -> 如果 sideEffects: false -> Webpack 认为无副作用 -> 也会删除
//    -> 如果没有 sideEffects 声明 -> 保守起见保留
```

### 面试回答

> Tree Shaking 依赖 ESM 的静态声明——import/export 在编译时就能确定依赖关系，Webpack 标记未被使用的导出，Terser 在压缩阶段删除。sideEffects: false 是向打包器承诺「我的模块删掉不影响功能」，配合这个标记才能安全删除有副作用的代码。

---

## Q7：代码分割与懒加载？（<span class="hot">高频</span>）

```js
// 方式一：动态 import —— 最常用的路由懒加载
const routes = [
  { path: '/', component: () => import('../views/Home.vue') },
  // 访问 / 时才下载 Home 的 chunk -> 首屏不含 Home 代码
  { path: '/about', component: () => import('../views/About.vue') }
]

// 方式二：splitChunks 分包配置
optimization: {
  splitChunks: {
    chunks: 'all',        // 同步+异步模块都参与分割
    cacheGroups: {
      vendor: {
        test: /[\\/]node_modules[\\/]/,
        name: 'vendors',
        priority: 10      // 三方库独立 -> 浏览器缓存（内容不变不重新下载）
      },
      common: {
        minChunks: 2,     // 被引用 2 次以上的模块提取公共
        name: 'common',
        priority: 5
      }
    }
  }
}

// 方式三：import() 配合魔法注释
const module = await import(/* webpackChunkName: "admin" */ './admin.js')
// 指定 chunk 名，方便定位
```

---

## Q8：Source Map 原理与配置？

**是什么**：源码和编译产物的**映射文件**——报错时把压缩后的行号还原成源码行号。

```js
// 开发环境（质量好但慢）
devtool: 'eval-source-map'

// 生产环境（不暴露源码，上传到监控平台）
devtool: 'hidden-source-map'  // 生成 map 但不在 JS 末尾引用
// 上传 SourceMap 到 Sentry 等平台 -> 线上报错自动还原源码位置
```

---

## Q9：Webpack HMR 原理？

```text
HMR（Hot Module Replacement）热模块替换：

1. Webpack Watch 模式监听文件变化
        |
2. 文件修改 -> 重新编译受影响的模块
        |
3. 编译完成 -> 生成新的模块代码 + Hash 变化
        |
4. HMR Server 通过 WebSocket 推送 hash 给浏览器
        |
5. 浏览器 HMR Runtime 收到 hash
   -> 发请求获取变更的模块（JSON + JS patch）
        |
6. HMR Runtime 执行 module.hot.accept 注册的回调
   -> Vue：替换组件 -> 保留状态
   -> CSS：替换 style 标签 -> 无感更新
```

---

## Q10：常用 Loader 和 Plugin 速查

| Loader | 作用 | Plugin | 作用 |
| --- | --- | --- | --- |
| babel-loader | ES6+ 转 ES5 | HtmlWebpackPlugin | 生成 HTML 注入资源 |
| css-loader | 解析 CSS import | MiniCssExtractPlugin | CSS 抽成独立文件 |
| style-loader | CSS 注入 DOM | DefinePlugin | 定义环境变量 |
| sass-loader | SCSS 转 CSS | TerserPlugin | JS 压缩 |
| postcss-loader | CSS 兼容前缀 | CopyWebpackPlugin | 拷贝静态资源 |
| vue-loader | 解析 .vue 文件 | webpack-bundle-analyzer | 体积可视化 |
| ts-loader | TS 转 JS | ModuleFederationPlugin | 模块联邦 |

## 本篇速答

| 问题 | 答案 |
| --- | --- |
| Loader 和 Plugin 区别？ | Loader 管文件转换（链式右到左）；Plugin 管流程扩展（Tapable 钩子） |
| Loader 执行顺序？ | 从右到左、从下到上 |
| Webpack 构建流程？ | 初始化→编译→入口→递归模块→组装Chunk→输出 |
| Webpack 5 最重要的新特性？ | filesystem 缓存（二次构建快90%）+ 模块联邦 |
| Tree Shaking 前提？ | ESM + sideEffects: false + production |
| 为什么 CJS 不能 Tree Shaking？ | require 运行时执行，无法静态分析 |
| SourceMap 生产怎么配？ | hidden-source-map + 上传到监控平台 |
| HMR 原理？ | Watch→编译→WebSocket推hash→浏览器拉patch→替换模块 |
