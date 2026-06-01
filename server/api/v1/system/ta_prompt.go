package system

import (
	"github.com/conchi/ai-note/server/global"
	"github.com/conchi/ai-note/server/model/common/response"
	"github.com/conchi/ai-note/server/model/system/request"
	"github.com/conchi/ai-note/server/utils"
	"github.com/gin-gonic/gin"
	"go.uber.org/zap"
)

type PromptApi struct{}

// AddCategory
func (p *PromptApi) AddCategory(c *gin.Context) {
	var req request.AddPromptCategoryReq
	if err := c.ShouldBindJSON(&req); err != nil {
		response.FailWithMessage(err.Error(), c)
		return
	}
	userId := utils.GetUserID(c)
	if category, err := promptService.AddCategory(userId, req); err != nil {
		global.GVA_LOG.Error("添加分类失败!", zap.Error(err))
		response.FailWithMessage("添加失败", c)
	} else {
		response.OkWithData(category, c)
	}
}

// DeleteCategory
func (p *PromptApi) DeleteCategory(c *gin.Context) {
	var req request.DeletePromptCategoryReq
	if err := c.ShouldBindJSON(&req); err != nil {
		response.FailWithMessage(err.Error(), c)
		return
	}
	userId := utils.GetUserID(c)
	if err := promptService.DeleteCategory(userId, req); err != nil {
		global.GVA_LOG.Error("删除分类失败!", zap.Error(err))
		response.FailWithMessage("删除失败", c)
	} else {
		response.OkWithMessage("删除成功", c)
	}
}

// AddPrompt
func (p *PromptApi) AddPrompt(c *gin.Context) {
	var req request.AddPromptReq
	if err := c.ShouldBindJSON(&req); err != nil {
		response.FailWithMessage(err.Error(), c)
		return
	}
	userId := utils.GetUserID(c)
	if prompt, err := promptService.AddPrompt(userId, req); err != nil {
		global.GVA_LOG.Error("添加提示词失败!", zap.Error(err))
		response.FailWithMessage("添加失败", c)
	} else {
		response.OkWithData(prompt, c)
	}
}

// UpdatePrompt
func (p *PromptApi) UpdatePrompt(c *gin.Context) {
	var req request.UpdatePromptReq
	if err := c.ShouldBindJSON(&req); err != nil {
		response.FailWithMessage(err.Error(), c)
		return
	}
	userId := utils.GetUserID(c)
	if err := promptService.UpdatePrompt(userId, req); err != nil {
		global.GVA_LOG.Error("更新提示词失败!", zap.Error(err))
		response.FailWithMessage("更新失败", c)
	} else {
		response.OkWithMessage("更新成功", c)
	}
}

// DeletePrompt
func (p *PromptApi) DeletePrompt(c *gin.Context) {
	var req request.DeletePromptReq
	if err := c.ShouldBindJSON(&req); err != nil {
		response.FailWithMessage(err.Error(), c)
		return
	}
	userId := utils.GetUserID(c)
	if err := promptService.DeletePrompt(userId, req); err != nil {
		global.GVA_LOG.Error("删除提示词失败!", zap.Error(err))
		response.FailWithMessage("删除失败", c)
	} else {
		response.OkWithMessage("删除成功", c)
	}
}

// GetData
func (p *PromptApi) GetData(c *gin.Context) {
	userId := utils.GetUserID(c)
	if data, err := promptService.GetPromptData(userId); err != nil {
		global.GVA_LOG.Error("获取提示词数据失败!", zap.Error(err))
		response.FailWithMessage("获取失败", c)
	} else {
		response.OkWithData(data, c)
	}
}
