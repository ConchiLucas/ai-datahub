package system

import (
	"github.com/conchi/ai-note/server/global"
)

type TaJsonSnippet struct {
	global.GVA_MODEL
	UserId  uint   `json:"userId" gorm:"column:user_id;not null;default:1;index;comment:用户ID"`
	Title   string `json:"title" gorm:"column:title;type:varchar(255);not null;comment:片段名称"`
	Content string `json:"content" gorm:"column:content;type:text;not null;comment:JSON内容"`
}

func (TaJsonSnippet) TableName() string { return "ta_json_snippet" }
