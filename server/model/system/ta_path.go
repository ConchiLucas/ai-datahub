package system

import (
	"github.com/conchi/ai-note/server/global"
)

type TaPathCategory struct {
	global.GVA_MODEL
	UserId uint   `json:"userId" gorm:"column:user_id;not null;default:1;index;comment:用户ID"`
	Name   string `json:"name" gorm:"column:name;type:varchar(50);not null;index;comment:分类名称"`
}

func (TaPathCategory) TableName() string { return "ta_path_category" }

type TaPath struct {
	global.GVA_MODEL
	UserId      uint   `json:"userId" gorm:"column:user_id;not null;default:1;index;comment:用户ID"`
	Category    string `json:"category" gorm:"column:category;type:varchar(50);index;comment:所属分类名称"`
	Title       string `json:"title" gorm:"column:title;type:varchar(255);not null;comment:路径名称"`
	Path        string `json:"path" gorm:"column:path;type:text;not null;comment:路径地址"`
	Description string `json:"description" gorm:"column:description;type:text;comment:备注说明"`
	Content     string `json:"content" gorm:"column:content;type:text;comment:配置内容"`
}

func (TaPath) TableName() string { return "ta_path" }
