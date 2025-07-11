# Response API vs Chat Completion Benchmark

这个 benchmark 工具用于比较 Response API 和 Chat Completion API 在不同任务类型下的执行速率。

## 支持的任务类型

- **FC (Function Calling)**: 基础的函数调用任务，测试工具调用能力
- **GUI**: GUI Agent 任务，测试浏览器自动化能力
- **MCP**: MCP Agent 任务，测试外部工具集成能力

## 使用方法

### 安装依赖

```bash
npm install
```

### 运行 benchmark

```bash
# 运行所有任务类型的 benchmark
npm run bench

# 只运行 FC 任务
npm run bench:fc

# 只运行 GUI 任务
npm run bench:gui

# 只运行 MCP 任务
npm run bench:mcp

# 自定义运行次数（默认 3 次）
npm run bench:runs
```

### 命令行参数

- `--save` 或 `-s`: 保存结果到磁盘
- `--task=<type>`: 指定任务类型 (fc, gui, mcp)
- `--runs=<number>`: 指定每个策略的运行次数

### 示例

```bash
# 运行 FC 任务 5 次并保存结果
ts-node src/index.ts --task=fc --runs=5 --save

# 运行所有任务并保存结果
ts-node src/index.ts --save
```

## 输出结果

### 控制台输出

Benchmark 会在控制台显示格式化的表格，包含：

- 平均执行时间
- 最小/最大执行时间
- 标准差
- 成功率

### 文件输出

当使用 `--save` 参数时，结果会保存到 `result/` 目录：

- `benchmark-results.json`: 完整的 JSON 格式结果
- `summary.md`: Markdown 格式的摘要报告

## 环境要求

### 环境变量

确保设置以下环境变量：

```bash
export ARK_API_KEY=your_volcengine_api_key
```

### GUI 任务要求

GUI 任务需要浏览器环境，确保系统已安装 Chrome 或 Chromium。

### MCP 任务要求

MCP 任务需要网络连接来下载和运行 MCP 服务器。

## 架构说明

### 核心组件

- `BenchmarkRunner`: 主要的 benchmark 执行器
- `TaskStrategy`: 任务策略接口
- `FCStrategy`: Function Calling 策略实现
- `GUIStrategy`: GUI Agent 策略实现
- `MCPStrategy`: MCP Agent 策略实现

### 测试流程

1. 为每个策略创建两个 Agent 实例（Response API 和 Chat Completion）
2. 执行指定次数的任务
3. 收集执行时间和成功率数据
4. 聚合结果并生成报告

## 注意事项

- 每个任务都有 5 分钟的超时限制
- GUI 和 MCP 任务可能需要较长时间完成
- 建议在稳定的网络环境下运行 benchmark
- 结果可能受系统负载影响，建议多次运行取平均值
