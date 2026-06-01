package system

import (
	"mime/multipart"

	"github.com/conchi/ai-note/server/model/common/response"
	"github.com/conchi/ai-note/server/utils"
	"github.com/gin-gonic/gin"
	"go.uber.org/zap"
	"github.com/conchi/ai-note/server/global"
)

type GalleryApi struct{}

// GetMediaList 获取所有图库媒体
func (g *GalleryApi) GetMediaList(c *gin.Context) {
	userId := utils.GetUserID(c)
	list, err := galleryService.GetMediaList(userId)
	if err != nil {
		global.GVA_LOG.Error("获取图库失败!", zap.Error(err))
		response.FailWithMessage("获取失败", c)
		return
	}
	response.OkWithData(list, c)
}

// UploadMedia 上传媒体
func (g *GalleryApi) UploadMedia(c *gin.Context) {
	userId := utils.GetUserID(c)
	file, err := c.FormFile("file")
	if err != nil {
		global.GVA_LOG.Error("接收文件失败!", zap.Error(err))
		response.FailWithMessage("接收文件失败", c)
		return
	}
	
	pType := c.PostForm("type")
	if pType == "" {
		pType = "image"
	}
	duration := c.PostForm("duration")

	var thumbnailFile *multipart.FileHeader
	if thumb, err := c.FormFile("thumbnail"); err == nil {
		thumbnailFile = thumb
	}

	media, err := galleryService.UploadMedia(file, thumbnailFile, userId, pType, duration)
	if err != nil {
		global.GVA_LOG.Error("保存媒体失败!", zap.Error(err))
		response.FailWithMessage("保存媒体失败", c)
		return
	}

	response.OkWithDetailed(media, "上传成功", c)
}

// DeleteMedia 删除媒体
func (g *GalleryApi) DeleteMedia(c *gin.Context) {
	userId := utils.GetUserID(c)
	
	type reqPath struct {
		Id uint `json:"id"`
	}
	var req reqPath
	if err := c.ShouldBindJSON(&req); err != nil {
		response.FailWithMessage("参数错误", c)
		return
	}

	if err := galleryService.DeleteMedia(userId, req.Id); err != nil {
		global.GVA_LOG.Error("删除失败!", zap.Error(err))
		response.FailWithMessage("删除失败", c)
		return
	}

	response.OkWithMessage("删除成功", c)
}
