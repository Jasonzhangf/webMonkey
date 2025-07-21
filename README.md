# 上下文工程模板 / Context Engineering Template

一个全面的上下文工程入门模板 - 上下文工程是为AI编程助手设计上下文的学科，确保它们拥有端到端完成工作所需的信息。

> **上下文工程比提示工程好10倍，比随意编程好100倍。**

A comprehensive template for getting started with Context Engineering - the discipline of engineering context for AI coding assistants so they have the information necessary to get the job done end to end.

> **Context Engineering is 10x better than prompt engineering and 100x better than vibe coding.**

## 🚀 快速开始 / Quick Start

```bash
# 1. 克隆此模板 / Clone this template
git clone https://github.com/coleam00/Context-Engineering-Intro.git
cd Context-Engineering-Intro

# 2. 设置项目规则（可选 - 已提供模板）/ Set up your project rules (optional - template provided)
# 编辑 CLAUDE.md 添加项目特定指南 / Edit CLAUDE.md to add your project-specific guidelines

# 3. 添加示例（强烈推荐）/ Add examples (highly recommended)
# 在 examples/ 文件夹中放置相关代码示例 / Place relevant code examples in the examples/ folder

# 4. 创建初始功能请求 / Create your initial feature request
# 编辑 INITIAL.md 添加功能需求 / Edit INITIAL.md with your feature requirements

# 5. 生成综合PRP（产品需求提示）/ Generate a comprehensive PRP (Product Requirements Prompt)
# 在 Claude Code 中运行：/ In Claude Code, run:
/generate-prp INITIAL.md

# 6. 执行PRP实现功能 / Execute the PRP to implement your feature
# 在 Claude Code 中运行：/ In Claude Code, run:
/execute-prp PRPs/your-feature-name.md
```

## 📚 目录 / Table of Contents

- [什么是上下文工程？/ What is Context Engineering?](#什么是上下文工程--what-is-context-engineering)
- [模板结构 / Template Structure](#模板结构--template-structure)
- [分步指南 / Step-by-Step Guide](#分步指南--step-by-step-guide)
- [编写有效的INITIAL.md文件 / Writing Effective INITIAL.md Files](#编写有效的initialmd文件--writing-effective-initialmd-files)
- [PRP工作流程 / The PRP Workflow](#prp工作流程--the-prp-workflow)
- [有效使用示例 / Using Examples Effectively](#有效使用示例--using-examples-effectively)
- [最佳实践 / Best Practices](#最佳实践--best-practices)

## 什么是上下文工程？/ What is Context Engineering?

上下文工程代表了从传统提示工程的范式转变：

### 提示工程 vs 上下文工程 / Prompt Engineering vs Context Engineering

**提示工程 / Prompt Engineering:**
- 专注于巧妙的措辞和特定短语 / Focuses on clever wording and specific phrasing
- 局限于如何表达任务 / Limited to how you phrase a task
- 就像给某人一张便利贴 / Like giving someone a sticky note

**上下文工程 / Context Engineering:**
- 提供全面上下文的完整系统 / A complete system for providing comprehensive context
- 包括文档、示例、规则、模式和验证 / Includes documentation, examples, rules, patterns, and validation
- 就像写一个包含所有细节的完整剧本 / Like writing a full screenplay with all the details

### 为什么上下文工程很重要 / Why Context Engineering Matters

1. **减少AI失败**：大多数代理失败不是模型失败 - 而是上下文失败 / **Reduces AI Failures**: Most agent failures aren't model failures - they're context failures
2. **确保一致性**：AI遵循你的项目模式和约定 / **Ensures Consistency**: AI follows your project patterns and conventions
3. **启用复杂功能**：AI可以通过适当的上下文处理多步骤实现 / **Enables Complex Features**: AI can handle multi-step implementations with proper context
4. **自我纠正**：验证循环允许AI修复自己的错误 / **Self-Correcting**: Validation loops allow AI to fix its own mistakes

## 模板结构 / Template Structure

```
context-engineering-intro/
├── .claude/
│   ├── commands/
│   │   ├── generate-prp.md    # 生成综合PRP / Generates comprehensive PRPs
│   │   └── execute-prp.md     # 执行PRP实现功能 / Executes PRPs to implement features
│   └── settings.local.json    # Claude Code权限 / Claude Code permissions
├── PRPs/
│   ├── templates/
│   │   └── prp_base.md       # PRP基础模板 / Base template for PRPs
│   └── EXAMPLE_multi_agent_prp.md  # 完整PRP示例 / Example of a complete PRP
├── examples/                  # 你的代码示例（关键！）/ Your code examples (critical!)
├── CLAUDE.md                 # AI助手全局规则 / Global rules for AI assistant
├── INITIAL.md               # 功能请求模板 / Template for feature requests
├── INITIAL_EXAMPLE.md       # 功能请求示例 / Example feature request
└── README.md                # 此文件 / This file
```

此模板不专注于RAG和上下文工程工具，因为我很快会有更多内容。;)

This template doesn't focus on RAG and tools with context engineering because I have a LOT more in store for that soon. ;)

## 分步指南 / Step-by-Step Guide

### 1. 设置全局规则 (CLAUDE.md) / Set Up Global Rules (CLAUDE.md)

`CLAUDE.md` 文件包含AI助手在每次对话中都会遵循的项目范围规则。模板包括：

- **项目意识**：阅读规划文档，检查任务 / **Project awareness**: Reading planning docs, checking tasks
- **代码结构**：文件大小限制，模块组织 / **Code structure**: File size limits, module organization
- **测试要求**：单元测试模式，覆盖率期望 / **Testing requirements**: Unit test patterns, coverage expectations
- **样式约定**：语言偏好，格式规则 / **Style conventions**: Language preferences, formatting rules
- **文档标准**：文档字符串格式，注释实践 / **Documentation standards**: Docstring formats, commenting practices

**你可以按原样使用提供的模板，或为你的项目自定义。**

**You can use the provided template as-is or customize it for your project.**

### 2. Create Your Initial Feature Request

Edit `INITIAL.md` to describe what you want to build:

```markdown
## FEATURE:
[Describe what you want to build - be specific about functionality and requirements]

## EXAMPLES:
[List any example files in the examples/ folder and explain how they should be used]

## DOCUMENTATION:
[Include links to relevant documentation, APIs, or MCP server resources]

## OTHER CONSIDERATIONS:
[Mention any gotchas, specific requirements, or things AI assistants commonly miss]
```

**See `INITIAL_EXAMPLE.md` for a complete example.**

### 3. Generate the PRP

PRPs (Product Requirements Prompts) are comprehensive implementation blueprints that include:

- Complete context and documentation
- Implementation steps with validation
- Error handling patterns
- Test requirements

They are similar to PRDs (Product Requirements Documents) but are crafted more specifically to instruct an AI coding assistant.

Run in Claude Code:
```bash
/generate-prp INITIAL.md
```

**Note:** The slash commands are custom commands defined in `.claude/commands/`. You can view their implementation:
- `.claude/commands/generate-prp.md` - See how it researches and creates PRPs
- `.claude/commands/execute-prp.md` - See how it implements features from PRPs

The `$ARGUMENTS` variable in these commands receives whatever you pass after the command name (e.g., `INITIAL.md` or `PRPs/your-feature.md`).

This command will:
1. Read your feature request
2. Research the codebase for patterns
3. Search for relevant documentation
4. Create a comprehensive PRP in `PRPs/your-feature-name.md`

### 4. Execute the PRP

Once generated, execute the PRP to implement your feature:

```bash
/execute-prp PRPs/your-feature-name.md
```

The AI coding assistant will:
1. Read all context from the PRP
2. Create a detailed implementation plan
3. Execute each step with validation
4. Run tests and fix any issues
5. Ensure all success criteria are met

## Writing Effective INITIAL.md Files

### Key Sections Explained

**FEATURE**: Be specific and comprehensive
- ❌ "Build a web scraper"
- ✅ "Build an async web scraper using BeautifulSoup that extracts product data from e-commerce sites, handles rate limiting, and stores results in PostgreSQL"

**EXAMPLES**: Leverage the examples/ folder
- Place relevant code patterns in `examples/`
- Reference specific files and patterns to follow
- Explain what aspects should be mimicked

**DOCUMENTATION**: Include all relevant resources
- API documentation URLs
- Library guides
- MCP server documentation
- Database schemas

**OTHER CONSIDERATIONS**: Capture important details
- Authentication requirements
- Rate limits or quotas
- Common pitfalls
- Performance requirements

## The PRP Workflow

### How /generate-prp Works

The command follows this process:

1. **Research Phase**
   - Analyzes your codebase for patterns
   - Searches for similar implementations
   - Identifies conventions to follow

2. **Documentation Gathering**
   - Fetches relevant API docs
   - Includes library documentation
   - Adds gotchas and quirks

3. **Blueprint Creation**
   - Creates step-by-step implementation plan
   - Includes validation gates
   - Adds test requirements

4. **Quality Check**
   - Scores confidence level (1-10)
   - Ensures all context is included

### How /execute-prp Works

1. **Load Context**: Reads the entire PRP
2. **Plan**: Creates detailed task list using TodoWrite
3. **Execute**: Implements each component
4. **Validate**: Runs tests and linting
5. **Iterate**: Fixes any issues found
6. **Complete**: Ensures all requirements met

See `PRPs/EXAMPLE_multi_agent_prp.md` for a complete example of what gets generated.

## Using Examples Effectively

The `examples/` folder is **critical** for success. AI coding assistants perform much better when they can see patterns to follow.

### What to Include in Examples

1. **Code Structure Patterns**
   - How you organize modules
   - Import conventions
   - Class/function patterns

2. **Testing Patterns**
   - Test file structure
   - Mocking approaches
   - Assertion styles

3. **Integration Patterns**
   - API client implementations
   - Database connections
   - Authentication flows

4. **CLI Patterns**
   - Argument parsing
   - Output formatting
   - Error handling

### Example Structure

```
examples/
├── README.md           # Explains what each example demonstrates
├── cli.py             # CLI implementation pattern
├── agent/             # Agent architecture patterns
│   ├── agent.py      # Agent creation pattern
│   ├── tools.py      # Tool implementation pattern
│   └── providers.py  # Multi-provider pattern
└── tests/            # Testing patterns
    ├── test_agent.py # Unit test patterns
    └── conftest.py   # Pytest configuration
```

## Best Practices

### 1. Be Explicit in INITIAL.md
- Don't assume the AI knows your preferences
- Include specific requirements and constraints
- Reference examples liberally

### 2. Provide Comprehensive Examples
- More examples = better implementations
- Show both what to do AND what not to do
- Include error handling patterns

### 3. Use Validation Gates
- PRPs include test commands that must pass
- AI will iterate until all validations succeed
- This ensures working code on first try

### 4. Leverage Documentation
- Include official API docs
- Add MCP server resources
- Reference specific documentation sections

### 5. Customize CLAUDE.md
- Add your conventions
- Include project-specific rules
- Define coding standards

## Resources

- [Claude Code Documentation](https://docs.anthropic.com/en/docs/claude-code)
- [Context Engineering Best Practices](https://www.philschmid.de/context-engineering)