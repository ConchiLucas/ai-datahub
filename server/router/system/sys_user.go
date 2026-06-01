package system

import (
	v1 "github.com/conchi/ai-note/server/api/v1"
	"github.com/gin-gonic/gin"
)

type UserRouter struct{}

func (s *UserRouter) InitUserRouter(Router *gin.RouterGroup) {
	userRouter := Router.Group("user")
	userApi := v1.ApiGroupApp.SystemApiGroup.UserApi
	{
		userRouter.POST("register", userApi.Register)
		userRouter.POST("changePassword", userApi.ChangePassword)
		userRouter.POST("getUserList", userApi.GetUserList)
		userRouter.PUT("setSelfSetting", userApi.SetSelfSetting)
	}
}
