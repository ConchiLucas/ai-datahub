package system

import (
	v1 "github.com/conchi/ai-note/server/api/v1"
	"github.com/gin-gonic/gin"
)

type TagRouter struct{}

func (s *TagRouter) InitTagRouter(Router *gin.RouterGroup) {
	tagRouter := Router.Group("tag")
	tagApi := v1.ApiGroupApp.SystemApiGroup.TagApi
	{
		tagRouter.GET("list", tagApi.GetTagList)
		tagRouter.POST("create", tagApi.CreateTag)
		tagRouter.PUT(":id", tagApi.UpdateTag)
		tagRouter.DELETE(":id", tagApi.DeleteTag)
		tagRouter.PUT("note/:noteId/tags", tagApi.UpdateNoteTags)
	}
}
