package system

import (
	"github.com/conchi/ai-note/server/global"
	"github.com/conchi/ai-note/server/model/system"
	"gorm.io/gorm"
)

type DeployService struct{}

// GetDeployTree 获取用户的所有部署项目（含文件和步骤）
func (s *DeployService) GetDeployTree(userId uint) ([]system.TaDeployProject, error) {
	var projects []system.TaDeployProject
	err := global.GVA_DB.Where("user_id = ?", userId).
		Preload("Files").
		Preload("Steps", func(db *gorm.DB) *gorm.DB {
			return db.Order("sort_order ASC")
		}).
		Order("updated_at DESC").
		Find(&projects).Error
	return projects, err
}

// ==== Project ====

func (s *DeployService) CreateProject(project *system.TaDeployProject) error {
	return global.GVA_DB.Create(project).Error
}

func (s *DeployService) UpdateProject(project system.TaDeployProject) error {
	return global.GVA_DB.Model(&system.TaDeployProject{}).
		Where("id = ? AND user_id = ?", project.ID, project.UserId).
		Updates(map[string]interface{}{
			"name":        project.Name,
			"description": project.Description,
			"platforms":   project.Platforms,
		}).Error
}

func (s *DeployService) DeleteProject(userId uint, id uint) error {
	return global.GVA_DB.Where("id = ? AND user_id = ?", id, userId).Delete(&system.TaDeployProject{}).Error
}

// ==== File ====

func (s *DeployService) CreateFile(file *system.TaDeployFile) error {
	return global.GVA_DB.Create(file).Error
}

func (s *DeployService) UpdateFile(file system.TaDeployFile) error {
	return global.GVA_DB.Model(&system.TaDeployFile{}).
		Where("id = ? AND user_id = ?", file.ID, file.UserId).
		Updates(map[string]interface{}{
			"name":       file.Name,
			"language":   file.Language,
			"content":    file.Content,
			"project_id": file.ProjectId,
		}).Error
}

func (s *DeployService) DeleteFile(userId uint, id uint) error {
	return global.GVA_DB.Where("id = ? AND user_id = ?", id, userId).Delete(&system.TaDeployFile{}).Error
}

// ==== Step ====

func (s *DeployService) CreateStep(step *system.TaDeployStep) error {
	return global.GVA_DB.Create(step).Error
}

func (s *DeployService) UpdateStep(step system.TaDeployStep) error {
	return global.GVA_DB.Model(&system.TaDeployStep{}).
		Where("id = ? AND user_id = ?", step.ID, step.UserId).
		Updates(map[string]interface{}{
			"sort_order":  step.SortOrder,
			"title":       step.Title,
			"description": step.Description,
			"commands":    step.Commands,
			"platform":    step.Platform,
		}).Error
}

func (s *DeployService) DeleteStep(userId uint, id uint) error {
	return global.GVA_DB.Where("id = ? AND user_id = ?", id, userId).Delete(&system.TaDeployStep{}).Error
}
