package system

import (
	"github.com/conchi/ai-note/server/global"
	"github.com/conchi/ai-note/server/model/system"
	"github.com/conchi/ai-note/server/model/system/request"
)

type CommandService struct{}

func (s *CommandService) AddCategory(userId uint, req request.AddCommandCategoryReq) (system.TaCommandCategory, error) {
	category := system.TaCommandCategory{
		UserId: userId,
		Name:   req.Name,
	}
	err := global.GVA_DB.Create(&category).Error
	return category, err
}

func (s *CommandService) DeleteCategory(userId uint, req request.DeleteCommandCategoryReq) error {
	return global.GVA_DB.Where("name = ? AND user_id = ?", req.Name, userId).Delete(&system.TaCommandCategory{}).Error
}

func (s *CommandService) AddCommand(userId uint, req request.AddCommandReq) (system.TaCommand, error) {
	// Auto-add category if needed
	if req.Category != "" && req.Category != "All" {
		var count int64
		global.GVA_DB.Model(&system.TaCommandCategory{}).Where("user_id = ? AND name = ?", userId, req.Category).Count(&count)
		if count == 0 {
			global.GVA_DB.Create(&system.TaCommandCategory{UserId: userId, Name: req.Category})
		}
	}

	cmd := system.TaCommand{
		UserId:      userId,
		Category:    req.Category,
		Title:       req.Title,
		Command:     req.Command,
		Description: req.Description,
	}
	err := global.GVA_DB.Create(&cmd).Error
	return cmd, err
}

func (s *CommandService) UpdateCommand(userId uint, req request.UpdateCommandReq) error {
	// Auto-add category if needed
	if req.Category != "" && req.Category != "All" {
		var count int64
		global.GVA_DB.Model(&system.TaCommandCategory{}).Where("user_id = ? AND name = ?", userId, req.Category).Count(&count)
		if count == 0 {
			global.GVA_DB.Create(&system.TaCommandCategory{UserId: userId, Name: req.Category})
		}
	}

	return global.GVA_DB.Model(&system.TaCommand{}).Where("id = ? AND user_id = ?", req.ID, userId).Updates(map[string]interface{}{
		"title":       req.Title,
		"category":    req.Category,
		"command":     req.Command,
		"description": req.Description,
	}).Error
}

func (s *CommandService) DeleteCommand(userId uint, req request.DeleteCommandReq) error {
	return global.GVA_DB.Where("id = ? AND user_id = ?", req.ID, userId).Delete(&system.TaCommand{}).Error
}

func (s *CommandService) GetCommandData(userId uint) (map[string]interface{}, error) {
	var categories []system.TaCommandCategory
	var commands []system.TaCommand

	if err := global.GVA_DB.Where("user_id = ?", userId).Order("id asc").Find(&categories).Error; err != nil {
		return nil, err
	}

	if err := global.GVA_DB.Where("user_id = ?", userId).Order("id desc").Find(&commands).Error; err != nil {
		return nil, err
	}

	return map[string]interface{}{
		"categories": categories,
		"commands":   commands,
	}, nil
}
