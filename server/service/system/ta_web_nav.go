package system

import (
	"mime/multipart"
	"path/filepath"
	"strconv"
	"time"

	"github.com/conchi/ai-note/server/global"
	"github.com/conchi/ai-note/server/model/system"
	"github.com/conchi/ai-note/server/model/system/request"
	"github.com/conchi/ai-note/server/utils"
	"gorm.io/gorm"
)

type WebNavService struct{}

func (ws *WebNavService) AddCategory(userId uint, req request.AddWebNavCategoryReq) (system.TaWebNavCategory, error) {
	category := system.TaWebNavCategory{
		UserId: userId,
		Name:   req.Name,
	}
	err := global.GVA_DB.Create(&category).Error
	return category, err
}

func (ws *WebNavService) DeleteCategory(userId uint, req request.DeleteWebNavCategoryReq) error {
	// Start transaction
	return global.GVA_DB.Transaction(func(tx *gorm.DB) error {
		// Nullify sites under this category safely
		if err := tx.Model(&system.TaWebNavSite{}).
			Where("category_id = ? AND user_id = ?", req.ID, userId).
			Update("category_id", 0).Error; err != nil {
			return err
		}
		// Delete the category
		return tx.Where("id = ? AND user_id = ?", req.ID, userId).Delete(&system.TaWebNavCategory{}).Error
	})
}

func (ws *WebNavService) UpdateCategory(userId uint, req request.UpdateWebNavCategoryReq) error {
	return global.GVA_DB.Model(&system.TaWebNavCategory{}).
		Where("id = ? AND user_id = ?", req.ID, userId).
		Update("name", req.Name).Error
}

func (ws *WebNavService) UpdateSite(userId uint, req request.UpdateWebNavSiteReq) error {
	return global.GVA_DB.Model(&system.TaWebNavSite{}).
		Where("id = ? AND user_id = ?", req.ID, userId).
		Updates(map[string]interface{}{
			"category_id": req.CategoryId,
			"title":       req.Title,
			"desc":        req.Desc,
			"url":         req.Url,
			"icon_path":   req.IconPath,
			"accounts":    req.Accounts,
		}).Error
}

func (ws *WebNavService) AddSite(userId uint, req request.AddWebNavSiteReq) (system.TaWebNavSite, error) {
	site := system.TaWebNavSite{
		UserId:     userId,
		CategoryId: req.CategoryId,
		Title:      req.Title,
		Desc:       req.Desc,
		Url:        req.Url,
		IconPath:   req.IconPath,
		Accounts:   req.Accounts,
	}
	err := global.GVA_DB.Create(&site).Error
	return site, err
}

func (ws *WebNavService) DeleteSite(userId uint, req request.DeleteWebNavSiteReq) error {
	return global.GVA_DB.Where("id = ? AND user_id = ?", req.ID, userId).Delete(&system.TaWebNavSite{}).Error
}

func (ws *WebNavService) GetNavigationData(userId uint) (request.WebNavListResponse, error) {
	var resp request.WebNavListResponse

	// Initialize empty arrays
	resp.Categories = []system.TaWebNavCategory{}
	resp.Sites = []system.TaWebNavSite{}

	if err := global.GVA_DB.Where("user_id = ?", userId).Order("id asc").Find(&resp.Categories).Error; err != nil {
		return resp, err
	}

	if err := global.GVA_DB.Where("user_id = ?", userId).Order("id desc").Find(&resp.Sites).Error; err != nil {
		return resp, err
	}

	return resp, nil
}

func (s *WebNavService) UploadIcon(header *multipart.FileHeader) (string, error) {
	fileExt := filepath.Ext(header.Filename)
	baseNum := strconv.FormatInt(time.Now().UnixNano(), 10)
	minioName := baseNum + fileExt
	
	headerCopy := *header
	headerCopy.Filename = minioName

	url, err := utils.UploadToMinio(&headerCopy, "website_icon")
	if err != nil {
		return "", err
	}

	return url, nil
}
