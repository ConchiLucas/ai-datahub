package system

import (
	"github.com/conchi/ai-note/server/api/v1"
	"github.com/gin-gonic/gin"
)

type ProductIdeaRouter struct{}

func (s *ProductIdeaRouter) InitProductIdeaRouter(Router *gin.RouterGroup) {
	ideaRouter := Router.Group("productIdea")
	var productIdeaApi = v1.ApiGroupApp.SystemApiGroup.ProductIdeaApi
	{
		ideaRouter.POST("create", productIdeaApi.CreateProductIdea)
		ideaRouter.DELETE("delete", productIdeaApi.DeleteProductIdea)
		ideaRouter.PUT("update", productIdeaApi.UpdateProductIdea)
		ideaRouter.POST("list", productIdeaApi.GetProductIdeaList)
	}
}
