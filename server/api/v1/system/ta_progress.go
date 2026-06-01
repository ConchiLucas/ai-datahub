package system

import (
	"github.com/conchi/ai-note/server/global"
	"github.com/conchi/ai-note/server/model/common/response"
	"github.com/conchi/ai-note/server/model/system"
	"github.com/conchi/ai-note/server/utils"
	"github.com/gin-gonic/gin"
	"go.uber.org/zap"
)

type TaProgressApi struct{}

// CreateProject 创建项目
// @Tags TaProgress
// @Summary 创建项目
// @Security ApiKeyAuth
// @accept application/json
// @Produce application/json
// @Param data body system.TaProgressProject true "项目信息"
// @Success 200 {object} response.Response{msg=string} "创建成功"
// @Router /progress/createProject [post]
func (a *TaProgressApi) CreateProject(c *gin.Context) {
	var project system.TaProgressProject
	err := c.ShouldBindJSON(&project)
	if err != nil {
		response.FailWithMessage(err.Error(), c)
		return
	}
	project.UserId = utils.GetUserID(c)
	res, err := progressService.CreateProject(project)
	if err != nil {
		global.GVA_LOG.Error("创建失败!", zap.Error(err))
		response.FailWithMessage("创建失败", c)
	} else {
		response.OkWithDetailed(res, "创建成功", c)
	}
}

// DeleteProject 删除项目
// @Tags TaProgress
// @Summary 删除项目
// @Security ApiKeyAuth
// @accept application/json
// @Produce application/json
// @Param data body system.TaProgressProject true "项目ID"
// @Success 200 {object} response.Response{msg=string} "删除成功"
// @Router /progress/deleteProject [delete]
func (a *TaProgressApi) DeleteProject(c *gin.Context) {
	var project system.TaProgressProject
	err := c.ShouldBindJSON(&project)
	if err != nil {
		response.FailWithMessage(err.Error(), c)
		return
	}
	userId := utils.GetUserID(c)
	err = progressService.DeleteProject(project.ID, userId)
	if err != nil {
		global.GVA_LOG.Error("删除失败!", zap.Error(err))
		response.FailWithMessage("删除失败", c)
	} else {
		response.OkWithMessage("删除成功", c)
	}
}

// UpdateProject 更新项目
// @Tags TaProgress
// @Summary 更新项目
// @Security ApiKeyAuth
// @accept application/json
// @Produce application/json
// @Param data body system.TaProgressProject true "项目信息"
// @Success 200 {object} response.Response{msg=string} "更新成功"
// @Router /progress/updateProject [put]
func (a *TaProgressApi) UpdateProject(c *gin.Context) {
	var project system.TaProgressProject
	err := c.ShouldBindJSON(&project)
	if err != nil {
		response.FailWithMessage(err.Error(), c)
		return
	}
	project.UserId = utils.GetUserID(c)
	err = progressService.UpdateProject(project)
	if err != nil {
		global.GVA_LOG.Error("更新失败!", zap.Error(err))
		response.FailWithMessage("更新失败", c)
	} else {
		response.OkWithMessage("更新成功", c)
	}
}

// GetProjectList 获取项目列表
// @Tags TaProgress
// @Summary 获取项目列表
// @Security ApiKeyAuth
// @accept application/json
// @Produce application/json
// @Success 200 {object} response.Response{data=[]system.TaProgressProject,msg=string} "获取成功"
// @Router /progress/getProjectList [get]
func (a *TaProgressApi) GetProjectList(c *gin.Context) {
	userId := utils.GetUserID(c)
	list, err := progressService.GetProjectList(userId)
	if err != nil {
		global.GVA_LOG.Error("获取失败!", zap.Error(err))
		response.FailWithMessage("获取失败", c)
	} else {
		response.OkWithDetailed(list, "获取成功", c)
	}
}

// CreateFeature 创建功能
// @Tags TaProgress
// @Summary 创建功能
// @Security ApiKeyAuth
// @accept application/json
// @Produce application/json
// @Param data body system.TaProgressFeature true "功能信息"
// @Success 200 {object} response.Response{msg=string} "创建成功"
// @Router /progress/createFeature [post]
func (a *TaProgressApi) CreateFeature(c *gin.Context) {
	var feature system.TaProgressFeature
	err := c.ShouldBindJSON(&feature)
	if err != nil {
		response.FailWithMessage(err.Error(), c)
		return
	}
	feature.UserId = utils.GetUserID(c)
	res, err := progressService.CreateFeature(feature)
	if err != nil {
		global.GVA_LOG.Error("创建失败!", zap.Error(err))
		response.FailWithMessage("创建失败", c)
	} else {
		response.OkWithDetailed(res, "创建成功", c)
	}
}

// DeleteFeature 删除功能
// @Tags TaProgress
// @Summary 删除功能
// @Security ApiKeyAuth
// @accept application/json
// @Produce application/json
// @Param data body system.TaProgressFeature true "功能ID"
// @Success 200 {object} response.Response{msg=string} "删除成功"
// @Router /progress/deleteFeature [delete]
func (a *TaProgressApi) DeleteFeature(c *gin.Context) {
	var feature system.TaProgressFeature
	err := c.ShouldBindJSON(&feature)
	if err != nil {
		response.FailWithMessage(err.Error(), c)
		return
	}
	userId := utils.GetUserID(c)
	err = progressService.DeleteFeature(feature.ID, userId)
	if err != nil {
		global.GVA_LOG.Error("删除失败!", zap.Error(err))
		response.FailWithMessage("删除失败", c)
	} else {
		response.OkWithMessage("删除成功", c)
	}
}

// UpdateFeature 更新功能
// @Tags TaProgress
// @Summary 更新功能
// @Security ApiKeyAuth
// @accept application/json
// @Produce application/json
// @Param data body system.TaProgressFeature true "功能信息"
// @Success 200 {object} response.Response{msg=string} "更新成功"
// @Router /progress/updateFeature [put]
func (a *TaProgressApi) UpdateFeature(c *gin.Context) {
	var feature system.TaProgressFeature
	err := c.ShouldBindJSON(&feature)
	if err != nil {
		response.FailWithMessage(err.Error(), c)
		return
	}
	feature.UserId = utils.GetUserID(c)
	err = progressService.UpdateFeature(feature)
	if err != nil {
		global.GVA_LOG.Error("更新失败!", zap.Error(err))
		response.FailWithMessage("更新失败", c)
	} else {
		response.OkWithMessage("更新成功", c)
	}
}
