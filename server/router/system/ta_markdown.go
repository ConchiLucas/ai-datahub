package system

import (
	v1 "github.com/conchi/ai-note/server/api/v1"
	"github.com/gin-gonic/gin"
)

type MarkdownRouter struct{}

func (s *MarkdownRouter) InitMarkdownRouter(Router *gin.RouterGroup) {
	markdownRouter := Router.Group("markdown")
	markdownApi := v1.ApiGroupApp.SystemApiGroup.MarkdownApi

	{
		markdownRouter.POST("add", markdownApi.AddSnippet)
		markdownRouter.PUT("update", markdownApi.UpdateSnippet)
		markdownRouter.DELETE("delete", markdownApi.DeleteSnippet)
		markdownRouter.GET("list", markdownApi.GetSnippets)
	}
}
