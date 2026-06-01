package system

import (
	"errors"

	"github.com/conchi/ai-note/server/global"
	"github.com/conchi/ai-note/server/model/system"
	"github.com/conchi/ai-note/server/model/system/request"
	"gorm.io/gorm"
)

type TaCodeService struct{}

// CreateCodeSnippet 创建代码片段
func (s *TaCodeService) CreateCodeSnippet(userId uint, req request.CreateCodeReq) (system.TaCodeSnippet, error) {
	codeSnippet := system.TaCodeSnippet{
		UserId:      userId,
		Feature:     req.Feature,
		Language:    req.Language,
		Title:       req.Title,
		Description: req.Description,
		Code:        req.Code,
	}
	err := global.GVA_DB.Create(&codeSnippet).Error
	return codeSnippet, err
}

// DeleteCodeSnippet 删除代码片段
func (s *TaCodeService) DeleteCodeSnippet(userId uint, id uint) error {
	return global.GVA_DB.Where("id = ? AND user_id = ?", id, userId).Delete(&system.TaCodeSnippet{}).Error
}

// UpdateCodeSnippet 更新代码片段
func (s *TaCodeService) UpdateCodeSnippet(userId uint, req request.UpdateCodeReq) error {
	var codeSnippet system.TaCodeSnippet
	err := global.GVA_DB.Where("id = ? AND user_id = ?", req.ID, userId).First(&codeSnippet).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return errors.New("代码片段不存在或无权限修改")
		}
		return err
	}

	updates := map[string]interface{}{
		"feature":     req.Feature,
		"language":    req.Language,
		"title":       req.Title,
		"description": req.Description,
		"code":        req.Code,
	}

	return global.GVA_DB.Model(&codeSnippet).Updates(updates).Error
}

// GetCodeSnippetList 获取代码片段列表
func (s *TaCodeService) GetCodeSnippetList(userId uint, info request.SearchCodeParams) (list []system.TaCodeSnippet, total int64, err error) {
	limit := info.PageSize
	offset := info.PageSize * (info.Page - 1)
	
	db := global.GVA_DB.Model(&system.TaCodeSnippet{}).Where("user_id = ?", userId)
	
	if info.Feature != "" {
		db = db.Where("feature = ?", info.Feature)
	}
	if info.Keyword != "" {
		db = db.Where("title LIKE ? OR description LIKE ? OR code LIKE ?", "%"+info.Keyword+"%", "%"+info.Keyword+"%", "%"+info.Keyword+"%")
	}
	
	err = db.Count(&total).Error
	if err != nil {
		return
	}
	
	err = db.Order("updated_at desc").Limit(limit).Offset(offset).Find(&list).Error
	return list, total, err
}
