package system

import (
	v1 "github.com/conchi/ai-note/server/api/v1"
	"github.com/gin-gonic/gin"
)

type DeployRouter struct{}

func (s *DeployRouter) InitDeployRouter(Router *gin.RouterGroup) {
	deployRouter := Router.Group("deploy")
	deployApi := v1.ApiGroupApp.SystemApiGroup.DeployApi
	{
		// Tree
		deployRouter.GET("getTree", deployApi.GetDeployTree)

		// Project
		deployRouter.POST("createProject", deployApi.CreateProject)
		deployRouter.PUT("updateProject", deployApi.UpdateProject)
		deployRouter.DELETE("deleteProject", deployApi.DeleteProject)

		// File
		deployRouter.POST("createFile", deployApi.CreateFile)
		deployRouter.PUT("updateFile", deployApi.UpdateFile)
		deployRouter.DELETE("deleteFile", deployApi.DeleteFile)

		// Step
		deployRouter.POST("createStep", deployApi.CreateStep)
		deployRouter.PUT("updateStep", deployApi.UpdateStep)
		deployRouter.DELETE("deleteStep", deployApi.DeleteStep)
	}
}
