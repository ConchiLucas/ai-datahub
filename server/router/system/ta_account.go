package system

import (
	"github.com/conchi/ai-note/server/api/v1"
	"github.com/gin-gonic/gin"
)

type AccountRouter struct{}

// InitAccountRouter 注册账号路由
func (s *AccountRouter) InitAccountRouter(Router *gin.RouterGroup) {
	accountRouter := Router.Group("account")
	accountApi := v1.ApiGroupApp.SystemApiGroup.AccountApi
	{
		accountRouter.POST("create", accountApi.CreateAccount)
		accountRouter.PUT("update", accountApi.UpdateAccount)
		accountRouter.DELETE("delete", accountApi.DeleteAccount)
		accountRouter.GET("list", accountApi.GetAccountList)
	}
}
