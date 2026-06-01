package system

import (
	v1 "github.com/conchi/ai-note/server/api/v1"
	"github.com/gin-gonic/gin"
)

type JsonRouter struct{}

func (s *JsonRouter) InitJsonRouter(Router *gin.RouterGroup) {
	jsonRouter := Router.Group("json")
	jsonApi := v1.ApiGroupApp.SystemApiGroup.JsonApi

	{
		jsonRouter.POST("add", jsonApi.AddSnippet)
		jsonRouter.PUT("update", jsonApi.UpdateSnippet)
		jsonRouter.DELETE("delete", jsonApi.DeleteSnippet)
		jsonRouter.GET("list", jsonApi.GetSnippets)
	}
}
