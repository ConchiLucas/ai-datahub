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

type ScriptApi struct{}

// CreateScript 创建脚本
func (a *ScriptApi) CreateScript(c *gin.Context) {
	userId := utils.GetUserID(c)
	var req request.CreateScriptReq
	if err := c.ShouldBindJSON(&req); err != nil {
		response.FailWithMessage("参数错误", c)
		return
	}

	if script, err := scriptService.CreateScript(userId, req); err != nil {
		global.GVA_LOG.Error("创建失败!", zap.Error(err))
		response.FailWithMessage("创建失败", c)
	} else {
		response.OkWithDetailed(script, "创建成功", c)
	}
}

// DeleteScript 删除脚本
func (a *ScriptApi) DeleteScript(c *gin.Context) {
	userId := utils.GetUserID(c)
	var req commonReq.GetById
	if err := c.ShouldBindJSON(&req); err != nil {
		response.FailWithMessage("参数错误", c)
		return
	}

	if err := scriptService.DeleteScript(userId, req.Uint()); err != nil {
		global.GVA_LOG.Error("删除失败!", zap.Error(err))
		response.FailWithMessage("删除失败", c)
	} else {
		response.OkWithMessage("删除成功", c)
	}
}

// UpdateScript 更新脚本
func (a *ScriptApi) UpdateScript(c *gin.Context) {
	userId := utils.GetUserID(c)
	var req request.UpdateScriptReq
	if err := c.ShouldBindJSON(&req); err != nil {
		response.FailWithMessage("参数错误", c)
		return
	}

	if err := scriptService.UpdateScript(userId, req); err != nil {
		global.GVA_LOG.Error("更新失败!", zap.Error(err))
		response.FailWithMessage("更新失败", c)
	} else {
		response.OkWithMessage("更新成功", c)
	}
}

// GetScriptList 获取脚本列表
func (a *ScriptApi) GetScriptList(c *gin.Context) {
	userId := utils.GetUserID(c)
	var pageInfo request.SearchScriptParams
	
	if err := c.ShouldBindJSON(&pageInfo); err != nil {
		if err := c.ShouldBindQuery(&pageInfo); err != nil {
			response.FailWithMessage("参数解析失败", c)
			return
		}
	}

	list, total, err := scriptService.GetScriptList(userId, pageInfo)
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
