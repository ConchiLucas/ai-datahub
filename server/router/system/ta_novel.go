package system

import (
	v1 "github.com/conchi/ai-note/server/api/v1"
	"github.com/gin-gonic/gin"
)

type TaNovelRouter struct{}

func (s *TaNovelRouter) InitTaNovelRouter(Router *gin.RouterGroup) {
	taNovelRouter := Router.Group("novel")
	
	taNovelApi := v1.ApiGroupApp.SystemApiGroup.TaNovelApi
	{
		taNovelRouter.POST("createNovel", taNovelApi.CreateTaNovel)             // 新建
		taNovelRouter.DELETE("deleteNovel", taNovelApi.DeleteTaNovel)           // 删除
		taNovelRouter.PUT("updateNovel", taNovelApi.UpdateTaNovel)              // 更新
		taNovelRouter.GET("getNovelById", taNovelApi.GetTaNovel)                 // 查询单条
		taNovelRouter.GET("getNovelList", taNovelApi.GetTaNovelList)             // 获取列表
	}
}
