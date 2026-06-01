package system

import (
	"github.com/conchi/ai-note/server/api/v1"
	"github.com/gin-gonic/gin"
)

type MusicRouter struct{}

func (s *MusicRouter) InitMusicRouter(Router *gin.RouterGroup) {
	musicRouter := Router.Group("music")
	musicApi := v1.ApiGroupApp.SystemApiGroup.MusicApi

	{
		musicRouter.POST("upload", musicApi.UploadMusic)
		musicRouter.POST("delete", musicApi.DeleteMusic)
		musicRouter.GET("list", musicApi.GetMusicList)
		musicRouter.POST("favorite", musicApi.ToggleFavorite)
		musicRouter.POST("play", musicApi.LogPlay)
	}
}
