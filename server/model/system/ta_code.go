package system

import (
	"github.com/conchi/ai-note/server/global"
)

type TaCodeSnippet struct {
	global.GVA_MODEL
	UserId      uint   `json:"userId" gorm:"column:user_id;not null;default:1;index;comment:用户ID"`
	Feature     string `json:"feature" gorm:"column:feature;type:varchar(100);not null;index;comment:所属功能名称"`
	Language    string `json:"language" gorm:"column:language;type:varchar(50);not null;comment:编程语言"`
	Title       string `json:"title" gorm:"column:title;type:varchar(255);not null;comment:文件名称/标题"`
	Description string `json:"description" gorm:"column:description;type:text;comment:备注说明"`
	Code        string `json:"code" gorm:"column:code;type:text;not null;comment:代码内容"`
}

func (TaCodeSnippet) TableName() string { return "ta_code_snippet" }
