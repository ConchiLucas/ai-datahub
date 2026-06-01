package system

import "github.com/conchi/ai-note/server/service"

var (
	userService             = service.ServiceGroupApp.SystemServiceGroup.UserService
	taAiNoteService         = service.ServiceGroupApp.SystemServiceGroup.TaAiNoteService
	directoryService        = service.ServiceGroupApp.SystemServiceGroup.TaDirectoryService
	tagService              = service.ServiceGroupApp.SystemServiceGroup.TaTagService
	filFileService          = service.ServiceGroupApp.SystemServiceGroup.FilFileService
	webNavService           = service.ServiceGroupApp.SystemServiceGroup.WebNavService
	galleryService          = service.ServiceGroupApp.SystemServiceGroup.GalleryService
	musicService            = service.ServiceGroupApp.SystemServiceGroup.MusicService
	accountService          = service.ServiceGroupApp.SystemServiceGroup.AccountService
	planService             = service.ServiceGroupApp.SystemServiceGroup.PlanService
	billingService          = service.ServiceGroupApp.SystemServiceGroup.BillingService
	promptService           = service.ServiceGroupApp.SystemServiceGroup.PromptService
	commandService          = service.ServiceGroupApp.SystemServiceGroup.CommandService
	jsonService             = service.ServiceGroupApp.SystemServiceGroup.JsonService
	markdownService         = service.ServiceGroupApp.SystemServiceGroup.MarkdownService
	softwareService         = service.ServiceGroupApp.SystemServiceGroup.SoftwareService
	taDraftService          = service.ServiceGroupApp.SystemServiceGroup.TaDraftService
	codeService             = service.ServiceGroupApp.SystemServiceGroup.TaCodeService
	errorService            = service.ServiceGroupApp.SystemServiceGroup.ErrorService
	changelogService        = service.ServiceGroupApp.SystemServiceGroup.ChangelogService
	guidelineService        = service.ServiceGroupApp.SystemServiceGroup.GuidelineService
	screenshotService       = service.ServiceGroupApp.SystemServiceGroup.ScreenshotService
	learningService         = service.ServiceGroupApp.SystemServiceGroup.LearningService
	skillService            = service.ServiceGroupApp.SystemServiceGroup.TaSkillService
	productIdeaService      = service.ServiceGroupApp.SystemServiceGroup.TaProductIdeaService
	taNovelService          = service.ServiceGroupApp.SystemServiceGroup.TaNovelService
	taNovelChapterService   = service.ServiceGroupApp.SystemServiceGroup.TaNovelChapterService
	materialService         = service.ServiceGroupApp.SystemServiceGroup.TaMaterialService
	appErrorService         = service.ServiceGroupApp.SystemServiceGroup.AppErrorService
	englishWordService      = service.ServiceGroupApp.SystemServiceGroup.EnglishWordService
	dockerService           = service.ServiceGroupApp.SystemServiceGroup.DockerService
	deployService           = service.ServiceGroupApp.SystemServiceGroup.DeployService
	scriptService           = service.ServiceGroupApp.SystemServiceGroup.TaScriptService
	releaseService          = service.ServiceGroupApp.SystemServiceGroup.TaReleaseService
	progressService         = service.ServiceGroupApp.SystemServiceGroup.TaProgressService
	pathService             = service.ServiceGroupApp.SystemServiceGroup.PathService
	portService             = service.ServiceGroupApp.SystemServiceGroup.PortService
)
