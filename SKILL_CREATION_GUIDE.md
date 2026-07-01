# Skill 创建与发布避坑指南

本文是 `agent-skills-storage` 仓库的维护教程，用来沉淀本次创建、发布、重命名和安装 `validate-gcs-storage` skill 过程中遇到的问题。后续新增 storage 相关 skill 时，优先按本文执行。

## 1. 仓库定位

本仓库是 skill 合集仓库，而不是单个 skill 的根目录。根目录用于 GitHub 说明和维护规则，真正可安装的 skill 放在 `skills/` 下。

当前结构：

```text
agent-skills-storage/
├── README.md
├── AGENTS.md
├── SKILL_CREATION_GUIDE.md
└── skills/
    └── validate-gcs-storage/
        ├── SKILL.md
        ├── agents/
        ├── examples/
        ├── references/
        └── scripts/
```

安装时必须显式选择内层 skill：

```bash
npx skills@latest add ndgwww/agent-skills-storage -g -a codex -s validate-gcs-storage -y --full-depth
```

## 2. 本次踩坑记录

### 根目录单 SKILL.md 不适合带资源分发

最初仓库根目录就是 `SKILL.md`。这种结构安装最简单，但在当前安装链路中曾出现只复制主入口文件、辅助资源不可见的问题。对于需要 `examples/`、`references/`、`scripts/` 的 skill，应使用合集结构：

```text
skills/<skill-name>/SKILL.md
```

### `--full-depth` 的作用是发现内层 skill

`--full-depth` 不是“强制复制所有资源”的开关。它的关键作用是让安装器继续搜索子目录中的 `SKILL.md`。因此合集仓库安装时还要配合 `-s <skill-name>` 明确选择目标 skill。

### 不要用 `npx skills@latest init --help` 探测帮助

本机曾出现该命令意外生成目录和 `SKILL.md` 的情况。需要看帮助时使用顶层帮助：

```bash
npx skills@latest --help
```

### README 不是 skill runtime 依赖

`README.md` 是给 GitHub 访客看的说明。Codex 运行 skill 时依赖的是被安装到 `~/.agents/skills/<skill-name>/` 的内容。不要把运行时必须遵守的规则只写在 README 里。

### 安装成功必须检查真实安装目录

不要只看 CLI 显示 installed。每次发布后都要检查：

```bash
find ~/.agents/skills/validate-gcs-storage -maxdepth 4 -type f -print | sort
```

如果缺少 `examples/`、`references/`、`scripts/`，说明安装包结构或命令仍有问题。

### 校验脚本要兼容源码仓库和安装目录

源码仓库中可以检查根目录 README 和禁止根目录 `SKILL.md`。安装目录中没有仓库根 README，因此脚本不能假设自己总在源码仓库里运行。

校验脚本也不要在安装目录中扫描整个 `~/.agents`，否则可能误命中其他 skill 的示例文字。安装后只扫描当前 skill 目录即可。

## 3. 新增 skill 的标准结构

新增 skill 时使用下面结构：

```text
skills/<skill-name>/
├── SKILL.md
├── agents/
│   └── openai.yaml
├── examples/
├── references/
└── scripts/
    └── validate-skill.sh
```

规则：

- `SKILL.md` 是入口，不是长篇手册。
- `references/` 放详细规范、官方链接、决策依据。
- `examples/` 放可复用代码形状、命令形状和验证模板。
- `scripts/` 放确定性校验脚本，减少 agent 重复生成检查逻辑。
- `agents/openai.yaml` 放 Codex UI 元数据。

## 4. SKILL.md 编写约束

frontmatter 只保留：

```md
---
name: <skill-name>
description: <clear capability and trigger text>
---
```

`description` 要满足：

- 第一句说明这个 skill 做什么。
- 第二句用 “Use when ...” 风格说明触发场景。
- 包含用户可能会说出的关键词。
- 不超过 1024 字符。

正文建议包含：

- 核心边界和安全规则。
- 资源路由：什么场景读哪个 `references/` 或 `examples/` 文件。
- 标准工作流。
- 输出格式或验收口径。

不要把所有细节塞进 `SKILL.md`。如果内容超过约 100 行，优先拆到 `references/` 或 `examples/`。

## 5. 安全与敏感信息规则

禁止提交：

- 本地环境配置文件。
- 云服务账号 JSON。
- 私钥或密钥材料。
- 真实临时授权 URL。
- URL 签名查询参数。
- 生产 bucket、对象路径和授权信息的可直接复用组合。

需要写示例时使用占位符，例如：

```text
PROJECT_ID
BUCKET_NAME
OBJECT_NAME
SIGNED_URL_PLACEHOLDER
```

## 6. 标准开发流程

1. 创建 `skills/<skill-name>/`。
2. 写 `SKILL.md`，确认 frontmatter 和 description。
3. 按需补充 `references/`、`examples/`、`scripts/`。
4. 写或复制 `scripts/validate-skill.sh`，让它能在源码仓库和安装目录中运行。
5. 运行本地校验。
6. 提交并 push。
7. 删除旧安装，从 GitHub 重新安装。
8. 检查安装目录文件清单。
9. 用 `npx skills@latest ls -g -a codex --json` 确认列表可见。
10. 重启 Codex，让新 skill 元数据刷新。

## 7. 当前仓库常用命令

源码校验：

```bash
cd /Users/mac004/Desktop/ndgwww/agent-skills-storage
bash skills/validate-gcs-storage/scripts/validate-skill.sh
git diff --check
```

安装验证：

```bash
npx skills@latest remove validate-gcs-storage -g -a codex -y
npx skills@latest add ndgwww/agent-skills-storage -g -a codex -s validate-gcs-storage -y --full-depth
find ~/.agents/skills/validate-gcs-storage -maxdepth 4 -type f -print | sort
bash ~/.agents/skills/validate-gcs-storage/scripts/validate-skill.sh
npx skills@latest ls -g -a codex --json
```

当前安装完整性应包含：

```text
SKILL.md
agents/openai.yaml
examples/
references/
scripts/validate-skill.sh
```

## 8. README、AGENTS 和指南的分工

- `README.md`：GitHub 首页说明，写仓库用途、安装命令和使用例子。
- `AGENTS.md`：短规则，给 agent 进入仓库时快速遵守。
- `SKILL_CREATION_GUIDE.md`：长教程，记录流程、坑点、命令和设计理由。

不要把长教程塞进 `AGENTS.md`。`AGENTS.md` 应该是稳定、短小、强约束的规则面。

## 9. 新 skill 上线验收清单

上线前确认：

- 仓库根目录没有 `SKILL.md`。
- 新 skill 位于 `skills/<skill-name>/`。
- `SKILL.md` frontmatter 只有 `name` 和 `description`。
- `description` 能准确触发目标场景。
- 运行时必须依赖的内容都在该 skill 目录内。
- README 安装命令带 `-s <skill-name> --full-depth`。
- 从 GitHub 删除重装后，安装目录资源完整。
- 安装后的脚本能在 `~/.agents/skills/<skill-name>/` 下运行。
