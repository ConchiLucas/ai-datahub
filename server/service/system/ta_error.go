package system

import (
	"errors"

	"github.com/conchi/ai-note/server/global"
	"github.com/conchi/ai-note/server/model/system"
	"github.com/conchi/ai-note/server/model/system/request"
)

type ErrorService struct{}

var ErrorServiceApp = new(ErrorService)

func (s *ErrorService) CreateError(userId uint, req request.TaCreateErrorReq) (*system.TaError, error) {
	errorRecord := &system.TaError{
		UserId:        userId,
		Title:         req.Title,
		Project:       req.Project,
		Scenario:      req.Scenario,
		WrongOutput:   req.WrongOutput,
		CorrectAnswer: req.CorrectAnswer,
		Model:         req.Model,
		Severity:      req.Severity,
	}
	err := global.GVA_DB.Create(errorRecord).Error
	return errorRecord, err
}

func (s *ErrorService) DeleteError(userId uint, id uint) error {
	var count int64
	global.GVA_DB.Model(&system.TaError{}).Where("id = ? AND user_id = ?", id, userId).Count(&count)
	if count == 0 {
		return errors.New("记录不存在或无权限删除")
	}
	err := global.GVA_DB.Where("id = ? AND user_id = ?", id, userId).Delete(&system.TaError{}).Error
	return err
}

func (s *ErrorService) UpdateError(userId uint, req request.TaUpdateErrorReq) error {
	var count int64
	global.GVA_DB.Model(&system.TaError{}).Where("id = ? AND user_id = ?", req.ID, userId).Count(&count)
	if count == 0 {
		return errors.New("记录不存在或无权限更新")
	}

	updateData := map[string]interface{}{
		"title":          req.Title,
		"project":        req.Project,
		"scenario":       req.Scenario,
		"wrong_output":   req.WrongOutput,
		"correct_answer": req.CorrectAnswer,
		"model":          req.Model,
		"severity":       req.Severity,
	}

	err := global.GVA_DB.Model(&system.TaError{}).Where("id = ? AND user_id = ?", req.ID, userId).Updates(updateData).Error
	return err
}



func (s *ErrorService) GetErrorList(userId uint, info request.TaSearchErrorParams) (list []request.TaErrorResponse, total int64, err error) {
	db := global.GVA_DB.Model(&system.TaError{}).Where("user_id = ?", userId)

	if info.FilterProject != "" && info.FilterProject != "all" {
		db = db.Where("project = ?", info.FilterProject)
	}
	if info.FilterSeverity != "" && info.FilterSeverity != "all" {
		db = db.Where("severity = ?", info.FilterSeverity)
	}
	if info.FilterModel != "" && info.FilterModel != "all" {
		db = db.Where("model = ?", info.FilterModel)
	}

	if info.SearchQuery != "" {
		// Fuzzy match
		q := "%" + info.SearchQuery + "%"
		db = db.Where("title LIKE ? OR scenario LIKE ? OR wrong_output LIKE ? OR correct_answer LIKE ?", q, q, q, q)
	}

	err = db.Count(&total).Error
	if err != nil {
		return
	}

	var errorsList []system.TaError
	if info.PageSize > 0 {
		offset := (info.Page - 1) * info.PageSize
		db = db.Offset(offset).Limit(info.PageSize)
	}

	err = db.Order("updated_at desc").Find(&errorsList).Error

	for _, e := range errorsList {
		createdAtStr := e.CreatedAt.Format("2006-01-02 15:04")
		updatedAtStr := e.UpdatedAt.Format("2006-01-02 15:04")
		list = append(list, request.TaErrorResponse{
			TaError:      e,
			CreatedAtStr: createdAtStr,
			UpdatedAtStr: updatedAtStr,
		})
	}
	return
}
