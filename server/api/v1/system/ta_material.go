package system

import (
	"github.com/conchi/ai-note/server/global"
	"github.com/conchi/ai-note/server/model/common/response"
	"github.com/conchi/ai-note/server/model/system/request"
	"github.com/conchi/ai-note/server/utils"
	"github.com/gin-gonic/gin"
	"go.uber.org/zap"
)

type MaterialApi struct{}

// CreateMaterial 创建素材
func (m *MaterialApi) CreateMaterial(c *gin.Context) {
	var req request.TaCreateMaterialReq
	if err := c.ShouldBindJSON(&req); err != nil {
		response.FailWithMessage("参数验证失败: "+err.Error(), c)
		return
	}

	userId := utils.GetUserID(c)
	material, err := materialService.CreateMaterial(&req, userId)
	if err != nil {
		global.GVA_LOG.Error("创建素材失败", zap.Error(err))
		response.FailWithMessage("创建失败: "+err.Error(), c)
		return
	}
	response.OkWithData(material, c)
}

// UpdateMaterial 更新素材
func (m *MaterialApi) UpdateMaterial(c *gin.Context) {
	var req request.TaUpdateMaterialReq
	if err := c.ShouldBindJSON(&req); err != nil {
		response.FailWithMessage("参数验证失败: "+err.Error(), c)
		return
	}

	userId := utils.GetUserID(c)
	material, err := materialService.UpdateMaterial(&req, userId)
	if err != nil {
		global.GVA_LOG.Error("更新素材失败", zap.Error(err))
		response.FailWithMessage("更新失败: "+err.Error(), c)
		return
	}
	response.OkWithData(material, c)
}

// DeleteMaterial 删除素材
func (m *MaterialApi) DeleteMaterial(c *gin.Context) {
	type DeleteReq struct {
		ID uint `json:"id" binding:"required"`
	}
	var req DeleteReq
	if err := c.ShouldBindJSON(&req); err != nil {
		response.FailWithMessage("参数验证失败", c)
		return
	}

	userId := utils.GetUserID(c)
	if err := materialService.DeleteMaterial(req.ID, userId); err != nil {
		global.GVA_LOG.Error("删除素材失败", zap.Error(err))
		response.FailWithMessage("删除失败: "+err.Error(), c)
		return
	}
	response.OkWithMessage("删除成功", c)
}

// GetMaterialList 获取素材列表
func (m *MaterialApi) GetMaterialList(c *gin.Context) {
	var pageInfo request.TaSearchMaterialParams
	if err := c.ShouldBindJSON(&pageInfo); err != nil {
		response.FailWithMessage("参数验证失败", c)
		return
	}

	userId := utils.GetUserID(c)
	list, total, err := materialService.GetMaterialList(pageInfo, userId)
	if err != nil {
		global.GVA_LOG.Error("获取素材列表失败", zap.Error(err))
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
