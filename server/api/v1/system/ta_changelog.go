package system

import (
	"github.com/conchi/ai-note/server/global"
	"github.com/conchi/ai-note/server/model/common/response"
	"github.com/conchi/ai-note/server/model/system/request"
	"github.com/conchi/ai-note/server/utils"
	"github.com/gin-gonic/gin"
	"go.uber.org/zap"
)

type ChangelogApi struct{}

// CreateProject 创建项目
func (a *ChangelogApi) CreateProject(c *gin.Context) {
	userId := utils.GetUserID(c)
	var req request.TaChangelogProjectReq
	if err := c.ShouldBindJSON(&req); err != nil {
		response.FailWithMessage(err.Error(), c)
		return
	}

	res, err := changelogService.CreateProject(userId, req)
	if err != nil {
		global.GVA_LOG.Error("创建项目失败!", zap.Error(err))
		response.FailWithMessage("创建失败: "+err.Error(), c)
	} else {
		response.OkWithDetailed(res, "创建成功", c)
	}
}

// UpdateProject 更新项目
func (a *ChangelogApi) UpdateProject(c *gin.Context) {
	userId := utils.GetUserID(c)
	var req request.TaChangelogProjectReq
	if err := c.ShouldBindJSON(&req); err != nil {
		response.FailWithMessage(err.Error(), c)
		return
	}

	err := changelogService.UpdateProject(userId, req)
	if err != nil {
		global.GVA_LOG.Error("更新项目失败!", zap.Error(err))
		response.FailWithMessage("更新失败: "+err.Error(), c)
	} else {
		response.OkWithMessage("更新成功", c)
	}
}

// DeleteProject 删除项目
func (a *ChangelogApi) DeleteProject(c *gin.Context) {
	userId := utils.GetUserID(c)
	var req struct{ ID uint `json:"id"` }
	if err := c.ShouldBindJSON(&req); err != nil {
		response.FailWithMessage(err.Error(), c)
		return
	}

	err := changelogService.DeleteProject(userId, req.ID)
	if err != nil {
		global.GVA_LOG.Error("删除项目失败!", zap.Error(err))
		response.FailWithMessage("删除失败: "+err.Error(), c)
	} else {
		response.OkWithMessage("删除成功", c)
	}
}

// CreateLog 创建日志
func (a *ChangelogApi) CreateLog(c *gin.Context) {
	userId := utils.GetUserID(c)
	var req request.TaChangelogLogReq
	if err := c.ShouldBindJSON(&req); err != nil {
		response.FailWithMessage(err.Error(), c)
		return
	}

	res, err := changelogService.CreateLog(userId, req)
	if err != nil {
		global.GVA_LOG.Error("创建日志失败!", zap.Error(err))
		response.FailWithMessage("创建失败: "+err.Error(), c)
	} else {
		response.OkWithDetailed(res, "创建成功", c)
	}
}

// UpdateLog 更新日志
func (a *ChangelogApi) UpdateLog(c *gin.Context) {
	userId := utils.GetUserID(c)
	var req request.TaChangelogLogReq
	if err := c.ShouldBindJSON(&req); err != nil {
		response.FailWithMessage(err.Error(), c)
		return
	}

	err := changelogService.UpdateLog(userId, req)
	if err != nil {
		global.GVA_LOG.Error("更新日志失败!", zap.Error(err))
		response.FailWithMessage("更新失败: "+err.Error(), c)
	} else {
		response.OkWithMessage("更新成功", c)
	}
}

// DeleteLog 删除日志
func (a *ChangelogApi) DeleteLog(c *gin.Context) {
	userId := utils.GetUserID(c)
	var req struct{ ID uint `json:"id"` }
	if err := c.ShouldBindJSON(&req); err != nil {
		response.FailWithMessage(err.Error(), c)
		return
	}

	err := changelogService.DeleteLog(userId, req.ID)
	if err != nil {
		global.GVA_LOG.Error("删除日志失败!", zap.Error(err))
		response.FailWithMessage("删除失败: "+err.Error(), c)
	} else {
		response.OkWithMessage("删除成功", c)
	}
}

// GetProjectWithLogsList 获取列表
func (a *ChangelogApi) GetProjectWithLogsList(c *gin.Context) {
	userId := utils.GetUserID(c)
	var pageInfo request.TaSearchChangelogParams
	_ = c.ShouldBindJSON(&pageInfo)

	list, total, err := changelogService.GetProjectWithLogsList(userId, pageInfo)
	if err != nil {
		global.GVA_LOG.Error("获取日志项目列表失败!", zap.Error(err))
		response.FailWithMessage("获取失败: "+err.Error(), c)
	} else {
		response.OkWithDetailed(response.PageResult{
			List:     list,
			Total:    total,
			Page:     pageInfo.Page,
			PageSize: pageInfo.PageSize,
		}, "获取成功", c)
	}
}
