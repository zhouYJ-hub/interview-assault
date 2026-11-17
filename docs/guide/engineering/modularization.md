# 模块化篇（Q11 - Q15）

> 覆盖：模块化演进、ESM vs CJS、npm/pnpm、monorepo

## Q11：模块化演进（IIFE 到 ESM）？

```text
全局变量时代（无模块化）
  <script src="a.js"> -> 变量全部挂 window -> 命名冲突
       |
IIFE（立即执行函数）
  const moduleA = (function() {
    let private = '私有'
    return { getData() { return private } }
  })()
  -> 通过闭包实现私有 -> 但无法解决依赖管理
       |
CommonJS（Node.js，2009）
  module.exports = { name: 'a' }
  const a = require('./a')
  -> 同步加载（服务端文件系统快，没问题）
  -> 浏览器端同步阻塞 -> 不适合
       |
AMD（RequireJS，浏览器端）
  define(['dep'], function(dep) { return {} })
  -> 异步加载 -> 但回调地狱，写法繁琐
       |
ESM（ES6 标准，2015）
  export const name = 'a'
  import { name } from './a'
  -> 静态声明、编译时确定、Tree-shaking 支持
  -> 现代浏览器原生支持
```

---

## Q12：ESM 和 CommonJS 的区别？（<span class="hot">超高频</span>）

| 对比项 | ESM | CommonJS |
| --- | --- | --- |
| 加载时机 | **编译时**静态确定 | **运行时**动态加载 |
| 导出内容 | **值的引用**（绑定） | **值的拷贝** |
| 循环依赖 | 引用指向快照，可能取到未初始化 | 可能取到部分导出 |
| Tree Shaking | ✅ 支持（静态分析） | ❌ 不支持 |
| this（顶层） | undefined | module.exports |
| import 位置 | 必须顶层静态声明 | require 可在任意位置 |
| 动态导入 | `import()` 返回 Promise | `require(变量)` 天然支持 |

**值的引用 vs 值的拷贝**：

```js
// ESM: counter.js
export let count = 0
export function inc() { count++ }

// main.js
import { count, inc } from './counter.js'
console.log(count) // 0
inc()
console.log(count) // 1 ✅ 同一份引用

// CommonJS 同样的代码 count 依然是 0 ❌（拿到的是导入时的拷贝）
```

**面试回答**：最核心的两条——第一，ESM 编译时确定依赖所以能 Tree Shaking，CJS 运行时加载所以不能；第二，ESM 导出的是值的引用（改了原模块，导入方能感知），CJS 导出的是值的拷贝。

---

## Q13：package.json 核心字段？

```json
{
  "name": "my-package",
  "version": "1.2.3",            // semver: major.minor.patch
  "main": "./dist/index.js",       // CJS 入口
  "module": "./dist/index.mjs",    // ESM 入口（打包工具优先用这个）
  "exports": {                     // 现代导出配置（优先级最高）
    ".": {
      "import": "./dist/index.mjs",
      "require": "./dist/index.js"
    },
    "./styles.css": "./dist/styles.css"
  },
  "sideEffects": false,            // 告诉打包器可以 Tree Shaking
  "peerDependencies": {            // 宿主环境必须有的依赖（如 vue）
    "vue": "^3.0.0"
  },
  "engines": { "node": ">=18" },
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "lint": "eslint src",
    "test": "vitest"
  }
}
```

**高频字段解释**：

| 字段 | 作用 | 注意 |
| --- | --- | --- |
| `main` | CJS 入口 | Node require 时找的 |
| `module` | ESM 入口 | Webpack/Vite 优先用 |
| `exports` | 现代导出 | 可以限制子路径访问 |
| `sideEffects` | Tree Shaking 标记 | false = 可安全删除 |
| `peerDependencies` | 宿主环境的依赖 | 避免 Vue 被重复打包 |

---

## Q14：npm/yarn/pnpm 对比？

| 对比项 | npm | yarn | pnpm |
| --- | --- | --- | --- |
| 锁文件 | package-lock.json | yarn.lock | pnpm-lock.yaml |
| 安装速度 | 慢 | 快 | **最快** |
| 磁盘占用 | 每个项目独立 node_modules | 同 npm | **硬链接共享**（省 70%+） |
| 幽灵依赖 | ❌ 有（能 require 未声明的包） | ❌ 有 | ✅ 严格（只能访问 package.json 声明的） |
| monorepo | workspaces（基础） | workspaces（较好） | **workspace（最佳）** |
| 推荐度 | 跟 Node 自带 | 老项目 | **新项目首选** |

**pnpm 的核心优势——硬链接**：

```text
node_modules/
├── .pnpm/                        # 全局存储的硬链接
│   ├── react@18.2.0/
│   │   └── node_modules/react/   # 硬链接到全局store
│   └── vue@3.4.0/
│       └── node_modules/vue/
├── react -> .pnpm/react@18.2.0/node_modules/react  # 符号链接
└── vue -> .pnpm/vue@3.4.0/node_modules/vue

效果：
  100 个项目都用 react -> 磁盘上只存一份 react
  项目 A 的 node_modules 里只有 package.json 声明的包
  -> 不可能出现幽灵依赖
```

---

## Q15：monorepo 和 pnpm workspace？

**是什么**：多个项目/包放在一个仓库管理（如 vue、react、vite 都是 monorepo）。

```text
my-monorepo/
├── pnpm-workspace.yaml      # 声明 workspace
├── packages/
│   ├── ui/                   # 组件库
│   │   └── package.json     # name: "@my/ui"
│   ├── utils/                # 工具函数
│   │   └── package.json     # name: "@my/utils"
│   └── app/                  # 主应用
│       └── package.json     # dependencies: { "@my/ui": "workspace:*" }
└── package.json              # 根配置
```

```yaml
# pnpm-workspace.yaml
packages:
  - 'packages/*'
```

```json
// packages/app/package.json
{
  "dependencies": {
    "@my/ui": "workspace:*"    // workspace 协议：本地链接
  }
}
// pnpm 会把 @my/ui 符号链接到本地，不发 npm 也能引用
```

**优势**：统一版本管理、代码共享零成本、一条命令构建所有包、原子提交（改 utils + app 一起提交）。

## 本篇速答

| 问题 | 答案 |
| --- | --- |
| ESM 和 CJS 最核心区别？ | 编译时静态 vs 运行时动态；引用 vs 拷贝 |
| 为什么 CJS 不能 Tree Shaking？ | require 是运行时执行，无法静态分析 |
| pnpm 为什么快？ | 硬链接全局 store + 符号链接到项目 |
| 什么是幽灵依赖？ | 能 require 未在 package.json 声明的包（pnpm 解决） |
| monorepo workspace 协议？ | "workspace:*" 本地链接不发布 npm |
