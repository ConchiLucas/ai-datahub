package system

import (
	"github.com/conchi/ai-note/server/global"
)

type TaPromptCategory struct {
	global.GVA_MODEL
	UserId uint   `json:"userId" gorm:"column:user_id;not null;default:1;index;comment:用户ID"`
	Name   string `json:"name" gorm:"column:name;type:varchar(50);not null;index;comment:分类名称"`
}

func (TaPromptCategory) TableName() string { return "ta_prompt_category" }

type TaPrompt struct {
	global.GVA_MODEL
	UserId   uint   `json:"userId" gorm:"column:user_id;not null;default:1;index;comment:用户ID"`
	Category string `json:"category" gorm:"column:category;type:varchar(50);index;comment:所属分类名称"`
	Title    string `json:"title" gorm:"column:title;type:varchar(255);not null;comment:提示词名称"`
	Content  string `json:"content" gorm:"column:content;type:text;not null;comment:提示词内容"`
}

func (TaPrompt) TableName() string { return "ta_prompt" }
