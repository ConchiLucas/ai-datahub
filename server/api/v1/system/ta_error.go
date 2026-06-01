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

type ErrorApi struct{}

// CreateError 创建报错记录
func (a *ErrorApi) CreateError(c *gin.Context) {
	userId := utils.GetUserID(c)
	var req request.TaCreateErrorReq
	if err := c.ShouldBindJSON(&req); err != nil {
		response.FailWithMessage("参数错误", c)
		return
	}

	if errorRecord, err := errorService.CreateError(userId, req); err != nil {
		global.GVA_LOG.Error("创建失败!", zap.Error(err))
		response.FailWithMessage("创建失败", c)
	} else {
		response.OkWithDetailed(errorRecord, "创建成功", c)
	}
}

// DeleteError 删除报错记录
func (a *ErrorApi) DeleteError(c *gin.Context) {
	userId := utils.GetUserID(c)
	var req commonReq.GetById
	if err := c.ShouldBindJSON(&req); err != nil {
		response.FailWithMessage("参数错误", c)
		return
	}

	if err := errorService.DeleteError(userId, req.Uint()); err != nil {
		global.GVA_LOG.Error("删除失败!", zap.Error(err))
		response.FailWithMessage("删除失败", c)
	} else {
		response.OkWithMessage("删除成功", c)
	}
}

// UpdateError 更新报错记录
func (a *ErrorApi) UpdateError(c *gin.Context) {
	userId := utils.GetUserID(c)
	var req request.TaUpdateErrorReq
	if err := c.ShouldBindJSON(&req); err != nil {
		response.FailWithMessage("参数错误", c)
		return
	}

	if err := errorService.UpdateError(userId, req); err != nil {
		global.GVA_LOG.Error("更新失败!", zap.Error(err))
		response.FailWithMessage("更新失败", c)
	} else {
		response.OkWithMessage("更新成功", c)
	}
}



// GetErrorList 获取报错记录分页
func (a *ErrorApi) GetErrorList(c *gin.Context) {
	userId := utils.GetUserID(c)
	var pageInfo request.TaSearchErrorParams
	
	_ = c.ShouldBindQuery(&pageInfo)
	if err := c.ShouldBindJSON(&pageInfo); err != nil {
		// handle safely
	}

	list, total, err := errorService.GetErrorList(userId, pageInfo)
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
