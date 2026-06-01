package system

import (
	"errors"

	"github.com/conchi/ai-note/server/global"
	"github.com/conchi/ai-note/server/model/system"
	"github.com/conchi/ai-note/server/model/system/request"
	"gorm.io/gorm"
)

type TaProductIdeaService struct{}

func (s *TaProductIdeaService) CreateProductIdea(req *request.TaCreateProductIdeaReq, userId uint) (*system.TaProductIdea, error) {
	if req.KeyPoints == nil {
		req.KeyPoints = system.KeyPoints{}
	}
	
	idea := &system.TaProductIdea{
		UserId:      userId,
		Title:       req.Title,
		Product:     req.Product,
		Description: req.Description,
		KeyPoints:   req.KeyPoints,
		Notes:       req.Notes,
		Priority:    req.Priority,
	}

	err := global.GVA_DB.Create(idea).Error
	return idea, err
}

func (s *TaProductIdeaService) UpdateProductIdea(req *request.TaUpdateProductIdeaReq, userId uint) (*system.TaProductIdea, error) {
	var idea system.TaProductIdea
	if err := global.GVA_DB.Where("id = ? AND user_id = ?", req.ID, userId).First(&idea).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, errors.New("记录不存在或无权限")
		}
		return nil, err
	}

	updateData := map[string]interface{}{}
	if req.Title != "" {
		updateData["title"] = req.Title
	}
	if req.Priority != "" {
		updateData["priority"] = req.Priority
	}
	// Let frontend update product to empty if they want? We'll just update it anyway
	updateData["product"] = req.Product
	updateData["description"] = req.Description
	updateData["notes"] = req.Notes
	if req.KeyPoints != nil {
		updateData["key_points"] = req.KeyPoints
	}

	err := global.GVA_DB.Model(&idea).Updates(updateData).Error
	return &idea, err
}

func (s *TaProductIdeaService) DeleteProductIdea(id uint, userId uint) error {
	var idea system.TaProductIdea
	res := global.GVA_DB.Where("id = ? AND user_id = ?", id, userId).Delete(&idea)
	if res.Error != nil {
		return res.Error
	}
	if res.RowsAffected == 0 {
		return errors.New("记录不存在或无权限删除")
	}
	return nil
}

func (s *TaProductIdeaService) GetProductIdeaList(info request.TaSearchProductIdeaParams, userId uint) (list interface{}, total int64, err error) {
	limit := info.PageSize
	offset := info.PageSize * (info.Page - 1)
	
	db := global.GVA_DB.Model(&system.TaProductIdea{}).Where("user_id = ?", userId)
	
	if info.FilterPriority != "" && info.FilterPriority != "all" {
		db = db.Where("priority = ?", info.FilterPriority)
	}
	
	if info.FilterProduct != "" && info.FilterProduct != "all" {
		db = db.Where("product = ?", info.FilterProduct)
	}

	if info.SearchQuery != "" {
		query := "%" + info.SearchQuery + "%"
		db = db.Where("title LIKE ? OR description LIKE ? OR notes LIKE ?", query, query, query)
	}

	err = db.Count(&total).Error
	if err != nil {
		return nil, 0, err
	}

	var records []system.TaProductIdea
	err = db.Order("updated_at DESC").Limit(limit).Offset(offset).Find(&records).Error
	if err != nil {
		return nil, 0, err
	}

	var respList []request.TaProductIdeaResponse
	for _, v := range records {
		respList = append(respList, request.TaProductIdeaResponse{
			TaProductIdea: v,
			CreatedAtStr:  v.CreatedAt.Format("2006-01-02 15:04"),
			UpdatedAtStr:  v.UpdatedAt.Format("2006-01-02 15:04"),
		})
	}

	return respList, total, err
}
