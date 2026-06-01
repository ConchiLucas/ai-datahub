package system

import "github.com/conchi/ai-note/server/global"

type TaDockerOrg struct {
	global.GVA_MODEL
	UserId   uint              `json:"userId" gorm:"column:user_id;not null;default:1;index;comment:用户ID"`
	Name     string            `json:"name" gorm:"column:name;type:varchar(255);not null;comment:组织名称"`
	Projects []TaDockerProject `json:"projects" gorm:"foreignKey:OrgId;constraint:OnUpdate:CASCADE,OnDelete:CASCADE;"`
}

func (TaDockerOrg) TableName() string { return "ta_docker_org" }

type TaDockerProject struct {
	global.GVA_MODEL
	UserId uint           `json:"userId" gorm:"column:user_id;not null;default:1;comment:用户ID"`
	OrgId  uint           `json:"orgId" gorm:"column:org_id;not null;index;comment:归属组织ID"`
	Name   string         `json:"name" gorm:"column:name;type:varchar(255);not null;comment:项目名称"`
	Files  []TaDockerFile `json:"files" gorm:"foreignKey:ProjectId;constraint:OnUpdate:CASCADE,OnDelete:CASCADE;"`
}

func (TaDockerProject) TableName() string { return "ta_docker_project" }

type TaDockerFile struct {
	global.GVA_MODEL
	UserId      uint   `json:"userId" gorm:"column:user_id;not null;default:1;comment:用户ID"`
	ProjectId   uint   `json:"projectId" gorm:"column:project_id;not null;index;comment:归属项目ID"`
	Name        string `json:"name" gorm:"column:name;type:varchar(255);not null;comment:文件名"`
	Type        string `json:"type" gorm:"column:type;type:varchar(50);not null;comment:文件类型(dockerfile/compose)"`
	Content     string `json:"content" gorm:"column:content;type:text;not null;comment:文件内容"`
	Description string `json:"description" gorm:"column:description;type:varchar(500);comment:文件描述"`
}

func (TaDockerFile) TableName() string { return "ta_docker_file" }
