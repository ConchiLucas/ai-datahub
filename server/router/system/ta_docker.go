package system

import (
	v1 "github.com/conchi/ai-note/server/api/v1"
	"github.com/gin-gonic/gin"
)

type DockerRouter struct{}

func (s *DockerRouter) InitDockerRouter(Router *gin.RouterGroup) {
	dockerRouter := Router.Group("docker")
	dockerApi := v1.ApiGroupApp.SystemApiGroup.DockerApi
	{
		// Tree
		dockerRouter.GET("getTree", dockerApi.GetDockerTree)

		// Org
		dockerRouter.POST("createOrg", dockerApi.CreateOrg)
		dockerRouter.PUT("updateOrg", dockerApi.UpdateOrg)
		dockerRouter.DELETE("deleteOrg", dockerApi.DeleteOrg)

		// Project
		dockerRouter.POST("createProject", dockerApi.CreateProject)
		dockerRouter.PUT("updateProject", dockerApi.UpdateProject)
		dockerRouter.DELETE("deleteProject", dockerApi.DeleteProject)

		// File
		dockerRouter.POST("createFile", dockerApi.CreateFile)
		dockerRouter.PUT("updateFile", dockerApi.UpdateFile)
		dockerRouter.DELETE("deleteFile", dockerApi.DeleteFile)
	}
}
