package system

import (
	"errors"

	"github.com/conchi/ai-note/server/global"
	"github.com/conchi/ai-note/server/model/system"
	"github.com/conchi/ai-note/server/model/system/request"
	"gorm.io/gorm"
)

type LearningService struct{}

var LearningServiceApp = new(LearningService)

// =======================
// Learning Item
// =======================

func (s *LearningService) CreateLearningItem(userId uint, req system.TaLearningItem) (*system.TaLearningItem, error) {
	req.UserId = userId
	err := global.GVA_DB.Create(&req).Error
	return &req, err
}

func (s *LearningService) UpdateLearningItem(userId uint, req system.TaLearningItem) error {
	var count int64
	global.GVA_DB.Model(&system.TaLearningItem{}).Where("id = ? AND user_id = ?", req.ID, userId).Count(&count)
	if count == 0 {
		return errors.New("记录不存在或无权限")
	}

	updateData := map[string]interface{}{
		"title":       req.Title,
		"description": req.Description,
		"url":         req.Url,
		"category":    req.Category,
		"tag":         req.Tag,
		"status":      req.Status,
	}
	return global.GVA_DB.Model(&system.TaLearningItem{}).Where("id = ? AND user_id = ?", req.ID, userId).Updates(updateData).Error
}

func (s *LearningService) DeleteLearningItem(userId uint, id uint) error {
	var count int64
	global.GVA_DB.Model(&system.TaLearningItem{}).Where("id = ? AND user_id = ?", id, userId).Count(&count)
	if count == 0 {
		return errors.New("记录不存在或无权限")
	}

	return global.GVA_DB.Transaction(func(tx *gorm.DB) error {
		// 删除项
		if err := tx.Where("id = ? AND user_id = ?", id, userId).Delete(&system.TaLearningItem{}).Error; err != nil {
			return err
		}
		// 删除章节
		if err := tx.Where("item_id = ? AND user_id = ?", id, userId).Delete(&system.TaLearningChapter{}).Error; err != nil {
			return err
		}
		// 删除笔记
		if err := tx.Where("item_id = ? AND user_id = ?", id, userId).Delete(&system.TaLearningNote{}).Error; err != nil {
			return err
		}
		return nil
	})
}

func (s *LearningService) GetLearningItemList(userId uint, info request.TaLearningItemSearch) (list []system.TaLearningItem, total int64, err error) {
	db := global.GVA_DB.Model(&system.TaLearningItem{}).Where("user_id = ?", userId)
	
	if info.Category != "" {
		db = db.Where("category = ?", info.Category)
	}
	if info.Status != "" {
		db = db.Where("status = ?", info.Status)
	}
	if info.Keyword != "" {
		db = db.Where("title LIKE ? OR description LIKE ?", "%"+info.Keyword+"%", "%"+info.Keyword+"%")
	}

	err = db.Count(&total).Error
	if err != nil {
		return
	}

	// 对于列表，预加载所有 Chapters 和 Notes（根据当前前端一把梭的设计）
	db = db.Preload("Chapters", func(db *gorm.DB) *gorm.DB {
		return db.Order("sort_order ASC")
	}).Preload("Notes", func(db *gorm.DB) *gorm.DB {
		return db.Order("created_at DESC")
	})

	if info.PageSize > 0 && info.Page > 0 {
		db = db.Scopes(info.Paginate())
	}

	err = db.Order("updated_at DESC").Find(&list).Error
	return
}

// =======================
// Learning Chapter
// =======================

func (s *LearningService) CreateChapter(userId uint, req system.TaLearningChapter) (*system.TaLearningChapter, error) {
	req.UserId = userId
	err := global.GVA_DB.Create(&req).Error
	return &req, err
}

func (s *LearningService) UpdateChapter(userId uint, req system.TaLearningChapter) error {
	var count int64
	global.GVA_DB.Model(&system.TaLearningChapter{}).Where("id = ? AND user_id = ?", req.ID, userId).Count(&count)
	if count == 0 {
		return errors.New("章节不存在或无权限")
	}

	updateData := map[string]interface{}{
		"title":      req.Title,
		"sort_order": req.SortOrder,
		"completed":  req.Completed,
	}
	return global.GVA_DB.Model(&system.TaLearningChapter{}).Where("id = ? AND user_id = ?", req.ID, userId).Updates(updateData).Error
}

func (s *LearningService) ToggleChapterCompleted(userId uint, req request.TaLearningChapterUpdateStatus) error {
	return global.GVA_DB.Model(&system.TaLearningChapter{}).
		Where("id = ? AND user_id = ?", req.ID, userId).
		Update("completed", req.Completed).Error
}

func (s *LearningService) DeleteChapter(userId uint, id uint) error {
	var count int64
	global.GVA_DB.Model(&system.TaLearningChapter{}).Where("id = ? AND user_id = ?", id, userId).Count(&count)
	if count == 0 {
		return errors.New("章节不存在或无权限")
	}

	return global.GVA_DB.Transaction(func(tx *gorm.DB) error {
		// 删除章节
		if err := tx.Where("id = ? AND user_id = ?", id, userId).Delete(&system.TaLearningChapter{}).Error; err != nil {
			return err
		}
		// 把关联笔记的 ChapterId 置为空(0)
		if err := tx.Model(&system.TaLearningNote{}).Where("chapter_id = ? AND user_id = ?", id, userId).Update("chapter_id", 0).Error; err != nil {
			return err
		}
		return nil
	})
}

// =======================
// Learning Note
// =======================

func (s *LearningService) CreateNote(userId uint, req system.TaLearningNote) (*system.TaLearningNote, error) {
	req.UserId = userId
	err := global.GVA_DB.Create(&req).Error
	return &req, err
}

func (s *LearningService) UpdateNote(userId uint, req system.TaLearningNote) error {
	var count int64
	global.GVA_DB.Model(&system.TaLearningNote{}).Where("id = ? AND user_id = ?", req.ID, userId).Count(&count)
	if count == 0 {
		return errors.New("笔记不存在或无权限")
	}

	updateData := map[string]interface{}{
		"content":    req.Content,
		"chapter_id": req.ChapterId,
	}
	return global.GVA_DB.Model(&system.TaLearningNote{}).Where("id = ? AND user_id = ?", req.ID, userId).Updates(updateData).Error
}

func (s *LearningService) DeleteNote(userId uint, id uint) error {
	return global.GVA_DB.Where("id = ? AND user_id = ?", id, userId).Delete(&system.TaLearningNote{}).Error
}
