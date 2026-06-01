package system

import (
	"time"

	"github.com/conchi/ai-note/server/global"
	"github.com/conchi/ai-note/server/model/common/response"
	"github.com/conchi/ai-note/server/model/system"
	"github.com/conchi/ai-note/server/model/system/request"
	"github.com/conchi/ai-note/server/utils"
	"github.com/gin-gonic/gin"
	"go.uber.org/zap"
)

type BillingApi struct{}

// CreateBilling 创建记账记录
func (a *BillingApi) CreateBilling(c *gin.Context) {
	userId := utils.GetUserID(c)
	var req request.TaCreateBillingReq
	if err := c.ShouldBindJSON(&req); err != nil {
		response.FailWithMessage("参数验证失败", c)
		return
	}

	billing := system.TaBilling{
		UserId:     userId,
		Type:       req.Type,
		CategoryId: req.CategoryId,
		Amount:     req.Amount,
		Note:       req.Note,
		Date:       time.Now().Format(time.RFC3339),
	}

	if err := billingService.CreateBilling(&billing); err != nil {
		global.GVA_LOG.Error("创建记录失败!", zap.Error(err))
		response.FailWithMessage("创建失败", c)
		return
	}
	// 将创建的带有自增ID的结构体返回，方便前端局部追加
	response.OkWithData(billing, c)
}

// DeleteBilling 删除记账记录
func (a *BillingApi) DeleteBilling(c *gin.Context) {
	userId := utils.GetUserID(c)
	var req request.TaDeleteBillingReq
	if err := c.ShouldBindJSON(&req); err != nil {
		response.FailWithMessage("参数验证失败", c)
		return
	}

	if err := billingService.DeleteBilling(userId, req.Id); err != nil {
		global.GVA_LOG.Error("删除记录失败!", zap.Error(err))
		response.FailWithMessage("删除失败", c)
		return
	}
	response.OkWithMessage("删除成功", c)
}

// GetBillingList 获取个人账单全量列表
func (a *BillingApi) GetBillingList(c *gin.Context) {
	userId := utils.GetUserID(c)
	list, err := billingService.GetBillingList(userId)
	if err != nil {
		global.GVA_LOG.Error("获取账单流水失败!", zap.Error(err))
		response.FailWithMessage("获取数据失败", c)
		return
	}
	response.OkWithData(list, c)
}
