package system

import (
	"github.com/conchi/ai-note/server/global"
	"github.com/conchi/ai-note/server/model/system"
	"github.com/conchi/ai-note/server/model/system/request"
	"gorm.io/gorm"
)

type TaNovelService struct{}

func (taNovelService *TaNovelService) CreateTaNovel(taNovel *system.TaNovel) (err error) {
	err = global.GVA_DB.Create(taNovel).Error
	return err
}

func (taNovelService *TaNovelService) DeleteTaNovel(taNovel system.TaNovel) (err error) {
	err = global.GVA_DB.Transaction(func(tx *gorm.DB) error {
		if err := tx.Delete(&taNovel).Error; err != nil {
			return err
		}
		if err := tx.Where("novel_id = ?", taNovel.ID).Delete(&system.TaNovelChapter{}).Error; err != nil {
			return err
		}
		return nil
	})
	return err
}

func (taNovelService *TaNovelService) UpdateTaNovel(taNovel system.TaNovel) (err error) {
	err = global.GVA_DB.Save(&taNovel).Error
	return err
}

func (taNovelService *TaNovelService) GetTaNovel(id uint) (taNovel system.TaNovel, err error) {
	err = global.GVA_DB.Where("id = ?", id).Preload("Chapters", func(db *gorm.DB) *gorm.DB {
		return db.Select("id, user_id, novel_id, title, sort_order, word_count, qwen_score, glm_score, kimi_score, minimax_score, created_at, updated_at")
	}).First(&taNovel).Error
	return
}

func (taNovelService *TaNovelService) GetTaNovelInfoList(info request.TaNovelSearch) (list []system.TaNovel, total int64, err error) {
	limit := info.PageSize
	offset := info.PageSize * (info.Page - 1)
	db := global.GVA_DB.Model(&system.TaNovel{})
	var taNovels []system.TaNovel

	if info.UserId != 0 {
		db = db.Where("user_id = ?", info.UserId)
	}
	if info.Title != "" {
		db = db.Where("title LIKE ?", "%"+info.Title+"%")
	}

	err = db.Count(&total).Error
	if err != nil {
		return
	}
    // we do not Limit Offset if pageSize is 999 
    if limit == 999 {
        err = db.Find(&taNovels).Error
    }else{
        err = db.Limit(limit).Offset(offset).Find(&taNovels).Error
    }
	
	return taNovels, total, err
}
