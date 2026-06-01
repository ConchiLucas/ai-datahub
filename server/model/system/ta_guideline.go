package system

import (
	"github.com/conchi/ai-note/server/global"
)

type TaGuideline struct {
	global.GVA_MODEL
	UserId  uint   `json:"userId" gorm:"index;comment:所属用户"`
	Title   string `json:"title" gorm:"type:varchar(255);comment:规范标题"`
	Tag     string `json:"tag" gorm:"type:varchar(100);comment:分类标签"`
	Content string `json:"content" gorm:"type:text;comment:规范Markdown内容"`
}

func (TaGuideline) TableName() string {
	return "ta_guidelines"
}
