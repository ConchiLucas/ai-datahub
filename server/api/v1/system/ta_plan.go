package system

import (
	"github.com/conchi/ai-note/server/global"
	commonReq "github.com/conchi/ai-note/server/model/common/request"
	"github.com/conchi/ai-note/server/model/common/response"
	"github.com/conchi/ai-note/server/model/system/request"
	"github.com/conchi/ai-note/server/utils"
	"github.com/gin-gonic/gin"
	"go.uber.org/zap"
)

type PlanApi struct{}

// CreatePlan 创建计划
// @Tags Plan
// @Summary 创建计划
// @Security ApiKeyAuth
// @accept application/json
// @Produce application/json
// @Param data body request.TaCreatePlanReq true "创建计划"
// @Success 200 {object} response.Response{msg=string} "创建成功"
// @Router /plan/createPlan [post]
func (a *PlanApi) CreatePlan(c *gin.Context) {
	userId := utils.GetUserID(c)
	var req request.TaCreatePlanReq
	if err := c.ShouldBindJSON(&req); err != nil {
		response.FailWithMessage("参数错误", c)
		return
	}

	if plan, err := planService.CreatePlan(userId, req); err != nil {
		global.GVA_LOG.Error("创建失败!", zap.Error(err))
		response.FailWithMessage("创建失败", c)
	} else {
		response.OkWithDetailed(plan, "创建成功", c)
	}
}

// DeletePlan 删除计划
func (a *PlanApi) DeletePlan(c *gin.Context) {
	userId := utils.GetUserID(c)
	var req commonReq.GetById
	if err := c.ShouldBindJSON(&req); err != nil {
		response.FailWithMessage("参数错误", c)
		return
	}

	if err := planService.DeletePlan(userId, req.Uint()); err != nil {
		global.GVA_LOG.Error("删除失败!", zap.Error(err))
		response.FailWithMessage("删除失败", c)
	} else {
		response.OkWithMessage("删除成功", c)
	}
}

// UpdatePlan 更新计划
func (a *PlanApi) UpdatePlan(c *gin.Context) {
	userId := utils.GetUserID(c)
	var req request.TaUpdatePlanReq
	if err := c.ShouldBindJSON(&req); err != nil {
		response.FailWithMessage("参数错误", c)
		return
	}

	if err := planService.UpdatePlan(userId, req); err != nil {
		global.GVA_LOG.Error("更新失败!", zap.Error(err))
		response.FailWithMessage("更新失败", c)
	} else {
		response.OkWithMessage("更新成功", c)
	}
}

// UpdatePlanProgress 更新进度
func (a *PlanApi) UpdatePlanProgress(c *gin.Context) {
	userId := utils.GetUserID(c)
	var req request.TaUpdatePlanProgressReq
	if err := c.ShouldBindJSON(&req); err != nil {
		response.FailWithMessage("参数错误", c)
		return
	}

	if err := planService.UpdatePlanProgress(userId, req); err != nil {
		global.GVA_LOG.Error("进度更新失败!", zap.Error(err))
		response.FailWithMessage("进度更新失败", c)
	} else {
		response.OkWithMessage("进度更新成功", c)
	}
}

// GetPlanList 获取计划分页或全量列表
func (a *PlanApi) GetPlanList(c *gin.Context) {
	userId := utils.GetUserID(c)
	var pageInfo request.TaSearchPlanParams
	_ = c.ShouldBindQuery(&pageInfo) // or form if necessary, GIN's map is slightly different but typically query/JSON logic

	// To handle POST JSON pagination safely:
	if err := c.ShouldBindJSON(&pageInfo); err != nil {
		// fallback to defaults or query
	}

	list, total, err := planService.GetPlanList(userId, pageInfo)
	if err != nil {
		global.GVA_LOG.Error("获取失败!", zap.Error(err))
		response.FailWithMessage("获取失败", c)
		return
	}

	response.OkWithDetailed(response.PageResult{
		List:     list,
		Total:    total,
		Page:     pageInfo.Page,
		PageSize: pageInfo.PageSize,
	}, "获取成功", c)
}
