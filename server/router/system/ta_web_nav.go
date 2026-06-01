package system

import (
	"github.com/conchi/ai-note/server/api/v1"
	"github.com/gin-gonic/gin"
)

type WebNavRouter struct{}

func (s *WebNavRouter) InitWebNavRouter(Router *gin.RouterGroup) {
	webNavRouter := Router.Group("website")
	webNavApi := v1.ApiGroupApp.SystemApiGroup.WebNavApi

	{
		webNavRouter.POST("category/add", webNavApi.AddCategory)
		webNavRouter.DELETE("category/delete", webNavApi.DeleteCategory)
		webNavRouter.PUT("category/update", webNavApi.UpdateCategory)
		webNavRouter.POST("site/add", webNavApi.AddSite)
		webNavRouter.PUT("site/update", webNavApi.UpdateSite)
		webNavRouter.DELETE("site/delete", webNavApi.DeleteSite)
		webNavRouter.POST("site/uploadIcon", webNavApi.UploadIcon)
		webNavRouter.GET("data", webNavApi.GetData)
	}
}
