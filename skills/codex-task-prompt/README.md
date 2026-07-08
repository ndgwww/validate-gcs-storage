# Codex 任务提示词生成 Skill

`codex-task-prompt` 是一个“任务制定 + 交接提示词生成”skill，用来把已经讨论清楚的需求、当前仓库上下文和本地 skill/tool 状态，整理成一份可以直接交给下一轮 Codex 执行的提示词。

它适合用户还没有准备好直接开发代码，而是需要先明确目标、任务范围、实施路径、skill/MCP/工具选择、验收要求和阻塞条件的场景。

## 这个 Skill 解决什么问题

- 你刚接手一个项目，还不清楚代码模块和业务链路。
- 你有外部文档，例如 API 服务商、支付平台、云服务、浏览器态文档，需要 Codex 先规划怎么阅读和对齐本地代码。
- 你想先判断应该用哪些 skill、浏览器工具、MCP、导出文档或本地命令，再决定是否进入开发。
- 你想把当前对话整理成一份可以复制到新 Codex 会话中执行的提示词。

## 典型使用场景

- 新仓库接手：先梳理模块地图、代码入口、文档入口和业务主链路。
- 外部 API 或支付文档接入：先读文档、看现有链路、判断对齐方式和缺口。
- 云服务、对象存储、第三方服务接入：先明确权限、凭据、真实环境操作边界。
- 长对话后的任务收敛：把已经确认的目标、边界和待解决问题整理成下一轮执行提示词。
- 实施前准备：生成包含读取顺序、非范围、验证命令和停止条件的执行提示词。

## 不适合的场景

- 用户已经给出明确实现要求，可以直接开发代码。
- 用户要正式 PRD 文档，应使用 `prd-development` 或 `to-prd`。
- 用户要把计划发布成 issue，应在计划确认后使用 `to-issues`。
- 用户正在排查可复现 bug 或性能回归，应使用 `diagnose`。

## 职责边界

- 判断当前阶段：目标制定、需求梳理、调研计划、执行准备、开发实施、验收复盘。
- 基于本地仓库和已安装 skill/tool 状态做建议，不凭记忆决定。
- 编排已有 skills，而不是替代它们。
- 判断 MCP 是必需、可选还是不需要。
- 输出任务目标、范围、非范围、阅读顺序、skill/tool 路由、执行路径、验收标准和最终提示词。
- 默认不开发、不改文件、不安装 MCP、不创建正式项目文档，除非用户明确授权。

## 依赖 Skill 列表

这些是推荐配合使用的 skills。它们不是本 skill 内置的一部分，需要按需单独安装或启用。

| Skill | 作用 | GitHub | skills.sh | 安装命令 |
| --- | --- | --- | --- | --- |
| `find-skills` | 搜索和评估是否需要额外 skill、MCP、connector 或工具。 | `https://github.com/vercel-labs/skills` | `https://skills.sh/vercel-labs/skills/find-skills` | `npx skills@latest add vercel-labs/skills -g -a codex -s find-skills -y` |
| `zoom-out` | 新接手项目或不熟悉模块时，先建立项目大图和上下文。 | `https://github.com/mattpocock/skills` | `https://skills.sh/mattpocock/skills/zoom-out` | `npx skills@latest add mattpocock/skills -g -a codex -s zoom-out -y --full-depth` |
| `grill-with-docs` | 基于项目文档、术语和 ADR 反复追问计划边界。 | `https://github.com/mattpocock/skills` | `https://skills.sh/mattpocock/skills/grill-with-docs` | `npx skills@latest add mattpocock/skills -g -a codex -s grill-with-docs -y --full-depth` |
| `grill-me` | 缺少项目文档时，用连续追问澄清目标、取舍和决策。 | `https://github.com/mattpocock/skills` | `https://skills.sh/mattpocock/skills/grill-me` | `npx skills@latest add mattpocock/skills -g -a codex -s grill-me -y --full-depth` |
| `handoff` | 把确认后的上下文整理给下一轮 agent 或新会话。 | `https://github.com/mattpocock/skills` | `https://skills.sh/mattpocock/skills/handoff` | `npx skills@latest add mattpocock/skills -g -a codex -s handoff -y --full-depth` |
| `to-issues` | 计划确认后，把任务拆成可以独立领取的 issue。 | `https://github.com/mattpocock/skills` | `https://skills.sh/mattpocock/skills/to-issues` | `npx skills@latest add mattpocock/skills -g -a codex -s to-issues -y --full-depth` |
| `verification-before-completion` | 进入开发后，要求先运行验证命令，再声明完成。 | `https://github.com/obra/superpowers` | `https://skills.sh/obra/superpowers/verification-before-completion` | `npx skills@latest add obra/superpowers -g -a codex -s verification-before-completion -y --full-depth` |

## 工具依赖和可选能力

这些是 Codex 插件或工具能力，不通过 `npx skills` 安装：

- `chrome:control-chrome`：用于需要登录态、密码页、浏览器上下文或交互式文档的网页。
- `browser:control-in-app-browser`：用于本地预览、localhost 页面、公开网页和基础视觉检查。
- `chrome-devtools-mcp@latest`：Codex 已配置时，可用于浏览器调试和 DevTools 风格检查。
- `node_repl`：用于结构化 JavaScript 执行、本地数据检查和浏览器自动化辅助。

## MCP 使用策略

默认不推荐安装 MCP。

一次性网页文档、带密码的共享文档、可导出的 API 文档，优先使用 Chrome、浏览器工具或导出的 Markdown/OpenAPI/Postman/Apifox 文件。

只有同时满足下面条件时，才建议 MCP：

- 需要长期、反复读取同一个外部系统。
- 用户有项目 ID、访问 token、OAuth 或其他安全授权方式。
- MCP 能访问这次任务真正需要的数据。
- 结构化实时读取比导出文件更有价值。
- 用户明确同意安装或配置。

对于 Apifox 这类文档：如果只是带密码的共享链接，通常优先用 Chrome 登录态或导出文件；只有拿到项目级访问权限、项目 ID 和访问 token 时，才考虑 Apifox MCP。

## 和其他 Skill 的区别

- `handoff` 更偏会话交接；`codex-task-prompt` 更偏任务制定和严格执行提示词生成。
- `to-prd`、`prd-development` 产出产品文档；`codex-task-prompt` 产出 Codex 执行提示词。
- `to-issues` 用于拆分已确认计划；`codex-task-prompt` 用于判断计划是否已经能拆。
- `verification-before-completion` 应该被写入本 skill 生成的开发执行提示词中。

## 示例触发提示词

```text
Use codex-task-prompt。本轮不开发代码。请先帮我明确目标、任务范围、需要使用的 skills/tools/MCP、执行路径和最终 Codex 执行提示词。
```

```text
Use codex-task-prompt。把这次 API 接入讨论整理成下一轮 Codex 的 planning-only 提示词，不要实现代码。
```

```text
Use codex-task-prompt。判断这个外部文档调研任务应该用 MCP、Chrome、导出文档，还是只需要仓库搜索，然后生成下一轮执行提示词。
```

## 安装

从本合集安装：

```bash
npx skills@latest add ndgwww/agent-skills-storage -g -a codex -s codex-task-prompt -y --full-depth
```

安装后重启 Codex，让新的 skill 元数据重新加载。
