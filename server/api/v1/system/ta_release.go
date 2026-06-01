package system

import (
	"github.com/conchi/ai-note/server/global"
	"github.com/conchi/ai-note/server/model/common/response"
	"github.com/conchi/ai-note/server/model/system"
	"github.com/conchi/ai-note/server/utils"
	"github.com/gin-gonic/gin"
	"go.uber.org/zap"
)

type TaReleaseApi struct{}

// CreateProject 创建发布项目
func (taReleaseApi *TaReleaseApi) CreateProject(c *gin.Context) {
	var project system.TaReleaseProject
	err := c.ShouldBindJSON(&project)
	if err != nil {
		response.FailWithMessage(err.Error(), c)
		return
	}
	project.UserId = utils.GetUserID(c)
	if err := releaseService.CreateProject(&project); err != nil {
		global.GVA_LOG.Error("创建失败!", zap.Error(err))
		response.FailWithMessage("创建失败", c)
	} else {
		response.OkWithData(project, c)
	}
}

// DeleteProject 删除发布项目
func (taReleaseApi *TaReleaseApi) DeleteProject(c *gin.Context) {
	var project system.TaReleaseProject
	err := c.ShouldBindJSON(&project)
	if err != nil {
		response.FailWithMessage(err.Error(), c)
		return
	}
	project.UserId = utils.GetUserID(c)
	if err := releaseService.DeleteProject(project); err != nil {
		global.GVA_LOG.Error("删除失败!", zap.Error(err))
		response.FailWithMessage("删除失败", c)
	} else {
		response.OkWithMessage("删除成功", c)
	}
}

// UpdateProject 更新发布项目
func (taReleaseApi *TaReleaseApi) UpdateProject(c *gin.Context) {
	var project system.TaReleaseProject
	err := c.ShouldBindJSON(&project)
	if err != nil {
		response.FailWithMessage(err.Error(), c)
		return
	}
	project.UserId = utils.GetUserID(c)
	if err := releaseService.UpdateProject(project); err != nil {
		global.GVA_LOG.Error("更新失败!", zap.Error(err))
		response.FailWithMessage("更新失败", c)
	} else {
		response.OkWithMessage("更新成功", c)
	}
}

// GetProjectList 获取发布项目列表
func (taReleaseApi *TaReleaseApi) GetProjectList(c *gin.Context) {
	userId := utils.GetUserID(c)
	if list, err := releaseService.GetProjectList(userId); err != nil {
		global.GVA_LOG.Error("获取失败!", zap.Error(err))
		response.FailWithMessage("获取失败", c)
	} else {
		response.OkWithData(list, c)
	}
}

// CreateAddress 添加地址
func (taReleaseApi *TaReleaseApi) CreateAddress(c *gin.Context) {
	var address system.TaReleaseAddress
	err := c.ShouldBindJSON(&address)
	if err != nil {
		response.FailWithMessage(err.Error(), c)
		return
	}
	address.UserId = utils.GetUserID(c)
	if err := releaseService.CreateAddress(&address); err != nil {
		global.GVA_LOG.Error("创建失败!", zap.Error(err))
		response.FailWithMessage("创建失败", c)
	} else {
		response.OkWithData(address, c)
	}
}

// UpdateAddress 更新地址
func (taReleaseApi *TaReleaseApi) UpdateAddress(c *gin.Context) {
	var address system.TaReleaseAddress
	err := c.ShouldBindJSON(&address)
	if err != nil {
		response.FailWithMessage(err.Error(), c)
		return
	}
	address.UserId = utils.GetUserID(c)
	if err := releaseService.UpdateAddress(address); err != nil {
		global.GVA_LOG.Error("更新失败!", zap.Error(err))
		response.FailWithMessage("更新失败", c)
	} else {
		response.OkWithMessage("更新成功", c)
	}
}

// DeleteAddress 删除地址
func (taReleaseApi *TaReleaseApi) DeleteAddress(c *gin.Context) {
	var address system.TaReleaseAddress
	err := c.ShouldBindJSON(&address)
	if err != nil {
		response.FailWithMessage(err.Error(), c)
		return
	}
	address.UserId = utils.GetUserID(c)
	if err := releaseService.DeleteAddress(address); err != nil {
		global.GVA_LOG.Error("删除失败!", zap.Error(err))
		response.FailWithMessage("删除失败", c)
	} else {
		response.OkWithMessage("删除成功", c)
	}
}

// CreateFile 添加文件
func (taReleaseApi *TaReleaseApi) CreateFile(c *gin.Context) {
	var file system.TaReleaseFile
	err := c.ShouldBindJSON(&file)
	if err != nil {
		response.FailWithMessage(err.Error(), c)
		return
	}
	file.UserId = utils.GetUserID(c)
	if err := releaseService.CreateFile(&file); err != nil {
		global.GVA_LOG.Error("创建失败!", zap.Error(err))
		response.FailWithMessage("创建失败", c)
	} else {
		response.OkWithData(file, c)
	}
}

// UpdateFile 更新文件
func (taReleaseApi *TaReleaseApi) UpdateFile(c *gin.Context) {
	var file system.TaReleaseFile
	err := c.ShouldBindJSON(&file)
	if err != nil {
		response.FailWithMessage(err.Error(), c)
		return
	}
	file.UserId = utils.GetUserID(c)
	if err := releaseService.UpdateFile(file); err != nil {
		global.GVA_LOG.Error("更新失败!", zap.Error(err))
		response.FailWithMessage("更新失败", c)
	} else {
		response.OkWithMessage("更新成功", c)
	}
}

// DeleteFile 删除文件
func (taReleaseApi *TaReleaseApi) DeleteFile(c *gin.Context) {
	var file system.TaReleaseFile
	err := c.ShouldBindJSON(&file)
	if err != nil {
		response.FailWithMessage(err.Error(), c)
		return
	}
	file.UserId = utils.GetUserID(c)
	if err := releaseService.DeleteFile(file); err != nil {
		global.GVA_LOG.Error("删除失败!", zap.Error(err))
		response.FailWithMessage("删除失败", c)
	} else {
		response.OkWithMessage("删除成功", c)
	}
}

// CreateCommand 添加命令
func (taReleaseApi *TaReleaseApi) CreateCommand(c *gin.Context) {
	var command system.TaReleaseCommand
	err := c.ShouldBindJSON(&command)
	if err != nil {
		response.FailWithMessage(err.Error(), c)
		return
	}
	command.UserId = utils.GetUserID(c)
	if err := releaseService.CreateCommand(&command); err != nil {
		global.GVA_LOG.Error("创建失败!", zap.Error(err))
		response.FailWithMessage("创建失败", c)
	} else {
		response.OkWithData(command, c)
	}
}

// UpdateCommand 更新命令
func (taReleaseApi *TaReleaseApi) UpdateCommand(c *gin.Context) {
	var command system.TaReleaseCommand
	err := c.ShouldBindJSON(&command)
	if err != nil {
		response.FailWithMessage(err.Error(), c)
		return
	}
	command.UserId = utils.GetUserID(c)
	if err := releaseService.UpdateCommand(command); err != nil {
		global.GVA_LOG.Error("更新失败!", zap.Error(err))
		response.FailWithMessage("更新失败", c)
	} else {
		response.OkWithMessage("更新成功", c)
	}
}

// DeleteCommand 删除命令
func (taReleaseApi *TaReleaseApi) DeleteCommand(c *gin.Context) {
	var command system.TaReleaseCommand
	err := c.ShouldBindJSON(&command)
	if err != nil {
		response.FailWithMessage(err.Error(), c)
		return
	}
	command.UserId = utils.GetUserID(c)
	if err := releaseService.DeleteCommand(command); err != nil {
		global.GVA_LOG.Error("删除失败!", zap.Error(err))
		response.FailWithMessage("删除失败", c)
	} else {
		response.OkWithMessage("删除成功", c)
	}
}
