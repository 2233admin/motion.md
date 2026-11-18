# MOTION.md

用于向编程 Agent 描述运动图形（motion graphics）与前端动画（animation）意图、时序和行为的格式规范。`MOTION.md` 让 Agent 持续、结构化地理解产品界面中的动画应该如何呈现、响应和降级。

A format specification for describing motion graphics and frontend animation intent, timing, and behavior to coding agents. `MOTION.md` gives agents a persistent, structured understanding of how a product interface moves.

[English](README.md) · **简体中文**

[规范](docs/spec.md) · [JSON Schema](schemas/motion.schema.json) · [示例](examples) · [v0.2 发布说明](docs/releases/v0.2.0.md)

## 文件格式

一个 `MOTION.md` 文件由两部分组成：YAML 中机器可读的动画语义（写在 front matter，或穿插在各章节的 ` ```yaml ` 代码块里），以及 Markdown 正文中人类与 Agent 可读的运动图形和前端动画意图。

YAML 定义精确的状态、事件、转换、时间线、曲线、中断规则、无障碍替代方案与性能预算。Markdown 解释这些规则为什么存在、动画需要传达什么，以及应该在哪里保持克制。

<details>
<summary>查看一个最小 <code>MOTION.md</code> 示例</summary>

```md
---
version: "0.2"
name: Quiet Feedback
posture: minimal
states:
  idle: { "description": "The control is ready." }
  active: { "description": "The control is selected." }
events:
  activate: { "description": "The user activates the control.", "source": "user" }
transitions:
  become-active:
    from: idle
    to: active
    on: activate
    mode: instant
    interruption: { "policy": "replace" }
    cancellation: { "policy": "target" }
reducedMotion:
  strategy: instant
performance:
  targetFps: 60
  maxMainThreadMsPerFrame: 3
  maxConcurrentTracks: 1
  inputReadyMs: 0
  deterministic: true
provenance:
  - id: product-intent
    kind: authored
    description: Original motion direction.
---

## Motion Thesis

反馈从用户输入开始，并且不会延迟结果。

## Motion Principles

- 状态在确认反馈完成之前提交。

## Hierarchy and Choreography

只有被激活的控件产生反馈。

## Interruption

最新输入拥有最终决定权。

## Reduced Motion

没有插值动画时，状态与内容仍然清晰可读。

## Performance

输入从时间零点开始保持可用。

## Provenance

这套动画行为由产品团队定义。

```

</details>

Agent 读取这个文件后，可以知道哪个状态拥有结果、什么事件触发变化、中断如何处理、Reduced Motion 必须保留什么，以及运行时选择不能破坏哪些性能限制。

完整的动画规范可以参考[最小](examples/minimal/MOTION.md)、[表现型](examples/expressive/MOTION.md)、[程序化](examples/procedural/MOTION.md)、[Reduced Motion](examples/reduced-motion/MOTION.md) 和 [DESIGN.md 绑定](examples/design-bound/MOTION.md) 示例。最后一个的时序全部来自同目录的 `DESIGN.md`。

## 快速开始

参考实现需要 Node.js 20 或更高版本，并且没有运行时依赖。

```bash
npm link
motionmd lint examples/minimal/MOTION.md
```

CLI 输出编程 Agent 可以直接处理的结构化 findings：

```json
{
  "findings": [],
  "format": "motion.md",
  "specVersion": "0.2",
  "summary": {
    "errors": 0,
    "warnings": 0,
    "info": 0
  }
}
```

比较两份动画规范，检测归一化 Motion IR 与动画意图说明的变化：

```bash
motionmd diff before/MOTION.md after/MOTION.md
```

## 规范

完整的 `MOTION.md` 规范位于 [`docs/spec.md`](docs/spec.md)。以下是精简参考。

### 文件结构

一个 `MOTION.md` 文件包含两个层：

1. **YAML** — 精确动画语义。可以写在文件顶部 `---` 分隔的 front matter 里，也可以写成穿插在对应章节内的 ` ```yaml ` 代码块（例如把 `reducedMotion` 放在 `## Reduced Motion` 下）。所有块合并成一棵树，同一顶层键只能出现一次；
2. **Markdown 正文** — 由 `##` 章节组织的动画意图与说明。正文可以用 `` `@path#fragment` `` 引用其他文件，从 `MOTION.md` 所在目录解析。

YAML 对精确数值和图关系具有规范性。Markdown 对意图、优先级、禁用规则和决策理由具有规范性。两者冲突时，合规消费者应报告冲突，而不是静默选择其中一层。

### Motion Schema

| 字段 | 用途 |
| --- | --- |
| `version` | 规范版本 |
| `name` | 动画规范的人类可读名称 |
| `posture` | `static`、`minimal`、`expressive` 或 `procedural` |
| `design` | 绑定的 `DESIGN.md` 相对路径，其 `motion` token 可被引用 |
| `omitted` | 有意省略的正文章节，附可选理由 |
| `defaults` | 默认时序：`timing` token 引用，或时长、延迟、曲线 |
| `states` | 产品的语义状态 |
| `events` | 用户、系统、数据、时间、视口、媒体或传感器输入 |
| `curves` | 线性、Bézier、steps、spring 或程序曲线 |
| `timelines` | 运行时无关的驱动、轨道和关键帧；轨道可用 `timing: "{motion.<token>}"` 引用 DESIGN.md 时序 |
| `transitions` | 状态变化、中断与取消策略 |
| `reducedMotion` | 无障碍策略与语义替代方案 |
| `performance` | 帧率、输入、并发与确定性预算 |
| `provenance` | authored、measured、derived 或 research 来源 |

规范 JSON Schema 位于 [`schemas/motion.schema.json`](schemas/motion.schema.json)。

### 章节顺序

Markdown 章节可以省略；已经出现的章节应遵循以下顺序：

1. Motion Thesis
2. Motion Principles
3. Hierarchy and Choreography
4. Interruption
5. Reduced Motion
6. Performance
7. Provenance

未知章节会被保留。重复的二级标题无效，因为它们会使稳定的章节寻址产生歧义。有意不写的章节在 `omitted` 中声明，即可消除 `missing-section` 警告。

## CLI 参考

所有命令都接受文件路径；`lint` 和 `parse` 也接受 `-` 作为标准输入。输出默认使用 JSON。

| 命令 | 说明 |
| --- | --- |
| `motionmd lint <file\|->` | 校验文档并输出结构化 findings |
| `motionmd parse <file\|->` | 输出归一化文档与 Motion IR |
| `motionmd diff <before> <after>` | 比较 Motion IR 与正文章节 |
| `motionmd spec` | 输出 Markdown 规范 |
| `motionmd spec --format json` | 输出 JSON Schema |

`design` 与 `@` 引用从输入文件所在目录解析（标准输入则从当前目录）。`lint`、`parse` 和 `diff` 在发现无效或破坏性结果时以代码 `1` 退出。CLI 用法错误和无法读取的输入以代码 `2` 退出。

## 与 DESIGN.md 的关系

Google Labs 的 [`design.md`](https://github.com/google-labs-code/design.md) 在 2026 年 11 月加入了 `## Motion & Micro-interaction` 章节和 `motion` token（`duration`、`delay`、`timingFunction`）。两份文件的分工因此是：

| 关注点 | 归属 |
| --- | --- |
| 品牌动效基调、时序词汇（`state-change`、`surface-enter` 等 token） | `DESIGN.md` |
| 状态图、事件、编排、打断、降级、性能预算 | `MOTION.md` |
| spring、滚动/指针驱动、程序曲线 | `MOTION.md`（DESIGN.md 无对应） |

`MOTION.md` 通过 `design: DESIGN.md` 绑定，用 `timing: "{motion.surface-enter}"` 引用 token，不再重复写 250ms 和贝塞尔曲线。引用会在 Motion IR 中解析为具体数值，并记录 `DESIGN.md` 的 hash，所以 token 一改，`motionmd diff` 就能看到。轨道上的字面值如果恰好等于某个 token，lint 会给出 `prefer-design-token` 提示。

两种格式共用同一套文档约定：front matter 或穿插 YAML 块、`##` 章节、`omitted`、`{…}` token 引用、`` `@path#fragment` `` 外部引用。完整示例见 [`examples/design-bound`](examples/design-bound)。

消费者边界详见 [`docs/interoperability.md`](docs/interoperability.md)。

## 运行时互操作

CSS、WAAPI、GSAP、Anime.js、Canvas、SVG、WebGL 与原生 UI 框架都属于运行时适配器。核心格式不偏向任何一种技术。

稳定交接路径是：

```text
MOTION.md → parser → Motion IR
Motion IR → consumer policy → runtime adapter
runtime adapter → evidence and QA
```

## 当前状态

`MOTION.md` 格式目前为 `0.2` 草案。规范、JSON Schema、Motion IR 与 CLI 已可用于评估；v1.0 之前仍可能发生不兼容变化。

仓库使用 MIT License 开源。包暂时保留 `private` 标记，仅用于避免分发契约仍在演进时被误发布到 npm。

## License

MIT，详见 [`LICENSE`](LICENSE)。
