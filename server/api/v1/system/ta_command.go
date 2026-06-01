package system

import (
	"github.com/conchi/ai-note/server/global"
	"github.com/conchi/ai-note/server/model/common/response"
	"github.com/conchi/ai-note/server/model/system/request"
	"github.com/conchi/ai-note/server/utils"
	"github.com/gin-gonic/gin"
	"go.uber.org/zap"
)

type CommandApi struct{}

func (a *CommandApi) AddCategory(c *gin.Context) {
	var req request.AddCommandCategoryReq
	if err := c.ShouldBindJSON(&req); err != nil {
		response.FailWithMessage(err.Error(), c)
		return
	}
	userId := utils.GetUserID(c)
	if category, err := commandService.AddCategory(userId, req); err != nil {
		global.GVA_LOG.Error("添加命令分类失败!", zap.Error(err))
		response.FailWithMessage("添加失败", c)
	} else {
		response.OkWithData(category, c)
	}
}

func (a *CommandApi) DeleteCategory(c *gin.Context) {
	var req request.DeleteCommandCategoryReq
	if err := c.ShouldBindJSON(&req); err != nil {
		response.FailWithMessage(err.Error(), c)
		return
	}
	userId := utils.GetUserID(c)
	if err := commandService.DeleteCategory(userId, req); err != nil {
		global.GVA_LOG.Error("删除命令分类失败!", zap.Error(err))
		response.FailWithMessage("删除失败", c)
	} else {
		response.OkWithMessage("删除成功", c)
	}
}

func (a *CommandApi) AddCommand(c *gin.Context) {
	var req request.AddCommandReq
	if err := c.ShouldBindJSON(&req); err != nil {
		response.FailWithMessage(err.Error(), c)
		return
	}
	userId := utils.GetUserID(c)
	if cmd, err := commandService.AddCommand(userId, req); err != nil {
		global.GVA_LOG.Error("添加命令失败!", zap.Error(err))
		response.FailWithMessage("添加失败", c)
	} else {
		response.OkWithData(cmd, c)
	}
}

func (a *CommandApi) UpdateCommand(c *gin.Context) {
	var req request.UpdateCommandReq
	if err := c.ShouldBindJSON(&req); err != nil {
		response.FailWithMessage(err.Error(), c)
		return
	}
	userId := utils.GetUserID(c)
	if err := commandService.UpdateCommand(userId, req); err != nil {
		global.GVA_LOG.Error("更新命令失败!", zap.Error(err))
		response.FailWithMessage("更新失败", c)
	} else {
		response.OkWithMessage("更新成功", c)
	}
}

func (a *CommandApi) DeleteCommand(c *gin.Context) {
	var req request.DeleteCommandReq
	if err := c.ShouldBindJSON(&req); err != nil {
		response.FailWithMessage(err.Error(), c)
		return
	}
	userId := utils.GetUserID(c)
	if err := commandService.DeleteCommand(userId, req); err != nil {
		global.GVA_LOG.Error("删除命令失败!", zap.Error(err))
		response.FailWithMessage("删除失败", c)
	} else {
		response.OkWithMessage("删除成功", c)
	}
}

func (a *CommandApi) GetData(c *gin.Context) {
	userId := utils.GetUserID(c)
	if data, err := commandService.GetCommandData(userId); err != nil {
		global.GVA_LOG.Error("获取命令数据失败!", zap.Error(err))
		response.FailWithMessage("获取失败", c)
	} else {
		response.OkWithData(data, c)
	}
}
