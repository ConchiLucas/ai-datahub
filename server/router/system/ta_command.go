package system

import (
	v1 "github.com/conchi/ai-note/server/api/v1"
	"github.com/gin-gonic/gin"
)

type CommandRouter struct{}

func (s *CommandRouter) InitCommandRouter(Router *gin.RouterGroup) {
	commandRouter := Router.Group("command")
	commandApi := v1.ApiGroupApp.SystemApiGroup.CommandApi

	{
		commandRouter.POST("addCategory", commandApi.AddCategory)
		commandRouter.DELETE("deleteCategory", commandApi.DeleteCategory)
		commandRouter.POST("add", commandApi.AddCommand)
		commandRouter.PUT("update", commandApi.UpdateCommand)
		commandRouter.DELETE("delete", commandApi.DeleteCommand)
		commandRouter.GET("getData", commandApi.GetData)
	}
}
