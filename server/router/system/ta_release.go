package system

import (
	"github.com/conchi/ai-note/server/api/v1"
	"github.com/gin-gonic/gin"
)

type TaReleaseRouter struct{}

// InitTaReleaseRouter 初始化 发布管理 路由信息
func (s *TaReleaseRouter) InitTaReleaseRouter(Router *gin.RouterGroup) {
	releaseRouter := Router.Group("release")
	releaseRouterWithoutRecord := Router.Group("release")
	releaseApi := v1.ApiGroupApp.SystemApiGroup.TaReleaseApi
	{
		releaseRouter.POST("createProject", releaseApi.CreateProject)
		releaseRouter.DELETE("deleteProject", releaseApi.DeleteProject)
		releaseRouter.PUT("updateProject", releaseApi.UpdateProject)
		
		releaseRouter.POST("createAddress", releaseApi.CreateAddress)
		releaseRouter.DELETE("deleteAddress", releaseApi.DeleteAddress)
		releaseRouter.PUT("updateAddress", releaseApi.UpdateAddress)

		releaseRouter.POST("createFile", releaseApi.CreateFile)
		releaseRouter.DELETE("deleteFile", releaseApi.DeleteFile)
		releaseRouter.PUT("updateFile", releaseApi.UpdateFile)

		releaseRouter.POST("createCommand", releaseApi.CreateCommand)
		releaseRouter.DELETE("deleteCommand", releaseApi.DeleteCommand)
		releaseRouter.PUT("updateCommand", releaseApi.UpdateCommand)
	}
	{
		releaseRouterWithoutRecord.GET("getProjectList", releaseApi.GetProjectList)
	}
}
