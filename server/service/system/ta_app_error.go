package system

import (
	"errors"

	"github.com/conchi/ai-note/server/global"
	"github.com/conchi/ai-note/server/model/system"
	"github.com/conchi/ai-note/server/model/system/request"
)

type AppErrorService struct{}

var AppErrorServiceApp = new(AppErrorService)

func (s *AppErrorService) CreateError(userId uint, req request.TaCreateAppErrorReq) (*system.TaAppError, error) {
	appErrorRecord := &system.TaAppError{
		UserId:       userId,
		Title:        req.Title,
		ErrorMessage: req.ErrorMessage,
		Solution:     req.Solution,
		Status:       req.Status,
		Severity:     req.Severity,
		Tag:          req.Tag,
	}
	err := global.GVA_DB.Create(appErrorRecord).Error
	return appErrorRecord, err
}

func (s *AppErrorService) DeleteError(userId uint, id uint) error {
	var count int64
	global.GVA_DB.Model(&system.TaAppError{}).Where("id = ? AND user_id = ?", id, userId).Count(&count)
	if count == 0 {
		return errors.New("记录不存在或无权限删除")
	}
	err := global.GVA_DB.Where("id = ? AND user_id = ?", id, userId).Delete(&system.TaAppError{}).Error
	return err
}

func (s *AppErrorService) UpdateError(userId uint, req request.TaUpdateAppErrorReq) error {
	var count int64
	global.GVA_DB.Model(&system.TaAppError{}).Where("id = ? AND user_id = ?", req.ID, userId).Count(&count)
	if count == 0 {
		return errors.New("记录不存在或无权限更新")
	}

	updateData := map[string]interface{}{
		"title":         req.Title,
		"error_message": req.ErrorMessage,
		"solution":      req.Solution,
		"status":        req.Status,
		"severity":      req.Severity,
		"tag":           req.Tag,
	}

	err := global.GVA_DB.Model(&system.TaAppError{}).Where("id = ? AND user_id = ?", req.ID, userId).Updates(updateData).Error
	return err
}

func (s *AppErrorService) UpdateErrorStatus(userId uint, req request.TaUpdateErrorStatusReq) error {
	var count int64
	global.GVA_DB.Model(&system.TaAppError{}).Where("id = ? AND user_id = ?", req.ID, userId).Count(&count)
	if count == 0 {
		return errors.New("记录不存在或无权限更新")
	}

	err := global.GVA_DB.Model(&system.TaAppError{}).Where("id = ? AND user_id = ?", req.ID, userId).Update("status", req.Status).Error
	return err
}

func (s *AppErrorService) GetErrorList(userId uint, info request.TaSearchAppErrorParams) (list []request.TaAppErrorResponse, total int64, err error) {
	db := global.GVA_DB.Model(&system.TaAppError{}).Where("user_id = ?", userId)

	if info.Status != "" && info.Status != "all" {
		db = db.Where("status = ?", info.Status)
	}

	if info.SearchQuery != "" {
		// Fuzzy match
		q := "%" + info.SearchQuery + "%"
		db = db.Where("title LIKE ? OR error_message LIKE ? OR solution LIKE ? OR tag LIKE ?", q, q, q, q)
	}

	err = db.Count(&total).Error
	if err != nil {
		return
	}

	var errorsList []system.TaAppError
	if info.PageSize > 0 {
		offset := (info.Page - 1) * info.PageSize
		db = db.Offset(offset).Limit(info.PageSize)
	}

	err = db.Order("updated_at desc").Find(&errorsList).Error

	for _, e := range errorsList {
		// Time string matches backend logic
		updatedAtStr := e.UpdatedAt.Format("2006-01-02 15:04")
		list = append(list, request.TaAppErrorResponse{
			TaAppError:      e,
			UpdatedAtStr: updatedAtStr,
		})
	}
	return
}
