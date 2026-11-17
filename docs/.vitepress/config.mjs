import { defineConfig } from 'vitepress'

export default defineConfig({
  title: '前端面试突击',
  description: '前端面试知识库 · 高频考点 · 真题解析',
  lang: 'zh-CN',
  head: [
    ['link', { rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' }],
    ['meta', { name: 'theme-color', content: '#c62828' }]
  ],
  themeConfig: {
    nav: [
      { text: '首页', link: '/' },
      {
        text: '面试指南',
        items: [
          { text: 'JS核心 + 前端八股文', link: '/guide/javascript/' },
          { text: '浏览器与网络', link: '/guide/browser/' },
          { text: 'HTML+CSS', link: '/guide/html-css/' },
          { text: 'TypeScript', link: '/guide/typescript/' },
          { text: '工程化', link: '/guide/engineering/' }
        ]
      }
    ],
    sidebar: {
      '/guide/': [
        {
          text: 'JS核心 + 前端八股文',
          collapsed: false,
          items: [
            { text: '专题概览', link: '/guide/javascript/' },
            { text: '原型与原型链', link: '/guide/javascript/prototype' },
            { text: '闭包与作用域', link: '/guide/javascript/closure-scope' },
            { text: '事件循环与宏微任务', link: '/guide/javascript/event-loop' },
            { text: 'this 指向', link: '/guide/javascript/this' },
            { text: '深浅拷贝', link: '/guide/javascript/deep-copy' },
            { text: '防抖与节流', link: '/guide/javascript/debounce-throttle' },
            { text: 'Promise 专题', link: '/guide/javascript/promise' },
            { text: 'async/await 专题', link: '/guide/javascript/async-await' },
            { text: 'ES6+ 核心特性', link: '/guide/javascript/es6-features' },
            { text: 'WebWorker', link: '/guide/javascript/web-worker' }
          ]
        },
        {
          text: '浏览器原理与网络',
          collapsed: false,
          items: [
            { text: '专题概览', link: '/guide/browser/' },
            { text: '渲染流程与重排重绘', link: '/guide/browser/render' },
            { text: '网络基础', link: '/guide/browser/network' },
            { text: '跨域解决方案', link: '/guide/browser/cross-origin' },
            { text: '浏览器本地存储', link: '/guide/browser/storage' }
          ]
        },
        {
          text: 'HTML + CSS 面试题',
          collapsed: false,
          items: [
            { text: '专题概览', link: '/guide/html-css/' },
            { text: 'HTML 基础篇', link: '/guide/html-css/basic' },
            { text: 'CSS 布局篇', link: '/guide/html-css/layout' },
            { text: 'CSS 进阶篇', link: '/guide/html-css/advanced' },
            { text: 'Sass 详解', link: '/guide/html-css/sass' },
            { text: 'Less 详解', link: '/guide/html-css/less' },
            { text: '移动端适配', link: '/guide/html-css/mobile' }
          ]
        },{
          text: 'TypeScript 面试题',
          collapsed: false,
          items: [
            { text: '专题概览', link: '/guide/typescript/' },
            { text: '基础篇：类型系统', link: '/guide/typescript/basic' },
            { text: '进阶篇：类型进阶', link: '/guide/typescript/advanced' },
            { text: '泛型与工具类型', link: '/guide/typescript/utility' }
          ]
        },
        {
          text: 'UniApp 专题',
          collapsed: false,
          items: [
            { text: '专题概览', link: '/guide/uniapp/' },
            { text: '基础篇', link: '/guide/uniapp/basic' },
            { text: '进阶篇', link: '/guide/uniapp/advanced' },
            { text: '高级篇：分包/热更新', link: '/guide/uniapp/expert' }
          ]
        },
        {
          text: 'Vue 全家桶',
          collapsed: false,
          items: [
            { text: '专题概览', link: '/guide/vue/' },
            { text: 'Vue3 API 详解', link: '/guide/vue/api' },
            { text: 'Vue3 核心', link: '/guide/vue/core' },
            { text: 'Vue Router', link: '/guide/vue/router' },
            { text: 'Pinia 与 Vuex', link: '/guide/vue/state' },
            { text: 'Vue 源码分析', link: '/guide/vue/source' }
          ]
        },{
          text: '165 面试题库',
          collapsed: false,
          items: [
            { text: '题目索引', link: '/guide/interview-165/' },
            { text: '前端基础与浏览器', link: '/guide/interview-165/basics' },
            { text: '框架与工程化', link: '/guide/interview-165/framework' },
            { text: '性能优化与安全', link: '/guide/interview-165/performance' },
            { text: '行为面试题', link: '/guide/interview-165/behavioral' }
          ]
        },{
          text: '构建与工程化',
          collapsed: false,
          items: [
            { text: '专题概览', link: '/guide/engineering/' },
            { text: 'Webpack 5 深度', link: '/guide/engineering/webpack5' },
            { text: 'Vite 深度', link: '/guide/engineering/vite' },
            { text: '模块化篇', link: '/guide/engineering/modularization' },
            { text: '代码质量篇', link: '/guide/engineering/code-quality' },
            { text: 'CI/CD 与监控', link: '/guide/engineering/cicd-monitor' },
            { text: 'qiankun 微前端', link: '/guide/engineering/qiankun' }
          ]
        }
      ]
    },
    socialLinks: [
      { icon: 'github', link: 'https://github.com/' }
    ],
    outline: { level: [2, 3], label: '本页目录' },
    docFooter: { prev: '上一篇', next: '下一篇' },
    lastUpdated: { label: '最后更新' },
    search: { provider: 'local' }
  }
})
