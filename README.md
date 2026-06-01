# AI数枢 (DataHub / ai-file-navigation)

[![Go Version](https://img.shields.io/badge/Go-1.21+-00ADD8?style=flat&logo=go)](https://golang.org/)
[![Node Version](https://img.shields.io/badge/Node.js-20+-339933?style=flat&logo=node.js)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-18.2-61DAFB?style=flat&logo=react)](https://reactjs.org/)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-3.4-38B2AC?style=flat&logo=tailwind-css)](https://tailwindcss.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-14+-4169E1?style=flat&logo=postgresql)](https://www.postgresql.org/)
[![Ollama](https://img.shields.io/badge/Ollama-bge--m3-orange?style=flat)](https://ollama.com/)

**AI数枢 DataHub** 是一个专为个人开发者和内容创作者打造的**智能化垂类私有数据库与一站式多维效率工作台**。项目巧妙结合了本地大语言模型与向量数据库，提供秒级的智能语义检索、知识连接，并聚合了从创意写作到日常运维等多维度的共计 **34 个高频效率工具模块**。

---

## 🎨 界面与设计美学

* **极光暗调视效**：系统主界面基于 HSL 深度调色方案设计，融合优雅的磨砂玻璃质感（Glassmorphism）、星空粒子与渐变霓虹光晕，营造高科技且轻量舒适的前端交互体验。
* **动感交互与微动效**：基于 `framer-motion` 精细雕琢悬停回弹、平滑卡片过渡、动态加载态及呼吸式 AI 检索框，使数据管理更加富有张力。
* **高自适应菜单**：支持卡片常用功能加星（收藏）、全局多维度分类隐藏及探索、夜间/日间双重模式瞬间无缝切换。

---

## 🚀 核心技术与架构

### 🏛️ 技术栈一览
* **前端 (Frontend)**：React 18 + TypeScript + Vite + TailwindCSS + Zustand (状态管理) + Framer Motion (微动效) + Lucide Icons。
* **后端 (Backend)**：Go (Gin 框架 MVC 架构) + GORM (ORM) + pgvector (向量运算) + Zap (高性能日志) + JWT (权限认证)。
* **基础设施**：PostgreSQL (具备 pgvector 插件) + Redis (令牌及会话缓存) + MinIO (私有化高性能对象存储，用于图库、音乐及附件管理)。
* **AI 向量引擎**：Ollama (本地大语言模型引擎，搭载 `bge-m3` 多语言嵌入模型生成 1024 维语义向量)。

### 🧠 智能向量搜寻与延迟队列设计
* **自动智能分片**：笔记更新时，系统在后台采用 `500字符` 为步长平滑切片，并自动关联文章标题信息。
* **防抖延迟队列 (Delay Queue)**：精心设计了 10 秒缓冲队列，用户编辑笔记时实时防抖，避免高频请求频繁穿透并给本地 Ollama API 带来并发压力。
* **语义距离度量**：利用 PostgreSQL 的 `pgvector` 插件存储并计算 `BGE-M3` 向量特征，实现基于余弦相似度的精准语义跨文本段落关联检索。

---

## 🛠️ 34 个高频多维效率模块分类

AI数枢将个人管理所需的所有维度高度整合，分为以下六大模块集：

### 📝 1. 内容创作 (Content)
* **笔记管理 (note)** / **草稿管理 (drafts)** / **Markdown (markdowns)**：全功能多源编辑、实时向量化知识图谱。
* **小说管理 (novels)**：专为小说作者量身定制的分卷、分章节多级大纲创作工作流。
* **产品思路 (product-ideas)** / **提示词管理 (prompts)** / **AI 犯错 (ai-mistakes)**：灵感捕手与人机协作记录本。

### 🛠️ 2. 开发工具 (DevTools)
* **代码管理 (codes)**：多语言代码片段箱，支持 Monaco Editor 高亮与搜索。
* **脚本管理 (scripts)** / **常用命令 (commands)**：收集和测试常用 Shell 脚本与 CLI 执行集。
* **代码 Skill (skills)** / **Docker 文件 (docker)** / **JSON 管理 (json)** / **报错管理 (errors)** / **规范管理 (guidelines)**。

### 🚀 3. 项目运维 (DevOps)
* **进度管理 (progress)** / **部署管理 (deploy)** / **发布管理 (release)** / **日志管理 (changelog)** / **端口管理 (ports)**：实时监控本地或云端主机的网络服务、端口健康、微服务构建生命周期。

### 📚 4. 资源管理 (Resources)
* **文件管理 (file)** / **图库管理 (gallery)** / **截图管理 (screenshots)** / **素材管理 (materials)** / **音乐管理 (music)** / **软件管理 (software)**：与私有 MinIO 高速打通，实现音乐在线流式播放、图库批量缩略图展示以及软件资产库追踪。

### 🌐 5. 信息中枢 (InfoHub)
* **网页管理 (websites)** / **账号管理 (accounts)** / **路径管理 (paths)** / **计划管理 (plans)**：本地路径快速跳转映射、账号密码加解密保险箱、静态导航地图。

### 📖 6. 学习成长 (Learning)
* **学习管理 (learning)** / **英语管理 (english)** / **记账管理 (billing)**：系统化的技能树点亮计划、结合联想记忆的英文生词库以及个人开销账单管理。

---

## 📥 环境搭建与本地运行指南

### 📋 前置需求
1. **Go 1.21+**
2. **Node.js 20+** 与 **pnpm** 包管理工具。
3. **PostgreSQL 14+**（确保已安装或开启了 `pgvector` 插件）。
4. **Redis Server**
5. **MinIO Server**
6. **Ollama** 本地客户端。

### 0. 准备本地 AI 向量模型
启动 Ollama 服务，在终端下载本系统推荐的 BGE-M3 多语言嵌入模型：
```bash
ollama pull bge-m3
```

### 1. 配置后端服务 (Backend)
1. 进入 `server` 目录：
   ```bash
   cd server
   ```
2. 编辑 `config.yaml` 配置文件，配置您的 PostgreSQL、Redis、MinIO 连接信息：
   ```yaml
   pgsql:
     path: '127.0.0.1'
     port: '5432'
     db-name: 'notebook'
     username: 'your-db-user'
     password: 'your-db-password'
   minio:
     endpoint: '127.0.0.1:19100'
     access-key-id: 'your-minio-key'
     secret-access-key: 'your-minio-secret'
     bucket-name: 'ai-file-navigation'
   ```
3. 运行后端一键初始化并启动脚本：
   ```bash
   chmod +x dev.sh
   ./dev.sh
   ```
   *(该脚本会自动检查并强制结束占用 8888 端口的残留进程，随后通过 `go run main.go` 启动后端服务。数据库表与种子数据在首次启动时由 GORM 自动进行迁移和填充)*

### 2. 配置前端服务 (Frontend)
1. 进入 `web` 目录：
   ```bash
   cd web
   ```
2. 安装项目依赖：
   ```bash
   pnpm install
   ```
3. 运行开发联调服务器：
   ```bash
   pnpm dev
   ```
   *(前端基于 Vite 开发服务器运行。系统内置了 Vite Proxy 反向代理，任何 `/api` 请求都会在本地被无缝转发至后端的 `8888` 端口，无需手动配置跨域)*
4. 打开浏览器访问终端输出的本地开发地址即可（默认 `http://localhost:5173`）。默认管理员管理员账号：`admin`，默认密码：`111111`。

---

## 🐳 生产 Docker 部署

前端与后端均已编写好用于生产环境的优化 `Dockerfile`。

* **后端服务容器**：进入 `server` 目录，可使用内部提供的 `Makefile` 自动化增量或全量构建部署后端镜像：
  ```bash
  cd server
  make deploy-incremental   # 增量一键启动
  ```
* **前端静态容器**：进入 `web` 目录，前端支持多阶段构建，将 Vite 打包出的 `dist` 包交由轻量级的 `nginx:alpine` 镜像进行分发，并内置了 history 路由回退配置与静态资源长缓存。
