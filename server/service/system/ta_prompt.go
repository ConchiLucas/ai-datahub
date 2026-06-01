package system

import (
	"github.com/conchi/ai-note/server/global"
	"github.com/conchi/ai-note/server/model/system"
	"github.com/conchi/ai-note/server/model/system/request"
)

type PromptService struct{}

func (s *PromptService) AddCategory(userId uint, req request.AddPromptCategoryReq) (system.TaPromptCategory, error) {
	category := system.TaPromptCategory{
		UserId: userId,
		Name:   req.Name,
	}
	err := global.GVA_DB.Create(&category).Error
	return category, err
}

func (s *PromptService) DeleteCategory(userId uint, req request.DeletePromptCategoryReq) error {
	return global.GVA_DB.Where("name = ? AND user_id = ?", req.Name, userId).Delete(&system.TaPromptCategory{}).Error
}

func (s *PromptService) AddPrompt(userId uint, req request.AddPromptReq) (system.TaPrompt, error) {
	prompt := system.TaPrompt{
		UserId:   userId,
		Category: req.Category,
		Title:    req.Title,
		Content:  req.Content,
	}
	err := global.GVA_DB.Create(&prompt).Error
	return prompt, err
}

func (s *PromptService) UpdatePrompt(userId uint, req request.UpdatePromptReq) error {
	return global.GVA_DB.Model(&system.TaPrompt{}).Where("id = ? AND user_id = ?", req.ID, userId).Updates(map[string]interface{}{
		"title":    req.Title,
		"category": req.Category,
		"content":  req.Content,
	}).Error
}

func (s *PromptService) DeletePrompt(userId uint, req request.DeletePromptReq) error {
	return global.GVA_DB.Where("id = ? AND user_id = ?", req.ID, userId).Delete(&system.TaPrompt{}).Error
}

func (s *PromptService) GetPromptData(userId uint) (map[string]interface{}, error) {
	var categories []system.TaPromptCategory
	var prompts []system.TaPrompt

	if err := global.GVA_DB.Where("user_id = ?", userId).Order("id asc").Find(&categories).Error; err != nil {
		return nil, err
	}

	if err := global.GVA_DB.Where("user_id = ?", userId).Order("id desc").Find(&prompts).Error; err != nil {
		return nil, err
	}

	return map[string]interface{}{
		"categories": categories,
		"prompts":    prompts,
	}, nil
}
