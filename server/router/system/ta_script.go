package system

import (
	v1 "github.com/conchi/ai-note/server/api/v1"
	"github.com/gin-gonic/gin"
)

type ScriptRouter struct{}

func (s *ScriptRouter) InitScriptRouter(Router *gin.RouterGroup) {
	scriptRouter := Router.Group("script")
	scriptApi := v1.ApiGroupApp.SystemApiGroup.ScriptApi
	{
		scriptRouter.POST("createScript", scriptApi.CreateScript)
		scriptRouter.DELETE("deleteScript", scriptApi.DeleteScript)
		scriptRouter.PUT("updateScript", scriptApi.UpdateScript)
		scriptRouter.GET("getScriptList", scriptApi.GetScriptList)
		scriptRouter.POST("getScriptList", scriptApi.GetScriptList)
	}
}
