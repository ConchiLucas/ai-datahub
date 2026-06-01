package system

import (
	"github.com/conchi/ai-note/server/global"
	"github.com/conchi/ai-note/server/model/system"
	systemReq "github.com/conchi/ai-note/server/model/system/request"
)

type TaSkillService struct{}

func (taSkillService *TaSkillService) CreateTaSkill(req systemReq.CreateSkillReq, userId uint) (err error) {
	skill := system.TaSkill{
		UserId:      userId,
		Title:       req.Title,
		Description: req.Description,
		Code:        req.Code,
		Language:    req.Language,
		Service:     req.Service,
	}
	err = global.GVA_DB.Create(&skill).Error
	return err
}

func (taSkillService *TaSkillService) UpdateTaSkill(req systemReq.UpdateSkillReq, userId uint) (err error) {
	var skill system.TaSkill
	if err = global.GVA_DB.Where("id = ? AND user_id = ?", req.ID, userId).First(&skill).Error; err != nil {
		return err
	}
	
	err = global.GVA_DB.Model(&skill).Updates(map[string]interface{}{
		"title":       req.Title,
		"description": req.Description,
		"code":        req.Code,
		"language":    req.Language,
		"service":     req.Service,
	}).Error
	return err
}

func (taSkillService *TaSkillService) DeleteTaSkill(id uint, userId uint) (err error) {
	err = global.GVA_DB.Where("id = ? AND user_id = ?", id, userId).Delete(&system.TaSkill{}).Error
	return err
}

func (taSkillService *TaSkillService) DeleteTaSkillByIds(ids []uint, userId uint) (err error) {
	err = global.GVA_DB.Where("id in ? AND user_id = ?", ids, userId).Delete(&system.TaSkill{}).Error
	return err
}

func (taSkillService *TaSkillService) ToggleSkillStar(id uint, userId uint, starred bool) (err error) {
	var skill system.TaSkill
	if err = global.GVA_DB.Where("id = ? AND user_id = ?", id, userId).First(&skill).Error; err != nil {
		return err
	}
	err = global.GVA_DB.Model(&skill).Update("starred", starred).Error
	return err
}

func (taSkillService *TaSkillService) GetTaSkillList(info systemReq.SearchSkillParams, userId uint) (list []system.TaSkill, total int64, err error) {
	limit := info.PageSize
	offset := info.PageSize * (info.Page - 1)
	
	db := global.GVA_DB.Model(&system.TaSkill{}).Where("user_id = ?", userId)
	
	if info.Keyword != "" {
		db = db.Where("(title LIKE ? OR description LIKE ?)", "%"+info.Keyword+"%", "%"+info.Keyword+"%")
	}
	
	if info.Service != "" {
		db = db.Where("service = ?", info.Service)
	}
	
	if info.Language != "" && info.Language != "all" {
		db = db.Where("language = ?", info.Language)
	}
	
	err = db.Count(&total).Error
	if err != nil {
		return
	}
	
	err = db.Order("updated_at desc").Limit(limit).Offset(offset).Find(&list).Error
	return list, total, err
}
