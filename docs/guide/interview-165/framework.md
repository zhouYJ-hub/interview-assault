# 框架与工程化

> 框架与工程化 | 36 题

## Q056：React的核心原理是什么？虚拟DOM和Diff算法（<span class="hot">必考</span> | ★★★）

**变体问法**：「React的渲染机制」「ReactFiber是什么」

**考察点**：考察React框架的深入理解，这是React面试最核心的题。

**答题框架**：JSX→虚拟DOM→Diff→Fiber调度→真实DOM更新，讲清每一步。

**示范要点**：

> React核心：①JSX编译为React.createElement调用，生成虚拟DOM（JS对象描述UI）；②状态变化时生成新虚拟DOM树，和旧树做Diff比较；③Diff策略：同层比较（不跨层）、key标识节点、组件类型不同直接替换；④Fiber架构：把渲染拆成可中断的小任务，用链表结构记录节点信息，支持优先级调度，避免长任务阻塞主线程；⑤Commit阶段把变更提交到真实DOM。React18引入并发渲染，支持startTransition、useDeferredValue等优先级控制。

**雷区**：说React直接操作真实DOM；不知道Fiber解决了什么问题；说Diff是全树O(n³)比较。

**追问链**：「Fiber的双缓存机制是什么」「React18的并发特性有哪些」——继续考。

---

## Q057：ReactHooks的原理，为什么不能写在条件语句中（<span class="hot">必考</span> | ★★★）

**变体问法**：「useState的实现原理」「Hooks的规则」

**考察点**：考察ReactHooks的底层理解，Hooks是React16.8后的核心。

**答题框架**：Hooks用链表/数组按调用顺序存储→每次渲染按顺序读取→条件语句会打乱顺序→useState/useEffect实现原理。

**示范要点**：

> Hooks的状态存在组件的fiber节点上，用链表按调用顺序存储。每次渲染时，React按顺序遍历hooks链表，第一个useState对应第一个状态，第二个对应第二个。如果写在条件语句中，某次渲染条件为true执行了hook，下次为false跳过，后续hooks的顺序就会错位，导致状态错乱。useState原理：首次渲染创建状态存入链表，setState触发重新渲染，渲染时按顺序从链表取出对应状态。useEffect原理：在commit阶段后执行，依赖项用Object.is比较，变化才执行。useMemo/useCallback用缓存避免重复计算/创建。

**雷区**：说Hooks的状态存在全局变量里；说条件语句中用hooks会报错（实际是行为异常，eslint会警告）；不知道useEffect的执行时机。

**追问链**：「手写一个简易useState」「useEffect和useLayoutEffect的区别」——继续考。

---

## Q059：React的状态管理方案有哪些，怎么选型（<span class="hot">必考</span> | ★★）

**变体问法**：「Redux和Zustand的区别」「Context和状态管理库的区别」

**考察点**：考察状态管理的全局视野和选型能力，实际项目必用。

**答题框架**：分类（本地状态/跨组件状态/服务端状态）→各方案特点（Context/Redux/Zustand/Jotai/Recoil/ReactQuery）→选型原则。

**示范要点**：

> 状态分三类：①本地状态（useState/useReducer，组件内）；②跨组件客户端状态（Context/Redux/Zustand/Jotai/Recoil）；③服务端状态（ReactQuery/SWR，专门处理缓存、重试、去重）。各方案：Context适合低频更新的全局数据（主题/用户信息），但Providervalue变化会导致所有消费者重渲染；Redux生态成熟、DevTools强大，但样板代码多（ReduxToolkit已改善）；Zustand轻量、API简洁、不包Provider，适合中小项目；Jotai原子化模型，细粒度更新；ReactQuery专门管服务端状态，自动缓存/重试/刷新，和客户端状态分开管理。选型：服务端状态优先用ReactQuery，客户端状态简单用Zustand，复杂大型用ReduxToolkit。

**雷区**：说Redux是唯一选择；把服务端状态也存在Redux里；不知道Context的性能问题。

**追问链**：「Redux的中间件原理」「ReactQuery的缓存机制」——继续考。

---

## Q060：React性能优化有哪些手段（<span class="hot">必考</span> | ★★★）

**变体问法**：「怎么避免React组件不必要的重渲染」「React.memo的原理」

**考察点**：考察React性能优化的实战能力，高级前端必考题。

**答题框架**：渲染优化（memo/useMemo/useCallback）→状态优化（状态下沉/拆分）→列表优化（key/虚拟列表）→代码分割→分析工具。

**示范要点**：

> ①渲染优化：React.memo包裹组件（浅比较props），useMemo缓存计算结果，useCallback缓存函数引用；②状态优化：状态尽量下沉到需要的组件，避免放在顶层；用useReducer拆分复杂状态；③列表优化：key用唯一ID不用index，长列表用虚拟列表（react-window）；④代码分割：React.lazy+Suspense路由懒加载，动态import；⑤避免在render中创建新对象/函数（会导致子组件memo失效）；⑥分析工具：ReactDevToolsProfiler、why-did-you-render定位不必要渲染；⑦服务端状态用ReactQuery减少请求。注意：不要过度优化，先测量再优化。

**雷区**：说useCallback能提升所有场景性能；说memo包裹所有组件就好；不知道memo是浅比较。

**追问链**：「React.memo和useMemo的区别」「怎么定位不必要的重渲染」——继续考。

---

## Q061：Vue3的响应式原理，和Vue2有什么区别（<span class="hot">必考</span> | ★★★）

**变体问法**：「Proxy和Object.defineProperty的区别」「Vue3

**考察点**：考察Vue框架的核心原理，Vue3是当前主流。

**答题框架**：Vue2（Object.defineProperty）→缺点→Vue3（Proxy）→优势→reactive/ref→依赖收集/触发。

**示范要点**：

> Vue2用Object.defineProperty递归遍历对象属性，拦截getter/setter。缺点：①无法检测对象属性新增/删除（需要$set）；②无法监听数组下标修改和length变化（重写了7个数组方法）；③初始化时就要递归遍历，性能差。Vue3用Proxy代理整个对象，拦截get/set/deleteProperty等13种操作。优势：①支持新增/删除属性；②原生支持数组；③惰性递归（访问到嵌套对象才代理）；④性能更好。reactive用Proxy创建响应式对象，ref用类包裹（.value访问，支持基本类型）。依赖收集：get时track收集effect，set时trigger触发effect更新。Vue3还做了编译优化：静态提升、补丁标记（PatchFlags）、缓存事件处理函数，运行时只更新动态部分。

**雷区**：说Vue3用Object.defineProperty；不知道Proxy的优势；说ref和reactive完全一样。

---

## Q066：Webpack的构建原理和核心概念（<span class="hot">必考</span> | ★★★）

**变体问法**：「Webpack的打包流程」「loader和plugin的区别」

**考察点**：考察工程化构建工具的深入理解，前端工程化核心。

**答题框架**：核心概念（entry/output/loader/plugin/mode）→构建流程（初始化→编译→输出）→loader（文件转换）→plugin（扩展功能）→HMR原理。

**示范要点**：

> Webpack核心概念：entry（入口）、output（输出）、loader（模块转换器，如babel-loader/css-loader）、plugin（扩展插件，如HtmlWebpackPlugin）、mode（development/production）。构建流程：①初始化：读取配置，创建Compiler实例，注册plugin；②编译：从entry出发，用对应loader解析文件，构建依赖图（AST分析import/require）；③优化：TreeShaking、代码分割、压缩；④输出：生成chunk写入文件系统。loader是函数，接收文件内容返回转换后的内容，在模块加载时执行；plugin基于Tapable钩子系统，在构建各阶段注入逻辑，功能更强大。HMR原理：dev-server和浏览器建立WebSocket，文件变化时推送更新，模块热替换不刷新页面。

**雷区**：说loader和plugin是一回事；不知道Webpack从入口构建依赖图；说HMR就是自动刷新。

**追问链**：「手写一个简单的loader/plugin」「Webpack的代码分割怎么配置」——继续考。

---

## Q067：Vite和Webpack的区别，Vite为什么快（<span class="hot">必考</span> | ★★★）

**变体问法**：「Vite的原理」「

**考察点**：考察现代构建工具的理解，Vite是当前主流，2026年高频题。

**答题框架**：开发模式差异（Vite基于ESM按需编译，Webpack全量打包）→生产构建（Rollup）→预构建（esbuild）→优势局限。

**示范要点**：

> Vite快的原因：①开发模式基于浏览器原生ESM，不需要打包整个应用，浏览器请求哪个模块就编译哪个，冷启动极快；Webpack需要从入口打包所有依赖才能启动。②依赖预构建用esbuild（Go编写，比JS快10-100倍），预构建第三方依赖（CommonJS转ESM、合并多模块）。③HMR基于ESM，修改模块只需让浏览器重新请求该模块，比Webpack的HMR更快。④生产构建用Rollup（比Webpack更轻量、TreeShaking更好）。局限：①开发环境不打包，浏览器请求数多（但HTTP/2多路复用影响不大）；②对CommonJS依赖需要预构建；③生态不如Webpack成熟（但快速发展中）。Vite5+已非常稳定。

**雷区**：说Vite生产环境也用esbuild打包（实际用Rollup）；说Vite完全不需要打包；不知道预构建的作用。

---

## Q071：ReactServerComponents（RSC）的原理和优势（<span class="hot">必考</span> | ★★★）

**变体问法**：「RSC和SSR的区别」「服务端组件和客户端组件」

**考察点**：考察React前沿技术，2026年React面试必考题。

**答题框架**：RSC定义→服务端组件vs客户端组件→和SSR的区别→优势（零JS/直接访问后端/流式渲染）→使用场景。

**示范要点**：

> RSC（ReactServerComponents）是在服务端渲染的React组件，不会发送JS到客户端，渲染结果以特殊的流格式（RSCpayload）发送给客户端，和客户端组件混合渲染。服务端组件（'useserver'或默认）：在服务端执行，可直接访问数据库/文件系统，不发送JS，无交互能力。客户端组件（'useclient'）：在浏览器执行，有状态和交互，发送JS。和SSR的区别：SSR是把组件渲染成HTML字符串发送，hydration后整个应用都是客户端的；RSC是组件级别的，服务端组件永远不在客户端运行，可以和客户端组件混合，且不需要hydration。优势：①零JS体积（服务端组件不发JS）；②直接访问后端资源，不需要API；③流式渲染，逐步显示；④自动代码分割。Next.jsAppRouter已全面采用RSC。

**雷区**：说RSC就是SSR；说服务端组件可以用useState；说RSC不需要客户端组件。

**追问链**：「RSC的流式渲染原理」「ServerActions是什么」——继续考。

---

## Q074：前端工程化包括哪些方面，你在项目中做过哪些工程化实践（<span class="hot">必考</span> | ★★★）

**变体问法**：「你怎么搭建前端工程化体系」「前端工程化的理解」

**考察点**：考察工程化全局视野和实践经验，中高级前端必考题。

**答题框架**：工程化维度（代码规范/构建/CI/CD/测试/监控/文档/组件库）→每个维度的工具和实践→结合项目讲具体成果。

**示范要点**：

> 前端工程化是用工具和流程提升开发效率和代码质量，包括：①代码规范：ESLint+Prettier+Stylelint+husky+lint-staged，提交前自动检查；②构建优化：Vite/Webpack配置，代码分割、TreeShaking、CDN、构建缓存；③CI/CD：GitLabCI/GitHubActions，自动lint、测试、构建、部署；④测试：单元测试（Vitest/Jest）、E2E测试（Cypress/Playwright）、组件测试；⑤监控：Sentry错误监控、性能监控（WebVitals）、用户行为埋点；⑥组件库/脚手架：内部组件库、CLI脚手架、项目模板；⑦文档：技术文档、组件文档（Storybook）；⑧环境管理：多环境配置、FeatureFlag。我在项目中主导了从Webpack迁移到Vite（构建时间从3min降到40s），搭建了组件库和CI流水线，代码评审覆盖率从40%提升到90%。

**雷区**：只说用了Webpack和ESLint；没有量化成果；工程化维度覆盖不全。

**追问链**：「你做的CI流水线具体有哪些阶段」「组件库怎么设计和维护」——继续考。

---

## Q088：React的Fiber架构解决了什么问题，原理是什么（<span class="hot">必考</span> | ★★★）

**变体问法**：「Fiber的双缓存」「React的调度机制」

**考察点**：考察React核心架构的深入理解，高级前端必考题。

**答题框架**：React15的问题（同步渲染不可中断，长任务阻塞）→Fiber是什么（链表结构的虚拟DOM）→核心能力（可中断/优先级/复用）→双缓存→调度器。

**雷区**：说Fiber就是虚拟DOM；说React渲染全程可中断（Commit阶段同步）；说Fiber用requestIdleCallback（实际用MessageChannel）。

**追问链**：「Fiber的双缓存机制是什么」「React的优先级有哪些」——继续考。

---

## Q055：什么是渐进式Web应用（PWA）？它的核心技术有哪些（高频 | ★★）

**变体问法**：「ServiceWorker的作用」「PWA怎么实现离线访问」

**考察点**：考察前端前沿技术的了解，移动端Web方向常考。

**答题框架**：PWA定义→核心特性（离线/推送/安装）→核心技术（ServiceWorker/Manifest/CacheAPI）→生命周期→优势局限。

**示范要点**：

> PWA（ProgressiveWebApp）是用Web技术构建的应用，具备原生应用的体验：离线访问、推送通知、可安装到桌面、快速加载。核心技术：①ServiceWorker：独立于网页的脚本，作为网络代理，可以拦截请求、缓存资源、后台同步，实现离线访问；②WebAppManifest：JSON文件，定义应用名称、图标、启动方式、主题色，支持安装到桌面；③CacheAPI：配合ServiceWorker缓存请求和响应；④PushAPI+NotificationAPI：实现推送通知。ServiceWorker生命周期：注册→安装（install，缓存静态资源）→激活（activate，清理旧缓存）→激活后拦截fetch事件。优势：跨平台、无需应用商店、更新即时；局限：iOS支持不完善、硬件能力有限。

**追问链**：「ServiceWorker的缓存策略有哪些」「PWA怎么更新缓存」——继续考。D·框架与工程化这是前端核心能力轮：React/Vue框架原理、TypeScript、构建工具、状态管理、工程化全都要会。原则：讲清原理、对比选型、结合项目实践。

---

## Q058：useEffect和useLayoutEffect的区别，使用场景（高频 | ★★）

**变体问法**：「useEffect的执行时机」「什么时候用useLayoutEffect」

**考察点**：考察React副作用钩子的深入理解，常考执行时机。

**答题框架**：执行时机对比（异步/同步）→浏览器渲染前后→使用场景→注意事项。

**示范要点**：

> useEffect：在浏览器完成绘制后异步执行，不阻塞渲染，适合大多数副作用（数据请求、订阅、DOM操作不影响布局）。useLayoutEffect：在DOM更新后、浏览器绘制前同步执行，会阻塞渲染，适合需要读取DOM布局并同步修改的场景（如测量元素尺寸后调整位置、避免闪烁）。执行顺序：useLayoutEffect（DOM更新后立即）→浏览器绘制→useEffect（绘制后）。注意：useLayoutEffect在SSR中会警告，因为服务端没有DOM。大多数情况用useEffect，只有需要避免视觉闪烁时才用useLayoutEffect。

**雷区**：说useEffect在渲染前执行；说useLayoutEffect和useEffect完全一样；不知道useLayoutEffect会阻塞渲染。

---

## Q062：Vue的CompositionAPI相比OptionsAPI有什么优势（高频 | ★★）

**变体问法**：「setup函数的作用」「Vue3

**考察点**：考察Vue3新特性的理解，CompositionAPI是Vue3的核心改进。

**答题框架**：OptionsAPI的问题（逻辑分散/mixin冲突）→CompositionAPI的优势（逻辑聚合/复用/TS支持/Tree-shaking）→对比。

**示范要点**：

> OptionsAPI按选项（data/methods/computed/watch）组织代码，一个功能的逻辑分散在不同选项中，大组件难以维护；mixin复用有命名冲突和来源不清晰的问题。CompositionAPI用setup函数，按逻辑功能组织代码，相关的状态和方法可以放在一起。优势：①逻辑聚合，相关代码在一起，可读性好；②逻辑复用用组合式函数（useXxx），比mixin更清晰，无命名冲突；③更好的TypeScript类型推导；④更好的Tree-shaking（未使用的函数不会被打包）；⑤更灵活的代码组织。注意：CompositionAPI不是必须，简单组件用OptionsAPI也可以。

**雷区**：说CompositionAPI就是把代码写在setup里；说OptionsAPI被废弃了；不知道组合式函数和mixin的区别。

**追问链**：「怎么写一个组合式函数」「Vue3的scriptsetup是什么」——继续考。

---

## Q063：Vue的生命周期钩子有哪些，每个阶段做什么（高频 | ★）

**变体问法**：「created和mounted的区别」「Vue3的生命周期钩子」

**考察点**：Vue基础题，考察组件生命周期的理解。

**答题框架**：Vue2生命周期（beforeCreate/created/beforeMount/mounted/beforeUpdate/updated/beforeDestroy/destroyed）→Vue3对应→使用场景。

**示范要点**：

> Vue2生命周期：①beforeCreate：实例初始化前，data和methods还不可用；②created：实例创建完成，data/methods可用，但DOM还没挂载，适合发请求；③beforeMount：挂载前，render函数首次调用；④mounted：挂载完成，DOM可用，适合操作DOM/初始化第三方库；⑤beforeUpdate：数据更新前，DOM还没更新；⑥updated：DOM更新完成；⑦beforeDestroy：销毁前，还能访问实例，适合清除定时器/事件监听；⑧destroyed：销毁完成。Vue3中beforeDestroy→beforeUnmount，destroyed→unmounted，新增setup（在beforeCreate之前）。注意：SSR中没有mounted等客户端钩子。

**雷区**：说created中能操作DOM；说mounted中所有子组件都挂载完成（要用$nextTick）；不知道Vue3的生命周期改名。

**追问链**：「$nextTick的原理」「父组件和子组件的生命周期执行顺序」——继续考。

---

## Q064：Vue的computed和watch的区别，使用场景（高频 | ★★）

**变体问法**：「computed的缓存原理」「watch和watchEffect的区别」

**考察点**：考察Vue响应式API的理解和使用，常用且易混淆。

**答题框架**：computed（计算属性，有缓存，依赖变化才重算）→watch（侦听器，执行副作用）→watchEffect（自动收集依赖）→选型。

**示范要点**：

> computed：计算属性，有缓存，依赖不变不会重新计算，适合派生数据（如fullName=firstName+lastName），必须有返回值。底层：computed创建一个lazy的effect，标记dirty，依赖变化时设dirty=true，下次访问才重新计算。watch：侦听器，监听指定数据源变化执行回调，适合执行副作用（如发请求、操作DOM），可以获取新旧值，支持immediate/deep。watchEffect：自动收集回调中用到的响应式依赖，不需要指定监听源，初始化立即执行。选型：需要派生值用computed，需要副作用用watch，依赖关系简单且要立即执行用watchEffect。

**雷区**：说computed没有缓存；说watch和computed可以互换；不知道watchEffect自动收集依赖。

---

## Q065：VueRouter的路由模式和原理（高频 | ★★）

**变体问法**：「hash模式和history模式的区别」「前端路由的实现原理」

**考察点**：考察前端路由的原理，SPA的核心技术。

**答题框架**：hash模式（#，onhashchange）→history模式（pushState，popstate）→对比→服务端配置→abstract模式。

**示范要点**：

> 前端路由有两种模式：①hash模式：URL带#，#后面的内容变化不会触发页面刷新，通过监听hashchange事件匹配路由。优点是兼容性好、不需要服务端配置；缺点是URL不美观、SEO差。②history模式：用HTML5的pushState/replaceState修改URL，监听popstate事件（浏览器前进后退触发），URL美观。缺点是刷新时会向服务器请求该路径，需要服务端配置fallback到index.html（Nginxtry_files），否则404。VueRouter还有abstract模式（非浏览器环境，如Node/Weex，用数组模拟历史记录）。路由守卫：全局（beforeEach/afterEach）、路由独享（beforeEnter）、组件内（beforeRouteEnter/Update/Leave）。

**雷区**：说history模式不需要服务端配置；说hashchange能监听pushState；不知道popstate只在前进后退触发。

**追问链**：「pushState和replaceState的区别」「路由懒加载怎么实现」——继续考。

---

## Q068：什么是TreeShaking？原理和前提条件（高频 | ★★★）

**变体问法**：「怎么实现TreeShaking」「

**考察点**：考察构建优化的深入理解，工程化常考题。

**答题框架**：定义（消除未使用代码）→原理（静态分析ESM导入导出）→前提（ESM/sideEffects/生产模式）→注意事项。

**示范要点**：

> TreeShaking是消除未使用代码（deadcode）的优化技术，减小打包体积。原理：ESModule是静态的，import/export在编译时就能确定依赖关系（不需要执行代码），构建工具可以静态分析哪些导出没有被使用并删除。前提条件：①必须用ESModule（import/export），CommonJS的require是动态的，无法静态分析；②package.json中配置sideEffects，标记哪些文件有副作用（不能被shaking）；③生产模式（mode:production），Webpack会自动做；④不要把模块导出的对象整体使用（如import*asobj，会导致无法判断哪些属性被用）。注意：函数调用有副作用的代码不会被shaking，需要sideEffects标记。CSS的TreeShaking需要PurgeCSS等工具。

**雷区**：说CommonJS也能TreeShaking；说sideEffects设为false就所有文件都没副作用；不知道TreeShaking需要静态分析。

**追问链**：「sideEffects字段怎么配置」「Webpack的TreeShaking和Rollup的区别」——继续考。

---

## Q069：前端模块化的发展历程，ESM和CommonJS的区别（高频 | ★★）

**变体问法**：「import和require的区别」「AMD/CMD/UMD是什么」

**考察点**：考察前端模块化的历史和原理，工程化基础。

**答题框架**：发展历程（全局函数→IIFE→AMD/CMD→CommonJS→ESM）→ESMvsCommonJS（静态/动态/同步/异步/导出值）→注意事项。

**示范要点**：

> 前端模块化发展：①全局函数（命名冲突）→②IIFE（私有作用域）→③AMD（RequireJS，异步加载，依赖前置）→④CMD（SeaJS，就近依赖）→⑤CommonJS（Node.js，同步加载，module.exports/require）→⑥ESM（ES6官方标准，import/export）。ESMvsCommonJS：①ESM是静态的，编译时确定依赖，支持TreeShaking；CommonJS是动态的，运行时加载；②ESM导出的是值的引用（绑定），CommonJS导出的是值的拷贝；③ESM是异步加载，CommonJS是同步加载；④ESM有严格模式，CommonJS默认非严格；⑤ESM在浏览器中原生支持（type=module），CommonJS需要打包。注意：在Node.js中，.mjs或package.jsontype=module才用ESM。

**雷区**：说ESM和CommonJS导出都是值拷贝；说AMD和CMD是一回事；不知道ESM是静态模块。

**追问链**：「ESM中exportdefault和export的区别」「循环依赖在ESM和CommonJS中的表现」——继续考。

---

## Q070：什么是微前端？实现方案和适用场景（高频 | ★★★）

**变体问法**：「qiankun的原理」「微前端和iframe的区别」

**考察点**：考察大型前端架构的理解，中高级前端常考题。

**答题框架**：微前端定义→解决的问题（巨石应用/多团队协作/技术栈兼容）→实现方案（iframe/qiankun/wujie/ModuleFederation）→优缺点→适用场景。

**示范要点**：

> 微前端是将大型前端应用拆分为多个独立子应用，每个子应用可独立开发、部署、运行，主应用负责整合和调度。解决问题：①巨石应用维护困难；②多团队协作冲突；③新旧技术栈共存（渐进式迁移）。实现方案：①iframe（最简单，但URL不同步、通信困难、样式隔离但体验差）；②qiankun（基于single-spa，JS沙箱+样式隔离，HTMLEntry加载子应用）；③wujie（基于WebComponents+iframe沙箱，更彻底的隔离）；④ModuleFederation（Webpack5内置，构建时模块共享，运行时加载）。适用场景：大型中后台系统、多团队协作、遗留系统迁移。注意：不是所有项目都需要微前端，小项目用反而增加复杂度。

**雷区**：说微前端就是iframe；说所有项目都应该用微前端；不知道qiankun的JS沙箱原理。

---

## Q073：Vue的Diff算法原理，和React的Diff有什么区别（高频 | ★★★）

**变体问法**：「Vue的双端比较算法」「key的作用」

**考察点**：考察框架虚拟DOMDiff的深入理解，常考对比。

**答题框架**：Vue2Diff（双端比较）→Vue3Diff（最长递增子序列优化）→ReactDiff（单指针+key）→对比→key的作用。

**示范要点**：

> Vue2Diff：双端比较算法，四个指针（旧头/旧尾/新头/新尾），依次比较四种组合（旧头新头、旧尾新尾、旧头新尾、旧尾新头），找到可复用节点就移动，都不匹配就用key建立映射查找。Vue3Diff：先用双端比较处理相同前缀和后缀，中间部分用最长递增子序列（LIS）算法，找到不需要移动的节点，只移动其他节点，减少DOM操作次数。ReactDiff：单指针从左到右遍历，用key建立旧节点的Map，新节点通过key查找旧节点，比较类型和位置，决定移动/创建/删除。key的作用：唯一标识节点，帮助Diff算法识别哪些节点可以复用，避免不必要的DOM重建。不能用index作为key（列表顺序变化时会导致状态错乱和性能问题）。

**雷区**：说Vue和React的Diff完全一样；说key是给Vue用的React不需要；不知道Vue3用了LIS优化。

---

## Q075：Git的常用操作和工作流，你怎么处理代码冲突（高频 | ★）

**变体问法**：「rebase和merge的区别」「Git工作流」

**考察点**：考察团队协作的基础能力，实际工作必备。

**答题框架**：常用命令→工作流（GitFlow/GitHubFlow/TrunkBased）→rebasevsmerge→冲突处理→代码回退。

**示范要点**：

> 常用命令：clone/init/add/commit/status/log/diff/branch/checkout/merge/rebase/pull/push/stash/reset/revert。工作流：①GitFlow（master/develop/feature/release/hotfix，适合版本发布明确的项目）；②GitHubFlow（main+feature分支，持续部署，简单）；③TrunkBased（主干开发+短生命周期分支+FeatureFlag，适合高频发布）。rebasevsmerge：merge保留完整历史，会产生合并节点；rebase把提交移到目标分支后面，历史线性更干净，但会改写提交历史，公共分支不要rebase。冲突处理：gitstatus看冲突文件→手动编辑解决→gitadd→gitrebase--continue（或merge--continue）。回退：reset（本地回退，--soft/--mixed/--hard）、revert（生成新提交撤销，安全）。

**雷区**：说rebase和merge完全一样；在公共分支用rebase；用reset回退已推送的提交。

**追问链**：「reset的三个参数区别」「怎么撤销已经push的提交」——继续考。

---

## Q076：前端测试有哪些类型，你怎么写单元测试（高频 | ★★）

**变体问法**：「Jest和Vitest的区别」「怎么测试React组件」

**考察点**：考察测试意识和实践，高质量前端必备。

**答题框架**：测试类型（单元/集成/E2E/快照）→工具链（Vitest/Jest+TestingLibrary+Cypress）→测试原则→组件测试方法。

**示范要点**：

> 测试类型：①单元测试：测试单个函数/组件，隔离依赖，用Vitest/Jest；②集成测试：测试多个模块协作，如组件+状态管理；③E2E测试：模拟真实用户操作，用Cypress/Playwright；④快照测试：记录组件渲染输出，防止意外变更。工具链：Vitest（Vite生态，快，兼容JestAPI）、Jest（成熟生态）、ReactTestingLibrary（按用户行为测试，不测实现细节）、Cypress/Playwright（E2E）。测试原则：①测试行为不测试实现；②Given-When-Then结构；③AAA模式（Arrange-Act-Assert）；④覆盖率不是越高越好，核心逻辑必须覆盖。组件测试：render组件→fireEvent模拟交互→assertDOM变化，mockAPI请求。注意：不要测试框架本身的功能。

**雷区**：说测试就是写断言；测试组件的内部state；追求100%覆盖率。

---

## Q077：什么是SSR？和CSR的区别，优缺点（高频 | ★★★）

**变体问法**：「SSR的原理」「Next.js/Nuxt的SSR」

**考察点**：考察服务端渲染的理解，SEO和首屏优化相关。

**答题框架**：CSR（客户端渲染）→SSR（服务端渲染）→对比（首屏/SEO/服务器压力/开发复杂度）→SSG/ISR→适用场景。

**示范要点**：

> CSR（Client-SideRendering）：服务器返回空HTML，浏览器下载JS后渲染页面，首屏慢、SEO差。SSR（Server-SideRendering）：服务器把组件渲染成HTML字符串返回，浏览器直接显示，首屏快、SEO好，但服务器压力大、开发复杂（需要处理window等浏览器API、hydration）。其他模式：①SSG（StaticSiteGeneration）：构建时生成静态HTML，最快，适合内容不频繁变化的页面；②ISR（IncrementalStaticRegeneration）：增量静态再生，按需重新生成页面，兼顾性能和实时性；③SPA+预渲染：关键页面预渲染，其他CSR。适用场景：SSR/SSG适合营销页、文档、电商商品页（SEO+首屏）；CSR适合中后台、用户登录后页面（SEO不重要）。Next.js（React）和Nuxt（Vue）是主流SSR框架。hydration：客户端JS接管服务端渲染的HTML，绑定事件，使页面可交互。

**雷区**：说SSR就是服务端渲染完就不用JS了；说SSR一定比CSR快；不知道hydration的概念。

**追问链**：「SSR的hydration是什么」「SSR中怎么处理window对象」——继续考。

---

## Q078：前端怎么做错误监控和性能监控（高频 | ★★）

**变体问法**：「Sentry的原理」「怎么监控前端性能」

**考察点**：考察线上质量保障意识，高级前端必备。

**答题框架**：错误监控（捕获方式/上报/Sentry）→性能监控（WebVitals/PerformanceAPI）→用户行为→告警→注意事项。

**示范要点**：

> 错误监控：①捕获方式：window.onerror（JS错误）、unhandledrejection（Promise错误）、try/catch（特定代码）、Vue/React的错误边界（errorHandler/componentDidCatch）、资源加载错误（performance.getEntries）；②上报：用navigator.sendBeacon（页面卸载也能发）或图片打点，批量上报；③Sentry：开源监控平台，自动捕获错误、sourcemap还原、堆栈分析、告警。性能监控：①WebVitals：LCP（最大内容绘制）、INP（交互到下一次绘制）、CLS（累积布局偏移）；②PerformanceAPI：navigationtiming、resourcetiming、longtask；③自定义指标：首屏时间、白屏时间、接口耗时。用户行为：埋点记录用户操作路径，错误时回放上下文。注意：监控不能影响页面性能，采样上报，保护用户隐私。

**雷区**：说window.onerror能捕获所有错误（不能捕获跨域脚本错误和Promise错误）；不知道sourcemap的作用；监控代码本身报错。

**追问链**：「跨域脚本的错误怎么捕获」「LCP怎么优化」——继续考。

---

## Q079：CSS预处理器（Sass/Less）和CSS-in-JS的区别和选型（高频 | ★★）

**变体问法**：「styled-components的原理」「TailwindCSS的理解」

**考察点**：考察CSS工程化方案的理解，样式方案选型。

**答题框架**：CSS预处理器（Sass/Less，变量/嵌套/mixin，编译为CSS）→CSSModules（局部作用域）→CSS-in-JS（styled-components，运行时生成）→Tailwind（原子化CSS）→对比选型。

**雷区**：说CSS预处理器和CSS-in-JS是一回事；说Tailwind就是内联样式；不知道CSSModules的作用域原理。

**追问链**：「styled-components的主题怎么实现」「CSSModules的原理」——继续考。

---

## Q081：React的受控组件和非受控组件的区别（高频 | ★）

**变体问法**：「什么是受控组件」「表单处理」

**考察点**：React基础题，考察表单处理的理解。

**答题框架**：受控组件（value+onChange，React控制）→非受控组件（ref/defaultValue，DOM控制）→对比→使用场景。

**示范要点**：

> 受控组件：表单元素的值由Reactstate控制，通过value属性绑定，onChange更新state。优点是实时验证、条件禁用、动态表单，React推荐方式。非受控组件：表单元素的值由DOM自己管理，用ref获取值，defaultValue设置初始值。优点是简单、适合一次性表单、和第三方DOM库集成。区别：受控组件每次输入都触发setState和重渲染，非受控不触发。使用场景：大多数情况用受控组件；简单表单、文件上传、集成第三方库时用非受控。注意：文件输入（inputtype=file）只能是非受控的，因为值是只读的。

**雷区**：说非受控组件不能设置初始值（用defaultValue）；说受控组件性能一定差；文件输入用受控。

**追问链**：「怎么处理大量表单的性能问题」「ReactHookForm的原理」——继续考。

---

## Q082：Vue的组件通信方式有哪些（高频 | ★）

**变体问法**：「父子组件怎么通信」「provide/inject的用法」

**考察点**：Vue基础题，考察组件间数据传递的掌握。

**答题框架**：父子（props/emit）→子父（emit）→兄弟（provide/inject/事件总线/状态管理）→跨层级（provide/inject/attrs/listeners）→v-model。

**示范要点**：

> Vue组件通信方式：①父子：props向下传数据，emits向上触发事件；②子父：$emit触发事件，父组件监听；③兄弟：通过共同父组件中转，或用状态管理（Pinia/Vuex）；④跨层级：provide/inject（祖先给后代提供数据，不需要逐层传递）；⑤v-model：语法糖，:modelValue+@update:modelValue，Vue3支持多个v-model；⑥$attrs/$listeners：透传属性和事件（Vue3中$listeners合并到$attrs）；⑦事件总线（mitt库，Vue3移除了$on）；⑧ref/$parent直接访问组件实例（不推荐，耦合高）。选型：简单父子用props/emit，全局状态用Pinia，深层传递用provide/inject。

**雷区**：说Vue3还有$on/$off（已移除）；说provide/inject是响应式的（需要传ref/reactive才响应式）；用$parent做复杂通信。

---

## Q085：什么是Babel？它的工作原理和常用配置（高频 | ★★）

**变体问法**：「Babel的编译过程」「preset-env的作用」

**考察点**：考察JS编译工具的理解，工程化基础。

**答题框架**：Babel定义→编译过程（parse→transform→generate）→preset/plugin→@babel/preset-env→polyfill→core-js。

**雷区**：说Babel能转换所有ES6+特性（API需要polyfill）；不知道AST；preset和plugin分不清。

**追问链**：「Babel的polyfill和runtime的区别」「browserslist的作用」——继续考。

---

## Q086：前端怎么做权限控制（路由权限/按钮权限/接口权限）（高频 | ★★★）

**变体问法**：「中后台系统的权限设计」「动态路由怎么实现」

**考察点**：考察中后台系统的核心能力，实际项目常用。

**答题框架**：权限模型（RBAC）→路由权限（动态路由/路由守卫）→按钮权限（指令/组件）→接口权限（token/拦截器）→数据权限。

**示范要点**：

> 前端权限控制通常基于RBAC（用户-角色-权限）模型：①路由权限：登录后获取用户角色和权限列表，根据权限动态生成路由表（Vue用addRoute，React用动态路由配置），路由守卫（beforeEach）校验是否有权限访问，无权限跳403；②按钮权限：自定义指令（v-permission）或权限组件（Permission），根据权限码控制按钮显示/禁用；③接口权限：请求拦截器统一带token，响应拦截器处理401（未登录）和403（无权限），token存在localStorage或cookie；④数据权限：通常后端控制，前端只做展示层过滤。实现要点：①权限数据存在Pinia/Vuex，持久化；②路由配置分静态路由（登录页/404）和动态路由（按权限加载）；③刷新页面时重新获取权限并重新生成路由；④按钮权限用全局指令，方便使用。注意：前端权限只是体验优化，真正的安全校验必须在后端。

**雷区**：说前端权限能保证安全（只是体验，后端必须校验）；权限数据存在前端不刷新；路由守卫死循环。

**追问链**：「动态路由刷新404怎么解决」「按钮权限指令怎么实现」——继续考。

---

## Q089：Vue的nextTick原理，和Vue2有什么区别（高频 | ★★）

**变体问法**：「$nextTick的实现」「Vue的异步更新队列」

**考察点**：考察Vue响应式更新机制的理解，常用API原理。

**答题框架**：Vue异步更新队列→nextTick的作用→实现原理（微任务降级策略）→Vue2vsVue3→使用场景。

**示范要点**：

> Vue的数据更新是异步的：修改data后不会立即更新DOM，而是把watcher推入队列，在下一个tick（微任务）中批量更新。nextTick的回调在DOM更新后执行，可以拿到更新后的DOM。实现原理：nextTick内部用微任务（Promise.then），不支持时降级为MutationObserver→setImmediate→setTimeout。Vue2和Vue3的区别：①Vue2的nextTick是实例方法（this.$nextTick）和全局方法（Vue.nextTick）；Vue3是组合式API（nextTick函数）；②Vue2的异步队列有watcher去重和排序；Vue3基于Scheduler，更精细的任务调度（pre/queue/post）；③Vue3的nextTick返回Promise。使用场景：修改数据后立即获取DOM尺寸、操作更新后的DOM、第三方库初始化。注意：nextTick的回调是微任务，在渲染前执行（DOM已更新但浏览器还没绘制）。

**雷区**：说nextTick的回调在渲染后执行（实际是DOM更新后、浏览器绘制前）；说nextTick只用Promise；不知道Vue的异步更新机制。

**追问链**：「Vue的watcher有哪些类型」「nextTick和setTimeout的区别」——继续考。

---

## Q072：React的Suspense和并发渲染机制（中频 | ★★★）

**变体问法**：「Suspense的原理」「React18的并发特性」

**考察点**：考察React18新特性的深入理解，高级前端常考。

**答题框架**：Suspense定义→工作原理（抛出Promise→捕获→显示fallback→resolve后重渲染）→并发渲染→startTransition→useDeferredValue。

**示范要点**：

> Suspense让组件可以在等待异步内容时显示fallback（加载状态）。原理：子组件渲染时如果抛出Promise，Suspense会捕获这个Promise，显示fallback，Promiseresolve后重新渲染子组件。React18的并发渲染：渲染是可中断的，React可以暂停、恢复、放弃渲染，优先级高的更新（如用户输入）可以打断低优先级更新。相关API：①startTransition：标记更新为低优先级（Transition），不阻塞用户输入；②useDeferredValue：延迟更新某个值，类似防抖；③useTransition：返回isPending和startTransition。Suspense配合React.lazy做代码分割，配合SWR/ReactQuery做数据加载，配合SSR做流式HTML。注意：并发渲染不是并行执行，而是可中断的协调。

**雷区**：说Suspense能捕获所有异步操作（只能捕获支持Suspense的数据源）；说并发渲染就是多线程；说startTransition能加速渲染。

**追问链**：「Transition和Urgent更新的区别」「Suspense在SSR中的作用」——继续考。

---

## Q080：什么是前端的设计系统（DesignSystem）？怎么搭建组件库（中频 | ★★★）

**变体问法**：「怎么设计一个通用组件库」「组件库的设计原则」

**考察点**：考察前端架构和组件设计能力，高级前端常考题。

**答题框架**：设计系统组成（设计令牌/组件库/文档/规范）→组件库设计原则（单一职责/可组合/受控非受控/无障碍）→技术选型→发布流程。

**示范要点**：

> 设计系统是一套完整的设计规范和组件库，包括：①设计令牌（DesignTokens）：颜色、字体、间距、圆角等变量，设计和开发共享；②组件库：基础组件（Button/Input/Modal）+业务组件；③文档：使用文档、设计规范、最佳实践；④工具：Figma组件库、代码脚手架。组件库设计原则：①单一职责，每个组件做一件事；②可组合，小组件组合成复杂组件；③同时支持受控和非受控（value/defaultValue）；④无障碍（ARIA、键盘导航、焦点管理）；⑤主题定制（CSS变量/DesignTokens）；⑥TypeScript类型支持。技术选型：React+TypeScript+Vite库模式+Rollup打包，CSS用CSSModules或Tailwind，文档用Storybook，发布用npm+Changesets，测试用Vitest+TestingLibrary。注意：组件库要考虑版本管理、按需加载、TreeShaking。

**雷区**：说组件库就是把常用组件封装一下；不考虑无障碍和主题；组件API设计不合理。

**追问链**：「组件库怎么实现按需加载」「怎么设计一个Modal组件」——继续考。

---

## Q083：Pinia相比Vuex有什么优势（中频 | ★★）

**变体问法**：「Pinia的原理」「Vue3

**考察点**：考察Vue状态管理的最新发展，Vue3官方推荐。

**答题框架**：Vuex的问题（mutations/actions/modules复杂）→Pinia的优势（简洁/TS友好/无mutations/组合式API）→核心概念→对比。

**示范要点**：

> Pinia是Vue3官方推荐的状态管理库，相比Vuex：①API更简洁，没有mutations（直接修改state），只有state/getters/actions；②更好的TypeScript支持，类型推导完善；③支持组合式API风格（defineStore），也支持选项式；④模块化设计，每个store独立，不需要嵌套modules；⑤支持插件扩展（持久化、devtools）；⑥更轻量（约1KB）。核心概念：state（状态）、getters（计算属性，有缓存）、actions（方法，支持同步/异步）。使用：defineStore('id',{state,getters,actions})或组合式风格（ref/computed/function）。Pinia默认支持devtools和时间旅行调试。注意：Pinia没有命名空间嵌套，store的id就是命名空间。

**雷区**：说Pinia不能做异步（actions支持async）；说Vuex被废弃了（Vuex仍维护但新项目推荐Pinia）；不知道Pinia的组合式写法。

**追问链**：「Pinia怎么持久化」「Pinia的store怎么在组件外使用」——继续考。

---

## Q084：Webpack的代码分割（CodeSplitting）怎么实现（中频 | ★★★）

**变体问法**：「splitChunks的配置」「路由懒加载原理」

**考察点**：考察构建优化的深入理解，性能优化常用。

**答题框架**：代码分割的三种方式（入口分割/动态import/optimization.splitChunks）→splitChunks配置→路由懒加载→预加载。

**示范要点**：

> Webpack代码分割三种方式：①多入口：entry配置多个入口，天然分割；②动态import：ES模块的动态import()，返回Promise，Webpack会把动态导入的模块单独打包成chunk；③optimization.splitChunks：自动提取公共代码和第三方依赖。splitChunks常用配置：chunks（all/async/initial，all表示同步和异步都分割）、minSize（最小体积）、maxSize（最大体积）、minChunks（最少引用次数）、cacheGroups（缓存组，如vendors提取node_modules）。路由懒加载：React用React.lazy(()=>import('./Page'))，Vue用()=>import('./Page.vue')，路由对应的组件单独打包，访问时才加载。预加载：webpackPrefetch（空闲时预加载未来可能用的资源）、webpackPreload（当前导航需要的资源，优先级高）。注意：不要过度分割，太多小chunk会增加请求数。

**雷区**：说代码分割就是把JS拆成多个文件；不知道splitChunks的cacheGroups；预加载和预获取分不清。

**追问链**：「splitChunks的chunks:all是什么意思」「怎么配置第三方库单独打包」——继续考。

---

## Q087：什么是前端的埋点？怎么设计埋点系统（中频 | ★★）

**变体问法**：「用户行为分析」「怎么统计PV/UV」

**考察点**：考察数据驱动和用户行为分析的能力，产品型前端常考。

**答题框架**：埋点类型（页面浏览/点击/曝光/自定义）→实现方式（代码埋点/可视化埋点/无埋点）→上报策略→数据处理→注意事项。

**示范要点**：

> 埋点是收集用户行为数据用于分析产品效果。类型：①PV/UV（页面浏览/独立访客）；②点击事件（按钮点击、链接点击）；③曝光事件（元素进入视口）；④自定义事件（如播放、购买）。实现方式：①代码埋点：手动调用track方法，精准但开发成本高；②可视化埋点：通过配置平台圈选元素，自动生成埋点；③无埋点（全埋点）：自动采集所有用户行为，事后筛选，数据量大但灵活。上报策略：①批量上报（攒N条或定时发）；②navigator.sendBeacon（页面卸载可靠上报）；③图片打点（兼容老浏览器）；④采样上报（高流量场景）。数据处理：上报到数据平台→清洗→入仓→可视化（BI看板）。注意：埋点不能影响性能；保护用户隐私（合规）；埋点规范统一（事件名/参数格式）。

**雷区**：说埋点就是统计PV；上报用同步请求阻塞页面；不考虑隐私合规。

**追问链**：「怎么实现元素曝光埋点」「埋点数据丢失怎么处理」——继续考。

---

## Q090：前端怎么做国际化（i18n）？（中频 | ★★）

**变体问法**：「多语言方案」「vue-i18n/react-intl的原理」

**考察点**：考察全球化项目的能力，出海产品常考。

**答题框架**：国际化内容（文本/日期/数字/货币/RTL）→方案（vue-i18n/react-intl/i18next）→实现要点→注意事项。

**示范要点**：

> 前端国际化包括：①文本翻译（多语言包）；②日期/时间格式（不同地区习惯不同）；③数字/货币格式；③复数形式（不同语言复数规则不同）；④RTL（阿拉伯语等从右到左）。方案：Vue用vue-i18n，React用react-intl或i18next。实现要点：①语言包按语言分文件（zh-CN.json/en-US.json），支持嵌套key；②用$t('key')或useTranslation获取文本；③动态切换语言，不需要刷新（响应式）；④语言持久化（localStorage），默认根据浏览器语言；⑤日期/数字用IntlAPI（Intl.DateTimeFormat/Intl.NumberFormat）；⑥RTL用dir属性和CSS逻辑属性（margin-inline-start）。注意：①文本中不要拼接字符串，用占位符（{name}）；②图片中的文字也要国际化；③翻译管理平台（如Crowdin）协作。

**雷区**：说国际化就是翻译文本；用字符串拼接动态内容；不考虑RTL和日期格式。

**追问链**：「怎么实现语言切换不刷新」「国际化的懒加载怎么实现」——继续考。

---

