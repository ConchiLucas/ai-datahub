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

type DockerApi struct{}

// ─── Get Tree ───────────────────────────

// GetDockerTree 获取完整的树状结构
func (a *DockerApi) GetDockerTree(c *gin.Context) {
	userId := utils.GetUserID(c)
	orgs, err := dockerService.GetDockerTree(userId)
	if err != nil {
		global.GVA_LOG.Error("获取失败!", zap.Error(err))
		response.FailWithMessage("获取失败", c)
		return
	}
	response.OkWithData(orgs, c)
}

// ─── Org ───────────────────────────

func (a *DockerApi) CreateOrg(c *gin.Context) {
	userId := utils.GetUserID(c)
	var req system.TaDockerOrg
	if err := c.ShouldBindJSON(&req); err != nil {
		response.FailWithMessage("参数错误", c)
		return
	}
	req.UserId = userId

	if res, err := dockerService.CreateOrg(req); err != nil {
		global.GVA_LOG.Error("创建失败!", zap.Error(err))
		response.FailWithMessage("创建失败", c)
	} else {
		response.OkWithData(res, c)
	}
}

func (a *DockerApi) UpdateOrg(c *gin.Context) {
	userId := utils.GetUserID(c)
	var req system.TaDockerOrg
	if err := c.ShouldBindJSON(&req); err != nil {
		response.FailWithMessage("参数错误", c)
		return
	}
	req.UserId = userId

	if err := dockerService.UpdateOrg(req); err != nil {
		global.GVA_LOG.Error("更新失败!", zap.Error(err))
		response.FailWithMessage("更新失败", c)
	} else {
		response.OkWithMessage("更新成功", c)
	}
}

func (a *DockerApi) DeleteOrg(c *gin.Context) {
	userId := utils.GetUserID(c)
	var req commonReq.GetById
	if err := c.ShouldBindJSON(&req); err != nil {
		response.FailWithMessage("参数错误", c)
		return
	}

	if err := dockerService.DeleteOrg(userId, uint(req.ID)); err != nil {
		global.GVA_LOG.Error("删除失败!", zap.Error(err))
		response.FailWithMessage("删除失败", c)
	} else {
		response.OkWithMessage("删除成功", c)
	}
}

// ─── Project ───────────────────────────

func (a *DockerApi) CreateProject(c *gin.Context) {
	userId := utils.GetUserID(c)
	var req system.TaDockerProject
	if err := c.ShouldBindJSON(&req); err != nil {
		response.FailWithMessage("参数错误", c)
		return
	}
	req.UserId = userId

	if res, err := dockerService.CreateProject(req); err != nil {
		global.GVA_LOG.Error("创建失败!", zap.Error(err))
		response.FailWithMessage("创建失败", c)
	} else {
		response.OkWithData(res, c)
	}
}

func (a *DockerApi) UpdateProject(c *gin.Context) {
	userId := utils.GetUserID(c)
	var req system.TaDockerProject
	if err := c.ShouldBindJSON(&req); err != nil {
		response.FailWithMessage("参数错误", c)
		return
	}
	req.UserId = userId

	if err := dockerService.UpdateProject(req); err != nil {
		global.GVA_LOG.Error("更新失败!", zap.Error(err))
		response.FailWithMessage("更新失败", c)
	} else {
		response.OkWithMessage("更新成功", c)
	}
}

func (a *DockerApi) DeleteProject(c *gin.Context) {
	userId := utils.GetUserID(c)
	var req commonReq.GetById
	if err := c.ShouldBindJSON(&req); err != nil {
		response.FailWithMessage("参数错误", c)
		return
	}

	if err := dockerService.DeleteProject(userId, uint(req.ID)); err != nil {
		global.GVA_LOG.Error("删除失败!", zap.Error(err))
		response.FailWithMessage("删除失败", c)
	} else {
		response.OkWithMessage("删除成功", c)
	}
}

// ─── File ───────────────────────────

func (a *DockerApi) CreateFile(c *gin.Context) {
	userId := utils.GetUserID(c)
	var req system.TaDockerFile
	if err := c.ShouldBindJSON(&req); err != nil {
		response.FailWithMessage("参数错误", c)
		return
	}
	req.UserId = userId

	if res, err := dockerService.CreateFile(req); err != nil {
		global.GVA_LOG.Error("创建失败!", zap.Error(err))
		response.FailWithMessage("创建失败", c)
	} else {
		response.OkWithData(res, c)
	}
}

func (a *DockerApi) UpdateFile(c *gin.Context) {
	userId := utils.GetUserID(c)
	var req system.TaDockerFile
	if err := c.ShouldBindJSON(&req); err != nil {
		response.FailWithMessage("参数错误", c)
		return
	}
	req.UserId = userId

	if err := dockerService.UpdateFile(req); err != nil {
		global.GVA_LOG.Error("更新失败!", zap.Error(err))
		response.FailWithMessage("更新失败", c)
	} else {
		response.OkWithMessage("更新成功", c)
	}
}

func (a *DockerApi) DeleteFile(c *gin.Context) {
	userId := utils.GetUserID(c)
	var req commonReq.GetById
	if err := c.ShouldBindJSON(&req); err != nil {
		response.FailWithMessage("参数错误", c)
		return
	}

	if err := dockerService.DeleteFile(userId, uint(req.ID)); err != nil {
		global.GVA_LOG.Error("删除失败!", zap.Error(err))
		response.FailWithMessage("删除失败", c)
	} else {
		response.OkWithMessage("删除成功", c)
	}
}
