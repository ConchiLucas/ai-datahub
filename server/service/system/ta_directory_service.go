package system

import (
	"errors"
	"github.com/conchi/ai-note/server/global"
	"github.com/conchi/ai-note/server/model/system"
	"gorm.io/gorm"
)

type TaDirectoryService struct{}

func (s *TaDirectoryService) GetDirectoryTree(userId uint) ([]system.TaDirectory, error) {
	var directories []system.TaDirectory
	err := global.GVA_DB.Where("user_id = ?", userId).Order("sort_num asc").Find(&directories).Error
	return directories, err
}

func (s *TaDirectoryService) GetDirectoryList(userId uint, dirType string, parentId *uint) ([]system.TaDirectory, error) {
	var directories []system.TaDirectory
	db := global.GVA_DB.Where("user_id = ? AND type = ?", userId, dirType)
	if parentId != nil && *parentId != 0 {
		db = db.Where("parent_id = ?", parentId)
	} else {
		db = db.Where("parent_id IS NULL")
	}
	err := db.Order("sort_num asc").Find(&directories).Error
	return directories, err
}

func (s *TaDirectoryService) GetDirectoryById(id int, userId uint) (system.TaDirectory, error) {
	var dir system.TaDirectory
	err := global.GVA_DB.Where("id = ? AND user_id = ?", id, userId).First(&dir).Error
	return dir, err
}

func (s *TaDirectoryService) SaveOrUpdateDirectory(dir *system.TaDirectory, notebookId *uint) error {
	return global.GVA_DB.Transaction(func(tx *gorm.DB) error {
		if dir.ID != 0 {
			return tx.Updates(dir).Error
		}
		if err := tx.Create(dir).Error; err != nil {
			return err
		}
		// 如果传入了 notebook_id，说明是创建组并将笔记本移动到组下
		if notebookId != nil {
			var notebook system.TaDirectory
			if err := tx.Where("id = ?", *notebookId).First(&notebook).Error; err == nil {
				notebook.ParentId = &dir.ID
				if err := tx.Save(&notebook).Error; err != nil {
					return err
				}
			}
		}
		return nil
	})
}

func (s *TaDirectoryService) DeleteDirectory(ids []int, userId uint) error {
	return global.GVA_DB.Transaction(func(tx *gorm.DB) error {
		for _, id := range ids {
			var dir system.TaDirectory
			if err := tx.Where("id = ? AND user_id = ?", id, userId).First(&dir).Error; err != nil {
				continue
			}

			// 检查是否有子目录
			var childCount int64
			tx.Model(&system.TaDirectory{}).Where("parent_id = ?", dir.ID).Count(&childCount)
			if childCount > 0 {
				return errors.New("无法删除目录，该目录下存在子目录")
			}

			// 如果是笔记本（type='note'），检查是否在组中，如果组下没有其他笔记本，则一并删除组
			if dir.Type == "note" && dir.ParentId != nil {
				var notebookCount int64
				tx.Model(&system.TaDirectory{}).Where("parent_id = ?", dir.ParentId).Count(&notebookCount)
				if notebookCount == 1 {
					// 如果组下只有这 1 个笔记本，删除组
					if err := tx.Where("id = ?", dir.ParentId).Delete(&system.TaDirectory{}).Error; err != nil {
						return err
					}
				}
			}

			// 删除当前目录
			if err := tx.Where("id = ?", dir.ID).Delete(&system.TaDirectory{}).Error; err != nil {
				return err
			}
		}
		return nil
	})
}

func (s *TaDirectoryService) MoveNoteToGroup(noteId int, groupId int, userId uint) error {
	// 获取用户拥有的笔记本 ID 列表，用于校验笔记归属
	var userNotebookIds []uint
	if err := global.GVA_DB.Model(&system.TaDirectory{}).
		Where("user_id = ? AND type = ?", userId, "note").
		Pluck("id", &userNotebookIds).Error; err != nil {
		return err
	}
	if len(userNotebookIds) == 0 {
		return errors.New("用户无笔记本")
	}

	var note system.TaAiNote
	err := global.GVA_DB.Where("id = ? AND notebook_id IN ?", noteId, userNotebookIds).First(&note).Error
	if err != nil {
		return errors.New("笔记不存在或无权操作")
	}

	note.NotebookId = uint(groupId)
	return global.GVA_DB.Save(&note).Error
}
