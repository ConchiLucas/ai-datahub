package system

import (
	"github.com/conchi/ai-note/server/global"
	"github.com/conchi/ai-note/server/model/system"
)

type DockerService struct{}

// GetDockerTree 获取所有的 Org, Project, File
func (s *DockerService) GetDockerTree(userId uint) ([]system.TaDockerOrg, error) {
	var orgs []system.TaDockerOrg
	err := global.GVA_DB.Where("user_id = ?", userId).
		Preload("Projects.Files").
		Preload("Projects").
		Find(&orgs).Error
	return orgs, err
}

// ==== Org ====

func (s *DockerService) CreateOrg(org system.TaDockerOrg) (system.TaDockerOrg, error) {
	err := global.GVA_DB.Create(&org).Error
	return org, err
}

func (s *DockerService) UpdateOrg(org system.TaDockerOrg) error {
	return global.GVA_DB.Model(&system.TaDockerOrg{}).Where("id = ? AND user_id = ?", org.ID, org.UserId).Updates(map[string]interface{}{
		"name": org.Name,
	}).Error
}

func (s *DockerService) DeleteOrg(userId uint, id uint) error {
	return global.GVA_DB.Where("id = ? AND user_id = ?", id, userId).Delete(&system.TaDockerOrg{}).Error
}

// ==== Project ====

func (s *DockerService) CreateProject(project system.TaDockerProject) (system.TaDockerProject, error) {
	err := global.GVA_DB.Create(&project).Error
	return project, err
}

func (s *DockerService) UpdateProject(project system.TaDockerProject) error {
	return global.GVA_DB.Model(&system.TaDockerProject{}).Where("id = ? AND user_id = ?", project.ID, project.UserId).Updates(map[string]interface{}{
		"name":   project.Name,
		"org_id": project.OrgId,
	}).Error
}

func (s *DockerService) DeleteProject(userId uint, id uint) error {
	return global.GVA_DB.Where("id = ? AND user_id = ?", id, userId).Delete(&system.TaDockerProject{}).Error
}

// ==== File ====

func (s *DockerService) CreateFile(file system.TaDockerFile) (system.TaDockerFile, error) {
	err := global.GVA_DB.Create(&file).Error
	return file, err
}

func (s *DockerService) UpdateFile(file system.TaDockerFile) error {
	return global.GVA_DB.Model(&system.TaDockerFile{}).Where("id = ? AND user_id = ?", file.ID, file.UserId).Updates(map[string]interface{}{
		"name":        file.Name,
		"type":        file.Type,
		"content":     file.Content,
		"description": file.Description,
		"project_id":  file.ProjectId,
	}).Error
}

func (s *DockerService) DeleteFile(userId uint, id uint) error {
	return global.GVA_DB.Where("id = ? AND user_id = ?", id, userId).Delete(&system.TaDockerFile{}).Error
}
