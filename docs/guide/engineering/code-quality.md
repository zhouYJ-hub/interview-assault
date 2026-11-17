# 代码质量篇（Q16 - Q18）

> 覆盖：ESLint/Prettier 分工、husky + lint-staged、Git 规范

## Q16：ESLint 和 Prettier 的分工？

```text
ESLint：代码质量 + 代码风格（可自定义规则）
  -> 检查未使用变量、强制 === 、禁止 var
  -> 也检查格式（缩进、引号）但不如 Prettier 专业

Prettier：纯代码格式化（不做质量检查）
  -> 统一缩进、引号、分号、换行
  -> 保存时自动格式化

分工：ESLint 管质量，Prettier 管格式
冲突：两者都有格式规则会打架 -> eslint-config-prettier 解决
```

```json
// .eslintrc.json
{
  "extends": [
    "eslint:recommended",
    "plugin:vue/vue3-recommended",
    "prettier"    // 必须放最后！关闭所有与 Prettier 冲突的 ESLint 规则
  ]
}

// .prettierrc
{
  "semi": false,        // 不要分号
  "singleQuote": true,  // 单引号
  "printWidth": 100,    // 换行宽度
  "trailingComma": "es5"
}
```

---

## Q17：husky + lint-staged 工作流？（<span class="hot">高频</span>）

**解决的问题**：`npm run lint` 检查全项目太慢，而且不能强制每次提交都检查。

```text
完整工作流：
  git commit
    |
    v（husky 拦截 pre-commit 钩子）
  lint-staged
    -> 只检查 staged（暂存区）的文件，不是全项目
    |
    v（并行执行）
  ① eslint --fix   -> 修复代码质量
  ② prettier --write -> 格式化
    |
    v（全部通过）
  允许 commit ✅
    |
    v（如果有错误）
  阻止 commit ❌ + 控制台显示错误
```

```bash
# 安装
npm install -D husky lint-staged

# 初始化 husky
npx husky install
npx husky add .husky/pre-commit "npx lint-staged"
```

```json
// package.json
{
  "lint-staged": {
    "*.{js,ts,vue}": ["eslint --fix", "prettier --write"],
    "*.{css,scss,json,md}": ["prettier --write"]
  }
}
```

**面试回答**：husky 拦截 Git 的 pre-commit 钩子，lint-staged 只检查暂存区文件（不是全项目），并行执行 eslint 修复和 prettier 格式化——**保证每个提交都是规范代码，而且速度极快**。

---

## Q18：Git 规范与 commitlint？

```bash
# 安装 commitlint + husky 集成
npm install -D @commitlint/config-conventional
npx husky add .husky/commit-msg "npx --no -- commitlint --edit $1"
```

```js
// commitlint.config.js
module.exports = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'type-enum': [2, 'always', [
      'feat',     // 新功能
      'fix',      // 修复 bug
      'docs',     // 文档
      'style',    // 格式（不影响逻辑）
      'refactor', // 重构
      'perf',     // 性能优化
      'test',     // 测试
      'chore'     // 构建工具/辅助
    ]]
  }
}

// 合法提交示例：
// git commit -m "feat: 新增用户导出功能"
// git commit -m "fix: 修复列表页滚动加载重复请求"
// git commit -m "docs: 更新 README"
```

**工具链完整版**：

```text
husky（Git 钩子）
  ├── pre-commit  -> lint-staged -> eslint + prettier（代码检查）
  └── commit-msg  -> commitlint（提交信息规范）
```

## 本篇速答

| 问题 | 答案 |
| --- | --- |
| ESLint 和 Prettier 分工？ | ESLint 管质量，Prettier 管格式 |
| 冲突怎么解决？ | eslint-config-prettier 放 extends 最后 |
| lint-staged 为什么快？ | 只检查暂存区文件，不是全项目 |
| husky 做什么的？ | 拦截 Git 钩子，在 commit 前自动执行检查 |
| commitlint 检查什么？ | 提交信息格式（feat/fix/docs...） |
