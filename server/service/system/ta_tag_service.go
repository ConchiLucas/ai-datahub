package system

import (
	"errors"
	"github.com/conchi/ai-note/server/global"
	"github.com/conchi/ai-note/server/model/system"
	"strings"
)

type TaTagService struct{}

func (s *TaTagService) GetTagList(userId uint) ([]system.TaTag, error) {
	var tags []system.TaTag
	err := global.GVA_DB.Where("user_id = ?", userId).Find(&tags).Error
	return tags, err
}

func (s *TaTagService) CreateTag(tag *system.TaTag) error {
	return global.GVA_DB.Create(tag).Error
}

func (s *TaTagService) UpdateTag(tag *system.TaTag) error {
	return global.GVA_DB.Updates(tag).Error
}

func (s *TaTagService) DeleteTag(id int, userId uint) error {
	var tag system.TaTag
	if err := global.GVA_DB.Where("id = ? AND user_id = ?", id, userId).First(&tag).Error; err != nil {
		return err
	}

	// 获取用户拥有的笔记本 ID，限定搜索范围
	var userNotebookIds []uint
	global.GVA_DB.Model(&system.TaDirectory{}).Where("user_id = ? AND type = ?", userId, "note").Pluck("id", &userNotebookIds)

	if len(userNotebookIds) > 0 {
		// 使用精确匹配：标签字段是逗号分隔的字符串，需要匹配完整的标签名
		// 匹配情况: "tagName" | "tagName,..." | "...,tagName" | "...,tagName,..."
		var count int64
		if err := global.GVA_DB.Model(&system.TaAiNote{}).
			Where("notebook_id IN ?", userNotebookIds).
			Where("(tags = ? OR tags LIKE ? OR tags LIKE ? OR tags LIKE ?)",
				tag.Name,
				tag.Name+",%",
				"%,"+tag.Name,
				"%,"+tag.Name+",%",
			).Count(&count).Error; err != nil {
			return err
		}

		if count > 0 {
			return errors.New("无法删除标签，该标签被笔记引用")
		}
	}

	return global.GVA_DB.Where("id = ?", id).Delete(&system.TaTag{}).Error
}

func (s *TaTagService) UpdateNoteTags(noteId int, tagNames []string, userId uint) error {
	// 校验笔记归属
	var userNotebookIds []uint
	if err := global.GVA_DB.Model(&system.TaDirectory{}).
		Where("user_id = ? AND type = ?", userId, "note").
		Pluck("id", &userNotebookIds).Error; err != nil {
		return err
	}
	if len(userNotebookIds) == 0 {
		return errors.New("用户无笔记本")
	}

	var count int64
	global.GVA_DB.Model(&system.TaAiNote{}).Where("id = ? AND notebook_id IN ?", noteId, userNotebookIds).Count(&count)
	if count == 0 {
		return errors.New("笔记不存在或无权操作")
	}

	// join tags with comma
	tagsStr := strings.Join(tagNames, ",")
	return global.GVA_DB.Model(&system.TaAiNote{}).Where("id = ?", noteId).Update("tags", tagsStr).Error
}
