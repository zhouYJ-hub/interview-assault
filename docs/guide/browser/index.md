# 浏览器原理与网络

高级前端的分水岭专题：不仅会用 API，还要懂浏览器怎么渲染、网络怎么传输、数据怎么存储。

## 高级前端知识清单（掌握度自查）

| 模块 | 关键考点 | 频率 / 要求 |
| --- | --- | --- |
| [浏览器渲染流程](./render) | HTML -> DOM、CSSOM、Render Tree、Layout、Paint、Composite | ⭐⭐⭐⭐⭐ 能画完整流程图 |
| [重排与重绘](./render) | 触发条件、性能代价、强制同步布局、优化手段 | ⭐⭐⭐⭐⭐ 能说出代价排序 |
| [合成层](./render) | transform / opacity、GPU 加速、will-change、层爆炸 | ⭐⭐⭐⭐ 知道动画为什么用 transform |
| [完整请求流程](./network) | DNS、TCP 握手挥手、HTTPS、HTTP 版本演进 | ⭐⭐⭐⭐⭐ 能完整叙述 |
| [HTTP 状态码与缓存](./network) | 状态码分类、强缓存/协商缓存、ETag、304、缓存方案设计 | ⭐⭐⭐⭐⭐ 能设计缓存方案 |
| [跨域解决方案](./cross-origin) | 同源策略、CORS 与预检、JSONP、代理、postMessage | ⭐⭐⭐⭐⭐ 能解决实际跨域 |
| [浏览器本地存储](./storage) | Cookie、Web Storage、IndexedDB、Cache API、token 存储权衡 | ⭐⭐⭐⭐⭐ 按场景选型 |
| 延伸加分项 | HTTPS/TLS 握手、HTTP/1.1 vs 2 vs 3、WebSocket、Service Worker、XSS/CSRF | ⭐⭐⭐ 原理级了解 |

## 学习路径建议

1. **先渲染后网络**：渲染管线 -> 重排重绘 -> 合成层，建立「改一行样式浏览器做了什么」的心智模型；
2. **网络三件套**：状态码 -> 缓存策略 -> 跨域，这是性能优化与联调排障的基本功；
3. **存储选型**：Cookie / localStorage / sessionStorage / IndexedDB 的边界与安全权衡。

## 面试官最爱追问的 10 个问题

1. 从输入 URL 到页面展示，中间发生了什么？（总纲级考题，串起整个专题）
2. 重排和重绘的区别？怎么减少？
3. 为什么 transform 动画比改 top/left 性能好？
4. 强缓存和协商缓存的区别？谁先触发？
5. ETag 和 Last-Modified 各自的优缺点？
6. 304 是怎么产生的？浏览器发了什么、服务器回了什么？
7. 什么情况会触发 CORS 预检请求？OPTIONS 是什么？
8. JSONP 为什么能跨域？有什么局限？
9. Cookie、localStorage、sessionStorage 的区别？
10. token 存 localStorage 还是 Cookie？各有什么安全风险？
