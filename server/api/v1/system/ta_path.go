package system

import (
	"github.com/conchi/ai-note/server/global"
	"github.com/conchi/ai-note/server/model/common/response"
	"github.com/conchi/ai-note/server/model/system/request"
	"github.com/conchi/ai-note/server/utils"
	"github.com/gin-gonic/gin"
	"go.uber.org/zap"
)

type PathApi struct{}

func (a *PathApi) GetPathData(c *gin.Context) {
	userId := utils.GetUserID(c)
	data, err := pathService.GetPathData(userId)
	if err != nil {
		global.GVA_LOG.Error("获取路径数据失败", zap.Error(err))
		response.FailWithMessage("获取失败", c)
		return
	}
	response.OkWithData(data, c)
}

func (a *PathApi) AddPath(c *gin.Context) {
	userId := utils.GetUserID(c)
	var req request.AddPathReq
	if err := c.ShouldBindJSON(&req); err != nil {
		response.FailWithMessage("获取参数失败", c)
		return
	}

	data, err := pathService.AddPath(userId, req)
	if err != nil {
		global.GVA_LOG.Error("添加路径失败", zap.Error(err))
		response.FailWithMessage("添加失败", c)
		return
	}
	response.OkWithData(data, c)
}

func (a *PathApi) UpdatePath(c *gin.Context) {
	userId := utils.GetUserID(c)
	var req request.UpdatePathReq
	if err := c.ShouldBindJSON(&req); err != nil {
		response.FailWithMessage("获取参数失败", c)
		return
	}

	err := pathService.UpdatePath(userId, req)
	if err != nil {
		global.GVA_LOG.Error("更新路径失败", zap.Error(err))
		response.FailWithMessage("更新失败", c)
		return
	}
	response.OkWithMessage("更新成功", c)
}

func (a *PathApi) DeletePath(c *gin.Context) {
	userId := utils.GetUserID(c)
	var req request.DeletePathReq
	if err := c.ShouldBindJSON(&req); err != nil {
		response.FailWithMessage("获取参数失败", c)
		return
	}

	err := pathService.DeletePath(userId, req)
	if err != nil {
		global.GVA_LOG.Error("删除路径失败", zap.Error(err))
		response.FailWithMessage("删除失败", c)
		return
	}
	response.OkWithMessage("删除成功", c)
}
