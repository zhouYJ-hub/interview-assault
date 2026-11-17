# 前端基础与浏览器原理

> 前端基础与浏览器原理 | 27 题

## Q028：请解释JavaScript的事件循环（EventLoop）机制（<span class="hot">必考</span> | ★★★）

**变体问法**：「宏任务和微任务的区别」「说说浏览器的EventLoop」

**考察点**：考察JS异步编程的核心理解，这是前端最基础也最重要的原理之一。

**答题框架**：单线程→调用栈→任务队列（宏任务/微任务）→执行顺序→渲染时机，结合代码示例。

**示范要点**：

> JS是单线程的，所有代码在调用栈中执行。同步代码执行完后，事件循环开始：①清空所有微任务（Promise.then、MutationObserver、queueMicrotask）；②执行一个宏任务（setTimeout、setInterval、I/O、UI渲染）；③再次清空微任务；④循环。注意：每执行一个宏任务后都会清空微任务队列，而不是等所有宏任务执行完。Node.js的EventLoop略有不同，分timers/pending/prepare/poll/check/close六个阶段。

**雷区**：说微任务在宏任务之后执行（不精确）；分不清哪些是宏任务哪些是微任务；把Node和浏览器的EventLoop混为一谈。

**追问链**：「Promise.then里再setTimeout再Promise.then，执行顺序是什么」——出代码题考。

---

## Q029：什么是闭包？闭包有哪些应用场景和缺点（<span class="hot">必考</span> | ★★）

**变体问法**：「闭包的原理是什么」「闭包会导致什么问题」

**考察点**：考察JS作用域和内存管理的理解，闭包是JS的核心特性。

**答题框架**：定义（函数+词法环境）→形成条件→应用场景→缺点（内存泄漏）→如何避免。

**示范要点**：

> 闭包是指函数能够访问其词法作用域中的变量，即使该函数在其词法作用域之外执行。本质是函数对象持有对外部作用域的引用。应用场景：①私有变量/数据封装；②函数柯里化；③防抖节流；④模块化（IIFE）；⑤事件回调中保留状态。缺点：闭包会导致外部函数的变量无法被GC回收，使用不当会造成内存泄漏。避免：不需要时手动置null、避免在循环中创建闭包引用大对象。

**雷区**：只背定义讲不清原理；说闭包就是函数嵌套函数；不知道闭包会导致内存问题。

**追问链**：「写一个闭包的例子」「闭包中的变量存在哪里」——继续深挖。

---

## Q030：var、let、const的区别，底层实现有什么不同（<span class="hot">必考</span> | ★★）

**变体问法**：「什么是暂时性死区」「let和const的区别」

**考察点**：考察ES6基础和变量提升的理解，是前端面试开场必考题。

**答题框架**：从作用域、变量提升、重复声明、赋值四个维度对比→讲暂时性死区→底层实现差异。

**示范要点**：

> ①作用域：var是函数作用域，let/const是块级作用域；②变量提升：var会提升并初始化为undefined，let/const会提升但不初始化（暂时性死区TDZ），在声明前访问报ReferenceError；③重复声明：var允许，let/const不允许；④赋值：const声明时必须赋值且不可重新赋值（但对象属性可改）。底层：var的变量存在VariableEnvironment中，let/const存在LexicalEnvironment中，JS引擎在执行前会先扫描所有let/const声明但不初始化。

**雷区**：说let/const不会变量提升（错误，会提升但不初始化）；不知道暂时性死区；说const定义的对象不能修改属性。

**追问链**：「for循环中用var和let有什么区别」——出经典异步打印题。

---

## Q031：请解释原型和原型链（<span class="hot">必考</span> | ★★★）

**变体问法**：「__proto__和prototype的区别」「怎么实现继承」

**考察点**：考察JS面向对象的核心理解，原型链是JS继承的基础。

**答题框架**：prototype（函数的原型对象）→__proto__（对象的原型指针）→原型链查找→constructor→继承实现。

**雷区**：分不清prototype和__proto__；说原型链终点是undefined（是null）；讲不清class继承的底层。

**追问链**：「手写一个继承」「instanceof的原理是什么」——继续考。

---

## Q032：this的指向规则有哪些，call/apply/bind的区别（<span class="hot">必考</span> | ★★）

**变体问法**：「箭头函数的this指向」「怎么改变this指向」

**考察点**：考察JS中this的理解，这是JS中最容易混淆的概念之一。

**答题框架**：this的四种绑定规则（默认/隐式/显式/new）→箭头函数的this→call/apply/bind对比。

**示范要点**：

> this指向取决于调用方式：①默认绑定：独立函数调用，this指向全局对象（严格模式undefined）；②隐式绑定：作为对象方法调用，this指向该对象；③显式绑定：call/apply/bind指定this；④new绑定：构造函数中this指向新创建的实例。优先级：new>显式>隐式>默认。箭头函数没有自己的this，继承外层作用域的this，且不能被call/apply/bind改变。call和apply立即执行，call传参数列表，apply传参数数组；bind返回新函数不立即执行。

**雷区**：说箭头函数的this指向调用者；分不清call和apply；不知道new绑定优先级最高。

**追问链**：「出一道this指向的代码题」「手写bind」——继续考。

---

## Q033：Promise的原理和常用方法，async/await的实现原理（<span class="hot">必考</span> | ★★★）

**变体问法**：「Promise.all和Promise.race的区别」「async/await怎么实现的」

**考察点**：考察异步编程的深入理解，Promise是现代前端异步的基础。

**答题框架**：Promise状态机→then/catch→静态方法（all/race/allSettled/any）→async/await是Generator+Promise的语法糖。

**示范要点**：

> Promise有三种状态：pending/fulfilled/rejected，状态一旦改变不可逆。then返回新Promise实现链式调用。常用方法：all（全部成功才成功，一个失败就失败）、race（谁先完成返回谁）、allSettled（等全部完成，不管成功失败）、any（谁先成功返回谁，全部失败才失败）。async/await底层是Generator函数+Promise的语法糖：async函数返回Promise，await会暂停执行等待Promiseresolve，本质是把Generator的自动执行器封装了。

**雷区**：说Promise.all一个失败就返回所有结果（错误，只返回失败的那个）；不知道allSettled和any；说async/await是全新的异步机制。

**追问链**：「手写Promise」「Promise.all的并发限制怎么实现」——继续考。

---

## Q034：浏览器从输入URL到页面渲染完成经历了什么（<span class="hot">必考</span> | ★★★）

**变体问法**：「浏览器渲染流程」「从输入URL到页面展示的全过程」

**考察点**：考察浏览器原理的全局理解，这是前端最经典的面试题之一。

**答题框架**：DNS解析→TCP连接→TLS握手→HTTP请求→服务器响应→浏览器解析→渲染→关闭连接，每步讲关键。

**示范要点**：

> ①DNS解析：域名→IP地址，有缓存（浏览器→系统→路由器→ISP→根/顶级/权威DNS）；②TCP三次握手建立连接；③HTTPS还要TLS握手（协商加密套件、交换密钥）；④发送HTTP请求；⑤服务器处理并返回响应；⑥浏览器解析：HTML构建DOM树、CSS构建CSSOM、合并为渲染树（RenderTree）；⑦布局（Layout/Reflow）计算元素位置大小；⑧绘制（Paint）像素；⑨合成（Composite）图层显示。JS执行会阻塞DOM解析，CSS会阻塞渲染。注意：DNS预解析、预连接、缓存等优化点。

**雷区**：漏掉TCP握手或TLS；把DOM和渲染树混为一谈；不知道回流和重绘的区别。

---

## Q035：什么是回流（重排）和重绘？如何优化（<span class="hot">必考</span> | ★★）

**变体问法**：「Reflow和Repaint的区别」「怎么减少回流」

**考察点**：考察浏览器渲染原理和性能优化意识，前端性能优化的基础。

**答题框架**：定义→触发条件→区别→优化策略（批量修改、脱离文档流、transform、will-change）。

**示范要点**：

> 回流（Reflow/Layout）：元素的几何属性（宽高、位置、布局）改变，浏览器重新计算布局，开销大。重绘（Repaint）：元素外观改变（颜色、背景）但布局不变，只重新绘制，开销较小。回流一定触发重绘，重绘不一定触发回流。优化：①避免频繁操作DOM，用文档碎片或批量修改；②用transform/opacity做动画（只触发合成，不触发回流重绘）；③避免频繁读取offsetTop等属性（会强制同步布局）；④用will-change提升合成层；⑤避免table布局。

**雷区**：说重绘比回流开销大；不知道transform为什么不触发回流；频繁读写DOM属性不知道会强制回流。

**追问链**：「transform为什么不触发回流」「什么是合成层」——继续考。

---

## Q036：请解释CSS盒模型，box-sizing的作用（<span class="hot">必考</span> | ★）

**变体问法**：「标准盒模型和IE盒模型的区别」

**考察点**：CSS最基础的概念，考察CSS基本功。

**答题框架**：标准盒模型（content-box）→IE盒模型（border-box）→box-sizing属性→实际应用。

**示范要点**：

> CSS盒模型由content、padding、border、margin四部分组成。标准盒模型（content-box）：width/height只包含content，实际占位=width+padding+border+margin。IE盒模型（border-box）：width/height包含content+padding+border，实际占位=width+margin。box-sizing属性控制使用哪种模型，border-box更符合直觉，布局时不用反复计算padding和border的影响，所以常全局设置*{box-sizing:border-box}。

**雷区**：说margin属于盒模型的一部分（margin是盒外间距，不计入元素尺寸）；分不清两种模型的计算方式。

**追问链**：「margin重叠的规则是什么」「怎么解决margin重叠」——继续考。

---

## Q038：Flex布局的原理和常用属性（<span class="hot">必考</span> | ★★）

**变体问法**：「flex:1是什么意思」「justify-content和align-items的区别」

**考察点**：现代CSS布局的核心，考察实际布局能力。

**答题框架**：容器属性（flex-direction/justify-content/align-items/flex-wrap）→子项属性（flex-grow/shrink/basis/order/align-self）→flex简写。

**雷区**：说flex:1就是width:100%；分不清justify-content和align-items；不知道flex-basis的作用。

**追问链**：「flex:1和flex:auto的区别」「用flex实现三栏布局」——实操考。

---

## Q039：请解释HTTP缓存机制（强缓存和协商缓存）（<span class="hot">必考</span> | ★★★）

**变体问法**：「Cache-Control和ETag的区别」「浏览器缓存策略」

**考察点**：考察网络和性能优化的核心知识，前端性能优化的重要手段。

**答题框架**：强缓存（Cache-Control/Expires）→协商缓存（ETag/Last-Modified）→缓存决策流程→实际应用策略。

**示范要点**：

> 强缓存：不发请求，直接用缓存。由Cache-Control（HTTP/1.1，如max-age=31536000）和Expires（HTTP/1.0，绝对时间）控制。协商缓存：发请求验证资源是否更新，未更新返回304。由ETag（资源唯一标识，If-None-Match）和Last-Modified（最后修改时间，If-Modified-Since）控制。流程：先查强缓存→命中则直接用→未命中则发协商缓存请求→304用缓存→200用新资源。实际策略：HTML用协商缓存，JS/CSS/图片用强缓存+contenthash文件名。

**雷区**：说强缓存需要发请求；分不清ETag和Last-Modified的优先级；不知道304的含义。

**追问链**：「ETag和Last-Modified哪个优先」「no-cache和no-store的区别」——继续考。

---

## Q040：什么是跨域？如何解决跨域问题（<span class="hot">必考</span> | ★★）

**变体问法**：「CORS的原理」「同源策略是什么」

**考察点**：考察网络安全和前后端协作的基础知识，前端必考题。

**答题框架**：同源策略→跨域定义→解决方案（CORS/代理/JSONP/postMessage/WebSocket）→CORS预检请求。

**示范要点**：

> 同源策略：协议、域名、端口三者相同才是同源，不同源之间的请求会被浏览器拦截（注意是浏览器拦截，服务器能收到并返回）。解决方案：①CORS（主流）：服务端设置Access-Control-Allow-Origin等响应头，简单请求直接发，非简单请求先发OPTIONS预检；②代理：开发环境用devServerproxy，生产环境用Nginx反向代理；③JSONP（仅GET，已少用）；④postMessage（窗口间通信）；⑤WebSocket（不受同源策略限制）。CORS中withCredentials需要服务端设置Allow-Credentials:true且Allow-Origin不能为*。

**雷区**：说跨域是服务器拒绝请求；说JSONP支持POST；不知道预检请求OPTIONS。

**追问链**：「简单请求和非简单请求的区别」「CORS怎么带cookie」——继续考。

---

## Q044：防抖和节流的区别及实现原理（<span class="hot">必考</span> | ★★）

**变体问法**：「手写防抖节流」「debounce和throttle的应用场景」

**考察点**：考察JS性能优化和函数式编程，前端高频实用技能。

**答题框架**：定义区别→应用场景→实现原理（setTimeout+闭包）→立即执行版本。

**示范要点**：

> 防抖（debounce）：事件触发后等待n秒，如果n秒内再次触发则重新计时，最后只执行一次。适用于搜索框输入、窗口resize。节流（throttle）：固定时间间隔内只执行一次，不管触发多少次。适用于滚动事件、拖拽、鼠标移动。实现：都用闭包+setTimeout。防抖记录timer，每次触发清掉重新计时；节流记录上次执行时间，时间差大于间隔才执行。防抖有立即执行版（leading）和非立即执行版（trailing）。

**雷区**：说防抖和节流是一回事；应用场景搞反；手写时闭包变量不隔离。

**追问链**：「手写防抖和节流」「lodash的debounce有哪些选项」——继续考。

---

## Q045：请解释JavaScript的垃圾回收机制（<span class="hot">必考</span> | ★★★）

**变体问法**：「V8的垃圾回收算法」「什么是内存泄漏」

**考察点**：考察JS内存管理的深入理解，高级前端必考题。

**答题框架**：引用计数（已淘汰）→标记清除（主流）→V8分代回收（新生代/老生代）→内存泄漏场景。

**雷区**：说JS用引用计数回收；不知道V8分代回收；说闭包一定会内存泄漏。

**追问链**：「怎么排查内存泄漏」「新生代和老生代的晋升条件」——继续考。

---

## Q046：什么是虚拟DOM？它的优势和原理是什么（<span class="hot">必考</span> | ★★★）

**变体问法**：「虚拟DOM的diff算法」「

**考察点**：考察框架核心原理的理解，React/Vue的基础。

**答题框架**：定义（JS对象描述DOM）→优势（跨平台/批量更新/减少DOM操作）→diff算法（同层比较/key/三种策略）→注意不是所有场景都快。

**示范要点**：

> 虚拟DOM是用JS对象描述真实DOM的结构（tag/props/children）。优势：①跨平台（可渲染到原生/小程序）；②批量更新，减少DOM操作次数；③diff算法只更新变化的部分。diff算法：只同层比较（不跨层），key标识节点，三种策略：①树diff（同层）；②组件diff（同类型才比较）；③元素diff（key+index）。注意：虚拟DOM不是所有场景都快，首次渲染反而多了一层JS计算，优势在频繁更新的场景。直接操作DOM在简单场景可能更快。

**雷区**：说虚拟DOM一定比真实DOM快；说diff是全树比较；不知道key的作用。

**追问链**：「key的作用是什么，为什么不能用index」「React的diff和Vue的diff有什么区别」——继续考。

---

## Q051：什么是XSS和CSRF？如何防范（<span class="hot">必考</span> | ★★★）

**变体问法**：「前端安全问题有哪些」「怎么防止XSS攻击」

**考察点**：考察前端安全意识，高级前端必考题。

**答题框架**：XSS（注入恶意脚本）→类型（存储型/反射型/DOM型）→防范（转义/CSP/HttpOnly）；CSRF（冒充用户请求）→防范（token/SameSite/验证Referer）。

**示范要点**：

> XSS（跨站脚本攻击）：攻击者在页面注入恶意脚本，窃取cookie或操作页面。类型：存储型（存数据库，最危险）、反射型（URL参数）、DOM型（前端JS操作DOM）。防范：①输入输出转义（<>&"'）；②CSP内容安全策略；③cookie设HttpOnly；④避免innerHTML/eval/document.write。CSRF（跨站请求伪造）：攻击者诱导用户在已登录的网站上发起非预期请求。防范：①CSRFToken（每次请求带随机token）；②SameSitecookie属性（Strict/Lax）；③验证Referer/Origin；④敏感操作二次验证。

**雷区**：说XSS和CSRF是一回事；不知道HttpOnly能防XSS偷cookie；说CSRF需要注入脚本。

**追问链**：「CSP怎么配置」「SameSite的三个值区别」——继续考。

---

## Q037：BFC是什么？如何触发BFC，有什么用（高频 | ★★）

**变体问法**：「什么是块级格式化上下文」「BFC的应用场景」

**考察点**：考察CSS布局的深入理解，BFC是清除浮动、防止margin重叠的关键。

**答题框架**：定义→触发条件→特性→应用场景（清除浮动、防止margin重叠、自适应布局）。

**示范要点**：

> BFC（BlockFormattingContext）是一个独立的渲染区域，内部元素的布局不会影响外部。触发条件：①float不为none；②position为absolute/fixed；③display为inline-block/flex/grid/table-cell；④overflow不为visible。特性：①内部box垂直排列；②margin重叠只发生在同一BFC内；③BFC区域不会与float元素重叠；④计算BFC高度时包含浮动元素。应用：①清除浮动（父元素overflow:hidden）；②防止margin重叠；③两栏自适应布局（左侧float，右侧overflow:hidden）。

**雷区**：说overflow:hidden是清除浮动的唯一方法；不知道BFC能防止margin重叠；触发条件记不全。

**追问链**：「还有哪些清除浮动的方法」「IFC是什么」——继续考。

---

## Q041：HTTP和HTTPS的区别，HTTPS的握手过程（高频 | ★★★）

**变体问法**：「HTTPS

**考察点**：考察网络安全基础，前端需要了解HTTPS原理。

**答题框架**：HTTPvsHTTPS（端口/加密/证书）→TLS握手过程（非对称加密交换密钥→对称加密传输）→证书验证。

**示范要点**：

> HTTP明文传输、端口80、无身份验证；HTTPS加密传输、端口443、有CA证书验证身份。TLS握手：①客户端发送ClientHello（支持的加密套件、随机数）；②服务器返回ServerHello（选定加密套件、随机数、证书）；③客户端验证证书（CA链、有效期、域名），生成预主密钥用服务器公钥加密发送；④双方用三个随机数+预主密钥生成会话密钥；⑤后续用对称加密（AES）传输数据。非对称加密用于交换密钥，对称加密用于传输数据（性能好）。

**雷区**：说HTTPS全程用非对称加密；不知道证书验证过程；说HTTPS端口是8080。

---

## Q042：HTTP/2相比HTTP/1.1有哪些改进（高频 | ★★）

**变体问法**：「多路复用是什么」「HTTP/2的特性」

**考察点**：考察网络协议的前沿知识，性能优化相关。

**答题框架**：二进制分帧→多路复用→头部压缩→服务器推送→流量控制和优先级。

**示范要点**：

> HTTP/2的改进：①二进制分帧：所有消息都拆成二进制帧，更高效解析；②多路复用：一个TCP连接上并行多个请求响应，解决HTTP/1.1的队头阻塞；③头部压缩（HPACK）：静态表+动态表+霍夫曼编码，减少重复头部传输；④服务器推送：服务器可以主动推送资源给客户端；⑤流量控制和优先级：可以设置请求优先级。注意：HTTP/2基于TCP，TCP层仍有队头阻塞；HTTP/3用QUIC（基于UDP）解决了这个问题。

**雷区**：说HTTP/2解决了所有队头阻塞；不知道头部压缩用的是HPACK；说HTTP/2不需要TCP。

**追问链**：「HTTP/3和QUIC了解吗」「HTTP/2多路复用的原理」——继续考。

---

## Q043：JavaScript的深拷贝和浅拷贝，如何实现深拷贝（高频 | ★★）

**变体问法**：「手写深拷贝」「JSON.parse(JSON.stringify())有什么问题」

**考察点**：考察JS数据类型和引用类型的理解，常考手写代码。

**答题框架**：浅拷贝（Object.assign/展开运算符）→深拷贝→JSON方法的局限→递归实现→循环引用处理。

**示范要点**：

> 浅拷贝只复制第一层属性，嵌套对象仍共享引用；深拷贝递归复制所有层级。JSON.parse(JSON.stringify())的问题：①无法处理函数、undefined、Symbol（会丢失）；②无法处理循环引用（报错）；③Date会变成字符串；④RegExp会变成空对象；⑤NaN/Infinity变成null。手写深拷贝：递归遍历对象属性，用WeakMap处理循环引用，区分数组/对象/Date/RegExp/Map/Set等特殊类型。也可以用structuredClone（浏览器原生API，支持循环引用但不支持函数）。

**雷区**：说展开运算符是深拷贝；不知道JSON方法的局限；手写深拷贝不处理循环引用。

**追问链**：「手写一个深拷贝函数」「WeakMap和Map的区别」——继续考。

---

## Q047：TypeScript相比JavaScript有什么优势，常用的高级类型有哪些（高频 | ★★）

**变体问法**：「any和unknown的区别」「TypeScript的泛型和工具类型」

**考察点**：考察TypeScript的掌握程度，2026年前端标配技能。

**答题框架**：TS优势（类型安全/IDE支持/重构/文档）→基本类型→高级类型（联合/交叉/泛型/工具类型）→any/unknown/never。

**示范要点**：

> TS优势：①静态类型检查，编译期发现错误；②更好的IDE提示和重构支持；③类型即文档；④大型项目可维护性。常用高级类型：联合类型（A|B）、交叉类型（A&B）、泛型（&lt;T>）、工具类型（Partial/Required/Pick/Omit/Record/ReturnType/Parameters）、条件类型（TextendsU?X:Y）、映射类型（inkeyof）、infer推断。any跳过类型检查，unknown是类型安全的any（使用前必须类型收窄），never是永不存在的值的类型。

**雷区**：说TS就是给JS加类型这么简单；不知道常用工具类型；any和unknown分不清。

**追问链**：「手写一个Pick的实现」「什么是类型收窄」——继续考。

---

## Q048：请解释CSS选择器的优先级和计算规则（高频 | ★★）

**变体问法**：「!important的优先级」「CSS权重计算」

**考察点**：CSS基础但常考，考察样式冲突的处理能力。

**答题框架**：优先级排序（!important>内联>ID>类/属性/伪类>标签/伪元素>通配符）→权重计算→继承和层叠。

**示范要点**：

> CSS优先级从高到低：!important>内联样式(1000)>ID选择器(0100)>类/属性/伪类选择器(0010)>标签/伪元素选择器(0001)>通配符/继承(0000)。权重计算：不是简单的十进制相加，而是按位比较（如11个类选择器不会超过1个ID选择器）。同优先级时后面的覆盖前面的。继承的样式优先级最低，通配符选择器比继承高。注意：!important应尽量少用，会破坏层叠规则。

**雷区**：说权重是十进制相加（10个类=1个ID是错误的）；说伪元素和伪类优先级一样；不知道继承优先级最低。

**追问链**：「#id.class和.class#id哪个优先级高」「CSS加载顺序对优先级的影响」——继续考。

---

## Q049：什么是事件委托（事件代理）？原理和优势是什么（高频 | ★★）

**变体问法**：「事件冒泡和捕获的区别」「addEventListener的第三个参数」

**答题框架**：事件流（捕获→目标→冒泡）→事件委托原理→优势（减少事件绑定/动态元素）→注意事项。

**示范要点**：

> 事件流分三个阶段：捕获阶段（从window到目标）、目标阶段、冒泡阶段（从目标到window）。addEventListener第三个参数useCapture，true为捕获，false（默认）为冒泡。事件委托：把事件绑定在父元素上，利用事件冒泡，通过event.target判断实际触发元素。优势：①减少事件绑定数量，节省内存；②动态添加的元素也能响应事件（不需要重新绑定）。注意：事件委托不适合不冒泡的事件（如blur/focus用focusin/focusout代替）；需要判断target时注意嵌套元素。

**雷区**：说事件委托用捕获实现；不知道哪些事件不冒泡；说事件委托一定比直接绑定好。

**追问链**：「stopPropagation和stopImmediatePropagation的区别」「React的合成事件了解吗」——继续考。

---

## Q050：localStorage、sessionStorage、cookie的区别（高频 | ★）

**变体问法**：「前端存储方案有哪些」「IndexedDB和localStorage的区别」

**考察点**：考察前端存储的基础知识，常用技能。

**答题框架**：对比维度（容量/有效期/作用域/与服务器通信/API）→其他存储方案（IndexedDB/WebSQL/CacheAPI）。

**示范要点**：

> ①cookie：容量4KB，每次HTTP请求都会携带，可设置过期时间，域名和路径限制，适合存少量需要发给服务器的数据（如sessionid）；②localStorage：容量5-10MB，永久存储（除非手动清除），同源共享，不发给服务器；③sessionStorage：容量5-10MB，标签页关闭即清除，仅当前标签页共享，不发给服务器。其他：IndexedDB（大容量结构化存储，异步，支持索引）、CacheAPI（缓存请求/响应，PWA用）、WebSQL（已废弃）。注意XSS风险，敏感数据不要存前端。

**雷区**：说sessionStorage和localStorage容量一样大但不限制；说cookie不会发给服务器；不知道IndexedDB。

**追问链**：「localStorage有什么安全风险」「怎么实现localStorage的过期时间」——继续考。

---

## Q052：请解释浏览器的同源策略和内容安全策略（CSP）（高频 | ★★★）

**变体问法**：「CSP的作用和配置」「怎么限制页面加载的资源」

**考察点**：考察浏览器安全策略的深入理解，安全方向常考。

**答题框架**：同源策略（协议/域名/端口）→限制范围→CSP定义→配置方式（meta/响应头）→常用指令→效果。

**雷区**：说同源策略限制所有资源加载；不知道CSP可以用meta标签；说CSP能防CSRF。

**追问链**：「CSP的strict-dynamic是什么」「怎么绕过CSP」——继续考。

---

## Q053：什么是WebWorker？它的作用和使用场景（中频 | ★★）

**变体问法**：「JS是单线程的，怎么处理大计算量」「ServiceWorker和WebWorker的区别」

**考察点**：考察浏览器多线程和性能优化的知识，高级前端常考。

**答题框架**：WebWorker定义→使用方式（postMessage/onmessage）→限制（不能操作DOM/同源）→类型（专用/共享/ServiceWorker）→场景。

**示范要点**：

> WebWorker让JS可以在后台线程运行，不阻塞主线程，适合大计算量任务（如大数据处理、加密、复杂计算）。使用：newWorker('worker.js')，主线程和worker通过postMessage/onmessage通信。限制：①不能操作DOM；②不能访问window/document；③必须同源；④数据传递是结构化克隆（大对象有性能开销，可用TransferableObjects转移所有权）。类型：专用Worker（DedicatedWorker）、共享Worker（SharedWorker，多标签共享）、ServiceWorker（网络代理，PWA核心，生命周期不同）。场景：图片处理、音视频编码、大数据排序、离线缓存。

**雷区**：说WebWorker能操作DOM；说ServiceWorker就是WebWorker；不知道数据传递是克隆。

**追问链**：「ServiceWorker的生命周期」「怎么用WebWorker做离线缓存」——继续考。

---

## Q054：请解释requestAnimationFrame的原理和使用场景（中频 | ★★）

**变体问法**：「rAF和setTimeout的区别」「

**考察点**：考察浏览器渲染和动画优化的知识。

**答题框架**：rAF定义→与显示器刷新率同步→优势（流畅/节能/后台标签自动暂停）→使用场景→和setTimeout对比。

**示范要点**：

> requestAnimationFrame（rAF）：告诉浏览器在下次重绘前执行指定回调，回调频率与显示器刷新率一致（通常60fps，即每16.7ms一次）。优势：①与刷新率同步，动画更流畅，不会丢帧；②浏览器自动优化，后台标签页自动暂停节省CPU；③不需要手动计算时间间隔。和setTimeout的区别：setTimeout是固定延迟（可能与刷新率不同步导致丢帧），rAF是在渲染前执行。使用场景：JS动画、Canvas绘制、滚动联动、性能监控。注意：rAF的回调在主线程执行，长任务仍会卡顿。

**雷区**：说rAF是16ms执行一次（实际是和刷新率同步，144Hz屏就是6.9ms）；说rAF在后台标签也执行；不知道rAF返回id可以cancel。

**追问链**：「怎么用rAF实现节流」「rAF和CSS动画哪个性能好」——继续考。

---

