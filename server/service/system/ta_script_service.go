package system

import (
	"errors"

	"github.com/conchi/ai-note/server/global"
	"github.com/conchi/ai-note/server/model/system"
	"github.com/conchi/ai-note/server/model/system/request"
	"gorm.io/gorm"
)

type TaScriptService struct{}

// CreateScript 创建脚本
func (s *TaScriptService) CreateScript(userId uint, req request.CreateScriptReq) (system.TaScript, error) {
	script := system.TaScript{
		UserId:      userId,
		Title:       req.Title,
		Description: req.Description,
		Language:    req.Language,
		Code:        req.Code,
		Tags:        req.Tags,
	}
	err := global.GVA_DB.Create(&script).Error
	return script, err
}

// DeleteScript 删除脚本
func (s *TaScriptService) DeleteScript(userId uint, id uint) error {
	return global.GVA_DB.Where("id = ? AND user_id = ?", id, userId).Delete(&system.TaScript{}).Error
}

// UpdateScript 更新脚本
func (s *TaScriptService) UpdateScript(userId uint, req request.UpdateScriptReq) error {
	var script system.TaScript
	err := global.GVA_DB.Where("id = ? AND user_id = ?", req.ID, userId).First(&script).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return errors.New("脚本不存在或无权限修改")
		}
		return err
	}

	updates := map[string]interface{}{
		"title":       req.Title,
		"description": req.Description,
		"language":    req.Language,
		"code":        req.Code,
		"tags":        req.Tags,
	}

	return global.GVA_DB.Model(&script).Updates(updates).Error
}

// GetScriptList 获取脚本列表
func (s *TaScriptService) GetScriptList(userId uint, info request.SearchScriptParams) (list []system.TaScript, total int64, err error) {
	limit := info.PageSize
	offset := info.PageSize * (info.Page - 1)
	
	db := global.GVA_DB.Model(&system.TaScript{}).Where("user_id = ?", userId)
	
	if info.Language != "" {
		db = db.Where("language = ?", info.Language)
	}
	if info.Keyword != "" {
		db = db.Where("title LIKE ? OR description LIKE ? OR code LIKE ? OR tags LIKE ?", "%"+info.Keyword+"%", "%"+info.Keyword+"%", "%"+info.Keyword+"%", "%"+info.Keyword+"%")
	}
	
	err = db.Count(&total).Error
	if err != nil {
		return
	}
	
	err = db.Order("updated_at desc").Limit(limit).Offset(offset).Find(&list).Error
	return list, total, err
}
