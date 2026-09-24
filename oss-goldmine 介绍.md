# OSS Goldmine 介绍

## 一句话

OSS Goldmine 是一个帮 AI Builder 从 GitHub 真实信号里发现产品机会的工具。

它不是 GitHub 搜索器。搜索器给链接，OSS Goldmine 给判断：这个机会为什么存在、适合怎么切、第一版该做什么。

## 为什么需要它

现在 Cursor、Codex、Claude Code 让“做出来”变快了，但很多 Builder 仍然卡在“做什么”。

OSS Goldmine 解决的是前一步：帮用户从 GitHub 的 repo、issue、PR、维护状态里找到更有证据的产品方向。

## 目标用户

| 用户 | 他们的问题 |
| --- | --- |
| AI Builder | 会用 AI 快速做东西，但缺少可靠 idea |
| 独立开发者 | 想做小工具、开源项目、微型 SaaS |
| Devtool 创业者 | 想从真实开发者痛点里找切口 |
| 内容型 Builder | 需要可截图、可传播的 GitHub 机会案例 |

## 产品流程

```mermaid
flowchart LR
  A[输入方向] --> B[实时搜索 GitHub]
  B --> C[分析 repo / issue / PR / commit / release]
  C --> D[判断机会类型]
  D --> E[生成机会卡]
  E --> F[给出第一版构建建议]
```

## 三类机会

| 类型 | 含义 | 适合做什么 |
| --- | --- | --- |
| Stalled | 项目变慢，但 issue 里还有需求 | 替代品、迁移工具、现代化版本 |
| Overloaded | 项目还活跃，但 issue / PR 太多 | 插件、自动化工具、报告工具 |
| Underserved | 赛道有人做，但小场景没解决好 | 窄切口产品 |

## 机会卡长什么样

每张机会卡回答 6 个问题：

1. 这是什么机会？
2. 为什么值得看？
3. GitHub 上有哪些证据？
4. 风险是什么？
5. 第一版可以做什么？
6. 怎么用 AI 工具开始构建？

## 和 GitHub 搜索器的区别

| GitHub 搜索器 | OSS Goldmine |
| --- | --- |
| 给 repo 列表 | 给产品机会判断 |
| 用户自己分析 | 系统自动整理证据 |
| 适合找代码 | 适合找可做项目 |
| 结果难传播 | 机会卡适合截图传播 |

## 当前进度

- 本地已经可以实时搜索 GitHub。
- 已经能生成机会卡。
- 已支持 Stalled / Overloaded / Underserved 三类判断。
- 前端 GitHub Pages 已开启。
- 后端 API 还需要部署到 Render，部署后外部用户才能稳定实时搜索。

## 演示顺序

1. 先说结论：这是一个帮 AI Builder 找产品机会的工具。
2. 输入一个方向，比如 `API testing tools`。
3. 展示机会卡。
4. 指出证据：issue、PR、维护状态、star。
5. 强调差异：不是搜索 repo，而是判断机会。
6. 最后落到主产品：主产品可以帮助 Builder 用多个 AI 更快把这些机会做出来。

## 汇报话术

> AI 编程工具让做产品变快了，但做什么仍然很难。OSS Goldmine 从 GitHub 的真实需求信号里挖产品机会，把 repo、issue、PR、维护状态整理成机会卡，告诉 Builder 哪个方向值得做、为什么值得做、第一版应该怎么切。
