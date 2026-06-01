package system

import "github.com/conchi/ai-note/server/global"

// TaDeployProject 部署项目
type TaDeployProject struct {
	global.GVA_MODEL
	UserId      uint             `json:"userId" gorm:"column:user_id;not null;index;comment:用户ID"`
	Name        string           `json:"name" gorm:"column:name;type:varchar(255);not null;comment:项目名称"`
	Description string           `json:"description" gorm:"column:description;type:varchar(500);comment:项目描述"`
	Platforms   string           `json:"platforms" gorm:"column:platforms;type:varchar(100);comment:适用平台(逗号分隔:windows,mac,linux)"`
	Files       []TaDeployFile   `json:"files" gorm:"foreignKey:ProjectId;constraint:OnUpdate:CASCADE,OnDelete:CASCADE;"`
	Steps       []TaDeployStep   `json:"steps" gorm:"foreignKey:ProjectId;constraint:OnUpdate:CASCADE,OnDelete:CASCADE;"`
}

func (TaDeployProject) TableName() string { return "ta_deploy_project" }

// TaDeployFile 部署文件
type TaDeployFile struct {
	global.GVA_MODEL
	UserId    uint   `json:"userId" gorm:"column:user_id;not null;comment:用户ID"`
	ProjectId uint   `json:"projectId" gorm:"column:project_id;not null;index;comment:归属项目ID"`
	Name      string `json:"name" gorm:"column:name;type:varchar(255);not null;comment:文件名"`
	Language  string `json:"language" gorm:"column:language;type:varchar(50);comment:语言类型"`
	Content   string `json:"content" gorm:"column:content;type:text;comment:文件内容"`
}

func (TaDeployFile) TableName() string { return "ta_deploy_file" }

// TaDeployStep 部署步骤
type TaDeployStep struct {
	global.GVA_MODEL
	UserId      uint   `json:"userId" gorm:"column:user_id;not null;comment:用户ID"`
	ProjectId   uint   `json:"projectId" gorm:"column:project_id;not null;index;comment:归属项目ID"`
	SortOrder   int    `json:"sortOrder" gorm:"column:sort_order;comment:排序顺序"`
	Title       string `json:"title" gorm:"column:title;type:varchar(255);comment:步骤标题"`
	Description string `json:"description" gorm:"column:description;type:varchar(500);comment:步骤说明"`
	Commands    string `json:"commands" gorm:"column:commands;type:text;comment:终端命令"`
	Platform    string `json:"platform" gorm:"column:platform;type:varchar(20);comment:平台限定(空=全平台)"`
}

func (TaDeployStep) TableName() string { return "ta_deploy_step" }
