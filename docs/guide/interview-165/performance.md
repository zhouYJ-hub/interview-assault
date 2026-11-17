# 性能优化与网络安全

> 性能优化与网络安全 | 20 题

## Q102：前端性能优化的整体思路和常用手段（<span class="hot">必考</span> | ★★★）

**变体问法**：「怎么优化首屏加载速度」「性能优化全景」

**考察点**：考察性能优化的全局视野和系统思维，高级前端必考题。

**答题框架**：按阶段：网络层→加载层→渲染层→运行时层→构建层，每层讲具体手段和指标。

**示范要点**：

> 性能优化按用户访问路径分层：①网络层：DNS预解析、CDN、HTTP/2、Gzip/Brotli压缩、缓存策略（强缓存+协商缓存）、减少请求数；②加载层：代码分割（路由懒加载）、TreeShaking、资源预加载（preload/prefetch）、图片优化（WebP/AVIF、懒加载、响应式图片）、骨架屏；③渲染层：关键CSS内联、JS用async/defer、避免阻塞渲染、SSR/SSG、减少回流重绘；④运行时：虚拟列表、防抖节流、WebWorker、requestAnimationFrame、事件委托、避免内存泄漏；⑤构建层：Vite/Webpack优化、压缩混淆、contenthash强缓存、第三方库CDN。核心指标：LCP（<2.5s）、INP（<200ms）、CLS（<0.1）、TTFB、FCP。原则：先测量（Lighthouse/Performance面板）再优化，关注用户感知而非纯数字。

**雷区**：只说压缩图片和代码分割；没有分层思路；不测量就优化。

---

## Q103：怎么优化首屏加载速度（白屏时间）（<span class="hot">必考</span> | ★★★）

**变体问法**：「首屏慢怎么排查」「FCP/LCP优化」

**考察点**：考察性能优化的核心场景，首屏是用户体验的关键。

**答题框架**：分析首屏瓶颈（网络/资源体积/渲染/JS执行）→针对性优化→测量验证。

**示范要点**：

> 首屏优化从瓶颈入手：①网络：CDN、HTTP/2、DNS预解析、减少域名、预连接（preconnect）；②资源体积：代码分割（首屏只加载必要代码）、TreeShaking、Gzip/Brotli、图片WebP/AVIF、字体优化（font-display:swap、子集化）；③渲染：关键CSS内联（首屏样式直接写在style标签）、JS用defer/async不阻塞解析、SSR/SSG（服务端渲染HTML）、预渲染；④JS执行：减少首屏JS执行时间、拆分长任务、WebWorker、避免同步操作；⑤体验：骨架屏/loading减少感知等待、渐进式渲染。测量：Lighthouse看FCP/LCP，Performance面板看长任务，Network看资源加载瀑布。注意：首屏优化要平衡，不要为了首屏把所有代码内联导致HTML过大。

**雷区**：说首屏优化就是加loading；不分析瓶颈直接上手段；只优化不测量。

**追问链**：「关键CSS怎么提取」「SSR和预渲染的区别」——继续考。

---

## Q107：前端安全有哪些常见攻击和防范措施（<span class="hot">必考</span> | ★★★）

**变体问法**：「前端安全全景」「XSS/CSRF/点击劫持」

**考察点**：考察安全意识的全面性，高级前端必备。

**答题框架**：XSS→CSRF→点击劫持→SQL注入（前端层面）→中间人攻击→依赖漏洞→其他，每个讲原理和防范。

**示范要点**：

> 前端常见安全问题：①XSS（跨站脚本）：注入恶意脚本，防范：输入输出转义、CSP、HttpOnlycookie、避免innerHTML/eval；②CSRF（跨站请求伪造）：冒充用户请求，防范：CSRFToken、SameSitecookie、验证Referer；③点击劫持（Clickjacking）：用iframe覆盖透明层诱导点击，防范：X-Frame-Options（DENY/SAMEORIGIN）、CSPframe-ancestors、frame-breaker脚本；④SQL注入：前端层面用参数化查询（主要后端防范），不要拼接SQL；⑤中间人攻击：用HTTPS，HSTS强制HTTPS；⑥依赖漏洞：npmaudit、Snyk检测，及时升级有漏洞的依赖；⑦敏感信息：不要在前端存密码/密钥，localStorage有XSS风险；⑧开放重定向：校验跳转URL白名单；⑨CORS配置：不要设Access-Control-Allow-Origin:*且允许凭证。注意：安全是全链路的，前端防范是第一道防线，后端必须做最终校验。

**雷区**：说前端安全就是防XSS；不知道点击劫持；把安全全推给后端。

**追问链**：「CSP怎么配置」「SameSite的三个值」——继续考。

---

## Q091：什么是前端的低代码/无代码？你怎么看（高频 | ★★）

**变体问法**：「低代码平台的原理」「低代码会不会取代前端」

**考察点**：考察对前端行业趋势的理解，2026年热点话题。

**答题框架**：低代码定义→核心技术（可视化拖拽/DSL/渲染引擎/物料体系）→适用场景→局限→对前端的影响。

**雷区**：说低代码会取代前端；说低代码就是拖拖拽拽没技术含量；不了解低代码的核心技术。

**追问链**：「低代码的渲染引擎怎么设计」「DSL和源码的区别」——继续考。

---

## Q094：前端怎么做大数据量渲染优化（虚拟列表原理）（高频 | ★★★）

**变体问法**：「10万条数据怎么渲染」「虚拟滚动的实现」

**考察点**：考察性能优化的实战能力，中后台常见问题。

**示范要点**：

> 大数据量渲染问题：10万条数据全部渲染DOM，节点多、内存大、滚动卡顿。虚拟列表原理：只渲染可视区域内的元素，用padding或transform模拟完整列表的高度，滚动时计算可视范围，动态替换内容。实现要点：①固定容器高度，overflow:auto；②计算可视区域的起始索引和结束索引（scrollTop/itemHeight）；③只渲染可视范围的item，上下加缓冲（避免快速滚动白屏）；④用padding-top撑开滚动高度，或用transform:translateY偏移内容。动态高度（item高度不固定）：①预估高度+滚动时测量实际高度修正；②用ResizeObserver监听高度变化。库推荐：React用react-window/react-virtualized，Vue用vue-virtual-scroller。进阶：无限滚动（IntersectionObserver触底加载）、分页加载。注意：虚拟列表中item的key必须稳定，不能用index。

**雷区**：说虚拟列表就是分页；不知道动态高度的处理；滚动时频繁计算导致卡顿。

**追问链**：「虚拟列表的动态高度怎么实现」「虚拟列表和无限滚动的区别」——继续考。

---

## Q095：什么是前端的响应式设计？实现方案有哪些（高频 | ★）

**变体问法**：「移动端适配方案」「rem和vw的区别」

**考察点**：考察移动端适配的基础能力，H5开发必备。

**答题框架**：响应式定义→媒体查询→rem方案→vw/vh方案→flex/grid→图片响应式→注意事项。

**示范要点**：

> 响应式设计是页面根据设备屏幕尺寸自动调整布局。实现方案：①媒体查询（@media）：针对不同断点设置不同样式，Bootstrap等框架的基础；②rem方案：根元素font-size根据屏幕宽度动态设置（用JS或vw），所有尺寸用rem，适合移动端H5（lib-flexible方案）；③vw/vh方案：视口单位，1vw=视口宽度的1%，不需要JS，现代浏览器支持好，是当前主流；④flex/grid布局：弹性布局天然适配不同宽度；⑤图片响应式：srcset+sizes根据屏幕加载不同分辨率图片，picture元素支持不同格式；⑥容器查询（@container）：根据容器尺寸而非视口尺寸响应，组件级响应式。注意：①移动端要设置viewportmeta（width=device-width,initial-scale=1）；②1px边框问题（transform:scale或border-image）；③点击延迟（fastclick或touch-action:manipulation）。选型：新项目推荐vw+flex，老项目rem。

**雷区**：说rem是最好的方案（vw更简单）；不设置viewport；响应式就是媒体查询。

**追问链**：「1px边框怎么实现」「vw和rem的区别」——继续考。

---

## Q096：React的ContextAPI原理和使用场景，有什么性能问题（高频 | ★★）

**变体问法**：「Context的性能优化」「useContext的用法」

**考察点**：考察React跨组件通信的理解，Context常用但有坑。

**答题框架**：Context定义（Provider/Consumer/useContext）→使用场景→性能问题（value变化所有消费者重渲染）→优化方案。

**示范要点**：

> Context提供跨组件传递数据的方式，不需要逐层props。组成：createContext创建Context对象，Provider提供value，Consumer或useContext消费value。使用场景：主题、用户信息、语言等全局低频更新的数据。性能问题：Provider的value变化时，所有消费该Context的组件都会重渲染，即使只用到value的一部分。优化方案：①拆分Context，把高频更新和低频更新分开；②value用useMemo缓存，避免每次渲染创建新对象；③消费者组件用React.memo包裹（但Context变化时memo无效）；④用选择器模式（use-context-selector库），只在用到的部分变化时重渲染；⑤高频更新的数据用状态管理库（Zustand/Jotai）而非Context。注意：Context不是状态管理工具，它只是依赖注入机制，不负责更新优化。

**雷区**：说Context能替代Redux；不知道Context的性能问题；把所有状态都放Context。

**追问链**：「怎么优化Context的性能」「Context和propsdrilling的区别」——继续考。

---

## Q097：前端怎么做文件上传和下载优化（高频 | ★★）

**变体问法**：「大文件分片上传」「断点续传原理」

**考察点**：考察文件处理的实战能力，常见业务需求。

**示范要点**：

> 大文件上传优化：①分片上传：用File.slice把文件切成固定大小（如5MB），并发上传分片，全部完成后通知服务器合并；②断点续传：记录已上传分片，中断后从断点继续（用localStorage或服务器查询已上传分片）；③秒传：上传前计算文件hash（MD5/SHA），服务器已有则直接返回成功；④并发控制：限制同时上传的分片数（如3个），避免占用过多带宽；⑤进度显示：onprogress事件；⑥拖拽上传：dragover/drop事件。下载优化：①大文件用流式下载（fetch+ReadableStream），不占内存；②显示下载进度；③断点下载（Range请求头）；④Blob+URL.createObjectURL生成下载链接，用完revokeObjectURL释放内存。注意：①hash计算大文件要用WebWorker避免阻塞主线程；②分片上传要处理失败重试；③跨域上传需要CORS配置。

**雷区**：说大文件直接一次性上传；不知道分片和断点续传；下载后不释放ObjectURL。

**追问链**：「怎么计算文件hash」「分片上传失败怎么处理」——继续考。

---

## Q099：前端怎么实现图片懒加载和预加载（高频 | ★）

**变体问法**：「懒加载的原理」「IntersectionObserver」

**考察点**：考察性能优化的基础技能，常用且实用。

**答题框架**：懒加载原理（不加载可视区域外的图片）→实现方式（原生loading=lazy/IntersectionObserver/scroll监听）→预加载→注意事项。

**示范要点**：

> 图片懒加载：图片进入可视区域才加载，减少首屏请求和带宽。实现方式：①原生：&lt;imgloading="lazy">，浏览器原生支持，最简单；②IntersectionObserver：监听元素是否进入视口，进入后把data-src赋值给src，性能好（不触发频繁回调）；③scroll+getBoundingClientRect：传统方式，需要防抖，性能较差。预加载：提前加载未来需要的图片，①newImage()设置src；②&lt;linkrel="preload">（高优先级，当前页面需要）；③&lt;linkrel="prefetch">（低优先级，未来页面可能需要）。注意：①懒加载图片要设置宽高避免布局偏移（CLS）；②用占位图或骨架屏提升体验；③IntersectionObserver的rootMargin可以提前加载（如下方200px）；④背景图懒加载需要用JS修改style。

**雷区**：说懒加载就是延迟加载；不知道原生loading属性；用scroll监听不防抖。

**追问链**：「IntersectionObserver的原理」「怎么实现视频懒加载」——继续考。

---

## Q100：什么是前端的可视化？常用的图表库和技术选型（高频 | ★★）

**变体问法**：「ECharts和D3的区别」「Canvas和SVG的选择」

**答题框架**：可视化技术（Canvas/SVG/WebGL）→图表库（ECharts/AntV/D3/Chart.js）→大屏方案→选型原则。

**示范要点**：

> 可视化技术：①SVG：矢量图，DOM元素，适合交互多、节点少的场景，放大不失真，但节点多了性能差；②Canvas：位图，像素级绘制，适合大数据量、动画多，但交互需要自己实现（命中检测）；③WebGL：GPU加速，3D/海量数据（百万级点），学习成本高。图表库：①ECharts：功能全面、中文文档好、适合大多数业务图表，百度开源；②AntV（G2Plot/G6/X6）：蚂蚁出品，G2统计图表、G6图分析、X6流程图；③D3.js：底层库，灵活度高，适合定制化可视化，但学习成本高；④Chart.js：轻量，简单图表；⑤Three.js：3D可视化。大屏方案：ECharts+自适应布局（rem/vw）+动效。选型：业务图表用ECharts/AntV，定制化用D3，3D用Three.js，海量数据用Canvas/WebGL。注意：①大数据量用Canvas或WebGL；②交互多用SVG；③响应式要处理resize。

**雷区**：说ECharts能做所有可视化；不知道Canvas和SVG的区别；3D用ECharts。

**追问链**：「Canvas和SVG的性能对比」「ECharts的大数据量优化」——继续考。

---

## Q104：WebVitals是什么？核心指标和优化方法（高频 | ★★）

**变体问法**：「LCP/INP/CLS是什么」「核心Web指标」

**考察点**：考察性能指标的理解，Google官方标准，SEO相关。

**答题框架**：三大核心指标（LCP/INP/CLS）→定义→合格阈值→优化方法→其他指标（FCP/TTFB）。

**示范要点**：

> WebVitals是Google定义的用户体验质量指标，核心三个：①LCP（LargestContentfulPaint，最大内容绘制）：衡量加载性能，合格<2.5s，优化：优化服务器响应（TTFB）、资源预加载、图片优化（WebP/响应式/优先级）、减少阻塞渲染的JS/CSS、SSR；②INP（InteractiontoNextPaint，交互到下一次绘制）：衡量交互响应性，合格<200ms（2024年替代FID），优化：减少长任务、拆分JS、事件委托、防抖节流、WebWorker、避免强制同步布局；③CLS（CumulativeLayoutShift，累积布局偏移）：衡量视觉稳定性，合格<0.1，优化：图片/视频设置宽高、广告位预留空间、字体用font-display:swap避免FOIT、不要在内容上方插入元素。其他指标：FCP（首次内容绘制<1.8s）、TTFB（首字节时间<800ms）。测量：Lighthouse、ChromeUXReport、web-vitals库。

**雷区**：说FID还是核心指标（已被INP替代）；不知道阈值；CLS优化只说图片设宽高。

**追问链**：「INP和FID的区别」「怎么减少CLS」——继续考。

---

## Q105：怎么定位和分析前端性能瓶颈（高频 | ★★★）

**变体问法**：「Performance面板怎么用」「性能排查流程」

**考察点**：考察性能分析的实操能力，只会优化不会定位是不够的。

**答题框架**：工具链（Lighthouse/Performance/Network/内存）→分析流程（指标→瓶颈→归因→优化→验证）→常见瓶颈识别。

**示范要点**：

> 性能分析流程：①先看指标：Lighthouse跑一遍，看FCP/LCP/INP/CLS哪些不达标；②Network面板：看资源加载瀑布，找大文件、慢请求、阻塞渲染的资源；③Performance面板：录制页面加载或交互，看Main线程的长任务（>50ms标红）、Scripting/Rendering/Painting各阶段耗时，火焰图找耗时函数；④Coverage面板：找未使用的JS/CSS代码；⑤Memory面板：看内存增长，排查内存泄漏；⑥ReactDevToolsProfiler：定位组件重渲染瓶颈。常见瓶颈：①JS执行时间长（大库/复杂计算/长列表）→代码分割/WebWorker/虚拟列表；②渲染慢（频繁回流/复杂选择器）→减少DOM操作/CSS优化；③网络慢（大资源/慢接口）→压缩/CDN/缓存。原则：数据驱动，每次优化后重新测量对比。

**雷区**：说性能优化靠经验不用测量；不知道Performance面板怎么看；只看Network不看Main线程。

---

## Q106：图片优化有哪些方法（高频 | ★★）

**变体问法**：「WebP和AVIF的区别」「图片加载优化」

**考察点**：图片通常是页面最大的资源，优化效果显著。

**答题框架**：格式优化→尺寸优化→加载优化→渲染优化→CDN→注意事项。

**示范要点**：

> 图片优化方法：①格式：WebP（比JPEG小25-35%）、AVIF（比WebP小20%，但编码慢），用&lt;picture&gt;元素做降级（AVIF→WebP→JPEG）；②尺寸：响应式图片（srcset+sizes），根据屏幕加载合适尺寸，不要用大图缩小显示；③压缩：tinypng等工具压缩，质量80-85通常肉眼无差；④加载：懒加载（loading=lazy）、优先级（首屏图fetchpriority=high）、渐进式JPEG（先模糊后清晰）、雪碧图（小图标合并）；⑤替代：iconfont/SVG代替小图标，CSS渐变代替纯色背景图；⑥CDN：图片CDN支持实时裁剪/压缩/格式转换（如七牛/阿里云OSS）；⑦渲染：设置宽高避免CLS，用decode()异步解码。注意：①图标用SVG不用位图；②大背景图考虑用CSS渐变或WebP；③GIF用视频代替（MP4更小）。

**雷区**：说WebP所有浏览器都支持（需要降级）；用大图显示小图；不知道srcset。

**追问链**：「picture元素怎么用」「SVG和iconfont的区别」——继续考。

---

## Q108：什么是点击劫持？怎么防范（高频 | ★★）

**变体问法**：「Clickjacking」「X-Frame-Options」

**考察点**：考察安全知识的全面性，常被忽略但实际存在。

**答题框架**：点击劫持原理（iframe覆盖+透明按钮）→危害→防范（X-Frame-Options/CSPframe-ancestors/JS防御）。

**示范要点**：

> 点击劫持（Clickjacking）：攻击者用透明/不可见的iframe覆盖在看似正常的页面上，用户点击看似按钮的地方实际点击了iframe中的敏感操作（如转账、关注）。防范：①X-Frame-Options响应头：DENY（禁止被iframe）、SAMEORIGIN（只允许同源iframe），这是最常用的方式；②CSP的frame-ancestors指令：比X-Frame-Options更灵活，支持指定域名白名单，如frame-ancestors'self'https://trusted.com；③JS防御（frame-breaker）：if(top!==self)top.location=self.location，但可以被sandbox属性绕过，不推荐作为唯一手段；④对敏感操作增加二次确认（如输入密码、验证码）。注意：X-Frame-Options是响应头，需要服务端配置；CSP的frame-ancestors会覆盖X-Frame-Options。

**雷区**：说点击劫持就是XSS；不知道X-Frame-Options；用JS防御作为唯一手段。

---

## Q109：前端怎么处理用户敏感数据（密码/token/个人信息）（高频 | ★★）

**变体问法**：「token存在哪里安全」「密码怎么传输」

**考察点**：考察安全意识和数据保护能力，实际项目必备。

**答题框架**：传输（HTTPS）→存储（cookievslocalStorage，HttpOnly）→使用（不打印/不缓存）→清理→合规。

**示范要点**：

> 敏感数据处理：①传输：必须HTTPS，密码不要明文传输（虽然HTTPS已加密，但可以额外加盐哈希）；②存储：token优先用HttpOnly+Secure+SameSite的cookie（防止XSS窃取），如果用localStorage要注意XSS风险，绝对不要存密码；③使用：不要在console.log打印敏感数据，不要把token拼在URL里（会被referrer泄露），不要存在全局变量；④清理：登出时清除所有存储（localStorage/sessionStorage/cookie），token设置合理过期时间；⑤密码：前端可以做强度校验，但不要做加密（加密也没用，中间人可以替换），真正的哈希在后端；⑥个人信息：展示时脱敏（手机号中间4位*），遵循最小权限原则。合规：GDPR/个人信息保护法要求用户同意收集、可删除、可导出。注意：前端没有绝对安全，所有前端存储都可能被XSS读取，关键防护在后端。

**雷区**：说localStorage存token很安全；前端加密密码；console.log打印token。

**追问链**：「HttpOnlycookie和localStorage存token的区别」「XSS怎么偷token」——继续考。

---

## Q110：什么是CORS？简单请求和预检请求的区别（高频 | ★★★）

**变体问法**：「OPTIONS请求是什么」「CORS带cookie」

**考察点**：考察跨域的深入理解，前后端联调常遇到。

**答题框架**：同源策略→CORS定义→简单请求（条件）→预检请求（触发条件/OPTIONS/缓存）→带凭证→注意事项。

**示范要点**：

> CORS（跨域资源共享）是W3C标准，允许服务器声明哪些源可以访问其资源。简单请求：同时满足①方法是GET/POST/HEAD；②Content-Type是text/plain/multipart/form-data/application/x-www-form-urlencoded；③无自定义头部。简单请求直接发，服务器返回Access-Control-Allow-Origin即可。非简单请求（如PUT/DELETE、Content-Type:application/json、自定义header）会先发OPTIONS预检请求，询问服务器是否允许，服务器返回Allow-Origin/Allow-Methods/Allow-Headers后才发真正请求。预检请求可以缓存（Access-Control-Max-Age）。带cookie：前端withCredentials=true，服务端必须Access-Control-Allow-Credentials:true且Allow-Origin不能是*（必须指定具体域名）。注意：①CORS是浏览器机制，服务器能收到请求；②跨域请求默认不带cookie；③响应头中的自定义字段需要Access-Control-Expose-Headers才能被JS读取。

**雷区**：说所有跨域请求都有OPTIONS；说Allow-Origin:*可以带cookie；不知道预检请求缓存。

**追问链**：「怎么避免频繁OPTIONS请求」「CORS报错怎么排查」——继续考。

---

## Q092：前端怎么做主题切换（深色模式）？（中频 | ★★）

**变体问法**：「暗黑模式实现」「CSS变量实现主题」

**考察点**：考察CSS工程化和用户体验的实战能力，常见需求。

**答题框架**：实现方案（CSS变量+data-theme/class）→切换逻辑→持久化→跟随系统→注意事项（图片/图表/第三方库）。

**示范要点**：

> 主题切换主流方案：①CSS变量（自定义属性）：在:root定义亮色变量，在[data-theme=dark]或.dark定义暗色变量，所有组件用var(--color)引用；②切换主题：修改document.documentElement的data-theme属性或class；③持久化：localStorage存主题偏好；④跟随系统：prefers-color-scheme媒体查询，默认跟随系统，用户手动选择后覆盖；⑤避免闪烁：在&lt;head>中内联一段JS，在页面渲染前读取localStorage设置主题。注意事项：①图片/图表需要适配深色模式（用CSSfilter或换图）；②第三方组件库（AntDesign）需要配置主题或覆盖样式；③颜色对比度要符合无障碍标准（WCAGAA4.5:1）；④过渡动画用transition:background-color.3s。进阶方案：CSS的color-scheme属性让浏览器原生控件（滚动条/表单）也适配深色。

**雷区**：说主题切换就是换CSS文件；切换时页面闪烁；不考虑系统偏好和持久化。

**追问链**：「怎么避免主题切换的闪烁」「CSS变量的兼容性」——继续考。

---

## Q093：什么是WebAssembly？前端怎么用WASM（中频 | ★★★）

**变体问法**：「WASM的应用场景」「Rust+WebAssembly」

**考察点**：考察前端前沿技术的了解，高性能计算方向常考。

**答题框架**：WASM定义→特点（二进制/高性能/沙箱）→和JS的关系→使用方式（Emscripten/Rust）→应用场景→局限。

**示范要点**：

> WebAssembly（WASM）是一种低级二进制指令格式，在浏览器中接近原生速度运行，是JS的补充而非替代。特点：①二进制格式，体积小加载快；②接近原生性能（比JS快10-100倍）；③沙箱环境，安全；④支持C/C++/Rust/Go等语言编译。使用方式：①C/C++用Emscripten编译为WASM；②Rust用wasm-pack；③JS中用WebAssembly.instantiate加载和调用。应用场景：①高性能计算（视频编辑、3D渲染、物理引擎）；②加密/解密（比JS快）；③游戏（Unity/Unreal编译为WASM）；④音视频处理（FFmpeg.wasm）；⑤把现有C/C++库移植到Web。局限：①不能直接操作DOM，需要通过JS桥接；②调试不如JS方便；③首次加载有编译开销（但有流式编译和缓存）。注意：WASM和JS可以互相调用，通常是计算密集部分用WASM，UI和DOM用JS。

**雷区**：说WASM会取代JS；说WASM能直接操作DOM；说WASM只适合游戏。

**追问链**：「WASM和JS怎么交互」「WASM的内存模型」——继续考。

---

## Q098：什么是前端的拖拽？HTML5拖拽API和实现原理（中频 | ★★）

**变体问法**：「拖拽排序的实现」「drag和drop事件」

**考察点**：考察交互实现能力，常见业务需求。

**答题框架**：HTML5拖拽API（dragstart/drag/dragend/dragover/drop）→dataTransfer→拖拽排序→库推荐→注意事项。

**示范要点**：

> HTML5拖拽API：可拖拽元素设置draggable=true，事件：①dragstart（开始拖拽，设置dataTransfer数据和effectAllowed）；②drag（拖拽中持续触发）；③dragend（拖拽结束）；目标元素事件：④dragenter（进入目标）；⑤dragover（在目标上移动，必须preventDefault才能触发drop）；⑥dragleave（离开目标）；⑦drop（释放，读取dataTransfer数据）。dataTransfer传递数据（setData/getData），也可传文件。拖拽排序实现：①记录拖拽元素的index；②dragover时计算目标位置，用insertBefore移动DOM或更新数据数组；③drop时确认最终位置。库推荐：react-beautiful-dnd（React）、vuedraggable（Vue）、SortableJS（通用）、dnd-kit（React现代方案）。注意：①dragover必须preventDefault；②移动端HTML5拖拽不支持，需要触摸事件或库；③拖拽时的视觉反馈（ghost元素、占位符）。

**雷区**：说dragover不需要preventDefault；不知道dataTransfer的作用；移动端用HTML5拖拽。

**追问链**：「拖拽排序的性能优化」「怎么实现跨列表拖拽」——继续考。

---

## Q101：前端怎么做移动端调试和真机调试（中频 | ★）

**变体问法**：「移动端bug怎么排查」「真机调试工具」

**考察点**：考察移动端开发的实战能力，H5开发必备。

**答题框架**：模拟器调试→真机调试（ChromeDevTools/Safari/vConsole/eruda）→抓包（Charles/Whistle）→常见问题→注意事项。

**示范要点**：

> 移动端调试方式：①模拟器：ChromeDevTools的DeviceMode模拟设备尺寸和触摸，但不能模拟真实设备性能和系统特性；②Android真机：USB连接，Chrome地址栏chrome://inspect，调试WebView；③iOS真机：Mac用Safari开发模式调试；④全平台：vConsole/eruda（在页面注入调试面板，查看console/network/element，适合测试环境）；⑤抓包：Charles/Whistle/Fiddler拦截请求，查看接口数据、修改请求、模拟弱网；⑥远程调试：内网穿透（ngrok）让手机访问本地服务。常见移动端问题：①点击延迟（300ms）；②1px边框；③软键盘遮挡输入框；④iOS橡皮筋效果；⑤safe-area适配（刘海屏）。注意：①生产环境不要引入vConsole；②真机调试要和电脑在同一WiFi；③HTTPS页面抓包需要安装证书。

**雷区**：说模拟器和真机一样；生产环境留vConsole；不知道抓包工具。

**追问链**：「iOS的safe-area怎么适配」「移动端软键盘遮挡怎么解决」——继续考。E·性能优化与网络安全性能和安全是前端的两大基石。性能优化要能测量、能归因、能落地；安全要懂常见攻击和防范。原则：先测量再优化，安全无小事。

---

