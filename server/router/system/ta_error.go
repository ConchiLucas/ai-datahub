package system

import (
	v1 "github.com/conchi/ai-note/server/api/v1"
	"github.com/gin-gonic/gin"
)

type ErrorRouter struct{}

func (s *ErrorRouter) InitErrorRouter(Router *gin.RouterGroup) {
	errorRouter := Router.Group("errorRecord")
	
	errorApi := v1.ApiGroupApp.SystemApiGroup.ErrorApi
	{
		errorRouter.POST("createError", errorApi.CreateError)             // 新建
		errorRouter.DELETE("deleteError", errorApi.DeleteError)           // 删除
		errorRouter.PUT("updateError", errorApi.UpdateError)              // 更新
		errorRouter.POST("getErrorList", errorApi.GetErrorList)           // 获取列表
	}
}
