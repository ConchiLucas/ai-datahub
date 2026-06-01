package system

import (
	"github.com/conchi/ai-note/server/global"
	"github.com/conchi/ai-note/server/model/common/response"
	"github.com/conchi/ai-note/server/model/system/request"
	"github.com/conchi/ai-note/server/utils"
	"github.com/gin-gonic/gin"
	"go.uber.org/zap"
)

type MarkdownApi struct{}

func (a *MarkdownApi) AddSnippet(c *gin.Context) {
	var req request.AddMarkdownSnippetReq
	if err := c.ShouldBindJSON(&req); err != nil {
		response.FailWithMessage(err.Error(), c)
		return
	}
	userId := utils.GetUserID(c)
	if snippet, err := markdownService.AddSnippet(userId, req); err != nil {
		global.GVA_LOG.Error("添加Markdown文档失败!", zap.Error(err))
		response.FailWithMessage("添加失败", c)
	} else {
		response.OkWithData(snippet, c)
	}
}

func (a *MarkdownApi) UpdateSnippet(c *gin.Context) {
	var req request.UpdateMarkdownSnippetReq
	if err := c.ShouldBindJSON(&req); err != nil {
		response.FailWithMessage(err.Error(), c)
		return
	}
	userId := utils.GetUserID(c)
	if err := markdownService.UpdateSnippet(userId, req); err != nil {
		global.GVA_LOG.Error("更新Markdown文档失败!", zap.Error(err))
		response.FailWithMessage("更新失败", c)
	} else {
		response.OkWithMessage("更新成功", c)
	}
}

func (a *MarkdownApi) DeleteSnippet(c *gin.Context) {
	var req request.DeleteMarkdownSnippetReq
	if err := c.ShouldBindJSON(&req); err != nil {
		response.FailWithMessage(err.Error(), c)
		return
	}
	userId := utils.GetUserID(c)
	if err := markdownService.DeleteSnippet(userId, req); err != nil {
		global.GVA_LOG.Error("删除Markdown文档失败!", zap.Error(err))
		response.FailWithMessage("删除失败", c)
	} else {
		response.OkWithMessage("删除成功", c)
	}
}

func (a *MarkdownApi) GetSnippets(c *gin.Context) {
	userId := utils.GetUserID(c)
	if snippets, err := markdownService.GetSnippets(userId); err != nil {
		global.GVA_LOG.Error("获取Markdown文档失败!", zap.Error(err))
		response.FailWithMessage("获取失败", c)
	} else {
		response.OkWithData(snippets, c)
	}
}
