package system

import (
	v1 "github.com/conchi/ai-note/server/api/v1"
	"github.com/gin-gonic/gin"
)

type DirectoryRouter struct{}

func (s *DirectoryRouter) InitDirectoryRouter(Router *gin.RouterGroup) {
	directoryRouter := Router.Group("directory")
	directoryApi := v1.ApiGroupApp.SystemApiGroup.DirectoryApi
	{
		directoryRouter.GET("tree", directoryApi.GetDirectoryTree)
		directoryRouter.GET("list", directoryApi.GetDirectoryList)
		directoryRouter.GET(":id", directoryApi.GetDirectoryById)
		directoryRouter.POST("saveOrUpdate", directoryApi.SaveOrUpdateDirectory)
		directoryRouter.DELETE("delete/:ids", directoryApi.DeleteDirectory)
		directoryRouter.POST("moveNote", directoryApi.MoveNoteToGroup)
	}
}
