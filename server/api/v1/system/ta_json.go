package system

import (
	"github.com/conchi/ai-note/server/global"
	"github.com/conchi/ai-note/server/model/common/response"
	"github.com/conchi/ai-note/server/model/system/request"
	"github.com/conchi/ai-note/server/utils"
	"github.com/gin-gonic/gin"
	"go.uber.org/zap"
)

type JsonApi struct{}

func (a *JsonApi) AddSnippet(c *gin.Context) {
	var req request.AddJsonSnippetReq
	if err := c.ShouldBindJSON(&req); err != nil {
		response.FailWithMessage(err.Error(), c)
		return
	}
	userId := utils.GetUserID(c)
	if snippet, err := jsonService.AddSnippet(userId, req); err != nil {
		global.GVA_LOG.Error("添加JSON片段失败!", zap.Error(err))
		response.FailWithMessage("添加失败", c)
	} else {
		response.OkWithData(snippet, c)
	}
}

func (a *JsonApi) UpdateSnippet(c *gin.Context) {
	var req request.UpdateJsonSnippetReq
	if err := c.ShouldBindJSON(&req); err != nil {
		response.FailWithMessage(err.Error(), c)
		return
	}
	userId := utils.GetUserID(c)
	if err := jsonService.UpdateSnippet(userId, req); err != nil {
		global.GVA_LOG.Error("更新JSON片段失败!", zap.Error(err))
		response.FailWithMessage("更新失败", c)
	} else {
		response.OkWithMessage("更新成功", c)
	}
}

func (a *JsonApi) DeleteSnippet(c *gin.Context) {
	var req request.DeleteJsonSnippetReq
	if err := c.ShouldBindJSON(&req); err != nil {
		response.FailWithMessage(err.Error(), c)
		return
	}
	userId := utils.GetUserID(c)
	if err := jsonService.DeleteSnippet(userId, req); err != nil {
		global.GVA_LOG.Error("删除JSON片段失败!", zap.Error(err))
		response.FailWithMessage("删除失败", c)
	} else {
		response.OkWithMessage("删除成功", c)
	}
}

func (a *JsonApi) GetSnippets(c *gin.Context) {
	userId := utils.GetUserID(c)
	if snippets, err := jsonService.GetSnippets(userId); err != nil {
		global.GVA_LOG.Error("获取JSON数据失败!", zap.Error(err))
		response.FailWithMessage("获取失败", c)
	} else {
		response.OkWithData(snippets, c)
	}
}
