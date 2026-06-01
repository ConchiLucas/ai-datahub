package system

import (
	"github.com/conchi/ai-note/server/global"
	"github.com/conchi/ai-note/server/model/common/response"
	"github.com/conchi/ai-note/server/model/system/request"
	"github.com/conchi/ai-note/server/utils"
	"github.com/gin-gonic/gin"
	"go.uber.org/zap"
)

type ProductIdeaApi struct{}

// CreateProductIdea 创建产品思路
func (p *ProductIdeaApi) CreateProductIdea(c *gin.Context) {
	var req request.TaCreateProductIdeaReq
	if err := c.ShouldBindJSON(&req); err != nil {
		response.FailWithMessage("参数验证失败: "+err.Error(), c)
		return
	}
	
	userId := utils.GetUserID(c)
	idea, err := productIdeaService.CreateProductIdea(&req, userId)
	if err != nil {
		global.GVA_LOG.Error("创建产品思路失败", zap.Error(err))
		response.FailWithMessage("创建失败: "+err.Error(), c)
		return
	}
	response.OkWithData(idea, c)
}

// UpdateProductIdea 更新产品思路
func (p *ProductIdeaApi) UpdateProductIdea(c *gin.Context) {
	var req request.TaUpdateProductIdeaReq
	if err := c.ShouldBindJSON(&req); err != nil {
		response.FailWithMessage("参数验证失败: "+err.Error(), c)
		return
	}
	
	userId := utils.GetUserID(c)
	idea, err := productIdeaService.UpdateProductIdea(&req, userId)
	if err != nil {
		global.GVA_LOG.Error("更新产品思路失败", zap.Error(err))
		response.FailWithMessage("更新失败: "+err.Error(), c)
		return
	}
	response.OkWithData(idea, c)
}

// DeleteProductIdea 删除产品思路
func (p *ProductIdeaApi) DeleteProductIdea(c *gin.Context) {
	type DeleteReq struct {
		ID uint `json:"id" binding:"required"`
	}
	var req DeleteReq
	if err := c.ShouldBindJSON(&req); err != nil {
		response.FailWithMessage("参数验证失败", c)
		return
	}
	
	userId := utils.GetUserID(c)
	if err := productIdeaService.DeleteProductIdea(req.ID, userId); err != nil {
		global.GVA_LOG.Error("删除产品思路失败", zap.Error(err))
		response.FailWithMessage("删除失败: "+err.Error(), c)
		return
	}
	response.OkWithMessage("删除成功", c)
}

// GetProductIdeaList 获取产品思路列表
func (p *ProductIdeaApi) GetProductIdeaList(c *gin.Context) {
	var pageInfo request.TaSearchProductIdeaParams
	if err := c.ShouldBindJSON(&pageInfo); err != nil {
		response.FailWithMessage("参数验证失败", c)
		return
	}
	
	userId := utils.GetUserID(c)
	list, total, err := productIdeaService.GetProductIdeaList(pageInfo, userId)
	if err != nil {
		global.GVA_LOG.Error("获取产品思路列表失败", zap.Error(err))
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
