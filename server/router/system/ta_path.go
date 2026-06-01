package system

import (
	v1 "github.com/conchi/ai-note/server/api/v1"
	"github.com/gin-gonic/gin"
)

type TaPathRouter struct{}

func (r *TaPathRouter) InitTaPathRouter(Router *gin.RouterGroup) {
	pathRouter := Router.Group("path")
	pathApi := v1.ApiGroupApp.SystemApiGroup.PathApi
	{
		pathRouter.POST("addPath", pathApi.AddPath)
		pathRouter.PUT("updatePath", pathApi.UpdatePath)
		pathRouter.DELETE("deletePath", pathApi.DeletePath)
		pathRouter.GET("getPathData", pathApi.GetPathData)
	}
}
