package system

import (
	v1 "github.com/conchi/ai-note/server/api/v1"
	"github.com/gin-gonic/gin"
)

type MaterialRouter struct{}

func (s *MaterialRouter) InitMaterialRouter(Router *gin.RouterGroup) {
	materialRouter := Router.Group("material")
	var materialApi = v1.ApiGroupApp.SystemApiGroup.MaterialApi
	{
		materialRouter.POST("create", materialApi.CreateMaterial)
		materialRouter.DELETE("delete", materialApi.DeleteMaterial)
		materialRouter.PUT("update", materialApi.UpdateMaterial)
		materialRouter.POST("list", materialApi.GetMaterialList)
	}
}
