package system

import (
	"github.com/conchi/ai-note/server/global"
	commonReq "github.com/conchi/ai-note/server/model/common/request"
	"github.com/conchi/ai-note/server/model/common/response"
	"github.com/conchi/ai-note/server/model/system"
	"github.com/conchi/ai-note/server/utils"
	"github.com/gin-gonic/gin"
	"go.uber.org/zap"
)

type DeployApi struct{}

// ─── Get Tree ───────────────────────────

func (a *DeployApi) GetDeployTree(c *gin.Context) {
	userId := utils.GetUserID(c)
	projects, err := deployService.GetDeployTree(userId)
	if err != nil {
		global.GVA_LOG.Error("获取失败!", zap.Error(err))
		response.FailWithMessage("获取失败", c)
		return
	}
	response.OkWithData(projects, c)
}

// ─── Project ───────────────────────────

func (a *DeployApi) CreateProject(c *gin.Context) {
	userId := utils.GetUserID(c)
	var req system.TaDeployProject
	if err := c.ShouldBindJSON(&req); err != nil {
		response.FailWithMessage("参数错误", c)
		return
	}
	req.UserId = userId

	if err := deployService.CreateProject(&req); err != nil {
		global.GVA_LOG.Error("创建失败!", zap.Error(err))
		response.FailWithMessage("创建失败", c)
	} else {
		response.OkWithData(req, c)
	}
}

func (a *DeployApi) UpdateProject(c *gin.Context) {
	userId := utils.GetUserID(c)
	var req system.TaDeployProject
	if err := c.ShouldBindJSON(&req); err != nil {
		response.FailWithMessage("参数错误", c)
		return
	}
	req.UserId = userId

	if err := deployService.UpdateProject(req); err != nil {
		global.GVA_LOG.Error("更新失败!", zap.Error(err))
		response.FailWithMessage("更新失败", c)
	} else {
		response.OkWithMessage("更新成功", c)
	}
}

func (a *DeployApi) DeleteProject(c *gin.Context) {
	userId := utils.GetUserID(c)
	var req commonReq.GetById
	if err := c.ShouldBindJSON(&req); err != nil {
		response.FailWithMessage("参数错误", c)
		return
	}

	if err := deployService.DeleteProject(userId, uint(req.ID)); err != nil {
		global.GVA_LOG.Error("删除失败!", zap.Error(err))
		response.FailWithMessage("删除失败", c)
	} else {
		response.OkWithMessage("删除成功", c)
	}
}

// ─── File ───────────────────────────

func (a *DeployApi) CreateFile(c *gin.Context) {
	userId := utils.GetUserID(c)
	var req system.TaDeployFile
	if err := c.ShouldBindJSON(&req); err != nil {
		response.FailWithMessage("参数错误", c)
		return
	}
	req.UserId = userId

	if err := deployService.CreateFile(&req); err != nil {
		global.GVA_LOG.Error("创建失败!", zap.Error(err))
		response.FailWithMessage("创建失败", c)
	} else {
		response.OkWithData(req, c)
	}
}

func (a *DeployApi) UpdateFile(c *gin.Context) {
	userId := utils.GetUserID(c)
	var req system.TaDeployFile
	if err := c.ShouldBindJSON(&req); err != nil {
		response.FailWithMessage("参数错误", c)
		return
	}
	req.UserId = userId

	if err := deployService.UpdateFile(req); err != nil {
		global.GVA_LOG.Error("更新失败!", zap.Error(err))
		response.FailWithMessage("更新失败", c)
	} else {
		response.OkWithMessage("更新成功", c)
	}
}

func (a *DeployApi) DeleteFile(c *gin.Context) {
	userId := utils.GetUserID(c)
	var req commonReq.GetById
	if err := c.ShouldBindJSON(&req); err != nil {
		response.FailWithMessage("参数错误", c)
		return
	}

	if err := deployService.DeleteFile(userId, uint(req.ID)); err != nil {
		global.GVA_LOG.Error("删除失败!", zap.Error(err))
		response.FailWithMessage("删除失败", c)
	} else {
		response.OkWithMessage("删除成功", c)
	}
}

// ─── Step ───────────────────────────

func (a *DeployApi) CreateStep(c *gin.Context) {
	userId := utils.GetUserID(c)
	var req system.TaDeployStep
	if err := c.ShouldBindJSON(&req); err != nil {
		response.FailWithMessage("参数错误", c)
		return
	}
	req.UserId = userId

	if err := deployService.CreateStep(&req); err != nil {
		global.GVA_LOG.Error("创建失败!", zap.Error(err))
		response.FailWithMessage("创建失败", c)
	} else {
		response.OkWithData(req, c)
	}
}

func (a *DeployApi) UpdateStep(c *gin.Context) {
	userId := utils.GetUserID(c)
	var req system.TaDeployStep
	if err := c.ShouldBindJSON(&req); err != nil {
		response.FailWithMessage("参数错误", c)
		return
	}
	req.UserId = userId

	if err := deployService.UpdateStep(req); err != nil {
		global.GVA_LOG.Error("更新失败!", zap.Error(err))
		response.FailWithMessage("更新失败", c)
	} else {
		response.OkWithMessage("更新成功", c)
	}
}

func (a *DeployApi) DeleteStep(c *gin.Context) {
	userId := utils.GetUserID(c)
	var req commonReq.GetById
	if err := c.ShouldBindJSON(&req); err != nil {
		response.FailWithMessage("参数错误", c)
		return
	}

	if err := deployService.DeleteStep(userId, uint(req.ID)); err != nil {
		global.GVA_LOG.Error("删除失败!", zap.Error(err))
		response.FailWithMessage("删除失败", c)
	} else {
		response.OkWithMessage("删除成功", c)
	}
}
