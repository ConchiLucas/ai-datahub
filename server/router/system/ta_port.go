package system

import (
	"github.com/conchi/ai-note/server/api/v1"
	"github.com/gin-gonic/gin"
)

type PortRouter struct{}

func (s *PortRouter) InitPortRouter(Router *gin.RouterGroup) {
	portRouter := Router.Group("port")
	portApi := v1.ApiGroupApp.SystemApiGroup.PortApi
	{
		portRouter.POST("host", portApi.CreateHost)
		portRouter.DELETE("host", portApi.DeleteHost)
		portRouter.PUT("host", portApi.UpdateHost)
		portRouter.GET("hostList", portApi.GetHostList)

		portRouter.POST("record", portApi.CreatePort)
		portRouter.DELETE("record", portApi.DeletePort)
		portRouter.PUT("record", portApi.UpdatePort)
		portRouter.GET("recordList", portApi.GetPortList)
	}
}
