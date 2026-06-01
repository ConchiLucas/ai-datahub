package system

import (
	v1 "github.com/conchi/ai-note/server/api/v1"
	"github.com/gin-gonic/gin"
)

type GuidelineRouter struct{}

func (s *GuidelineRouter) InitGuidelineRouter(Router *gin.RouterGroup) {
	guidelineRouter := Router.Group("guideline")

	guidelineApi := v1.ApiGroupApp.SystemApiGroup.GuidelineApi
	{
		guidelineRouter.POST("createGuideline", guidelineApi.CreateGuideline)
		guidelineRouter.DELETE("deleteGuideline", guidelineApi.DeleteGuideline)
		guidelineRouter.PUT("updateGuideline", guidelineApi.UpdateGuideline)
		guidelineRouter.POST("getGuidelineList", guidelineApi.GetGuidelineList)
	}
}
