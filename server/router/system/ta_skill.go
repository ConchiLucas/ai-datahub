package system

import (
	"github.com/conchi/ai-note/server/api/v1"
	"github.com/gin-gonic/gin"
)

type TaSkillRouter struct{}

func (s *TaSkillRouter) InitTaSkillRouter(Router *gin.RouterGroup) {
	skillRouter := Router.Group("skill")
	var skillApi = v1.ApiGroupApp.SystemApiGroup.TaSkillApi
	{
		skillRouter.POST("create", skillApi.CreateTaSkill)
		skillRouter.PUT("update", skillApi.UpdateTaSkill)
		skillRouter.PUT("star", skillApi.ToggleSkillStar)
		skillRouter.DELETE("delete", skillApi.DeleteTaSkill)
		skillRouter.GET("list", skillApi.GetTaSkillList)
	}
}
