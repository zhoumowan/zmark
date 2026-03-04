# zmark

zmark 是一个基于 Tauri 2 + React 19 构建的现代化 Markdown 编辑器与本地知识库（RAG）助手。它结合了极致的编辑体验与智能化的文档问答能力。

## ✨ 特性

- **📝 现代化编辑器**:
  - 基于 Tiptap 构建，支持所见即所得的 Markdown 编辑体验。
  - 支持代码高亮（lowlight）、图片上传、高亮标注、链接管理等。
  - 内置快捷键支持（如 `Cmd/Ctrl + S` 保存）。
- **🧠 智能知识库 (RAG)**:
  - 支持导入本地 Markdown 文档构建专属知识库。
  - 集成 SiliconFlow API，使用 `BAAI/bge-m3` 进行向量嵌入，`Qwen/Qwen2.5-7B-Instruct` 进行流式问答。
  - 支持检索过程可视化，展示参考文档及其相似度。
- **🎨 极致体验**:
  - 使用 Tailwind CSS 4 构建的响应式 UI。
  - 原生支持深色模式。
  - 基于 SQLite 的本地数据存储，保护隐私。
  - 高性能的 Rust 后端处理向量计算与文件 IO。

## 🛠️ 技术栈

- **前端**: React 19, Vite, Tailwind CSS 4, Tiptap, Zustand, Shadcn UI.
- **后端**: Tauri 2, Rust, SQLite (rusqlite).
- **AI 能力**: SiliconFlow API (BGE-M3 + Qwen2.5).

## 🚀 快速开始

### 环境准备

确保你的机器上已安装：
- [Rust](https://www.rust-lang.org/tools/install)
- [Node.js](https://nodejs.org/) (建议 v18+)
- [pnpm](https://pnpm.io/installation)

### 安装依赖

```bash
pnpm install
```

### 启动开发环境

```bash
pnpm dev
```

### 构建应用

```bash
pnpm build
```

## ⚙️ 配置

在“知识库”模式下，点击设置图标配置你的 SiliconFlow API Key 以启用 AI 问答功能。

## 🎓 技术扩展 (毕业设计专用)

针对毕业设计或进阶开发，本项目提供了一份详细的 [技术扩展方案](./EXTENSION_PLAN.md)，涵盖了以下功能点：

- **全文搜索 (Full-text Search)**
- **多人实时协作 (Real-time Collaboration)**
- **文档版本历史 (Version Control)**
- **Notion 级交互体验 (Interactive UI)**
- **多格式导出引擎 (Export Engine)**
- **智能目录导航 (Dynamic ToC)**
- **附件管理与离线资源 (Asset Management)**

## 📄 开源协议

MIT
