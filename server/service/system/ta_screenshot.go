package system

import (
	"errors"
	"mime/multipart"

	"github.com/conchi/ai-note/server/global"
	"github.com/conchi/ai-note/server/model/system"
	systemReq "github.com/conchi/ai-note/server/model/system/request"
	"github.com/conchi/ai-note/server/utils"
	"gorm.io/gorm"
)

type ScreenshotService struct{}

func (s *ScreenshotService) CreateScreenshot(fileHeader *multipart.FileHeader, desc string, tag string, userId uint) (*system.TaScreenshot, error) {
	url, err := utils.UploadToMinio(fileHeader, "screenshot")
	if err != nil {
		return nil, err
	}

	screenshot := system.TaScreenshot{
		UserId:      userId,
		Url:         url,
		Description: desc,
		Tag:         tag,
	}

	err = global.GVA_DB.Create(&screenshot).Error
	return &screenshot, err
}

func (s *ScreenshotService) UpdateScreenshot(userId uint, req *system.TaScreenshot) error {
	var old system.TaScreenshot
	err := global.GVA_DB.Where("id = ? AND user_id = ?", req.ID, userId).First(&old).Error
	if err != nil {
		return errors.New("记录不存在或无权限")
	}

	return global.GVA_DB.Model(&old).Updates(map[string]interface{}{
		"description": req.Description,
		"tag":         req.Tag,
	}).Error
}

func (s *ScreenshotService) DeleteScreenshot(userId uint, id uint) error {
	return global.GVA_DB.Transaction(func(tx *gorm.DB) error {
		var screenshot system.TaScreenshot
		if err := tx.Where("id = ? AND user_id = ?", id, userId).First(&screenshot).Error; err != nil {
			return err
		}

		if screenshot.Url != "" {
			_ = utils.DeleteFromMinio(screenshot.Url)
		}

		return tx.Delete(&screenshot).Error
	})
}

func (s *ScreenshotService) GetScreenshotList(userId uint, info systemReq.TaScreenshotSearch) (items []system.TaScreenshot, total int64, err error) {
	limit := info.PageSize
	offset := info.PageSize * (info.Page - 1)

	db := global.GVA_DB.Model(&system.TaScreenshot{}).Where("user_id = ?", userId)
	
	err = db.Count(&total).Error
	if err != nil {
		return
	}

	err = db.Order("id DESC").Limit(limit).Offset(offset).Find(&items).Error
	return items, total, err
}
