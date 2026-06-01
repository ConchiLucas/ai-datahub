package system

import (
	"github.com/conchi/ai-note/server/global"
	"github.com/conchi/ai-note/server/model/common/request"
	"github.com/conchi/ai-note/server/model/common/response"
	"github.com/conchi/ai-note/server/model/system"
	systemReq "github.com/conchi/ai-note/server/model/system/request"
	"github.com/conchi/ai-note/server/utils"
	"github.com/gin-gonic/gin"
	"go.uber.org/zap"
)

type TaDraftApi struct{}

// CreateTaDraft 创建草稿
// @Tags TaDraft
// @Summary 创建草稿
// @Security ApiKeyAuth
// @accept application/json
// @Produce application/json
// @Param data body system.TaDraft true "创建草稿"
// @Success 200 {string} string "{"success":true,"data":{},"msg":"创建成功"}"
// @Router /draft/createTaDraft [post]
func (taDraftApi *TaDraftApi) CreateTaDraft(c *gin.Context) {
	var taDraft system.TaDraft
	err := c.ShouldBindJSON(&taDraft)
	if err != nil {
		response.FailWithMessage(err.Error(), c)
		return
	}
	taDraft.UserId = utils.GetUserID(c)
	if err := taDraftService.CreateTaDraft(&taDraft); err != nil {
		global.GVA_LOG.Error("创建失败!", zap.Error(err))
		response.FailWithMessage("创建失败", c)
	} else {
		response.OkWithData(taDraft, c)
	}
}

// DeleteTaDraft 删除草稿
// @Tags TaDraft
// @Summary 删除草稿
// @Security ApiKeyAuth
// @accept application/json
// @Produce application/json
// @Param data body system.TaDraft true "删除草稿"
// @Success 200 {string} string "{"success":true,"data":{},"msg":"删除成功"}"
// @Router /draft/deleteTaDraft [delete]
func (taDraftApi *TaDraftApi) DeleteTaDraft(c *gin.Context) {
	var taDraft system.TaDraft
	err := c.ShouldBindJSON(&taDraft)
	if err != nil {
		response.FailWithMessage(err.Error(), c)
		return
	}
	taDraft.UserId = utils.GetUserID(c)
	if err := taDraftService.DeleteTaDraft(taDraft); err != nil {
		global.GVA_LOG.Error("删除失败!", zap.Error(err))
		response.FailWithMessage("删除失败", c)
	} else {
		response.OkWithMessage("删除成功", c)
	}
}

// DeleteTaDraftByIds 批量删除草稿
// @Tags TaDraft
// @Summary 批量删除草稿
// @Security ApiKeyAuth
// @accept application/json
// @Produce application/json
// @Param data body request.IdsReq true "批量删除草稿"
// @Success 200 {string} string "{"success":true,"data":{},"msg":"批量删除成功"}"
// @Router /draft/deleteTaDraftByIds [delete]
func (taDraftApi *TaDraftApi) DeleteTaDraftByIds(c *gin.Context) {
	var IDS request.IdsReq
	err := c.ShouldBindJSON(&IDS)
	if err != nil {
		response.FailWithMessage(err.Error(), c)
		return
	}
	userId := utils.GetUserID(c)
	if err := taDraftService.DeleteTaDraftByIds(IDS.Ids, userId); err != nil {
		global.GVA_LOG.Error("批量删除失败!", zap.Error(err))
		response.FailWithMessage("批量删除失败", c)
	} else {
		response.OkWithMessage("批量删除成功", c)
	}
}

// UpdateTaDraft 更新草稿
// @Tags TaDraft
// @Summary 更新草稿
// @Security ApiKeyAuth
// @accept application/json
// @Produce application/json
// @Param data body system.TaDraft true "更新草稿"
// @Success 200 {string} string "{"success":true,"data":{},"msg":"更新成功"}"
// @Router /draft/updateTaDraft [put]
func (taDraftApi *TaDraftApi) UpdateTaDraft(c *gin.Context) {
	var taDraft system.TaDraft
	err := c.ShouldBindJSON(&taDraft)
	if err != nil {
		response.FailWithMessage(err.Error(), c)
		return
	}
	taDraft.UserId = utils.GetUserID(c)
	if err := taDraftService.UpdateTaDraft(taDraft); err != nil {
		global.GVA_LOG.Error("更新失败!", zap.Error(err))
		response.FailWithMessage("更新失败", c)
	} else {
		response.OkWithMessage("更新成功", c)
	}
}

// FindTaDraft 用id查询草稿
// @Tags TaDraft
// @Summary 用id查询草稿
// @Security ApiKeyAuth
// @accept application/json
// @Produce application/json
// @Param data query system.TaDraft true "用id查询草稿"
// @Success 200 {string} string "{"success":true,"data":{},"msg":"查询成功"}"
// @Router /draft/findTaDraft [get]
func (taDraftApi *TaDraftApi) FindTaDraft(c *gin.Context) {
	var taDraft system.TaDraft
	err := c.ShouldBindQuery(&taDraft)
	if err != nil {
		response.FailWithMessage(err.Error(), c)
		return
	}
	userId := utils.GetUserID(c)
	if retaDraft, err := taDraftService.GetTaDraft(taDraft.ID, userId); err != nil {
		global.GVA_LOG.Error("查询失败!", zap.Error(err))
		response.FailWithMessage("查询失败", c)
	} else {
		response.OkWithData(gin.H{"retaDraft": retaDraft}, c)
	}
}

// GetTaDraftList 分页获取草稿列表
// @Tags TaDraft
// @Summary 分页获取草稿列表
// @Security ApiKeyAuth
// @accept application/json
// @Produce application/json
// @Param data query systemReq.TaDraftSearch true "分页获取草稿列表"
// @Success 200 {string} string "{"success":true,"data":{},"msg":"获取成功"}"
// @Router /draft/getTaDraftList [get]
func (taDraftApi *TaDraftApi) GetTaDraftList(c *gin.Context) {
	var pageInfo systemReq.TaDraftSearch
	err := c.ShouldBindQuery(&pageInfo)
	if err != nil {
		response.FailWithMessage(err.Error(), c)
		return
	}
	userId := utils.GetUserID(c)
	if list, total, err := taDraftService.GetTaDraftInfoList(pageInfo, userId); err != nil {
		global.GVA_LOG.Error("获取失败!", zap.Error(err))
		response.FailWithMessage("获取失败", c)
	} else {
		response.OkWithDetailed(response.PageResult{
			List:  list,
			Total: total,
			Page:  pageInfo.Page,
			PageSize: pageInfo.PageSize,
		}, "获取成功", c)
	}
}
