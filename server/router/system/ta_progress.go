package system

import (
	"github.com/conchi/ai-note/server/api/v1"
	"github.com/gin-gonic/gin"
)

type TaProgressRouter struct{}

func (s *TaProgressRouter) InitTaProgressRouter(Router *gin.RouterGroup) {
	progressRouter := Router.Group("progress")
	progressApi := v1.ApiGroupApp.SystemApiGroup.TaProgressApi
	{
		progressRouter.POST("createProject", progressApi.CreateProject)
		progressRouter.DELETE("deleteProject", progressApi.DeleteProject)
		progressRouter.PUT("updateProject", progressApi.UpdateProject)
		progressRouter.GET("getProjectList", progressApi.GetProjectList)

		progressRouter.POST("createFeature", progressApi.CreateFeature)
		progressRouter.DELETE("deleteFeature", progressApi.DeleteFeature)
		progressRouter.PUT("updateFeature", progressApi.UpdateFeature)
	}
}
