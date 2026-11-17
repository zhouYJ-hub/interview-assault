# 构建与工程化

> 面试频率：⭐⭐⭐⭐（中高级必考）| 25 道核心题，按「构建工具 -> 模块化 -> 代码质量 -> CI/CD 与高级」四篇组织

## 面试回答示范（总-分结构）

> **总起**：前端工程化我按构建工具、模块化、代码质量、CI/CD 四层讲掌握情况。
>
> **第一，构建工具。** 深入理解 Webpack 的核心流程（entry 到 output 的编译管线、Loader 做转换、Plugin 做扩展）；能手写简单 Loader 和 Plugin；Vite 能讲清它为什么快——开发时 esbuild 预构建 + 原生 ESM 按需加载，生产用 Rollup 打包。
>
> **第二，模块化。** 清楚 ESM 和 CommonJS 在加载时机（编译时 vs 运行时）、导出内容（引用 vs 拷贝）、Tree-shaking 支持上的核心差异；了解 pnpm 的硬链接和 monorepo 实践。
>
> **第三，代码质量。** 团队里推过 ESLint + Prettier + husky + lint-staged 的完整工作流——提交前自动检查格式和代码规范。
>
> **第四，CI/CD 和监控。** 搭建过 GitLab CI 的完整流水线（lint -> test -> build -> deploy），了解前端错误监控（window.onerror + unhandledrejection + 资源加载失败）和性能监控（Web Vitals）的接入方案。

## 25 道核心题清单

| # | 题目 | 所在篇章 | 频率 |
| --- | --- | --- | --- |
| 1 | Webpack 核心概念？ | [Webpack 5](./webpack5) / [Vite](./vite) | ⭐⭐⭐⭐ |
| 2 | Loader 和 Plugin 的区别？ | [Webpack 5](./webpack5) / [Vite](./vite) | ⭐⭐⭐⭐⭐ |
| 3 | Webpack 构建流程（原理）？ | [Webpack 5](./webpack5) / [Vite](./vite) | ⭐⭐⭐ |
| 4 | 常用 Loader 和 Plugin？ | [Webpack 5](./webpack5) / [Vite](./vite) | ⭐⭐⭐ |
| 5 | Webpack 性能优化？ | [Webpack 5](./webpack5) / [Vite](./vite) | ⭐⭐⭐⭐ |
| 6 | Vite 为什么快？ | [Webpack 5](./webpack5) / [Vite](./vite) | ⭐⭐⭐⭐⭐ |
| 7 | Vite 和 Webpack 的区别与选型？ | [Webpack 5](./webpack5) / [Vite](./vite) | ⭐⭐⭐⭐⭐ |
| 8 | Tree Shaking 原理？ | [Webpack 5](./webpack5) / [Vite](./vite) | ⭐⭐⭐⭐ |
| 9 | 代码分割与懒加载？ | [Webpack 5](./webpack5) / [Vite](./vite) | ⭐⭐⭐⭐ |
| 10 | Babel 编译原理？ | [Webpack 5](./webpack5) / [Vite](./vite) | ⭐⭐⭐ |
| 11 | 模块化演进（IIFE到ESM）？ | [模块化](./modularization) | ⭐⭐⭐ |
| 12 | ESM 和 CommonJS 的区别？ | [模块化](./modularization) | ⭐⭐⭐⭐⭐ |
| 13 | package.json 核心字段？ | [模块化](./modularization) | ⭐⭐⭐ |
| 14 | npm/yarn/pnpm 对比？ | [模块化](./modularization) | ⭐⭐⭐ |
| 15 | monorepo 和 pnpm workspace？ | [模块化](./modularization) | ⭐⭐⭐ |
| 16 | ESLint 和 Prettier 的分工？ | [代码质量](./code-quality) | ⭐⭐⭐ |
| 17 | husky + lint-staged 工作流？ | [代码质量](./code-quality) | ⭐⭐⭐⭐ |
| 18 | Git 规范与 commitlint？ | [代码质量](./code-quality) | ⭐⭐ |
| 19 | CI/CD 完整流程？ | [CI/CD与监控](./cicd-monitor) | ⭐⭐⭐⭐ |
| 20 | 前端测试金字塔？ | [CI/CD与监控](./cicd-monitor) | ⭐⭐⭐ |
| 21 | 前端错误监控方案？ | [CI/CD与监控](./cicd-monitor) | ⭐⭐⭐⭐ |
| 22 | 前端性能监控（Web Vitals）？ | [CI/CD与监控](./cicd-monitor) | ⭐⭐⭐ |
| 23 | 微前端原理与实践？ | [CI/CD与监控](./cicd-monitor) | ⭐⭐⭐ |
| 24 | 组件库从 0 到 1？ | [CI/CD与监控](./cicd-monitor) | ⭐⭐ |
| 25 | SSR/SSG/BFF？ | [CI/CD与监控](./cicd-monitor) | ⭐⭐⭐ |

## 学习路径建议

```text
1. 构建工具是核心战场 -> Webpack 概念 + Vite 原理必须能对比着讲
2. 模块化是基础 -> ESM vs CJS 是所有构建话题的底层
3. 代码质量体现团队协作 -> husky + lint-staged 完整流程
4. CI/CD + 监控体现工程能力 -> 能讲出自己搭过的完整流水线
```
