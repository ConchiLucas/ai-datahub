package system

import "github.com/conchi/ai-note/server/global"

// TaPlan 计划管理模型
type TaPlan struct {
	global.GVA_MODEL
	UserId      uint   `json:"userId" gorm:"column:user_id;comment:归属用户ID"`
	Title       string `json:"title" gorm:"column:title;comment:标题"`
	Description string `json:"description" gorm:"column:description;type:text;comment:详情描述"`
	Priority    string `json:"priority" gorm:"column:priority;comment:优先级(high/medium/low)"`
	Progress    int    `json:"progress" gorm:"column:progress;comment:完成进度百分比(0-100)"`
}

// TableName 表名
func (TaPlan) TableName() string {
	return "ta_plan"
}
