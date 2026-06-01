package system

import (
	"github.com/conchi/ai-note/server/global"
	"github.com/conchi/ai-note/server/model/system"
	"github.com/conchi/ai-note/server/model/system/request"
)

type JsonService struct{}

func (s *JsonService) AddSnippet(userId uint, req request.AddJsonSnippetReq) (system.TaJsonSnippet, error) {
	snippet := system.TaJsonSnippet{
		UserId:  userId,
		Title:   req.Title,
		Content: req.Content,
	}
	err := global.GVA_DB.Create(&snippet).Error
	return snippet, err
}

func (s *JsonService) UpdateSnippet(userId uint, req request.UpdateJsonSnippetReq) error {
	updates := map[string]interface{}{}
	if req.Title != "" {
		updates["title"] = req.Title
	}
	if req.Content != "" {
		updates["content"] = req.Content
	}
	return global.GVA_DB.Model(&system.TaJsonSnippet{}).Where("id = ? AND user_id = ?", req.ID, userId).Updates(updates).Error
}

func (s *JsonService) DeleteSnippet(userId uint, req request.DeleteJsonSnippetReq) error {
	return global.GVA_DB.Where("id = ? AND user_id = ?", req.ID, userId).Delete(&system.TaJsonSnippet{}).Error
}

func (s *JsonService) GetSnippets(userId uint) ([]system.TaJsonSnippet, error) {
	var snippets []system.TaJsonSnippet
	err := global.GVA_DB.Where("user_id = ?", userId).Order("id desc").Find(&snippets).Error
	return snippets, err
}
