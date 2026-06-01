package system

import (
	"github.com/conchi/ai-note/server/global"
	"github.com/conchi/ai-note/server/model/system"
)

type TaProgressService struct{}

func (s *TaProgressService) CreateProject(project system.TaProgressProject) (system.TaProgressProject, error) {
	err := global.GVA_DB.Create(&project).Error
	return project, err
}

func (s *TaProgressService) DeleteProject(id uint, userId uint) error {
	return global.GVA_DB.Where("id = ? AND user_id = ?", id, userId).Delete(&system.TaProgressProject{}).Error
}

func (s *TaProgressService) UpdateProject(project system.TaProgressProject) error {
	return global.GVA_DB.Model(&system.TaProgressProject{}).
		Where("id = ? AND user_id = ?", project.ID, project.UserId).
		Updates(map[string]interface{}{
			"name":        project.Name,
			"description": project.Description,
			"sort":        project.Sort,
		}).Error
}

func (s *TaProgressService) GetProjectList(userId uint) ([]system.TaProgressProject, error) {
	var projects []system.TaProgressProject
	err := global.GVA_DB.Where("user_id = ?", userId).
		Preload("Features", "parent_id = 0").
		Order("sort asc, updated_at desc").
		Find(&projects).Error
	if err != nil {
		return projects, err
	}

	// Manually load children for each top-level feature
	for i := range projects {
		for j := range projects[i].Features {
			var children []system.TaProgressFeature
			global.GVA_DB.Where("parent_id = ?", projects[i].Features[j].ID).Find(&children)
			projects[i].Features[j].Children = children
		}
	}

	return projects, nil
}

func (s *TaProgressService) CreateFeature(feature system.TaProgressFeature) (system.TaProgressFeature, error) {
	err := global.GVA_DB.Create(&feature).Error
	return feature, err
}

func (s *TaProgressService) DeleteFeature(id uint, userId uint) error {
	// Delete children first, then the feature itself
	global.GVA_DB.Where("parent_id = ? AND user_id = ?", id, userId).Delete(&system.TaProgressFeature{})
	return global.GVA_DB.Where("id = ? AND user_id = ?", id, userId).Delete(&system.TaProgressFeature{}).Error
}

func (s *TaProgressService) UpdateFeature(feature system.TaProgressFeature) error {
	return global.GVA_DB.Model(&system.TaProgressFeature{}).
		Where("id = ? AND user_id = ?", feature.ID, feature.UserId).
		Updates(map[string]interface{}{
			"name":        feature.Name,
			"status":      feature.Status,
			"progress":    feature.Progress,
			"priority":    feature.Priority,
			"description": feature.Description,
			"parent_id":   feature.ParentId,
			"sort":        feature.Sort,
		}).Error
}
