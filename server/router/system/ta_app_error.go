package system

import (
	v1 "github.com/conchi/ai-note/server/api/v1"
	"github.com/gin-gonic/gin"
)

type AppErrorRouter struct{}

func (s *AppErrorRouter) InitAppErrorRouter(Router *gin.RouterGroup) {
	errorRouter := Router.Group("appError")
	
	errorApi := v1.ApiGroupApp.SystemApiGroup.AppErrorApi
	{
		errorRouter.POST("createError", errorApi.CreateError)             // 新建
		errorRouter.DELETE("deleteError", errorApi.DeleteError)           // 删除
		errorRouter.PUT("updateError", errorApi.UpdateError)              // 更新
		errorRouter.PUT("updateErrorStatus", errorApi.UpdateErrorStatus)  // 快速更新状态
		errorRouter.POST("getErrorList", errorApi.GetErrorList)           // 获取列表
	}
}
