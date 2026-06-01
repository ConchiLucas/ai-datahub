package system

import (
	"github.com/conchi/ai-note/server/global"
)

type TaTag struct {
	global.GVA_MODEL
	UserId    uint   `json:"userId" gorm:"column:user_id;not null;index;comment:用户ID"`
	Name      string `json:"name" gorm:"column:name;type:varchar(50);not null;index;comment:标签名称"`
	Color     string `json:"color" gorm:"column:color;type:varchar(7);not null;default:'#6366F1';comment:标签颜色（HEX格式）"`
	NoteCount int    `json:"noteCount" gorm:"column:note_count;type:int;not null;default:0;index;comment:关联笔记数量"`
}

func (TaTag) TableName() string {
	return "ta_tag"
}
