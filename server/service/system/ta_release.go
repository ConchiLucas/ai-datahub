package system

import (
	"github.com/conchi/ai-note/server/global"
	"github.com/conchi/ai-note/server/model/system"
)

type TaReleaseService struct{}

// CreateProject 创建发布项目
func (taReleaseService *TaReleaseService) CreateProject(project *system.TaReleaseProject) (err error) {
	err = global.GVA_DB.Create(project).Error
	return err
}

// DeleteProject 删除发布项目
func (taReleaseService *TaReleaseService) DeleteProject(project system.TaReleaseProject) (err error) {
	// GORM 约束设定了外键 cascade，因此直接删除 project 时也会级联删除相关的 address, file, command
	err = global.GVA_DB.Delete(&project).Error
	return err
}

// UpdateProject 更新发布项目
func (taReleaseService *TaReleaseService) UpdateProject(project system.TaReleaseProject) (err error) {
	err = global.GVA_DB.Model(&system.TaReleaseProject{}).Where("id = ? AND user_id = ?", project.ID, project.UserId).Updates(map[string]interface{}{
		"name":        project.Name,
		"description": project.Description,
	}).Error
	return err
}

// GetProjectList 获取发布项目列表
func (taReleaseService *TaReleaseService) GetProjectList(userId uint) (list []system.TaReleaseProject, err error) {
	err = global.GVA_DB.Where("user_id = ?", userId).Preload("Addresses").Preload("Files").Preload("Commands").Order("id desc").Find(&list).Error
	return
}

// CreateAddress 添加地址
func (taReleaseService *TaReleaseService) CreateAddress(address *system.TaReleaseAddress) (err error) {
	err = global.GVA_DB.Create(address).Error
	return err
}

// UpdateAddress 更新地址
func (taReleaseService *TaReleaseService) UpdateAddress(address system.TaReleaseAddress) (err error) {
	err = global.GVA_DB.Model(&system.TaReleaseAddress{}).Where("id = ? AND user_id = ?", address.ID, address.UserId).Updates(map[string]interface{}{
		"label": address.Label,
		"env":   address.Env,
		"url":   address.Url,
	}).Error
	return err
}

// DeleteAddress 删除地址
func (taReleaseService *TaReleaseService) DeleteAddress(address system.TaReleaseAddress) (err error) {
	err = global.GVA_DB.Delete(&address).Error
	return err
}

// CreateFile 添加文件
func (taReleaseService *TaReleaseService) CreateFile(file *system.TaReleaseFile) (err error) {
	err = global.GVA_DB.Create(file).Error
	return err
}

// UpdateFile 更新文件
func (taReleaseService *TaReleaseService) UpdateFile(file system.TaReleaseFile) (err error) {
	err = global.GVA_DB.Model(&system.TaReleaseFile{}).Where("id = ? AND user_id = ?", file.ID, file.UserId).Updates(map[string]interface{}{
		"name":        file.Name,
		"path":        file.Path,
		"description": file.Description,
	}).Error
	return err
}

// DeleteFile 删除文件
func (taReleaseService *TaReleaseService) DeleteFile(file system.TaReleaseFile) (err error) {
	err = global.GVA_DB.Delete(&file).Error
	return err
}

// CreateCommand 添加命令
func (taReleaseService *TaReleaseService) CreateCommand(command *system.TaReleaseCommand) (err error) {
	err = global.GVA_DB.Create(command).Error
	return err
}

// UpdateCommand 更新命令
func (taReleaseService *TaReleaseService) UpdateCommand(command system.TaReleaseCommand) (err error) {
	err = global.GVA_DB.Model(&system.TaReleaseCommand{}).Where("id = ? AND user_id = ?", command.ID, command.UserId).Updates(map[string]interface{}{
		"label":       command.Label,
		"command":     command.Command,
		"description": command.Description,
	}).Error
	return err
}

// DeleteCommand 删除命令
func (taReleaseService *TaReleaseService) DeleteCommand(command system.TaReleaseCommand) (err error) {
	err = global.GVA_DB.Delete(&command).Error
	return err
}
