package system

import "github.com/conchi/ai-note/server/global"

type TaReleaseProject struct {
	global.GVA_MODEL
	UserId      uint               `json:"userId" gorm:"column:user_id;not null;default:1;index;comment:用户ID"`
	Name        string             `json:"name" gorm:"column:name;type:varchar(255);not null;comment:发布项目名称"`
	Description string             `json:"description" gorm:"column:description;type:varchar(500);comment:说明"`
	Addresses   []TaReleaseAddress `json:"addresses" gorm:"foreignKey:ProjectId;constraint:OnUpdate:CASCADE,OnDelete:CASCADE;"`
	Files       []TaReleaseFile    `json:"files" gorm:"foreignKey:ProjectId;constraint:OnUpdate:CASCADE,OnDelete:CASCADE;"`
	Commands    []TaReleaseCommand `json:"commands" gorm:"foreignKey:ProjectId;constraint:OnUpdate:CASCADE,OnDelete:CASCADE;"`
}

func (TaReleaseProject) TableName() string { return "ta_release_project" }

type TaReleaseAddress struct {
	global.GVA_MODEL
	UserId    uint   `json:"userId" gorm:"column:user_id;not null;default:1;comment:用户ID"`
	ProjectId uint   `json:"projectId" gorm:"column:project_id;not null;index;comment:关联项目ID"`
	Label     string `json:"label" gorm:"column:label;type:varchar(255);comment:地址名称"`
	Env       string `json:"env" gorm:"column:env;type:varchar(50);default:'dev';comment:环境 dev/staging/production"`
	Url       string `json:"url" gorm:"column:url;type:varchar(500);comment:地址URL"`
}

func (TaReleaseAddress) TableName() string { return "ta_release_address" }

type TaReleaseFile struct {
	global.GVA_MODEL
	UserId      uint   `json:"userId" gorm:"column:user_id;not null;default:1;comment:用户ID"`
	ProjectId   uint   `json:"projectId" gorm:"column:project_id;not null;index;comment:关联项目ID"`
	Name        string `json:"name" gorm:"column:name;type:varchar(255);comment:文件名称"`
	Path        string `json:"path" gorm:"column:path;type:varchar(500);comment:文件路径"`
	Description string `json:"description" gorm:"column:description;type:varchar(500);comment:文件描述"`
}

func (TaReleaseFile) TableName() string { return "ta_release_file" }

type TaReleaseCommand struct {
	global.GVA_MODEL
	UserId      uint   `json:"userId" gorm:"column:user_id;not null;default:1;comment:用户ID"`
	ProjectId   uint   `json:"projectId" gorm:"column:project_id;not null;index;comment:关联项目ID"`
	Label       string `json:"label" gorm:"column:label;type:varchar(255);comment:命令名称"`
	Command     string `json:"command" gorm:"column:command;type:text;comment:执行命令"`
	Description string `json:"description" gorm:"column:description;type:varchar(500);comment:命令描述"`
}

func (TaReleaseCommand) TableName() string { return "ta_release_command" }
