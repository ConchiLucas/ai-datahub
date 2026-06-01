package system

import (
	v1 "github.com/conchi/ai-note/server/api/v1"
	"github.com/gin-gonic/gin"
)

type TaNovelChapterRouter struct{}

func (s *TaNovelChapterRouter) InitTaNovelChapterRouter(Router *gin.RouterGroup) {
	taNovelChapterRouter := Router.Group("novelChapter")
	
	taNovelChapterApi := v1.ApiGroupApp.SystemApiGroup.TaNovelChapterApi
	{
		taNovelChapterRouter.POST("createChapter", taNovelChapterApi.CreateTaNovelChapter)             // 新建
		taNovelChapterRouter.DELETE("deleteChapter", taNovelChapterApi.DeleteTaNovelChapter)           // 删除
		taNovelChapterRouter.PUT("updateChapter", taNovelChapterApi.UpdateTaNovelChapter)              // 更新
		taNovelChapterRouter.GET("getChapterById", taNovelChapterApi.GetTaNovelChapter)                 // 查询单条
		taNovelChapterRouter.GET("getChapterList", taNovelChapterApi.GetTaNovelChapterList)             // 获取列表
	}
}
