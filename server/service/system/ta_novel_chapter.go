package system

import (
	"github.com/conchi/ai-note/server/global"
	"github.com/conchi/ai-note/server/model/system"
	"github.com/conchi/ai-note/server/model/system/request"
)

type TaNovelChapterService struct{}

func (taNovelChapterService *TaNovelChapterService) CreateTaNovelChapter(taNovelChapter *system.TaNovelChapter) (err error) {
	err = global.GVA_DB.Create(taNovelChapter).Error
	return err
}

func (taNovelChapterService *TaNovelChapterService) DeleteTaNovelChapter(taNovelChapter system.TaNovelChapter) (err error) {
	err = global.GVA_DB.Delete(&taNovelChapter).Error
	return err
}

func (taNovelChapterService *TaNovelChapterService) UpdateTaNovelChapter(taNovelChapter system.TaNovelChapter) (err error) {
	err = global.GVA_DB.Save(&taNovelChapter).Error
	return err
}

func (taNovelChapterService *TaNovelChapterService) GetTaNovelChapter(id uint) (taNovelChapter system.TaNovelChapter, err error) {
	err = global.GVA_DB.Where("id = ?", id).First(&taNovelChapter).Error
	return
}

func (taNovelChapterService *TaNovelChapterService) GetTaNovelChapterInfoList(info request.TaNovelChapterSearch) (list []system.TaNovelChapter, total int64, err error) {
	limit := info.PageSize
	offset := info.PageSize * (info.Page - 1)
	db := global.GVA_DB.Model(&system.TaNovelChapter{})
	var taNovelChapters []system.TaNovelChapter

	if info.UserId != 0 {
		db = db.Where("user_id = ?", info.UserId)
	}
	if info.NovelId != 0 {
		db = db.Where("novel_id = ?", info.NovelId)
	}

	err = db.Count(&total).Error
	if err != nil {
		return
	}
    if limit == 999 {
        err = db.Order("sort_order ASC").Find(&taNovelChapters).Error
    }else{
        err = db.Limit(limit).Offset(offset).Order("sort_order ASC").Find(&taNovelChapters).Error
    }
	return taNovelChapters, total, err
}
