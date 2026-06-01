package system

import "github.com/conchi/ai-note/server/global"

// TaHost 主机模型
type TaHost struct {
	global.GVA_MODEL
	UserId      uint   `json:"userId" gorm:"column:user_id;index;comment:用户ID"`
	Name        string `json:"name" gorm:"column:name;comment:主机名"`
	Type        string `json:"type" gorm:"column:type;comment:主机类型 server/pc/other"`
	Description string `json:"description" gorm:"column:description;comment:描述"`
}

// TableName 表名
func (TaHost) TableName() string {
	return "ta_host"
}
