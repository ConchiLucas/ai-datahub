package system

import (
	"github.com/conchi/ai-note/server/global"
)

type TaCommandCategory struct {
	global.GVA_MODEL
	UserId uint   `json:"userId" gorm:"column:user_id;not null;default:1;index;comment:用户ID"`
	Name   string `json:"name" gorm:"column:name;type:varchar(50);not null;index;comment:分类名称"`
}

func (TaCommandCategory) TableName() string { return "ta_command_category" }

type TaCommand struct {
	global.GVA_MODEL
	UserId      uint   `json:"userId" gorm:"column:user_id;not null;default:1;index;comment:用户ID"`
	Category    string `json:"category" gorm:"column:category;type:varchar(50);index;comment:所属分类名称"`
	Title       string `json:"title" gorm:"column:title;type:varchar(255);not null;comment:命令名称"`
	Command     string `json:"command" gorm:"column:command;type:text;not null;comment:命令内容"`
	Description string `json:"description" gorm:"column:description;type:text;comment:备注说明"`
}

func (TaCommand) TableName() string { return "ta_command" }
