package system

import (
	"github.com/conchi/ai-note/server/global"
	"github.com/conchi/ai-note/server/model/common/response"
	"github.com/conchi/ai-note/server/model/system"
	"github.com/conchi/ai-note/server/model/system/request"
	"github.com/conchi/ai-note/server/utils"
	"github.com/gin-gonic/gin"
	"go.uber.org/zap"
)

type GuidelineApi struct{}

// CreateGuideline
func (a *GuidelineApi) CreateGuideline(c *gin.Context) {
	var req system.TaGuideline
	_ = c.ShouldBindJSON(&req)
	userId := utils.GetUserID(c)

	err := guidelineService.CreateGuideline(userId, &req)
	if err != nil {
		global.GVA_LOG.Error("创建规范失败!", zap.Error(err))
		response.FailWithMessage("创建失败: "+err.Error(), c)
	} else {
		response.OkWithDetailed(req, "创建成功", c)
	}
}

// UpdateGuideline
func (a *GuidelineApi) UpdateGuideline(c *gin.Context) {
	var req system.TaGuideline
	_ = c.ShouldBindJSON(&req)
	userId := utils.GetUserID(c)

	err := guidelineService.UpdateGuideline(userId, &req)
	if err != nil {
		global.GVA_LOG.Error("更新规范失败!", zap.Error(err))
		response.FailWithMessage("更新失败: "+err.Error(), c)
	} else {
		response.OkWithMessage("更新成功", c)
	}
}

// DeleteGuideline
func (a *GuidelineApi) DeleteGuideline(c *gin.Context) {
	var req struct {
		ID uint `json:"id"`
	}
	_ = c.ShouldBindJSON(&req)
	userId := utils.GetUserID(c)

	err := guidelineService.DeleteGuideline(userId, req.ID)
	if err != nil {
		global.GVA_LOG.Error("删除规范失败!", zap.Error(err))
		response.FailWithMessage("删除失败: "+err.Error(), c)
	} else {
		response.OkWithMessage("删除成功", c)
	}
}

// GetGuidelineList
func (a *GuidelineApi) GetGuidelineList(c *gin.Context) {
	var pageInfo request.TaGuidelineSearch
	_ = c.ShouldBindJSON(&pageInfo)
	userId := utils.GetUserID(c)

	list, total, err := guidelineService.GetGuidelineList(userId, pageInfo)
	if err != nil {
		global.GVA_LOG.Error("获取规范列表失败!", zap.Error(err))
		response.FailWithMessage("获取失败: "+err.Error(), c)
	} else {
		response.OkWithDetailed(response.PageResult{
			List:     list,
			Total:    total,
			Page:     pageInfo.Page,
			PageSize: pageInfo.PageSize,
		}, "获取成功", c)
	}
}
