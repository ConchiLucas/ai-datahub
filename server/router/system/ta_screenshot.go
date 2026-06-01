package system

import (
	v1 "github.com/conchi/ai-note/server/api/v1"
	"github.com/gin-gonic/gin"
)

type ScreenshotRouter struct{}

func (s *ScreenshotRouter) InitScreenshotRouter(Router *gin.RouterGroup) {
	screenshotRouter := Router.Group("screenshot")

	screenshotApi := v1.ApiGroupApp.SystemApiGroup.ScreenshotApi
	{
		// Note that FormFile limit middleware could be attached here if needed
		screenshotRouter.POST("createScreenshot", screenshotApi.CreateScreenshot)
		screenshotRouter.DELETE("deleteScreenshot", screenshotApi.DeleteScreenshot)
		screenshotRouter.PUT("updateScreenshot", screenshotApi.UpdateScreenshot)
		screenshotRouter.POST("getScreenshotList", screenshotApi.GetScreenshotList)
	}
}
