package system

import (
	"github.com/conchi/ai-note/server/api/v1"
	"github.com/gin-gonic/gin"
)

type TaDraftRouter struct{}

// InitTaDraftRouter 初始化草稿路由信息
func (s *TaDraftRouter) InitTaDraftRouter(Router *gin.RouterGroup) {
	draftRouter := Router.Group("draft")
	draftRouterWithoutRecord := Router.Group("draft")
	var draftApi = v1.ApiGroupApp.SystemApiGroup.TaDraftApi
	{
		draftRouter.POST("createTaDraft", draftApi.CreateTaDraft)             // 新建草稿
		draftRouter.DELETE("deleteTaDraft", draftApi.DeleteTaDraft)           // 删除草稿
		draftRouter.DELETE("deleteTaDraftByIds", draftApi.DeleteTaDraftByIds) // 批量删除草稿
		draftRouter.PUT("updateTaDraft", draftApi.UpdateTaDraft)              // 更新草稿
	}
	{
		draftRouterWithoutRecord.GET("findTaDraft", draftApi.FindTaDraft)       // 根据ID获取草稿
		draftRouterWithoutRecord.GET("getTaDraftList", draftApi.GetTaDraftList) // 获取草稿列表
	}
}
