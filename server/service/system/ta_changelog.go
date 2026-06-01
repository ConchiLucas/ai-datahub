package system

import (
	"errors"

	"github.com/conchi/ai-note/server/global"
	"github.com/conchi/ai-note/server/model/system"
	"github.com/conchi/ai-note/server/model/system/request"
	"gorm.io/gorm"
)

type ChangelogService struct{}

var ChangelogServiceApp = new(ChangelogService)

// --- Project ---

func (s *ChangelogService) CreateProject(userId uint, req request.TaChangelogProjectReq) (*system.TaChangelogProject, error) {
	project := &system.TaChangelogProject{
		UserId:      userId,
		Name:        req.Name,
		Description: req.Description,
	}
	err := global.GVA_DB.Create(project).Error
	return project, err
}

func (s *ChangelogService) UpdateProject(userId uint, req request.TaChangelogProjectReq) error {
	var count int64
	global.GVA_DB.Model(&system.TaChangelogProject{}).Where("id = ? AND user_id = ?", req.ID, userId).Count(&count)
	if count == 0 {
		return errors.New("记录不存在或无权限更新")
	}

	err := global.GVA_DB.Model(&system.TaChangelogProject{}).Where("id = ? AND user_id = ?", req.ID, userId).Updates(map[string]interface{}{
		"name":        req.Name,
		"description": req.Description,
	}).Error
	return err
}

func (s *ChangelogService) DeleteProject(userId uint, id uint) error {
	var count int64
	global.GVA_DB.Model(&system.TaChangelogProject{}).Where("id = ? AND user_id = ?", id, userId).Count(&count)
	if count == 0 {
		return errors.New("记录不存在或无权限删除")
	}
	// GORM will cascade delete TaChangelogLog due to foreignKey constraints
	err := global.GVA_DB.Where("id = ? AND user_id = ?", id, userId).Delete(&system.TaChangelogProject{}).Error
	return err
}

// --- Log ---

func (s *ChangelogService) CreateLog(userId uint, req request.TaChangelogLogReq) (*system.TaChangelogLog, error) {
	var count int64
	global.GVA_DB.Model(&system.TaChangelogProject{}).Where("id = ? AND user_id = ?", req.ProjectId, userId).Count(&count)
	if count == 0 {
		return nil, errors.New("所属项目不存在或无权限")
	}

	logEntry := &system.TaChangelogLog{
		ProjectId:   req.ProjectId,
		Version:     req.Version,
		Description: req.Description,
		ChangeType:  req.ChangeType,
		Date:        req.Date,
		Details:     req.Details,
	}
	err := global.GVA_DB.Create(logEntry).Error
	return logEntry, err
}

func (s *ChangelogService) UpdateLog(userId uint, req request.TaChangelogLogReq) error {
	// Verify ownership by checking the parent project
	var logEntry system.TaChangelogLog
	if err := global.GVA_DB.First(&logEntry, req.ID).Error; err != nil {
		return errors.New("日志记录不存在")
	}

	var count int64
	global.GVA_DB.Model(&system.TaChangelogProject{}).Where("id = ? AND user_id = ?", logEntry.ProjectId, userId).Count(&count)
	if count == 0 {
		return errors.New("无权限修改该日志记录")
	}

	err := global.GVA_DB.Model(&system.TaChangelogLog{}).Where("id = ?", req.ID).Updates(map[string]interface{}{
		"version":     req.Version,
		"description": req.Description,
		"change_type": req.ChangeType,
		"date":        req.Date,
		"details":     req.Details,
	}).Error
	return err
}

func (s *ChangelogService) DeleteLog(userId uint, id uint) error {
	var logEntry system.TaChangelogLog
	if err := global.GVA_DB.First(&logEntry, id).Error; err != nil {
		return errors.New("日志记录不存在")
	}

	var count int64
	global.GVA_DB.Model(&system.TaChangelogProject{}).Where("id = ? AND user_id = ?", logEntry.ProjectId, userId).Count(&count)
	if count == 0 {
		return errors.New("无权限删除该日志记录")
	}

	err := global.GVA_DB.Delete(&system.TaChangelogLog{}, id).Error
	return err
}

// --- Query ---

func (s *ChangelogService) GetProjectWithLogsList(userId uint, info request.TaSearchChangelogParams) (list []request.TaChangelogProjectResponse, total int64, err error) {
	db := global.GVA_DB.Model(&system.TaChangelogProject{}).Where("user_id = ?", userId)
	
	err = db.Count(&total).Error
	if err != nil {
		return
	}

	var projects []system.TaChangelogProject
	// Preload logs ordered by date desc
	err = db.Preload("Logs", func(db *gorm.DB) *gorm.DB {
		return db.Order("date DESC, created_at DESC")
	}).Order("created_at desc").Find(&projects).Error

	for _, p := range projects {
		list = append(list, request.TaChangelogProjectResponse{
			TaChangelogProject: p,
			CreatedAtStr:       p.CreatedAt.Format("2006-01-02"),
		})
	}
	return
}
