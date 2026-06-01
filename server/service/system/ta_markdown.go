package system

import (
	"github.com/conchi/ai-note/server/global"
	"github.com/conchi/ai-note/server/model/system"
	"github.com/conchi/ai-note/server/model/system/request"
)

type MarkdownService struct{}

func (s *MarkdownService) AddSnippet(userId uint, req request.AddMarkdownSnippetReq) (system.TaMarkdownSnippet, error) {
	snippet := system.TaMarkdownSnippet{
		UserId:  userId,
		Title:   req.Title,
		Content: req.Content,
	}
	err := global.GVA_DB.Create(&snippet).Error
	return snippet, err
}

func (s *MarkdownService) UpdateSnippet(userId uint, req request.UpdateMarkdownSnippetReq) error {
	updates := map[string]interface{}{}
	if req.Title != "" {
		updates["title"] = req.Title
	}
	if req.Content != "" {
		updates["content"] = req.Content
	}
	return global.GVA_DB.Model(&system.TaMarkdownSnippet{}).Where("id = ? AND user_id = ?", req.ID, userId).Updates(updates).Error
}

func (s *MarkdownService) DeleteSnippet(userId uint, req request.DeleteMarkdownSnippetReq) error {
	return global.GVA_DB.Where("id = ? AND user_id = ?", req.ID, userId).Delete(&system.TaMarkdownSnippet{}).Error
}

func (s *MarkdownService) GetSnippets(userId uint) ([]system.TaMarkdownSnippet, error) {
	var snippets []system.TaMarkdownSnippet
	err := global.GVA_DB.Where("user_id = ?", userId).Order("id desc").Find(&snippets).Error
	return snippets, err
}
