package system

import (
	v1 "github.com/conchi/ai-note/server/api/v1"
	"github.com/gin-gonic/gin"
)

type SoftwareRouter struct{}

func (s *SoftwareRouter) InitSoftwareRouter(Router *gin.RouterGroup) {
	r := Router.Group("software")
	api := v1.ApiGroupApp.SystemApiGroup.SoftwareApi
	{
		r.GET("list", api.GetList)
		r.POST("upload", api.Upload)
		r.DELETE("delete", api.Delete)
		r.PUT("update", api.Update)
		r.GET("download/:id", api.Download)
	}
}
