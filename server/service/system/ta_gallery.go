package system

import (
	"mime/multipart"
	"path/filepath"
	"strconv"
	"time"

	"github.com/conchi/ai-note/server/global"
	"github.com/conchi/ai-note/server/model/system"
	"github.com/conchi/ai-note/server/utils"
)

type GalleryService struct{}

func (s *GalleryService) GetMediaList(userId uint) ([]system.TaGalleryMedia, error) {
	var medias []system.TaGalleryMedia
	err := global.GVA_DB.Where("user_id = ?", userId).Order("id desc").Find(&medias).Error
	return medias, err
}

func (s *GalleryService) DeleteMedia(userId uint, id uint) error {
	var m system.TaGalleryMedia
	if err := global.GVA_DB.Where("id = ? AND user_id = ?", id, userId).First(&m).Error; err != nil {
		return err
	}
	_ = utils.DeleteFromMinio(m.Url)
	return global.GVA_DB.Delete(&m).Error
}

func (s *GalleryService) UploadMedia(header *multipart.FileHeader, thumbnailHeader *multipart.FileHeader, userId uint, pType string, duration string) (*system.TaGalleryMedia, error) {
	fileExt := filepath.Ext(header.Filename)
	baseNum := strconv.FormatInt(time.Now().UnixNano(), 10)
	minioName := baseNum + fileExt

	headerCopy := *header
	headerCopy.Filename = minioName

	url, err := utils.UploadToMinio(&headerCopy, "gallery")
	if err != nil {
		return nil, err
	}

	thumbnail := ""
	if thumbnailHeader != nil {
		thumbnailHeaderCopy := *thumbnailHeader
		thumbnailHeaderCopy.Filename = baseNum + "_thumb.jpg"
		if tUrl, err := utils.UploadToMinio(&thumbnailHeaderCopy, "gallery"); err == nil {
			thumbnail = tUrl
		}
	} else if pType == "video" {
		thumbnail = url // Fallback
	}

	media := system.TaGalleryMedia{
		UserId:    userId,
		Type:      pType,
		Url:       url,
		Thumbnail: thumbnail,
		Title:     header.Filename,
		Size:      header.Size,
		Duration:  duration,
	}

	if err := global.GVA_DB.Create(&media).Error; err != nil {
		return nil, err
	}

	return &media, nil
}
