<div align="center">

# motion.md

**开放、运行时无关的运动设计规范。**<br>
为人类保留设计意图，为编程 Agent 提供稳定、可解析的结构。

**An open, runtime-neutral specification for motion design.**<br>
It preserves design intent for people and provides a stable structure for coding agents.

[English](README.md) · [简体中文](#为什么需要-motionmd)

[![规范版本](https://img.shields.io/badge/spec-v0.1_draft-5b5bd6)](docs/spec.md)
[![测试](https://img.shields.io/badge/tests-17_passing-2f855a)](tests)
[![许可证](https://img.shields.io/badge/license-MIT-1f2937)](LICENSE)

</div>

---

运动设计不只是时长和缓动。它描述的是状态、事件、时间、中断、无障碍策略与产品意图之间的关系。

`motion.md` 定义了一种可移植的项目文档 `MOTION.md`，由两个互补层组成：

- **机器可读的 YAML**：描述状态、事件、转换、时间线、曲线、Reduced Motion 替代方案、性能预算、确定性播放和来源信息。
- **人类可读的 Markdown**：解释运动设计的核心主张、层级、情绪、克制原则，以及每项规则存在的理由。

结构化数值让行为可以复现；文字意图解释这些行为为什么属于这个产品。

## 为什么需要 motion.md

动画库擅长描述“如何让元素动起来”，但它们不会解释为什么这里需要运动、哪个状态拥有最终结果、用户打断操作时应该发生什么，以及 Reduced Motion 模式下必须保留哪些语义。

`motion.md` 在选择运行时之前保存这些设计决策：

```text
MOTION.md → 解析器 → Motion IR
Motion IR → 消费者策略 → 运行时适配器
运行时适配器 → 证据与 QA
```

CSS、WAAPI、GSAP、Anime.js、Canvas、SVG、WebGL 和原生 UI 框架都属于适配器层。核心规范不偏向其中任何一种技术。

> [!IMPORTANT]
> 规范保存运动设计的意图与行为，不提供动画引擎、特效图库、组件库或模板市场。

## 当前状态

规范目前处于 **v0.1 草案**。文档契约、JSON Schema、Motion IR 和参考 CLI 已可用于评估，但在 v1.0 之前仍可能发生不兼容调整。

项目使用 MIT License 开源，草案阶段通过 GitHub Releases 分发。npm 包暂时保留 `private` 标记，仅用于避免分发契约稳定前被误发布。

## 仓库包含什么

- `MOTION.md` 文档契约与版本策略
- 面向 YAML front matter 的 JSON Schema Draft 2020-12
- 稳定、运行时无关的 Motion IR
- 零运行时依赖的解析与校验
- 不受格式和键顺序影响的语义 diff
- 面向 Agent 的 `lint`、`parse`、`diff`、`spec` 命令
- 最小、表现型、程序化和 Reduced Motion 四类示例
- 有效与无效的一致性夹具
- authored、measured、derived、research 四类来源规则

## 快速开始

需要 Node.js 20 或更高版本。参考实现没有运行时依赖。

```sh
npm test
npm run lint
npm link
motionmd spec
```

| 命令 | 用途 |
| --- | --- |
| `motionmd lint <file>` | 校验 `MOTION.md` 文档 |
| `motionmd parse <file>` | 解析 front matter 与 Markdown |
| `motionmd diff <a> <b>` | 对两个文档进行语义比较 |
| `motionmd spec` | 输出内置规范 |

除默认输出 Markdown 的 `spec` 外，所有命令都输出 JSON。诊断信息写入标准错误，结构化结果写入标准输出。

## 浏览仓库

- [`PHILOSOPHY.md`](PHILOSOPHY.md) — 产品哲学与非目标
- [`docs/spec.md`](docs/spec.md) — `MOTION.md` v0.1 规范
- [`docs/terminology.md`](docs/terminology.md) — 作者与消费者共享术语
- [`docs/motion-ir.md`](docs/motion-ir.md) — Motion IR 契约
- [`docs/interoperability.md`](docs/interoperability.md) — `DESIGN.md`、Pipeline 与适配器边界
- [`docs/versioning.md`](docs/versioning.md) — 兼容性与版本策略
- [`schemas/motion.schema.json`](schemas/motion.schema.json) — YAML front matter JSON Schema
- [`packages/`](packages) — 解析器、Motion IR 与 CLI 参考实现
- [`examples/`](examples) — 四类参考运动系统
- [`fixtures/`](fixtures) — 有效与无效的一致性输入
- [`tests/`](tests) — 参考实现测试

## 与 DESIGN.md 的关系

项目形态参考了 Google Labs 的 [`design.md`](https://github.com/google-labs-code/design.md)：使用可移植的 Markdown 文档、可选结构化 front matter、Schema、示例与面向 Agent 的工具。

`motion.md` 继承其中一个核心观点：精确数值提供必要上下文，但真正决定生成结果是否属于产品的，是清晰的设计意图和理由。

本规范保持独立，不 fork `DESIGN.md`，不重复定义视觉 Token，也不要求使用特定设计系统工具。详见 [`docs/interoperability.md`](docs/interoperability.md)。

## License

MIT，详见 [`LICENSE`](LICENSE)。
