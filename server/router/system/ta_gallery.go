package system

import (
	v1 "github.com/conchi/ai-note/server/api/v1"
	"github.com/gin-gonic/gin"
)

type GalleryRouter struct{}

func (s *GalleryRouter) InitGalleryRouter(Router *gin.RouterGroup) {
	galleryRouter := Router.Group("gallery")
	galleryApi := v1.ApiGroupApp.SystemApiGroup.GalleryApi
	{
		galleryRouter.GET("list", galleryApi.GetMediaList)
		galleryRouter.POST("upload", galleryApi.UploadMedia)
		galleryRouter.DELETE("delete", galleryApi.DeleteMedia)
	}
}
