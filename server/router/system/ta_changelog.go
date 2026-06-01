package system

import (
	v1 "github.com/conchi/ai-note/server/api/v1"
	"github.com/gin-gonic/gin"
)

type ChangelogRouter struct{}

func (s *ChangelogRouter) InitChangelogRouter(Router *gin.RouterGroup) {
	changelogRouter := Router.Group("changelog")
	
	changelogApi := v1.ApiGroupApp.SystemApiGroup.ChangelogApi
	{
		changelogRouter.POST("createProject", changelogApi.CreateProject)
		changelogRouter.DELETE("deleteProject", changelogApi.DeleteProject)
		changelogRouter.PUT("updateProject", changelogApi.UpdateProject)
		
		changelogRouter.POST("createLog", changelogApi.CreateLog)
		changelogRouter.DELETE("deleteLog", changelogApi.DeleteLog)
		changelogRouter.PUT("updateLog", changelogApi.UpdateLog)
		
		changelogRouter.POST("getProjectWithLogsList", changelogApi.GetProjectWithLogsList)
	}
}
