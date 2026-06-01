package system

import (
	"errors"

	"github.com/conchi/ai-note/server/global"
	"github.com/conchi/ai-note/server/model/system"
	systemReq "github.com/conchi/ai-note/server/model/system/request"
)

type GuidelineService struct{}

func (s *GuidelineService) CreateGuideline(userId uint, req *system.TaGuideline) (err error) {
	req.UserId = userId
	err = global.GVA_DB.Create(req).Error
	return err
}

func (s *GuidelineService) UpdateGuideline(userId uint, req *system.TaGuideline) (err error) {
	var old system.TaGuideline
	err = global.GVA_DB.Where("id = ? AND user_id = ?", req.ID, userId).First(&old).Error
	if err != nil {
		return errors.New("查询失败或无权限")
	}

	err = global.GVA_DB.Model(&old).Updates(map[string]interface{}{
		"title":   req.Title,
		"tag":     req.Tag,
		"content": req.Content,
	}).Error

	return err
}

func (s *GuidelineService) DeleteGuideline(userId uint, id uint) (err error) {
	err = global.GVA_DB.Where("id = ? AND user_id = ?", id, userId).Delete(&system.TaGuideline{}).Error
	return err
}

func (s *GuidelineService) GetGuidelineList(userId uint, info systemReq.TaGuidelineSearch) (list interface{}, total int64, err error) {
	limit := info.PageSize
	offset := info.PageSize * (info.Page - 1)

	db := global.GVA_DB.Model(&system.TaGuideline{}).Where("user_id = ?", userId)
	var guidelines []system.TaGuideline

	err = db.Count(&total).Error
	if err != nil {
		return
	}

	err = db.Order("id DESC").Limit(limit).Offset(offset).Find(&guidelines).Error
	return guidelines, total, err
}
