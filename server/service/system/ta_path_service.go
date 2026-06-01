package system

import (
	"github.com/conchi/ai-note/server/global"
	"github.com/conchi/ai-note/server/model/system"
	"github.com/conchi/ai-note/server/model/system/request"
)

type PathService struct{}

func (s *PathService) AddPathCategory(userId uint, name string) (system.TaPathCategory, error) {
	category := system.TaPathCategory{
		UserId: userId,
		Name:   name,
	}
	err := global.GVA_DB.Create(&category).Error
	return category, err
}

func (s *PathService) AddPath(userId uint, req request.AddPathReq) (system.TaPath, error) {
	// Auto-add category if needed
	if req.Category != "" && req.Category != "All" {
		var count int64
		global.GVA_DB.Model(&system.TaPathCategory{}).Where("user_id = ? AND name = ?", userId, req.Category).Count(&count)
		if count == 0 {
			global.GVA_DB.Create(&system.TaPathCategory{UserId: userId, Name: req.Category})
		}
	}

	pathItem := system.TaPath{
		UserId:      userId,
		Category:    req.Category,
		Title:       req.Title,
		Path:        req.Path,
		Description: req.Description,
		Content:     req.Content,
	}
	err := global.GVA_DB.Create(&pathItem).Error
	return pathItem, err
}

func (s *PathService) UpdatePath(userId uint, req request.UpdatePathReq) error {
	// Auto-add category if needed
	if req.Category != "" && req.Category != "All" {
		var count int64
		global.GVA_DB.Model(&system.TaPathCategory{}).Where("user_id = ? AND name = ?", userId, req.Category).Count(&count)
		if count == 0 {
			global.GVA_DB.Create(&system.TaPathCategory{UserId: userId, Name: req.Category})
		}
	}

	return global.GVA_DB.Model(&system.TaPath{}).Where("id = ? AND user_id = ?", req.ID, userId).Updates(map[string]interface{}{
		"title":       req.Title,
		"category":    req.Category,
		"path":        req.Path,
		"description": req.Description,
		"content":     req.Content,
	}).Error
}

func (s *PathService) DeletePath(userId uint, req request.DeletePathReq) error {
	return global.GVA_DB.Where("id = ? AND user_id = ?", req.ID, userId).Delete(&system.TaPath{}).Error
}

func (s *PathService) GetPathData(userId uint) (map[string]interface{}, error) {
	var categories []system.TaPathCategory
	var paths []system.TaPath

	if err := global.GVA_DB.Where("user_id = ?", userId).Order("id asc").Find(&categories).Error; err != nil {
		return nil, err
	}

	if err := global.GVA_DB.Where("user_id = ?", userId).Order("id desc").Find(&paths).Error; err != nil {
		return nil, err
	}

	return map[string]interface{}{
		"categories": categories,
		"paths":      paths,
	}, nil
}
