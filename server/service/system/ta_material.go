package system

import (
	"errors"

	"github.com/conchi/ai-note/server/global"
	"github.com/conchi/ai-note/server/model/system"
	"github.com/conchi/ai-note/server/model/system/request"
	"gorm.io/gorm"
)

type TaMaterialService struct{}

func (s *TaMaterialService) CreateMaterial(req *request.TaCreateMaterialReq, userId uint) (*system.TaMaterial, error) {
	if req.Tags == nil {
		req.Tags = system.MaterialTags{}
	}

	material := &system.TaMaterial{
		UserId:      userId,
		Title:       req.Title,
		Type:        req.Type,
		Content:     req.Content,
		Tags:        req.Tags,
		Description: req.Description,
	}

	err := global.GVA_DB.Create(material).Error
	return material, err
}

func (s *TaMaterialService) UpdateMaterial(req *request.TaUpdateMaterialReq, userId uint) (*system.TaMaterial, error) {
	var material system.TaMaterial
	if err := global.GVA_DB.Where("id = ? AND user_id = ?", req.ID, userId).First(&material).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, errors.New("记录不存在或无权限")
		}
		return nil, err
	}

	updateData := map[string]interface{}{}
	if req.Title != "" {
		updateData["title"] = req.Title
	}
	if req.Type != "" {
		updateData["type"] = req.Type
	}
	updateData["content"] = req.Content
	updateData["description"] = req.Description
	if req.Tags != nil {
		updateData["tags"] = req.Tags
	}

	err := global.GVA_DB.Model(&material).Updates(updateData).Error
	if err != nil {
		return nil, err
	}

	// Re-fetch to get updated data
	global.GVA_DB.Where("id = ?", req.ID).First(&material)
	return &material, nil
}

func (s *TaMaterialService) DeleteMaterial(id uint, userId uint) error {
	var material system.TaMaterial
	res := global.GVA_DB.Where("id = ? AND user_id = ?", id, userId).Delete(&material)
	if res.Error != nil {
		return res.Error
	}
	if res.RowsAffected == 0 {
		return errors.New("记录不存在或无权限删除")
	}
	return nil
}

func (s *TaMaterialService) GetMaterialList(info request.TaSearchMaterialParams, userId uint) (list interface{}, total int64, err error) {
	limit := info.PageSize
	offset := info.PageSize * (info.Page - 1)

	db := global.GVA_DB.Model(&system.TaMaterial{}).Where("user_id = ?", userId)

	if info.FilterType != "" && info.FilterType != "all" {
		db = db.Where("type = ?", info.FilterType)
	}

	if info.FilterTag != "" {
		// JSONB contains for PostgreSQL
		db = db.Where("tags @> ?", `["`+info.FilterTag+`"]`)
	}

	if info.SearchQuery != "" {
		query := "%" + info.SearchQuery + "%"
		db = db.Where("title LIKE ? OR description LIKE ? OR content LIKE ?", query, query, query)
	}

	err = db.Count(&total).Error
	if err != nil {
		return nil, 0, err
	}

	var records []system.TaMaterial
	err = db.Order("updated_at DESC").Limit(limit).Offset(offset).Find(&records).Error
	if err != nil {
		return nil, 0, err
	}

	var respList []request.TaMaterialResponse
	for _, v := range records {
		respList = append(respList, request.TaMaterialResponse{
			TaMaterial:   v,
			CreatedAtStr: v.CreatedAt.Format("2006-01-02 15:04"),
			UpdatedAtStr: v.UpdatedAt.Format("2006-01-02 15:04"),
		})
	}

	return respList, total, err
}
