package system

import (
	v1 "github.com/conchi/ai-note/server/api/v1"
	"github.com/gin-gonic/gin"
)

type FileRouter struct{}

func (s *FileRouter) InitFileRouter(Router *gin.RouterGroup) {
	fileRouter := Router.Group("file")
	fileApi := v1.ApiGroupApp.SystemApiGroup.FileApi
	{
		fileRouter.POST("list", fileApi.GetFileList)
		fileRouter.POST("create/directory", fileApi.CreateDirectory)
		fileRouter.POST("upload", fileApi.UploadFile)
		fileRouter.DELETE("delete/:id", fileApi.DeleteFile)
		fileRouter.PUT("rename/:id", fileApi.RenameFile)
		fileRouter.GET("download/:id", fileApi.DownloadFile)
		fileRouter.GET("preview/:id", fileApi.PreviewFile)
	}
}
