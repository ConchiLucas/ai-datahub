package initialize

import (
	"net/http"

	"github.com/conchi/ai-note/server/global"
	"github.com/conchi/ai-note/server/middleware"
	"github.com/conchi/ai-note/server/router"
	"github.com/gin-gonic/gin"
)

func Routers() *gin.Engine {
	Router := gin.Default()

	systemRouter := router.RouterGroupApp.System

	if global.GVA_CONFIG.System.Env == "public" {
		Router.Use(middleware.GinRecovery(false))
	} else {
		Router.Use(middleware.GinRecovery(true))
	}

	Router.Use(middleware.CorsByRules())
	Router.Use(middleware.DefaultLogger())
	
	// Server static uploads directory
	Router.Static(global.GVA_CONFIG.System.RouterPrefix+"/uploads", "./uploads")
	
	PublicGroup := Router.Group(global.GVA_CONFIG.System.RouterPrefix)
	{
		PublicGroup.GET("/health", func(c *gin.Context) {
			c.JSON(http.StatusOK, "ok")
		})
	}
	{
		systemRouter.InitBaseRouter(PublicGroup)
		systemRouter.InitAuthPublicRouter(PublicGroup)
	}
	PrivateGroup := Router.Group(global.GVA_CONFIG.System.RouterPrefix)
	PrivateGroup.Use(middleware.JWTAuth())
	{
		systemRouter.InitUserRouter(PrivateGroup)
		systemRouter.InitAuthPrivateRouter(PrivateGroup)
		systemRouter.InitDirectoryRouter(PrivateGroup)
		systemRouter.InitAiNoteRouter(PrivateGroup)
		systemRouter.InitTagRouter(PrivateGroup)
		systemRouter.InitFileRouter(PrivateGroup)
		systemRouter.InitWebNavRouter(PrivateGroup)
		systemRouter.InitGalleryRouter(PrivateGroup)
		systemRouter.InitMusicRouter(PrivateGroup)
		systemRouter.InitAccountRouter(PrivateGroup)
		systemRouter.InitPlanRouter(PrivateGroup)
		systemRouter.InitBillingRouter(PrivateGroup)
		systemRouter.InitPromptRouter(PrivateGroup)
		systemRouter.InitCommandRouter(PrivateGroup)
		systemRouter.InitJsonRouter(PrivateGroup)
		systemRouter.InitMarkdownRouter(PrivateGroup)
		systemRouter.InitSoftwareRouter(PrivateGroup)
		systemRouter.InitTaDraftRouter(PrivateGroup)
		systemRouter.InitCodeRouter(PrivateGroup)
		systemRouter.InitErrorRouter(PrivateGroup)
		systemRouter.InitAppErrorRouter(PrivateGroup) // 注册报错管理路由
		systemRouter.InitChangelogRouter(PrivateGroup)
		systemRouter.InitGuidelineRouter(PrivateGroup)
		systemRouter.InitScreenshotRouter(PrivateGroup)
		systemRouter.InitLearningRouter(PrivateGroup)
		systemRouter.InitTaSkillRouter(PrivateGroup)
		systemRouter.InitProductIdeaRouter(PrivateGroup)
		systemRouter.InitTaNovelRouter(PrivateGroup)
		systemRouter.InitTaNovelChapterRouter(PrivateGroup)
		systemRouter.InitMaterialRouter(PrivateGroup)
		systemRouter.InitEnglishWordRouter(PrivateGroup)
		systemRouter.InitDeployRouter(PrivateGroup)
		systemRouter.InitTaReleaseRouter(PrivateGroup)
		systemRouter.InitTaProgressRouter(PrivateGroup)
		systemRouter.InitScriptRouter(PrivateGroup)
		systemRouter.InitDockerRouter(PrivateGroup)
		systemRouter.InitTaPathRouter(PrivateGroup)
		systemRouter.InitPortRouter(PrivateGroup)
	}

	global.GVA_LOG.Info("router register success")
	return Router
}
