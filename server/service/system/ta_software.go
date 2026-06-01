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

type SoftwareService struct{}

func (s *SoftwareService) GetList(userId uint) ([]system.TaSoftware, error) {
	var list []system.TaSoftware
	err := global.GVA_DB.Where("user_id = ?", userId).Order("id desc").Find(&list).Error
	return list, err
}

func (s *SoftwareService) Upload(
	header *multipart.FileHeader,
	iconHeader *multipart.FileHeader,
	userId uint,
	name, version, category, platform, description string,
) (*system.TaSoftware, error) {
	// Upload main file to MinIO
	fileExt := filepath.Ext(header.Filename)
	baseName := strconv.FormatInt(time.Now().UnixNano(), 10)
	headerCopy := *header
	headerCopy.Filename = baseName + fileExt

	fileUrl, err := utils.UploadToMinio(&headerCopy, "software")
	if err != nil {
		return nil, err
	}

	iconUrl := ""
	if iconHeader != nil {
		iconCopy := *iconHeader
		iconCopy.Filename = baseName + "_icon" + filepath.Ext(iconHeader.Filename)
		if url, err := utils.UploadToMinio(&iconCopy, "software"); err == nil {
			iconUrl = url
		}
	}

	sw := system.TaSoftware{
		UserId:      userId,
		Name:        name,
		Version:     version,
		Category:    category,
		Platform:    platform,
		Description: description,
		FileUrl:     fileUrl,
		FileName:    header.Filename,
		FileSize:    header.Size,
		IconUrl:     iconUrl,
	}
	err = global.GVA_DB.Create(&sw).Error
	return &sw, err
}

func (s *SoftwareService) Delete(userId uint, id uint) error {
	var sw system.TaSoftware
	if err := global.GVA_DB.Where("id = ? AND user_id = ?", id, userId).First(&sw).Error; err != nil {
		return err
	}
	if sw.FileUrl != "" {
		_ = utils.DeleteFromMinio(sw.FileUrl)
	}
	if sw.IconUrl != "" {
		_ = utils.DeleteFromMinio(sw.IconUrl)
	}
	return global.GVA_DB.Delete(&sw).Error
}

func (s *SoftwareService) Update(userId uint, id uint, name, version, category, platform, description string) error {
	return global.GVA_DB.Model(&system.TaSoftware{}).
		Where("id = ? AND user_id = ?", id, userId).
		Updates(map[string]interface{}{
			"name":        name,
			"version":     version,
			"category":    category,
			"platform":    platform,
			"description": description,
		}).Error
}
