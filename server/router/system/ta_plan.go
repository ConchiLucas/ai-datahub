package system

import (
	v1 "github.com/conchi/ai-note/server/api/v1"
	"github.com/gin-gonic/gin"
)

type PlanRouter struct{}

func (s *PlanRouter) InitPlanRouter(Router *gin.RouterGroup) {
	planRouter := Router.Group("plan")
	
	planApi := v1.ApiGroupApp.SystemApiGroup.PlanApi
	{
		planRouter.POST("createPlan", planApi.CreatePlan)             // 新建计划
		planRouter.DELETE("deletePlan", planApi.DeletePlan)           // 删除计划
		planRouter.PUT("updatePlan", planApi.UpdatePlan)              // 更新计划
		planRouter.PUT("updatePlanProgress", planApi.UpdatePlanProgress) // 单独更新进度
		planRouter.POST("getPlanList", planApi.GetPlanList)           // 获取计划列表
	}
}
