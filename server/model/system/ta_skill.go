package system

import (
	"github.com/conchi/ai-note/server/global"
)

type TaSkill struct {
	global.GVA_MODEL
	UserId      uint   `json:"userId" gorm:"column:user_id;not null;default:1;index;comment:用户ID"`
	Title       string `json:"title" gorm:"column:title;type:varchar(255);not null;comment:标题"`
	Description string `json:"description" gorm:"column:description;type:text;comment:备注说明"`
	Code        string `json:"code" gorm:"column:code;type:text;not null;comment:代码内容"`
	Language    string `json:"language" gorm:"column:language;type:varchar(50);not null;index;comment:编程语言"`
	Service     string `json:"service" gorm:"column:service;type:varchar(100);index;comment:所属服务"`
	Starred     bool   `json:"starred" gorm:"column:starred;default:false;comment:是否收藏"`
}

func (TaSkill) TableName() string { return "ta_skill" }
