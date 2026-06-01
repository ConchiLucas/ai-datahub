package system

import (
	v1 "github.com/conchi/ai-note/server/api/v1"
	"github.com/gin-gonic/gin"
)

type AuthRouter struct{}

func (s *AuthRouter) InitAuthPublicRouter(Router *gin.RouterGroup) {
	authRouter := Router.Group("auth")
	authApi := v1.ApiGroupApp.SystemApiGroup.AuthApi
	{
		authRouter.POST("login", authApi.Login)
	}
}

func (s *AuthRouter) InitAuthPrivateRouter(Router *gin.RouterGroup) {
	authRouter := Router.Group("auth")
	authApi := v1.ApiGroupApp.SystemApiGroup.AuthApi
	{
		authRouter.GET("userinfo", authApi.GetUserInfo)
		authRouter.POST("logout", authApi.Logout)
	}
}
