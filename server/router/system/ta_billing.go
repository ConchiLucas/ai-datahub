package system

import (
	"github.com/conchi/ai-note/server/api/v1"
	"github.com/gin-gonic/gin"
)

type BillingRouter struct{}

func (r *BillingRouter) InitBillingRouter(Router *gin.RouterGroup) {
	billingRouter := Router.Group("billing")

	billingApi := v1.ApiGroupApp.SystemApiGroup.BillingApi
	{
		billingRouter.POST("create", billingApi.CreateBilling) // 创建记账
		billingRouter.DELETE("delete", billingApi.DeleteBilling) // 删除记账
		billingRouter.GET("list", billingApi.GetBillingList) // 获取所有大盘流水
	}
}
