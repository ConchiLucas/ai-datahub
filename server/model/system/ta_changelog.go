package system

import "github.com/conchi/ai-note/server/global"

// TaChangelogProject 日志项目模型
type TaChangelogProject struct {
	global.GVA_MODEL
	UserId      uint             `json:"userId" gorm:"column:user_id;comment:归属用户ID"`
	Name        string           `json:"name" gorm:"column:name;comment:项目名称"`
	Description string           `json:"description" gorm:"column:description;comment:项目描述"`
	Logs        []TaChangelogLog `json:"logs" gorm:"foreignKey:ProjectId;constraint:OnUpdate:CASCADE,OnDelete:CASCADE;"`
}

func (TaChangelogProject) TableName() string {
	return "ta_changelog_project"
}

// TaChangelogLog 日志条目模型
type TaChangelogLog struct {
	global.GVA_MODEL
	ProjectId   uint   `json:"projectId" gorm:"column:project_id;comment:归属项目ID;index"`
	Version     string `json:"version" gorm:"column:version;comment:版本号"`
	Description string `json:"description" gorm:"column:description;type:text;comment:变更描述"`
	ChangeType  string `json:"changeType" gorm:"column:change_type;comment:变更类型"`
	Date        string `json:"date" gorm:"column:date;comment:变更日期(YYYY-MM-DD)"`
	Details     string `json:"details" gorm:"column:details;type:text;comment:详细说明"`
}

func (TaChangelogLog) TableName() string {
	return "ta_changelog_log"
}
