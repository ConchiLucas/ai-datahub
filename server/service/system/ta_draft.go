package system

import (
	"github.com/conchi/ai-note/server/global"
	"github.com/conchi/ai-note/server/model/system"
	"github.com/conchi/ai-note/server/model/system/request"
)

type TaDraftService struct{}

// CreateTaDraft 创建草稿记录
func (taDraftService *TaDraftService) CreateTaDraft(taDraft *system.TaDraft) (err error) {
	err = global.GVA_DB.Create(taDraft).Error
	return err
}

// DeleteTaDraft 删除草稿记录
func (taDraftService *TaDraftService) DeleteTaDraft(taDraft system.TaDraft) (err error) {
	err = global.GVA_DB.Where("id = ? AND user_id = ?", taDraft.ID, taDraft.UserId).Delete(&taDraft).Error
	return err
}

// DeleteTaDraftByIds 批量删除草稿记录
func (taDraftService *TaDraftService) DeleteTaDraftByIds(ids []int, userId uint) (err error) {
	err = global.GVA_DB.Where("id in ? AND user_id = ?", ids, userId).Delete(&system.TaDraft{}).Error
	return err
}

// UpdateTaDraft 更新草稿记录
func (taDraftService *TaDraftService) UpdateTaDraft(taDraft system.TaDraft) (err error) {
	err = global.GVA_DB.Where("id = ? AND user_id = ?", taDraft.ID, taDraft.UserId).
		Select("title", "content", "pinned", "starred", "color").
		Updates(&taDraft).Error
	return err
}

// GetTaDraft 根据id获取草稿记录
func (taDraftService *TaDraftService) GetTaDraft(id uint, userId uint) (taDraft system.TaDraft, err error) {
	err = global.GVA_DB.Where("id = ? AND user_id = ?", id, userId).First(&taDraft).Error
	return
}

// GetTaDraftInfoList 分页获取草稿记录
func (taDraftService *TaDraftService) GetTaDraftInfoList(info request.TaDraftSearch, userId uint) (list []system.TaDraft, total int64, err error) {
	limit := info.PageSize
	offset := info.PageSize * (info.Page - 1)
	
	db := global.GVA_DB.Model(&system.TaDraft{})
	var taDrafts []system.TaDraft

	db = db.Where("user_id = ?", userId)
	
	if info.Keyword != "" {
		db = db.Where("(title LIKE ? OR content LIKE ?)", "%"+info.Keyword+"%", "%"+info.Keyword+"%")
	}
	
	if info.Starred != nil {
		db = db.Where("starred = ?", *info.Starred)
	}

	err = db.Count(&total).Error
	if err != nil {
		return
	}
	
	err = db.Limit(limit).Offset(offset).Order("pinned desc, updated_at desc").Find(&taDrafts).Error
	return taDrafts, total, err
}
