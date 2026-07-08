# Agent Instructions

本仓库是 Codex skill 合集仓库，不是单 skill 根目录仓库。后续 agent 在本仓库工作时必须遵守这些约束。

## 仓库结构

- 根目录只放仓库级文档和索引，例如 `README.md`、`AGENTS.md`、`SKILL_CREATION_GUIDE.md`。
- 不要在仓库根目录创建 `SKILL.md`，否则可能遮蔽 `skills/` 下的内层 skill。
- 每个可安装 skill 必须放在 `skills/<skill-name>/`。
- 当前 skills 包括：
  - `skills/validate-gcs-storage/`：GCS 集成审查与验证。
  - `skills/codex-task-prompt/`：任务制定、skill/MCP 路由和 Codex 执行提示词生成。
  - `skills/lark-paste-pack/`：无 Lark 应用凭证时，将 Markdown 转成 Lark 友好粘贴/导入包。

## Skill 约束

- `SKILL.md` frontmatter 只保留 `name` 和 `description`。
- `description` 必须写清能力范围和触发场景；它是 agent 决定是否加载 skill 的主要依据。
- `SKILL.md` 保持入口化，详细资料放 `references/`，代码案例放 `examples/`，确定性检查放 `scripts/`。
- 新增或修改 skill 时，要同步维护对应的 `scripts/validate-skill.sh`。
- 不提交凭据、dotenv 文件、服务账号 JSON、私钥、真实临时授权 URL 或签名查询参数。

## 验证要求

修改 skill 或仓库级文档后，至少运行：

```bash
bash skills/validate-gcs-storage/scripts/validate-skill.sh
bash skills/codex-task-prompt/scripts/validate-skill.sh
bash skills/lark-paste-pack/scripts/validate-skill.sh
git diff --check
```

发布后必须从 GitHub 重新安装目标 skill，并检查安装目录是否包含 `SKILL.md`、`agents/`、`examples/`、`references/`、`scripts/`。

当前安装命令：

```bash
npx skills@latest add ndgwww/agent-skills-storage -g -a codex -s validate-gcs-storage -y --full-depth
npx skills@latest add ndgwww/agent-skills-storage -g -a codex -s codex-task-prompt -y --full-depth
npx skills@latest add ndgwww/agent-skills-storage -g -a codex -s lark-paste-pack -y --full-depth
```

详细创建流程和避坑记录见 `SKILL_CREATION_GUIDE.md`。
