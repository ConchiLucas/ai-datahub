package initialize

import (
	"fmt"
	"os"
	"strings"
	"time"

	"github.com/conchi/ai-note/server/global"
	"github.com/conchi/ai-note/server/model/system"
	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"

	"go.uber.org/zap"
)

func InitDB() *gorm.DB {
	return GormPgSql()
}

func RegisterTables(db *gorm.DB) {
	// 启用 pgvector 扩展
	if global.GVA_CONFIG.System.DbType == "pgsql" {
		db.Exec("CREATE EXTENSION IF NOT EXISTS vector;")
	}

	err := db.AutoMigrate(
		system.SysUser{},
		system.TaAiNote{},
		system.TaDirectory{},
		system.TaTag{},
		system.TaNoteChunk{},
		system.FilFile{},
		system.TaWebNavCategory{},
		system.TaWebNavSite{},
		system.TaGalleryMedia{},
		system.TaMusic{},
		system.TaAccount{},
		system.TaPlan{},
		system.TaBilling{},
		system.TaPrompt{},
		system.TaPromptCategory{},
		system.TaCommand{},
		system.TaCommandCategory{},
		system.TaJsonSnippet{},
		system.TaMarkdownSnippet{},
		system.TaSoftware{},
		system.TaDraft{},
		system.TaCodeSnippet{},
		system.TaSkill{},
		system.TaError{},
		system.TaChangelogProject{},
		system.TaChangelogLog{},
		system.TaGuideline{},
		system.TaScreenshot{},
		system.TaLearningItem{},
		system.TaLearningChapter{},
		system.TaLearningNote{},
		system.TaProductIdea{},
		system.TaMaterial{},
		system.TaAppError{},
		system.TaNovel{},
		system.TaNovelChapter{},
		system.TaMaterial{},
		system.TaEnglishWord{},
		system.TaDockerOrg{},
		system.TaDockerProject{},
		system.TaDockerFile{},
		system.TaDeployProject{},
		system.TaDeployFile{},
		system.TaDeployStep{},
		system.TaReleaseProject{},
		system.TaReleaseAddress{},
		system.TaReleaseFile{},
		system.TaReleaseCommand{},
		system.TaProgressProject{},
		system.TaProgressFeature{},
		system.TaPath{},
		system.TaPathCategory{},
		system.TaHost{},
		system.TaPort{},
	)
	if err != nil {
		if !strings.Contains(err.Error(), "does not exist") {
			global.GVA_LOG.Error("register table failed", zap.Error(err))
			os.Exit(0)
		} else {
			global.GVA_LOG.Warn("register table warning (ignored)", zap.Error(err))
		}
	}
	global.GVA_LOG.Info("register table success")
}

func InitSystemData(db *gorm.DB) {
	var count int64
	db.Model(&system.SysUser{}).Count(&count)
	if count == 0 {
		password := "111111"
		bytes, _ := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
		user := system.SysUser{
			Username:  "admin",
			Password:  string(bytes),
			NickName:  "超级管理员",
			Enable:    1,
			HeaderImg: "https://qmplusimg.henrongyi.top/gva_header.jpg",
		}
		db.Create(&user)
		fmt.Println("Init admin user success, username: admin, password: ", password)
	}

	var categoryCount int64
	db.Model(&system.TaWebNavCategory{}).Count(&categoryCount)
	if categoryCount == 0 {
		categories := []system.TaWebNavCategory{
			{UserId: 1, Name: "AI 生态", Sort: 1},
			{UserId: 1, Name: "开发工具", Sort: 2},
			{UserId: 1, Name: "图像设计", Sort: 3},
			{UserId: 1, Name: "效率助手", Sort: 4},
			{UserId: 1, Name: "音视频", Sort: 5},
		}
		db.Create(&categories)
		
		sites := []system.TaWebNavSite{
			{UserId: 1, CategoryId: 1, Title: "ChatGPT", Desc: "OpenAI公司开发的一种大型语言模型", Url: "https://chat.openai.com", IconPath: "openai"},
			{UserId: 1, CategoryId: 1, Title: "奇米AI", Desc: "一站畅享全球顶级AI，500+AI超能力", Url: "https://ai.qimi.com", IconPath: "star"},
			{UserId: 1, CategoryId: 3, Title: "新片场AI作图", Desc: "各类AI创作工具一站式解决", Url: "https://ai.xinpianchang.com", IconPath: "new", IsNew: true},
			{UserId: 1, CategoryId: 3, Title: "Midjourney", Desc: "知名AI图像生成站点，拥有优质图库", Url: "https://midjourney.com", IconPath: "ship"},
			{UserId: 1, CategoryId: 4, Title: "智能文本", Desc: "使用ChatGPT开发在线智能文本工具", Url: "https://smarttext.com", IconPath: "box"},
			{UserId: 1, CategoryId: 5, Title: "WonderDynamics", Desc: "可自动将CG角色制作动画", Url: "https://wonderdynamics.com", IconPath: "robot"},
			{UserId: 1, CategoryId: 2, Title: "Sloyd", Desc: "选择一个生成器，对其进行调整，导出", Url: "https://sloyd.com", IconPath: "triangle"},
			{UserId: 1, CategoryId: 4, Title: "Gamma App", Desc: "几秒内生成文档、幻灯片和网页", Url: "https://gamma.app", IconPath: "presentation"},
			{UserId: 1, CategoryId: 2, Title: "Auto-GPT", Desc: "开源项目，使GPT-4完全自主", Url: "https://github.com/Significant-Gravitas/Auto-GPT", IconPath: "github"},
		}
		db.Create(&sites)
		fmt.Println("Init Web Navigation seed data success")
	}

	var musicCount int64
	db.Model(&system.TaMusic{}).Count(&musicCount)
	if musicCount == 0 {
		musics := []system.TaMusic{
			{UserId: 1, Title: "SoundHelix Song 1", Artist: "SoundHelix", Album: "AI Generation", CoverUrl: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3", AudioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3", Duration: 372.0},
			{UserId: 1, Title: "SoundHelix Song 2", Artist: "SoundHelix", Album: "AI Discovery", CoverUrl: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3", AudioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3", Duration: 425.0},
			{UserId: 1, Title: "SoundHelix Song 3", Artist: "SoundHelix", Album: "The Beyond", CoverUrl: "https://images.unsplash.com/photo-1493225457124-a1a2a5f5f92e?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3", AudioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3", Duration: 344.0},
		}
		db.Create(&musics)
		fmt.Println("Init Music seed data success")
	}

	var planCount int64
	db.Model(&system.TaPlan{}).Count(&planCount)
	if planCount == 0 {
		now := time.Now()
		yesterday := now.Add(-24 * time.Hour)
		lastWeek := now.Add(-7 * 24 * time.Hour)

		plans := []system.TaPlan{
			{UserId: 1, Title: "完成系统架构设计", Description: "整理微服务拓扑图，输出相关的设计文档并提交PR。", Priority: "high", Progress: 30},
			{UserId: 1, Title: "修复登录模块白屏Bug", Description: "排查严格模式下的二次渲染问题。", Priority: "high", Progress: 70},
			{UserId: 1, Title: "补充API接口文档", Description: "输出最新的后端API接入指南。", Priority: "medium", Progress: 100},
			{UserId: 1, Title: "团队周报汇总", Description: "催促并收集各个产研小组的进度汇报。", Priority: "low", Progress: 100},
			{UserId: 1, Title: "开发首页 Kanban看板面板", Description: "高保真还原Figma设计稿，并植入动画。", Priority: "high", Progress: 85},
			{UserId: 1, Title: "面试三名候选人", Description: "完成前端岗位的初试与复试。", Priority: "medium", Progress: 100},
			{UserId: 1, Title: "跟进客户数据打通", Description: "拉通相关业务线，对齐字段并处理脏数据。", Priority: "medium", Progress: 0},
			{UserId: 1, Title: "项目二期需求评审", Description: "同产品经理确认功能优先级与排期。", Priority: "medium", Progress: 100},
			{UserId: 1, Title: "构建基础 AI 工具箱", Description: "完成核心开发管理工具的打通与测试，保证开发者基础数据流闭环。", Priority: "high", Progress: 100},
			{UserId: 1, Title: "发布并上线初始版本", Description: "编译部署前端及后端，完成服务器初始化与跨域配置。", Priority: "high", Progress: 80},
			{UserId: 1, Title: "接入大模型自动分析", Description: "利用 LLM API 来一键分析并为代码片段生成介绍与总结。", Priority: "medium", Progress: 30},
			{UserId: 1, Title: "开发深色与浅色模式切换", Description: "完善整个界面的样式变量，顺滑切换并记忆当前的颜色模式偏好。", Priority: "low", Progress: 0},
		}
		
		// Set some dynamic created_at manually before create
		for i := range plans {
			if i < 4 {
				plans[i].CreatedAt = now
			} else if i < 6 {
				plans[i].CreatedAt = yesterday
			} else {
				plans[i].CreatedAt = lastWeek
			}
		}

		db.Create(&plans)
		fmt.Println("Init Plan seed data success")
	}

	var jsonCount int64
	db.Model(&system.TaJsonSnippet{}).Count(&jsonCount)
	if jsonCount == 0 {
		jsonSnippets := []system.TaJsonSnippet{
			{UserId: 1, Title: "默认配置", Content: "{\n  \"theme\": \"dark\",\n  \"language\": \"zh-CN\",\n  \"autoSave\": true\n}"},
			{UserId: 1, Title: "前端依赖列表", Content: "{\n  \"react\": \"^18.2.0\",\n  \"vite\": \"^5.0.0\",\n  \"zustand\": \"^4.5.0\"\n}"},
			{UserId: 1, Title: "测试API响应", Content: "{\n  \"code\": 200,\n  \"msg\": \"success\",\n  \"data\": {\n    \"userId\": 1024,\n    \"username\": \"test_user\",\n    \"role\": \"admin\"\n  }\n}"},
		}
		db.Create(&jsonSnippets)
		fmt.Println("Init JSON snippet seed data success")
	}

	var softwareCount int64
	db.Model(&system.TaSoftware{}).Count(&softwareCount)
	if softwareCount == 0 {
		softwares := []system.TaSoftware{
			{UserId: 1, Name: "Navicat Premium", Version: "16.1.11", Category: "database", Platform: "mac", Description: "强大的数据库管理和开发工具。", FileUrl: "", FileName: "navicat16111mac_en.dmg", FileSize: 204857600},
			{UserId: 1, Name: "Postman", Version: "10.15.0", Category: "tool", Platform: "windows", Description: "API测试工具的行业标准。", FileUrl: "", FileName: "Postman-win64-10.15.0-Setup.exe", FileSize: 154857600},
			{UserId: 1, Name: "Docker Desktop", Version: "4.21.1", Category: "tool", Platform: "mac", Description: "容器化开发的基础设施。", FileUrl: "", FileName: "Docker.dmg", FileSize: 504857600},
			{UserId: 1, Name: "Typora", Version: "1.6.7", Category: "office", Platform: "linux", Description: "极简的Markdown编辑器。", FileUrl: "", FileName: "typora_1.6.7_amd64.deb", FileSize: 74857600},
		}
		db.Create(&softwares)
		fmt.Println("Init Software seed data success")
	}

	var mdCount int64
	db.Model(&system.TaMarkdownSnippet{}).Count(&mdCount)
	if mdCount == 0 {
		snippets := []system.TaMarkdownSnippet{
			{UserId: 1, Title: "部署流程文档", Content: "# 项目部署流程\n\n## 1. 准备工作\n- 确保服务器已安装 Docker 和 Docker Compose\n- 获取项目的最新代码\n\n## 2. 部署步骤\n1. 运行 `docker-compose up -d` 启动基础服务（MySQL, Redis）\n2. 编译后端代码：`go build -o server main.go`\n3. 启动后端及前端服务\n\n> 注意：部署前请确认配置文件中的数据库及缓存连接信息是否正确。"},
			{UserId: 1, Title: "API 规范说明", Content: "# RESTful API 设计规范\n\n## 基础原则\n- 使用名词而非动词作为 URI（例如：`/users` 而不是 `/getUsers`）\n- 使用正确的 HTTP 方法（`GET`, `POST`, `PUT`, `DELETE` 等）\n\n## 统一返回格式\n```json\n{\n  \"code\": 0,\n  \"data\": {},\n  \"msg\": \"success\"\n}\n```\n\n## 常见状态码\n- `200`: 请求成功\n- `400`: 参数错误\n- `401`: 未授权\n- `500`: 服务器内部错误"},
			{UserId: 1, Title: "TODO 列表", Content: "## 本周开发任务\n\n- [x] 完成 JSON 管理前端与后端接口开发\n- [x] 补充软件管理默认数据\n- [ ] 优化进度管理 UI，自动计算状态\n- [ ] 加入 Markdown 模块初始化数据\n\n***\n*任务持续跟进中。*"},
		}
		db.Create(&snippets)
		fmt.Println("Init Markdown snippet seed data success")
	}

	var cmdCount int64
	db.Model(&system.TaCommand{}).Count(&cmdCount)
	if cmdCount == 0 {
		commands := []system.TaCommand{
			{UserId: 1, Category: "Docker", Title: "清理未悬空镜像", Command: "docker image prune -a -f", Description: "强制清理所有没有被容器引用的镜像，释放磁盘空间。"},
			{UserId: 1, Category: "Docker", Title: "删除所有容器", Command: "docker stop $(docker ps -aq) && docker rm $(docker ps -aq)", Description: "停止并移除当前系统的所有容器。"},
			{UserId: 1, Category: "Git", Title: "撤销一次 commit", Command: "git reset --soft HEAD~1", Description: "保留工作区修改内容，仅撤销上一次的 commit。"},
			{UserId: 1, Category: "Git", Title: "强制同步远程", Command: "git fetch --all && git reset --hard origin/main", Description: "丢弃所有本地更改，强制和远程的 main 分支对齐。"},
			{UserId: 1, Category: "Linux", Title: "查看端口占用", Command: "lsof -i :8080", Description: "查看哪个进程占用了特定的端口（例如 8080）。"},
			{UserId: 1, Category: "Go", Title: "交叉编译至 Linux", Command: "CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build -o app main.go", Description: "关闭 CGO，跨平台编译出能在 Linux (64位) 上运行的二进制文件。"},
		}
		db.Create(&commands)

		categories := []system.TaCommandCategory{
			{UserId: 1, Name: "Docker"},
			{UserId: 1, Name: "Git"},
			{UserId: 1, Name: "Linux"},
			{UserId: 1, Name: "Go"},
		}
		db.Create(&categories)
		fmt.Println("Init Command seed data success")
	}

	var accountCount int64
	db.Model(&system.TaAccount{}).Count(&accountCount)
	if accountCount == 0 {
		accounts := []system.TaAccount{
			{UserId: 1, Account: "admin@github.com", Password: "SuperSecretPassword123!", Website: "https://github.com", Description: "GitHub 主账号，绑定了所有的开源项目和企业组织仓库。"},
			{UserId: 1, Account: "conchi_dev", Password: "Mysql_root_password_2026", Website: "http://localhost:3306", Description: "本地开发用 MySQL Root 账号，仅限本地及内网访问测试使用。"},
			{UserId: 1, Account: "service@aws.amazon.com", Password: "Aws-production-token-998", Website: "https://aws.amazon.com", Description: "AWS 生产环境子账号，具备 S3 和 EC2 的管理权限。"},
			{UserId: 1, Account: "api_bot", Password: "sk-proj-xyz123abc456", Website: "https://platform.openai.com", Description: "OpenAI API Key 账号，用于本地应用的问答大模型接入测试。"},
		}
		db.Create(&accounts)
		fmt.Println("Init Account seed data success")
	}

	var errorCount int64
	db.Model(&system.TaError{}).Count(&errorCount)
	if errorCount < 4 {
		now := time.Now()
		errorsList := []system.TaError{
			{UserId: 1, Title: "编造不存在的 API 或库", Project: "AI 数枢", Scenario: "让 AI 推荐某个框架的最佳实践时", WrongOutput: "AI 推荐了一个看似合理但实际上不存在的第三方库，并自信地描述了其用法和安装方式。", CorrectAnswer: "在采纳 AI 推荐之前，先去 npm / PyPI / pkg.go.dev 等官方仓库验证包是否真实存在。", Model: "chatgpt", Severity: "critical"},
			{UserId: 1, Title: "长对话后遗忘前文约定", Project: "AI 数枢", Scenario: "在超过 20 轮的复杂对话中，前面约定的接口字段名被后文覆盖", WrongOutput: "AI 在后续代码中使用了不同的字段名，导致前后端接口不一致。", CorrectAnswer: "在关键节点主动重复约定，或使用 system prompt 固定核心上下文。超长对话考虑分段进行。", Model: "claude", Severity: "major"},
			{UserId: 1, Title: "自行修改用户未要求变更的代码", Project: "微信小程序", Scenario: "让 AI 修复一个 bug，但它同时\"优化\"了其他不相关的代码", WrongOutput: "AI 在 fix bug 的同时重构了变量命名、删除了注释、调整了函数签名，引入新的问题。", CorrectAnswer: "明确要求\"只修改与 bug 相关的代码，不要改动其他任何内容\"，或使用 diff 模式审查变更。", Model: "cursor", Severity: "major"},
			{UserId: 1, Title: "生成的正则表达式有边界问题", Project: "微信小程序", Scenario: "让 AI 写一个匹配邮箱的正则表达式", WrongOutput: "生成的正则缺少行首/行尾锚点，导致部分匹配通过。或使用了过于宽松/严格的规则。", CorrectAnswer: "要求 AI 同时提供测试用例（正例+反例），并在 regex101.com 验证。", Model: "gemini", Severity: "minor"},
		}
		
		for i := range errorsList {
			errorsList[i].UpdatedAt = now
		}

		db.Create(&errorsList)
		fmt.Println("Init AI Mistake Management seed data success")
	}

	var appErrorCount int64
	db.Model(&system.TaAppError{}).Count(&appErrorCount)
	if appErrorCount == 0 {
		now := time.Now()
		appErrors := []system.TaAppError{
			{UserId: 1, Title: "数据库连接超时", ErrorMessage: "dial tcp 127.0.0.1:5432: connect: connection refused", Solution: "检查本地 PostgreSQL 服务是否已启动并侦听对应端口。", Status: "solved", Severity: "critical", Tag: "Backend"},
			{UserId: 1, Title: "前端白屏", ErrorMessage: "Uncaught TypeError: Cannot read properties of undefined (reading 'map')", Solution: "渲染列表前增加数据是否正常的判空校验，或使用数据默认值 []", Status: "unsolved", Severity: "normal", Tag: "Frontend"},
			{UserId: 1, Title: "请求跨域失败", ErrorMessage: "Access to XMLHttpRequest at 'http://localhost:8080/api' from origin 'http://localhost:5173' has been blocked by CORS policy", Solution: "在后端中间件（如 Gin 的 CORS 中间件）中配置允许的源 (AllowOrigins) 和请求头。", Status: "solved", Severity: "normal", Tag: "Network"},
			{UserId: 1, Title: "上传文件体积超出限制", ErrorMessage: "http: request body too large", Solution: "修改 Nginx 的 client_max_body_size 配置，并同步调大后端框架的内存接收限制。", Status: "unsolved", Severity: "minor", Tag: "Server"},
			{UserId: 1, Title: "JWT Token鉴权无效", ErrorMessage: "token contains an invalid number of segments", Solution: "重新登录获取最新的 Token，并在前端统一配置 axios 拦截器处理 401 自动强制登出。", Status: "solved", Severity: "major", Tag: "Auth"},
			{UserId: 1, Title: "Tailwind样式冲突", ErrorMessage: "CSS specificity issue: Tailwind classes not applied", Solution: "检查是否有全局自定义 CSS 覆盖了原子类，必要时使用特定包裹或者提高权重。", Status: "solved", Severity: "minor", Tag: "CSS"},
			{UserId: 1, Title: "Goroutine 内存泄漏", ErrorMessage: "fatal error: runtime: out of memory", Solution: "使用 pprof 分析 Goroutine 泄漏点，确保所有的 channel 都能正确接收从而避免阻塞。", Status: "unsolved", Severity: "critical", Tag: "Go"},
			{UserId: 1, Title: "NPM 依赖版本冲突", ErrorMessage: "ERESOLVE unable to resolve dependency tree", Solution: "删除 node_modules 和 package-lock.json 后使用 npm install --legacy-peer-deps 重新安装，或手动平级依赖版本号。", Status: "solved", Severity: "minor", Tag: "Node"},
			{UserId: 1, Title: "React 钩子依赖死循环", ErrorMessage: "Maximum update depth exceeded", Solution: "检查 useEffect 依赖项，防止因对象引用变化触发无限更新。必要时可通过 useRef 跳过非响应式闭包缓存。", Status: "solved", Severity: "major", Tag: "React"},
			{UserId: 1, Title: "Nginx 502 Bad Gateway", ErrorMessage: "502 Bad Gateway nginx/1.18.0", Solution: "后端服务崩溃或端口连不上。检查后端运行日志（Docker或PM2等），确保 proxy_pass 所代理的服务已被正确启动。", Status: "unsolved", Severity: "critical", Tag: "Server"},
			{UserId: 1, Title: "Git 冲突未解决并中断", ErrorMessage: "error: you need to resolve your current index first", Solution: "运行 git status 找到 both modified 文件，手动解决 <<< === >>> 标记后使用 git add 以及 git commit 完成合并。", Status: "solved", Severity: "normal", Tag: "Git"},
			{UserId: 1, Title: "Docker 本地端口被占用", ErrorMessage: "Bind for 0.0.0.0:8080 failed: port is already allocated", Solution: "用 lsof -i :8080 找出并杀掉占用该端口的残留进程，或是去 docker-compose.yml 更换前置宿主映射端口。", Status: "solved", Severity: "major", Tag: "Docker"},
		}
		for i := range appErrors {
			appErrors[i].UpdatedAt = now
		}
		db.Create(&appErrors)
		fmt.Println("Init App Error seed data success")
	}


	var changelogCount int64
	db.Model(&system.TaChangelogProject{}).Where("user_id = ?", 1).Count(&changelogCount)
	if changelogCount == 0 {
		projects := []system.TaChangelogProject{
			{
				UserId: 1, Name: "AI 文件导航", Description: "基于 AI 的智能文件导航系统",
				Logs: []system.TaChangelogLog{
					{Version: "v2.5.0", Description: "新增全栈日志模块迁移", ChangeType: "feature", Date: time.Now().Format("2006-01-02"), Details: "完全从 LocalStorage 迁移到 Go/GORM 后端"},
					{Version: "v2.4.0", Description: "新增报错管理模块", ChangeType: "feature", Date: "2026-04-06", Details: "支持错误记录分类"},
					{Version: "v2.3.0", Description: "新增进度管理模块", ChangeType: "feature", Date: "2026-04-05", Details: "项目进度追踪"},
				},
			},
			{
				UserId: 1, Name: "电商后台系统", Description: "Spring Boot 微服务电商平台",
				Logs: []system.TaChangelogLog{
					{Version: "v1.5.0", Description: "优化订单查询性能", ChangeType: "perf", Date: "2026-04-03", Details: "引入 Redis 缓存"},
					{Version: "v1.4.2", Description: "修复支付回调重复处理", ChangeType: "fix", Date: "2026-04-01", Details: "增加幂等性"},
					{Version: "v1.4.0", Description: "新增优惠券系统", ChangeType: "feature", Date: "2026-03-28", Details: "支持满减、折扣等"},
				},
			},
		}
		db.Create(&projects)
		fmt.Println("Init Changelog seed data success")
	}

	var guidelineCount int64
	db.Model(&system.TaGuideline{}).Where("user_id = ?", 1).Count(&guidelineCount)
	if guidelineCount == 0 {
		guidelines := []system.TaGuideline{
			{UserId: 1, Title: "前端代码规范", Tag: "React", Content: "# 前端代码规范\n\n## 项目结构\n\n- **组件文件**：每个模块一个文件夹，文件夹名与组件名一致\n- **样式**：使用 Tailwind CSS，不使用行内样式\n- **状态管理**：使用 Zustand，避免 prop drilling\n\n## 命名规范\n\n- 组件名：**PascalCase**，如 `ErrorManagerPage`"},
			{UserId: 1, Title: "后端 API 规范", Tag: "Go", Content: "# 后端 API 规范\n\n## 路由设计\n\n- RESTful 风格：`GET /api/items`、`POST /api/items`\n- 统一前缀 `/api/v1/`\n- 资源名使用复数形式\n\n## 返回格式\n\n统一返回 `code`, `msg`, `data`"},
			{UserId: 1, Title: "Git 提交规范", Tag: "通用", Content: "# Git 提交规范\n\n## Commit Message 格式\n\n`<type>(<scope>): <subject>`\n\n- **feat**: 新功能\n- **fix**: 修复 Bug\n- **refactor**: 代码重构\n- **style**: 样式调整"},
		}
		db.Create(&guidelines)
		fmt.Println("Init Guideline seed data success")
	}

	var learnCount int64
	db.Model(&system.TaLearningItem{}).Where("user_id = ?", 1).Count(&learnCount)
	if learnCount == 0 {
		// Item 1
		item1 := system.TaLearningItem{UserId: 1, Title: "Go 并发编程实战", Description: "深入理解 Goroutine、Channel、Select 的使用场景和最佳实践", Url: "https://www.bilibili.com/video/BV1example1", Category: "video", Tag: "Go", Status: "in_progress"}
		db.Create(&item1)

		ch1 := system.TaLearningChapter{UserId: 1, ItemId: item1.ID, Title: "Goroutine 基础", SortOrder: 0, Completed: true}
		ch2 := system.TaLearningChapter{UserId: 1, ItemId: item1.ID, Title: "Channel 通信", SortOrder: 1, Completed: false}
		ch3 := system.TaLearningChapter{UserId: 1, ItemId: item1.ID, Title: "Select 多路复用", SortOrder: 2, Completed: false}
		ch4 := system.TaLearningChapter{UserId: 1, ItemId: item1.ID, Title: "sync 包与互斥锁", SortOrder: 3, Completed: false}
		ch5 := system.TaLearningChapter{UserId: 1, ItemId: item1.ID, Title: "并发模式实战", SortOrder: 4, Completed: false}
		db.Create(&ch1); db.Create(&ch2); db.Create(&ch3); db.Create(&ch4); db.Create(&ch5)

		n1 := system.TaLearningNote{UserId: 1, ItemId: item1.ID, ChapterId: ch2.ID, Content: "已看到第 5 集，Channel 的部分需要反复理解，特别是带缓冲和不带缓冲的区别"}
		n2 := system.TaLearningNote{UserId: 1, ItemId: item1.ID, ChapterId: ch3.ID, Content: "Select 多路复用的用法和 switch 很像，但专门用于 channel 操作"}
		db.Create(&n1); db.Create(&n2)

		// Item 2
		item2 := system.TaLearningItem{UserId: 1, Title: "React 19 新特性详解", Description: "学习 React 19 的 Server Components、Actions 等新特性", Url: "https://react.dev/blog/2024/04/25/react-19", Category: "article", Tag: "React", Status: "todo"}
		db.Create(&item2)

		// Item 3
		item3 := system.TaLearningItem{UserId: 1, Title: "Docker 容器化部署完整教程", Description: "从零开始学习 Docker，包括 Dockerfile、docker-compose、多阶段构建", Url: "https://www.bilibili.com/video/BV1example2", Category: "course", Tag: "Docker", Status: "done"}
		db.Create(&item3)

		ch6 := system.TaLearningChapter{UserId: 1, ItemId: item3.ID, Title: "Docker 基础概念", SortOrder: 0, Completed: true}
		ch7 := system.TaLearningChapter{UserId: 1, ItemId: item3.ID, Title: "Dockerfile 编写", SortOrder: 1, Completed: true}
		ch8 := system.TaLearningChapter{UserId: 1, ItemId: item3.ID, Title: "docker-compose 编排", SortOrder: 2, Completed: true}
		ch9 := system.TaLearningChapter{UserId: 1, ItemId: item3.ID, Title: "多阶段构建优化", SortOrder: 3, Completed: true}
		db.Create(&ch6); db.Create(&ch7); db.Create(&ch8); db.Create(&ch9)

		n3 := system.TaLearningNote{UserId: 1, ItemId: item3.ID, ChapterId: ch9.ID, Content: "已经学完并在项目中实践，掌握了多阶段构建优化镜像大小"}
		n4 := system.TaLearningNote{UserId: 1, ItemId: item3.ID, ChapterId: ch8.ID, Content: "docker-compose 管理多容器非常方便，记住 depends_on 和 networks 的用法"}
		n5 := system.TaLearningNote{UserId: 1, ItemId: item3.ID, ChapterId: ch7.ID, Content: "学到了 .dockerignore 的重要性，可以大幅减小构建上下文"}
		db.Create(&n3); db.Create(&n4); db.Create(&n5)

		// Item 4
		item4 := system.TaLearningItem{UserId: 1, Title: "系统设计面试指南", Description: "了解大型系统的设计思路：负载均衡、缓存、消息队列、数据库分片", Url: "", Category: "book", Tag: "系统设计", Status: "todo"}
		db.Create(&item4)

		fmt.Println("Init Learning Management seed data success")
	}

	var skillCount int64
	db.Model(&system.TaSkill{}).Where("user_id = ?", 1).Count(&skillCount)
	if skillCount == 0 {
		skills := []system.TaSkill{
			{UserId: 1, Title: "Go 并发安全 Map 封装", Description: "基于 sync.RWMutex 封装的线程安全 Map，支持泛型", Code: "package util\n\nimport \"sync\"\n\ntype SafeMap[K comparable, V any] struct {\n\tmu    sync.RWMutex\n\titems map[K]V\n}\n\nfunc NewSafeMap[K comparable, V any]() *SafeMap[K, V] {\n\treturn &SafeMap[K, V]{\n\t\titems: make(map[K]V),\n\t}\n}\n\nfunc (m *SafeMap[K, V]) Set(key K, value V) {\n\tm.mu.Lock()\n\tdefer m.mu.Unlock()\n\tm.items[key] = value\n}\n\nfunc (m *SafeMap[K, V]) Get(key K) (V, bool) {\n\tm.mu.RLock()\n\tdefer m.mu.RUnlock()\n\tval, ok := m.items[key]\n\treturn val, ok\n}", Language: "go", Service: "core-components", Starred: true},
			{UserId: 1, Title: "React 防抖 Hook", Description: "通用的 useDebounce Hook，支持自定义延迟和清理函数", Code: "import { useState, useEffect } from 'react';\n\nexport function useDebounce<T>(value: T, delay: number): T {\n  const [debouncedValue, setDebouncedValue] = useState<T>(value);\n\n  useEffect(() => {\n    const timer = setTimeout(() => {\n      setDebouncedValue(value);\n    }, delay);\n\n    return () => {\n      clearTimeout(timer);\n    };\n  }, [value, delay]);\n\n  return debouncedValue;\n}", Language: "typescript", Service: "frontend-utils", Starred: true},
			{UserId: 1, Title: "Python 装饰器重试机制", Description: "带指数退避的自动重试装饰器，适用于网络请求等场景", Code: "import time\nimport functools\n\ndef retry(max_retries=3, base_delay=1):\n    def decorator(func):\n        @functools.wraps(func)\n        def wrapper(*args, **kwargs):\n            delay = base_delay\n            for i in range(max_retries):\n                try:\n                    return func(*args, **kwargs)\n                except Exception as e:\n                    if i == max_retries - 1:\n                        raise e\n                    time.sleep(delay)\n                    delay *= 2\n            return None\n        return wrapper\n    return decorator", Language: "python", Service: "data-pipeline", Starred: false},
			{UserId: 1, Title: "Docker 多阶段构建模板", Description: "Go 项目的 Dockerfile 多阶段构建，最小化生产镜像", Code: "# Build stage\nFROM golang:1.21-alpine AS builder\nWORKDIR /app\nCOPY go.mod go.sum ./\nRUN go mod download\nCOPY . .\nRUN CGO_ENABLED=0 GOOS=linux go build -o main .\n\n# Production stage\nFROM alpine:latest\nWORKDIR /root/\nCOPY --from=builder /app/main .\nEXPOSE 8080\nCMD [\"./main\"]", Language: "dockerfile", Service: "devops", Starred: false},
		}
		db.Create(&skills)
		fmt.Println("Init Skill Management seed data success")
	}

	var productIdeaCount int64
	db.Model(&system.TaProductIdea{}).Where("user_id = ?", 1).Count(&productIdeaCount)
	if productIdeaCount == 0 {
		ideas := []system.TaProductIdea{
			{UserId: 1, Title: "智能搜索全局化", Product: "AI 数枢", Description: "将 AI 搜索能力扩展到所有模块，支持跨模块语义搜索，实现一个搜索框搜全站的体验。", Notes: "需要后端支持向量化索引，考虑使用 pgvector 或 Milvus。前端先做 UI 和交互，后端搜索能力分阶段接入。", Priority: "high", KeyPoints: system.KeyPoints{
				{Id: "1712211234567-abcde", Text: "统一搜索入口，支持快捷键 Cmd+K 呼出", Done: true},
				{Id: "1712211234568-fghij", Text: "搜索结果按模块分组展示（笔记、文件、代码等）", Done: false},
				{Id: "1712211234569-klmno", Text: "支持自然语言查询，如\"上周写的 Go 代码\"", Done: false},
				{Id: "1712211234570-pqrst", Text: "搜索历史和热门搜索推荐", Done: false},
			}},
			{UserId: 1, Title: "移动端适配方案", Product: "AI 数枢", Description: "针对手机和平板设备进行响应式适配，确保核心功能在移动端可用。", Notes: "优先适配 iPhone 和 iPad，安卓后续跟进。考虑 PWA 方案。", Priority: "medium", KeyPoints: system.KeyPoints{
				{Id: "1712211234571-uvwxy", Text: "导航页改为底部 Tab Bar 布局", Done: false},
				{Id: "1712211234572-zabcd", Text: "笔记模块支持手势操作（左滑删除、右滑收藏）", Done: false},
				{Id: "1712211234573-efghi", Text: "文件预览适配移动端屏幕", Done: false},
			}},
			{UserId: 1, Title: "团队协作功能", Product: "协作平台", Description: "支持多人协作编辑笔记、共享文件夹、实时评论和通知系统。", Notes: "核心技术选型：CRDT 或 OT 算法。可以先用 Yjs 做前端协作，后端用 Redis Pub/Sub 做消息转发。", Priority: "low", KeyPoints: system.KeyPoints{
				{Id: "1712211234574-jklmn", Text: "基于 WebSocket 的实时协作编辑", Done: false},
				{Id: "1712211234575-opqrs", Text: "权限管理：查看者 / 编辑者 / 管理员", Done: false},
				{Id: "1712211234576-tuvwx", Text: "评论和 @提及 通知", Done: false},
				{Id: "1712211234577-yzabc", Text: "操作日志和版本回溯", Done: false},
			}},
		}
		db.Create(&ideas)
		fmt.Println("Init Product Idea seed data success")
	}

	// ─── Init Material seed data ────
	var materialCount int64
	db.Model(&system.TaMaterial{}).Count(&materialCount)
	if materialCount == 0 {
		materials := []system.TaMaterial{
			{UserId: 1, Title: "科技风产品宣传图", Type: "image", Content: "https://images.unsplash.com/photo-1518770660439-4636190af475?w=600", Tags: system.MaterialTags{"科技", "产品"}, Description: "深色背景电路板风格，适合科技类产品宣传"},
			{UserId: 1, Title: "极简自然风光", Type: "image", Content: "https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=600", Tags: system.MaterialTags{"风景", "极简"}, Description: "山水风光背景图"},
			{UserId: 1, Title: "城市夜景光斑", Type: "image", Content: "https://images.unsplash.com/photo-1519501025264-65ba15a82390?w=600", Tags: system.MaterialTags{"城市", "夜景"}, Description: "城市灯光虚化背景素材"},
			{UserId: 1, Title: "Midjourney 产品渲染提示词", Type: "prompt", Content: "A sleek modern wireless headphone floating in mid-air, soft studio lighting, dark gradient background, product photography, 8k, ultra realistic, minimal shadows, commercial shot --ar 16:9 --v 6", Tags: system.MaterialTags{"Midjourney", "产品"}, Description: "高品质无线耳机产品渲染"},
			{UserId: 1, Title: "ChatGPT 文案润色提示词", Type: "prompt", Content: "你是一位资深文案专家。请帮我润色以下营销文案，要求：\n1. 保持原意不变\n2. 语言更加生动有力\n3. 增加情感共鸣\n4. 适当使用修辞手法\n5. 控制在200字以内\n\n原文案：{input}", Tags: system.MaterialTags{"ChatGPT", "文案"}, Description: "通用文案优化提示词模板"},
			{UserId: 1, Title: "Stable Diffusion 人物肖像", Type: "prompt", Content: "professional portrait of a young woman, soft natural lighting, shallow depth of field, warm color grade, shot on Canon EOS R5, 85mm f/1.4, photorealistic, highly detailed skin texture, editorial style", Tags: system.MaterialTags{"SD", "人像"}, Description: "真实感人像生成提示词"},
			{UserId: 1, Title: "产品发布会开场视频", Type: "video", Content: "https://www.youtube.com/watch?v=example1", Tags: system.MaterialTags{"发布会", "开场"}, Description: "30秒倒计时开场动画参考"},
			{UserId: 1, Title: "品牌故事短片参考", Type: "video", Content: "https://www.bilibili.com/video/BV1example", Tags: system.MaterialTags{"品牌", "故事"}, Description: "2分钟叙事类品牌宣传片"},
			{UserId: 1, Title: "618 大促首页 Banner 文案", Type: "copywriting", Content: "🔥 年中狂欢，不止半价\n全场爆品低至 3 折起\n前 1000 名下单额外赠送限量礼盒\n限时 24 小时，手慢无！\n\n👉 立即抢购", Tags: system.MaterialTags{"电商", "促销"}, Description: "618 电商大促首页横幅文案"},
			{UserId: 1, Title: "App Store 应用描述文案", Type: "copywriting", Content: "【产品名称】— 让效率触手可及\n\n🚀 一款重新定义工作流的效率工具\n\n✨ 核心亮点：\n• AI 智能助手，一键完成复杂任务\n• 跨平台同步，随时随地无缝衔接\n• 极简设计，零学习成本上手\n• 端到端加密，数据安全有保障\n\n已有 100,000+ 用户选择信赖\n立即下载，开启高效新体验 →", Tags: system.MaterialTags{"App", "介绍"}, Description: "应用商店描述模板"},
		}
		db.Create(&materials)
		fmt.Println("Init Material seed data success")
	}

	// ─── Init Draft seed data ────
	var draftCount int64
	db.Model(&system.TaDraft{}).Count(&draftCount)
	if draftCount == 0 {
		drafts := []system.TaDraft{
			{UserId: 1, Title: "部署检查清单", Content: "1. 检查环境变量配置\n2. 数据库迁移脚本\n3. Nginx 配置更新\n4. SSL 证书有效期\n5. 健康检查接口\n6. 日志收集配置\n7. 监控告警规则", Pinned: true, Starred: true, Color: "blue"},
			{UserId: 1, Title: "SQL 查询片段", Content: "-- 查询最近7天活跃用户\nSELECT user_id, COUNT(*) as actions\nFROM user_logs\nWHERE created_at > NOW() - INTERVAL '7 days'\nGROUP BY user_id\nORDER BY actions DESC\nLIMIT 100;", Pinned: true, Starred: false, Color: "violet"},
			{UserId: 1, Title: "接口返回格式规范", Content: "{\n  \"code\": 200,\n  \"message\": \"success\",\n  \"data\": {\n    \"list\": [],\n    \"total\": 0,\n    \"page\": 1,\n    \"pageSize\": 20\n  }\n}", Pinned: false, Starred: true, Color: "emerald"},
			{UserId: 1, Title: "本周会议纪要", Content: "1. 前端性能优化方案确认 → 下周三前完成\n2. 新功能需求评审 → 周五下午 3 点\n3. 数据库索引优化 → 已提交 PR\n4. 移动端适配问题 → 分配给小李跟进", Pinned: false, Starred: false, Color: "amber"},
			{UserId: 1, Title: "Git 常用命令备忘", Content: "# 交互式 rebase\ngit rebase -i HEAD~3\n\n# 暂存当前改动\ngit stash push -m \"临时保存\"\ngit stash pop\n\n# 查看某文件的修改历史\ngit log --follow -p -- filename\n\n# 撤销最近一次 commit（保留改动）\ngit reset --soft HEAD~1", Pinned: false, Starred: true, Color: "default"},
			{UserId: 1, Title: "服务器登录信息", Content: "生产环境:\n  IP: 10.0.1.100\n  用户: deploy\n\n测试环境:\n  IP: 10.0.2.50\n  用户: test\n\n数据库:\n  Host: db.internal\n  Port: 5432", Pinned: true, Starred: false, Color: "rose"},
		}
		db.Create(&drafts)
		fmt.Println("Init Draft seed data success")
	}

	var codeSnippetCount int64
	db.Model(&system.TaCodeSnippet{}).Count(&codeSnippetCount)
	if codeSnippetCount == 0 {
		codeSnippets := []system.TaCodeSnippet{
			{UserId: 1, Feature: "HTTP", Language: "go", Title: "Gin CORS Middleware", Description: "标准跨域中间件", Code: "func Cors() gin.HandlerFunc {\n\treturn func(c *gin.Context) {\n\t\tc.Writer.Header().Set(\"Access-Control-Allow-Origin\", \"*\")\n\t\tc.Writer.Header().Set(\"Access-Control-Allow-Credentials\", \"true\")\n\t\tc.Writer.Header().Set(\"Access-Control-Allow-Headers\", \"Content-Type\")\n\t\tc.Writer.Header().Set(\"Access-Control-Allow-Methods\", \"POST, OPTIONS, GET, PUT, DELETE\")\n\t\tif c.Request.Method == \"OPTIONS\" {\n\t\t\tc.AbortWithStatus(204)\n\t\t\treturn\n\t\t}\n\t\tc.Next()\n\t}\n}"},
			{UserId: 1, Feature: "Utils", Language: "javascript", Title: "深拷贝函数", Description: "支持多种环境的安全深拷贝备份方案", Code: "function deepClone(obj) {\n  if (typeof structuredClone === 'function') {\n    return structuredClone(obj);\n  }\n  return JSON.parse(JSON.stringify(obj));\n}"},
			{UserId: 1, Feature: "CSS", Language: "css", Title: "隐藏滚动条样式", Description: "隐藏各种浏览器的滚动条但仍可滚动", Code: ".no-scrollbar::-webkit-scrollbar {\n  display: none;\n}\n.no-scrollbar {\n  -ms-overflow-style: none; \n  scrollbar-width: none; \n}"},
            {UserId: 1, Feature: "Database", Language: "sql", Title: "PGSQL 查看重复数据", Description: "使用 Group By 查看具有相同列值的行", Code: "SELECT email, COUNT(email)\nFROM users\nGROUP BY email\nHAVING COUNT(email) > 1;"},
		}
		db.Create(&codeSnippets)
		fmt.Println("Init Code Snippet seed data success")
	}

	var englishCount int64
	db.Model(&system.TaEnglishWord{}).Count(&englishCount)
	if englishCount == 0 {
		nowStr := fmt.Sprintf("%d年%d月%d日", time.Now().Year(), time.Now().Month(), time.Now().Day())
		words := []system.TaEnglishWord{
			{UserId: 1, Word: "ephemeral", Meaning: "短暂的；朝生暮死的", Phrase: "Fame in the world of pop is largely ephemeral.", PhraseTranslation: "流行乐界的名声大抵是短暂的。", Link: "https://dictionary.cambridge.org/dictionary/english/ephemeral", Date: nowStr, Mastery: 0},
			{UserId: 1, Word: "serendipity", Meaning: "机缘巧合；意外发现的运气", Phrase: "They found each other by pure serendipity.", PhraseTranslation: "他们完全是机缘巧合才找到彼此的。", Link: "https://dictionary.cambridge.org/dictionary/english/serendipity", Date: nowStr, Mastery: 1},
			{UserId: 1, Word: "pragmatic", Meaning: "务实的；实用的", Phrase: "He made a pragmatic decision.", PhraseTranslation: "他做出了一个务实的决定。", Link: "https://dictionary.cambridge.org/dictionary/english/pragmatic", Date: nowStr, Mastery: 2},
			{UserId: 1, Word: "ubiquitous", Meaning: "无处不在的；十分普遍的", Phrase: "Smartphones have become ubiquitous.", PhraseTranslation: "智能手机已经变得无处不在了。", Link: "https://dictionary.cambridge.org/dictionary/english/ubiquitous", Date: nowStr, Mastery: 0},
			{UserId: 1, Word: "meticulous", Meaning: "一丝不苟的；非常注意细节的", Phrase: "Many hours of meticulous preparation have gone into writing the book.", PhraseTranslation: "写这本书投入了大量时间进行细致入微的准备。", Link: "https://dictionary.cambridge.org/dictionary/english/meticulous", Date: nowStr, Mastery: 1},
			{UserId: 1, Word: "eloquent", Meaning: "雄辩的；有说服力的", Phrase: "She made an eloquent appeal for action.", PhraseTranslation: "她恳切地呼吁采取行动。", Link: "https://dictionary.cambridge.org/dictionary/english/eloquent", Date: nowStr, Mastery: 2},
			{UserId: 1, Word: "resilient", Meaning: "有弹性的；能恢复活力的", Phrase: "She's a resilient girl - she won't be unhappy for long.", PhraseTranslation: "她是个适应力很强的女孩——她不会难过太久的。", Link: "https://dictionary.cambridge.org/dictionary/english/resilient", Date: nowStr, Mastery: 0},
			{UserId: 1, Word: "ambiguous", Meaning: "模棱两可的；含糊不清的", Phrase: "His reply to my question was somewhat ambiguous.", PhraseTranslation: "他对我问题的回答有些模棱两可。", Link: "https://dictionary.cambridge.org/dictionary/english/ambiguous", Date: nowStr, Mastery: 1},
			{UserId: 1, Word: "paradigm", Meaning: "范例；词形变化表", Phrase: "Some of these educators are hoping to produce a change in the current cultural paradigm.", PhraseTranslation: "一些教育家希望改变当前的文化模式。", Link: "https://dictionary.cambridge.org/dictionary/english/paradigm", Date: nowStr, Mastery: 0},
			{UserId: 1, Word: "lucrative", Meaning: "赚钱的；盈利的", Phrase: "The merger proved to be very lucrative for both companies.", PhraseTranslation: "事实证明，这次合并对两家公司都是很赚钱的。", Link: "https://dictionary.cambridge.org/dictionary/english/lucrative", Date: nowStr, Mastery: 2},
		}
		db.Create(&words)
		fmt.Println("Init English Word seed data success")
	}

	var dockerOrgCount int64
	db.Model(&system.TaDockerOrg{}).Count(&dockerOrgCount)
	if dockerOrgCount == 0 {
		org1 := system.TaDockerOrg{UserId: 1, Name: "A公司服务配置库"}
		org2 := system.TaDockerOrg{UserId: 1, Name: "自留地"}
		db.Create(&org1)
		db.Create(&org2)

		p1 := system.TaDockerProject{UserId: 1, OrgId: org1.ID, Name: "开发环境数据库"}
		p2 := system.TaDockerProject{UserId: 1, OrgId: org1.ID, Name: "Redis集群"}
		p3 := system.TaDockerProject{UserId: 1, OrgId: org2.ID, Name: "个人博客"}
		db.Create(&p1)
		db.Create(&p2)
		db.Create(&p3)

		f1 := system.TaDockerFile{UserId: 1, ProjectId: p1.ID, Name: "docker-compose.yml", Type: "compose", Description: "MySQL与Adminer", Content: "version: '3'\nservices:\n  mysql:\n    image: mysql:8\n    environment:\n      MYSQL_ROOT_PASSWORD: root\n"}
		f2 := system.TaDockerFile{UserId: 1, ProjectId: p2.ID, Name: "redis.conf", Type: "dockerfile", Description: "Redis配置文件", Content: "# Redis config\nport 6379\n"}
		f3 := system.TaDockerFile{UserId: 1, ProjectId: p3.ID, Name: "Dockerfile", Type: "dockerfile", Description: "Nginx静态博客", Content: "FROM nginx:alpine\nCOPY . /usr/share/nginx/html\n"}
		db.Create(&f1)
		db.Create(&f2)
		db.Create(&f3)
		fmt.Println("Init Docker seed data success")
	}

	// ─── Init Deploy seed data ────
	var deployCount int64
	db.Model(&system.TaDeployProject{}).Count(&deployCount)
	if deployCount == 0 {
		// Project 1: Redis
		p1 := system.TaDeployProject{UserId: 1, Name: "Redis 部署", Description: "使用 Docker 部署 Redis 7.x，含持久化与密码配置", Platforms: "mac,linux"}
		db.Create(&p1)
		db.Create(&system.TaDeployFile{UserId: 1, ProjectId: p1.ID, Name: "docker-compose.yml", Language: "yaml", Content: "version: '3.8'\nservices:\n  redis:\n    image: redis:7.2-alpine\n    container_name: redis\n    restart: always\n    ports:\n      - \"6379:6379\"\n    volumes:\n      - ./redis.conf:/usr/local/etc/redis/redis.conf\n      - redis-data:/data\n    command: redis-server /usr/local/etc/redis/redis.conf\n\nvolumes:\n  redis-data:"})
		db.Create(&system.TaDeployFile{UserId: 1, ProjectId: p1.ID, Name: "redis.conf", Language: "properties", Content: "bind 0.0.0.0\nrequirepass your_redis_password\nappendonly yes\nappendfsync everysec\nmaxmemory 256mb\nmaxmemory-policy allkeys-lru"})
		db.Create(&system.TaDeployStep{UserId: 1, ProjectId: p1.ID, SortOrder: 1, Title: "创建项目目录", Description: "在服务器上创建部署目录", Commands: "mkdir -p /opt/redis && cd /opt/redis"})
		db.Create(&system.TaDeployStep{UserId: 1, ProjectId: p1.ID, SortOrder: 2, Title: "上传配置文件", Description: "将 docker-compose.yml 和 redis.conf 放入目录", Commands: "ls -la /opt/redis/"})
		db.Create(&system.TaDeployStep{UserId: 1, ProjectId: p1.ID, SortOrder: 3, Title: "启动服务", Commands: "docker-compose up -d"})
		db.Create(&system.TaDeployStep{UserId: 1, ProjectId: p1.ID, SortOrder: 4, Title: "验证服务", Commands: "docker ps | grep redis\ndocker exec -it redis redis-cli -a your_redis_password ping"})

		// Project 2: ES + Kibana
		p2 := system.TaDeployProject{UserId: 1, Name: "Elasticsearch + Kibana", Description: "Docker Compose 部署 ES 8.x 单节点 + Kibana", Platforms: "mac,linux"}
		db.Create(&p2)
		db.Create(&system.TaDeployFile{UserId: 1, ProjectId: p2.ID, Name: "docker-compose.yml", Language: "yaml", Content: "version: '3.8'\nservices:\n  elasticsearch:\n    image: elasticsearch:8.12.0\n    container_name: elasticsearch\n    environment:\n      - discovery.type=single-node\n      - xpack.security.enabled=false\n      - ES_JAVA_OPTS=-Xms512m -Xmx512m\n    ports:\n      - \"9200:9200\"\n    volumes:\n      - es-data:/usr/share/elasticsearch/data\n    networks:\n      - elastic\n\n  kibana:\n    image: kibana:8.12.0\n    container_name: kibana\n    environment:\n      - ELASTICSEARCH_HOSTS=http://elasticsearch:9200\n    ports:\n      - \"5601:5601\"\n    depends_on:\n      - elasticsearch\n    networks:\n      - elastic\n\nvolumes:\n  es-data:\n\nnetworks:\n  elastic:"})
		db.Create(&system.TaDeployStep{UserId: 1, ProjectId: p2.ID, SortOrder: 1, Title: "创建部署目录", Commands: "mkdir -p /opt/elasticsearch && cd /opt/elasticsearch"})
		db.Create(&system.TaDeployStep{UserId: 1, ProjectId: p2.ID, SortOrder: 2, Title: "调整系统参数", Description: "ES 需要较大的 mmap 计数", Commands: "sudo sysctl -w vm.max_map_count=262144\necho \"vm.max_map_count=262144\" | sudo tee -a /etc/sysctl.conf", Platform: "linux"})
		db.Create(&system.TaDeployStep{UserId: 1, ProjectId: p2.ID, SortOrder: 3, Title: "启动服务", Commands: "docker-compose up -d"})
		db.Create(&system.TaDeployStep{UserId: 1, ProjectId: p2.ID, SortOrder: 4, Title: "验证", Commands: "curl http://localhost:9200\ncurl http://localhost:9200/_cluster/health?pretty\n# Kibana: http://localhost:5601"})

		// Project 3: RabbitMQ
		p3 := system.TaDeployProject{UserId: 1, Name: "RabbitMQ 部署", Description: "Docker 部署 RabbitMQ 3.12 含管理面板", Platforms: "windows,mac,linux"}
		db.Create(&p3)
		db.Create(&system.TaDeployFile{UserId: 1, ProjectId: p3.ID, Name: "docker-compose.yml", Language: "yaml", Content: "version: '3.8'\nservices:\n  rabbitmq:\n    image: rabbitmq:3.12-management\n    container_name: rabbitmq\n    hostname: rabbitmq-host\n    restart: always\n    ports:\n      - \"5672:5672\"\n      - \"15672:15672\"\n    environment:\n      RABBITMQ_DEFAULT_USER: admin\n      RABBITMQ_DEFAULT_PASS: admin123\n    volumes:\n      - rabbitmq-data:/var/lib/rabbitmq\n\nvolumes:\n  rabbitmq-data:"})
		db.Create(&system.TaDeployStep{UserId: 1, ProjectId: p3.ID, SortOrder: 1, Title: "启动服务", Commands: "docker-compose up -d"})
		db.Create(&system.TaDeployStep{UserId: 1, ProjectId: p3.ID, SortOrder: 2, Title: "访问管理面板", Description: "http://localhost:15672  用户: admin / admin123", Commands: "# 浏览器访问 http://localhost:15672"})

		fmt.Println("Init Deploy seed data success")
	}

	var releaseProjectCount int64
	db.Model(&system.TaReleaseProject{}).Count(&releaseProjectCount)
	if releaseProjectCount == 0 {
		rp1 := system.TaReleaseProject{UserId: 1, Name: "AI 数枢平台", Description: "前后端分离全栈项目，Go + React"}
		rp2 := system.TaReleaseProject{UserId: 1, Name: "用户中心微服务", Description: "Spring Boot 用户认证服务"}
		db.Create(&rp1)
		db.Create(&rp2)

		addresses := []system.TaReleaseAddress{
			{UserId: 1, ProjectId: rp1.ID, Label: "生产服务器", Url: "https://datahub.example.com", Env: "production"},
			{UserId: 1, ProjectId: rp1.ID, Label: "后端 API", Url: "https://api.datahub.example.com", Env: "production"},
			{UserId: 1, ProjectId: rp1.ID, Label: "测试环境", Url: "http://192.168.1.100:5174", Env: "staging"},
			{UserId: 1, ProjectId: rp1.ID, Label: "本地开发", Url: "http://localhost:5174", Env: "dev"},
			{UserId: 1, ProjectId: rp2.ID, Label: "生产地址", Url: "https://user.example.com", Env: "production"},
			{UserId: 1, ProjectId: rp2.ID, Label: "预发环境", Url: "https://staging-user.example.com", Env: "staging"},
		}
		db.Create(&addresses)

		files := []system.TaReleaseFile{
			{UserId: 1, ProjectId: rp1.ID, Name: "server", Path: "/opt/datahub/server", Description: "Go 后端二进制文件"},
			{UserId: 1, ProjectId: rp1.ID, Name: "dist/", Path: "/opt/datahub/web/dist", Description: "前端打包产物"},
			{UserId: 1, ProjectId: rp1.ID, Name: "config.yaml", Path: "/opt/datahub/config.yaml", Description: "后端配置文件"},
			{UserId: 1, ProjectId: rp1.ID, Name: "nginx.conf", Path: "/etc/nginx/conf.d/datahub.conf", Description: "Nginx 反代配置"},
			{UserId: 1, ProjectId: rp2.ID, Name: "user-center.jar", Path: "/opt/services/user-center/user-center.jar", Description: "Spring Boot Fat JAR"},
			{UserId: 1, ProjectId: rp2.ID, Name: "application-prod.yml", Path: "/opt/services/user-center/application-prod.yml", Description: "生产配置"},
			{UserId: 1, ProjectId: rp2.ID, Name: "Dockerfile", Path: "/opt/services/user-center/Dockerfile", Description: "容器镜像构建文件"},
		}
		db.Create(&files)

		commands := []system.TaReleaseCommand{
			{UserId: 1, ProjectId: rp1.ID, Label: "前端打包", Command: "cd web && npm run build", Description: "构建前端生产包"},
			{UserId: 1, ProjectId: rp1.ID, Label: "Go 编译", Command: "CGO_ENABLED=0 GOOS=linux go build -o server main.go", Description: "交叉编译 Linux 二进制"},
			{UserId: 1, ProjectId: rp1.ID, Label: "上传文件", Command: "scp -r dist/ server config.yaml root@192.168.1.100:/opt/datahub/", Description: "SCP 上传到服务器"},
			{UserId: 1, ProjectId: rp1.ID, Label: "重启服务", Command: "ssh root@192.168.1.100 \"cd /opt/datahub && ./restart.sh\"", Description: "SSH 远程重启"},
			{UserId: 1, ProjectId: rp1.ID, Label: "重启 Nginx", Command: "ssh root@192.168.1.100 \"nginx -t && nginx -s reload\"", Description: "校验并重载 Nginx"},
			{UserId: 1, ProjectId: rp2.ID, Label: "Maven 打包", Command: "mvn clean package -DskipTests -Pprod", Description: "跳过测试打生产包"},
			{UserId: 1, ProjectId: rp2.ID, Label: "Docker 构建", Command: "docker build -t user-center:latest .", Description: "构建 Docker 镜像"},
			{UserId: 1, ProjectId: rp2.ID, Label: "Docker 发布", Command: "docker-compose up -d user-center", Description: "启动容器"},
		}
		db.Create(&commands)

		fmt.Println("Init Release Management seed data success")
	}

	// ─── Init Script Management seed data ────
	var scriptCount int64
	db.Model(&system.TaScript{}).Count(&scriptCount)
	if scriptCount == 0 {
		scripts := []system.TaScript{
			{UserId: 1, Title: "清理系统日志", Description: "清理 /var/log 下的旧日志文件，释放磁盘空间", Language: "bash", Code: "#!/bin/bash\n# 清理 7 天前的日志文件\nfind /var/log -type f -name \"*.log\" -mtime +7 -exec rm -f {} \\;\necho \"旧日志清理完成\"", Tags: []string{"运维", "系统", "清理"}},
			{UserId: 1, Title: "批量重命名图片", Description: "将当前目录下所有的 jpg 格式重命名为规范的前缀", Language: "python", Code: "import os\n\nprefix = 'img_'\ncount = 1\nfor filename in os.listdir('.'):\n    if filename.endswith('.jpg'):\n        new_name = f\"{prefix}{count:03d}.jpg\"\n        os.rename(filename, new_name)\n        count += 1\nprint('重命名完成！')", Tags: []string{"工具", "Python"}},
			{UserId: 1, Title: "检查服务健康状态", Description: "使用 curl 检查指定 API 接口是否正常响应 200", Language: "shell", Code: "#!/bin/bash\nURL=\"http://localhost:8888/api/health\"\nSTATUS=$(curl -s -o /dev/null -w \"%{http_code}\" $URL)\nif [ $STATUS -eq 200 ]; then\n  echo \"服务运行正常\"\nelse\n  echo \"服务异常，HTTP 状态码: $STATUS\"\nfi", Tags: []string{"监控", "API"}},
			{UserId: 1, Title: "解析 JSON 数据配置", Description: "演示如何在 Node.js 中读取并解析本地 JSON 文件", Language: "javascript", Code: "const fs = require('fs');\n\ntry {\n  const rawData = fs.readFileSync('config.json', 'utf8');\n  const config = JSON.parse(rawData);\n  console.log('读取到配置：', config);\n} catch (err) {\n  console.error('读取或解析配置失败：', err);\n}", Tags: []string{"Node.js", "前端", "配置"}},
		}
		db.Create(&scripts)
		fmt.Println("Init Script Management seed data success")
	}

	var progressProjectCount int64
	db.Model(&system.TaProgressProject{}).Count(&progressProjectCount)
	if progressProjectCount == 0 {
		pp1 := system.TaProgressProject{UserId: 1, Name: "AI 数枢平台", Description: "个人数据管理全栈项目"}
		pp2 := system.TaProgressProject{UserId: 1, Name: "用户中心微服务", Description: "Spring Boot 用户认证服务"}
		pp3 := system.TaProgressProject{UserId: 1, Name: "电商后台管理", Description: "React + Go 电商管理平台"}
		db.Create(&pp1)
		db.Create(&pp2)
		db.Create(&pp3)

		// AI 数枢平台 - flat features (no children)
		features1 := []system.TaProgressFeature{
			{UserId: 1, ProjectId: pp1.ID, Name: "笔记管理", Status: "done", Progress: 100, Priority: "high"},
			{UserId: 1, ProjectId: pp1.ID, Name: "文件管理", Status: "done", Progress: 100, Priority: "high"},
			{UserId: 1, ProjectId: pp1.ID, Name: "代码管理", Status: "done", Progress: 100, Priority: "medium"},
			{UserId: 1, ProjectId: pp1.ID, Name: "部署管理", Status: "in_progress", Progress: 70, Priority: "medium"},
			{UserId: 1, ProjectId: pp1.ID, Name: "发布管理", Status: "in_progress", Progress: 50, Priority: "medium"},
			{UserId: 1, ProjectId: pp1.ID, Name: "素材管理", Status: "in_progress", Progress: 85, Priority: "low"},
			{UserId: 1, ProjectId: pp1.ID, Name: "英语管理", Status: "in_progress", Progress: 60, Priority: "low"},
			{UserId: 1, ProjectId: pp1.ID, Name: "进度管理", Status: "done", Progress: 100, Priority: "high"},
			{UserId: 1, ProjectId: pp1.ID, Name: "数据导出", Status: "todo", Progress: 0, Priority: "low"},
		}
		db.Create(&features1)

		// 用户中心微服务 - flat features
		features2 := []system.TaProgressFeature{
			{UserId: 1, ProjectId: pp2.ID, Name: "用户注册/登录", Status: "done", Progress: 100, Priority: "high"},
			{UserId: 1, ProjectId: pp2.ID, Name: "OAuth 第三方登录", Status: "in_progress", Progress: 40, Priority: "medium"},
			{UserId: 1, ProjectId: pp2.ID, Name: "角色权限管理", Status: "in_progress", Progress: 90, Priority: "high"},
			{UserId: 1, ProjectId: pp2.ID, Name: "用户资料管理", Status: "done", Progress: 100, Priority: "medium"},
			{UserId: 1, ProjectId: pp2.ID, Name: "操作日志", Status: "todo", Progress: 0, Priority: "low"},
		}
		db.Create(&features2)

		// 电商后台管理 - parent-child hierarchy
		// Parent: 订单管理
		orderMgr := system.TaProgressFeature{UserId: 1, ProjectId: pp3.ID, Name: "订单管理", Status: "in_progress", Progress: 65, Priority: "high"}
		db.Create(&orderMgr)
		orderChildren := []system.TaProgressFeature{
			{UserId: 1, ProjectId: pp3.ID, ParentId: orderMgr.ID, Name: "订单列表页", Status: "done", Progress: 100, Priority: "high"},
			{UserId: 1, ProjectId: pp3.ID, ParentId: orderMgr.ID, Name: "订单详情页", Status: "in_progress", Progress: 70, Priority: "high"},
			{UserId: 1, ProjectId: pp3.ID, ParentId: orderMgr.ID, Name: "状态流转逻辑", Status: "in_progress", Progress: 30, Priority: "medium"},
		}
		db.Create(&orderChildren)

		// Parent: 支付对接
		payMgr := system.TaProgressFeature{UserId: 1, ProjectId: pp3.ID, Name: "支付对接", Status: "in_progress", Progress: 20, Priority: "high"}
		db.Create(&payMgr)
		payChildren := []system.TaProgressFeature{
			{UserId: 1, ProjectId: pp3.ID, ParentId: payMgr.ID, Name: "微信支付", Status: "in_progress", Progress: 40, Priority: "high"},
			{UserId: 1, ProjectId: pp3.ID, ParentId: payMgr.ID, Name: "支付宝对接", Status: "todo", Progress: 0, Priority: "high"},
		}
		db.Create(&payChildren)

		// Standalone features (no children)
		standalone := []system.TaProgressFeature{
			{UserId: 1, ProjectId: pp3.ID, Name: "商品管理", Status: "done", Progress: 100, Priority: "high"},
			{UserId: 1, ProjectId: pp3.ID, Name: "数据看板", Status: "todo", Progress: 0, Priority: "medium"},
		}
		db.Create(&standalone)

		fmt.Println("Init Progress Management seed data success")
	}

	var pathCount int64
	db.Model(&system.TaPath{}).Count(&pathCount)
	if pathCount == 0 {
		paths := []system.TaPath{
			{UserId: 1, Category: "MacOS", Title: "Nginx 主配置", Path: "/usr/local/etc/nginx/nginx.conf", Description: "本地开发环境 Nginx 核心代理配置", Content: "user nobody;\nworker_processes auto;\nevents {\n    worker_connections 1024;\n}\nhttp {\n    include mime.types;\n    default_type application/octet-stream;\n    sendfile on;\n    keepalive_timeout 65;\n    server {\n        listen 8080;\n        server_name localhost;\n        location / {\n            root html;\n            index index.html index.htm;\n        }\n    }\n}"},
			{UserId: 1, Category: "MacOS", Title: "Redis 常用配置", Path: "/usr/local/etc/redis.conf", Description: "后台自启的 Redis 本地缓存", Content: "bind 127.0.0.1\nport 6379\ndaemonize yes"},
			{UserId: 1, Category: "阿里云服务器", Title: "SSH 授权配置", Path: "~/.ssh/authorized_keys", Description: "用来管理信任访问的免密登录机器公钥", Content: "ssh-rsa AAAAB3NzaC..."},
		}
		db.Create(&paths)

		cats := []system.TaPathCategory{
			{UserId: 1, Name: "MacOS"},
			{UserId: 1, Name: "阿里云服务器"},
		}
		db.Create(&cats)
		fmt.Println("Init Path Management seed data success")
	}
}
