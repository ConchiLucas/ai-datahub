package system

import (
	v1 "github.com/conchi/ai-note/server/api/v1"
	"github.com/gin-gonic/gin"
)

type EnglishWordRouter struct{}

func (s *EnglishWordRouter) InitEnglishWordRouter(Router *gin.RouterGroup) {
	wordRouter := Router.Group("englishWord")
	wordApi := v1.ApiGroupApp.SystemApiGroup.EnglishWordApi
	{
		wordRouter.POST("create", wordApi.CreateWord)
		wordRouter.DELETE("delete", wordApi.DeleteWord)
		wordRouter.PUT("update", wordApi.UpdateWord)
		wordRouter.GET("list", wordApi.GetWordList)
	}
}
