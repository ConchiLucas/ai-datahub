package system

import (
	"github.com/conchi/ai-note/server/api/v1"
	"github.com/gin-gonic/gin"
)

type PromptRouter struct{}

func (s *PromptRouter) InitPromptRouter(Router *gin.RouterGroup) {
	promptRouter := Router.Group("prompt")
	promptApi := v1.ApiGroupApp.SystemApiGroup.PromptApi

	{
		promptRouter.POST("addCategory", promptApi.AddCategory)
		promptRouter.DELETE("deleteCategory", promptApi.DeleteCategory)
		promptRouter.POST("add", promptApi.AddPrompt)
		promptRouter.PUT("update", promptApi.UpdatePrompt)
		promptRouter.DELETE("delete", promptApi.DeletePrompt)
		promptRouter.GET("getData", promptApi.GetData)
	}
}
