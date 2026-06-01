package system

import (
	v1 "github.com/conchi/ai-note/server/api/v1"
	"github.com/gin-gonic/gin"
)

type CodeRouter struct{}

func (s *CodeRouter) InitCodeRouter(Router *gin.RouterGroup) {
	codeRouter := Router.Group("code")
	
	codeApi := v1.ApiGroupApp.SystemApiGroup.CodeApi
	{
		codeRouter.POST("createCode", codeApi.CreateCodeSnippet)
		codeRouter.DELETE("deleteCode", codeApi.DeleteCodeSnippet)
		codeRouter.PUT("updateCode", codeApi.UpdateCodeSnippet)
		codeRouter.POST("getCodeList", codeApi.GetCodeSnippetList)
	}
}
