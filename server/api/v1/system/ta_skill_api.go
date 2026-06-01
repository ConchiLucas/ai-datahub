package system

import (
	"github.com/conchi/ai-note/server/global"
	"github.com/conchi/ai-note/server/model/common/request"
	"github.com/conchi/ai-note/server/model/common/response"
	systemReq "github.com/conchi/ai-note/server/model/system/request"
	"github.com/conchi/ai-note/server/utils"
	"github.com/gin-gonic/gin"
	"go.uber.org/zap"
)

type TaSkillApi struct{}

// CreateTaSkill
// @Tags TaSkill
// @Summary 创建代码片段
// @accept application/json
// @Produce application/json
// @Param data body systemReq.CreateSkillReq true "创建代码片段"
// @Success 200 {object} response.Response{msg=string} "创建成功"
// @Router /skill/create [post]
func (taSkillApi *TaSkillApi) CreateTaSkill(c *gin.Context) {
	var req systemReq.CreateSkillReq
	err := c.ShouldBindJSON(&req)
	if err != nil {
		response.FailWithMessage(err.Error(), c)
		return
	}
	
	userId := utils.GetUserID(c)
	err = skillService.CreateTaSkill(req, userId)
	if err != nil {
		global.GVA_LOG.Error("创建失败!", zap.Error(err))
		response.FailWithMessage("创建失败", c)
	} else {
		response.OkWithMessage("创建成功", c)
	}
}

// UpdateTaSkill
// @Tags TaSkill
// @Summary 更新代码片段
// @accept application/json
// @Produce application/json
// @Param data body systemReq.UpdateSkillReq true "更新代码片段"
// @Success 200 {object} response.Response{msg=string} "更新成功"
// @Router /skill/update [put]
func (taSkillApi *TaSkillApi) UpdateTaSkill(c *gin.Context) {
	var req systemReq.UpdateSkillReq
	err := c.ShouldBindJSON(&req)
	if err != nil {
		response.FailWithMessage(err.Error(), c)
		return
	}
	
	userId := utils.GetUserID(c)
	err = skillService.UpdateTaSkill(req, userId)
	if err != nil {
		global.GVA_LOG.Error("更新失败!", zap.Error(err))
		response.FailWithMessage("更新失败", c)
	} else {
		response.OkWithMessage("更新成功", c)
	}
}

// ToggleSkillStar
// @Tags TaSkill
// @Summary 切换收藏状态
// @accept application/json
// @Produce application/json
// @Param data body systemReq.ToggleSkillStarReq true "切换收藏状态"
// @Success 200 {object} response.Response{msg=string} "操作成功"
// @Router /skill/star [put]
func (taSkillApi *TaSkillApi) ToggleSkillStar(c *gin.Context) {
	var req systemReq.ToggleSkillStarReq
	err := c.ShouldBindJSON(&req)
	if err != nil {
		response.FailWithMessage(err.Error(), c)
		return
	}
	
	userId := utils.GetUserID(c)
	err = skillService.ToggleSkillStar(req.ID, userId, req.Starred)
	if err != nil {
		global.GVA_LOG.Error("操作失败!", zap.Error(err))
		response.FailWithMessage("操作失败", c)
	} else {
		response.OkWithMessage("操作成功", c)
	}
}

// DeleteTaSkill
// @Tags TaSkill
// @Summary 删除代码片段
// @accept application/json
// @Produce application/json
// @Param data body request.GetById true "删除代码片段"
// @Success 200 {object} response.Response{msg=string} "删除成功"
// @Router /skill/delete [delete]
func (taSkillApi *TaSkillApi) DeleteTaSkill(c *gin.Context) {
	var req request.GetById
	err := c.ShouldBindJSON(&req)
	if err != nil {
		response.FailWithMessage(err.Error(), c)
		return
	}
	
	userId := utils.GetUserID(c)
	err = skillService.DeleteTaSkill(uint(req.ID), userId)
	if err != nil {
		global.GVA_LOG.Error("删除失败!", zap.Error(err))
		response.FailWithMessage("删除失败", c)
	} else {
		response.OkWithMessage("删除成功", c)
	}
}

// GetTaSkillList
// @Tags TaSkill
// @Summary 获取代码片段列表
// @accept application/json
// @Produce application/json
// @Param data query systemReq.SearchSkillParams true "获取代码片段列表"
// @Success 200 {object} response.Response{data=response.PageResult,msg=string} "获取成功"
// @Router /skill/list [get]
func (taSkillApi *TaSkillApi) GetTaSkillList(c *gin.Context) {
	var pageInfo systemReq.SearchSkillParams
	err := c.ShouldBindQuery(&pageInfo)
	if err != nil {
		response.FailWithMessage(err.Error(), c)
		return
	}
	
	userId := utils.GetUserID(c)
	list, total, err := skillService.GetTaSkillList(pageInfo, userId)
	if err != nil {
		global.GVA_LOG.Error("获取失败!", zap.Error(err))
		response.FailWithMessage("获取失败", c)
	} else {
		response.OkWithDetailed(response.PageResult{
			List:  list,
			Total: total,
			Page:  pageInfo.Page,
			PageSize: pageInfo.PageSize,
		}, "获取成功", c)
	}
}
