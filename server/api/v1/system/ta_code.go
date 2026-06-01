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

type CodeApi struct{}

// CreateCodeSnippet 创建代码片段
func (a *CodeApi) CreateCodeSnippet(c *gin.Context) {
	userId := utils.GetUserID(c)
	var req request.CreateCodeReq
	if err := c.ShouldBindJSON(&req); err != nil {
		response.FailWithMessage("参数错误", c)
		return
	}

	if codeSnippet, err := codeService.CreateCodeSnippet(userId, req); err != nil {
		global.GVA_LOG.Error("创建失败!", zap.Error(err))
		response.FailWithMessage("创建失败", c)
	} else {
		response.OkWithDetailed(codeSnippet, "创建成功", c)
	}
}

// DeleteCodeSnippet 删除代码片段
func (a *CodeApi) DeleteCodeSnippet(c *gin.Context) {
	userId := utils.GetUserID(c)
	var req commonReq.GetById
	if err := c.ShouldBindJSON(&req); err != nil {
		response.FailWithMessage("参数错误", c)
		return
	}

	if err := codeService.DeleteCodeSnippet(userId, req.Uint()); err != nil {
		global.GVA_LOG.Error("删除失败!", zap.Error(err))
		response.FailWithMessage("删除失败", c)
	} else {
		response.OkWithMessage("删除成功", c)
	}
}

// UpdateCodeSnippet 更新代码片段
func (a *CodeApi) UpdateCodeSnippet(c *gin.Context) {
	userId := utils.GetUserID(c)
	var req request.UpdateCodeReq
	if err := c.ShouldBindJSON(&req); err != nil {
		response.FailWithMessage("参数错误", c)
		return
	}

	if err := codeService.UpdateCodeSnippet(userId, req); err != nil {
		global.GVA_LOG.Error("更新失败!", zap.Error(err))
		response.FailWithMessage("更新失败", c)
	} else {
		response.OkWithMessage("更新成功", c)
	}
}

// GetCodeSnippetList 获取代码片段列表
func (a *CodeApi) GetCodeSnippetList(c *gin.Context) {
	userId := utils.GetUserID(c)
	var pageInfo request.SearchCodeParams
	
	if err := c.ShouldBindJSON(&pageInfo); err != nil {
		if err := c.ShouldBindQuery(&pageInfo); err != nil {
			response.FailWithMessage("参数解析失败", c)
			return
		}
	}

	list, total, err := codeService.GetCodeSnippetList(userId, pageInfo)
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
