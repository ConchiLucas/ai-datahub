package system

import (
	"github.com/conchi/ai-note/server/global"
)

type TaScript struct {
	global.GVA_MODEL
	UserId      uint     `json:"userId" gorm:"column:user_id;not null;default:1;index;comment:用户ID"`
	Title       string   `json:"title" gorm:"column:title;type:varchar(255);not null;comment:脚本标题"`
	Description string   `json:"description" gorm:"column:description;type:text;comment:脚本描述"`
	Language    string   `json:"language" gorm:"column:language;type:varchar(50);not null;comment:编程语言"`
	Code        string   `json:"code" gorm:"column:code;type:text;not null;comment:代码内容"`
	Tags        []string `json:"tags" gorm:"column:tags;type:text;serializer:json;comment:标签列表"`
}

func (TaScript) TableName() string { return "ta_script" }
