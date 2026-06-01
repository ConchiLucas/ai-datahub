package system

import (
	"github.com/conchi/ai-note/server/global"
)

type TaMarkdownSnippet struct {
	global.GVA_MODEL
	UserId  uint   `json:"userId" gorm:"column:user_id;not null;default:1;index;comment:用户ID"`
	Title   string `json:"title" gorm:"column:title;type:varchar(255);not null;comment:文档标题"`
	Content string `json:"content" gorm:"column:content;type:text;not null;comment:Markdown内容"`
}

func (TaMarkdownSnippet) TableName() string { return "ta_markdown_snippet" }
