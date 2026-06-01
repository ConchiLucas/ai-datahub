package system

import (
	"github.com/conchi/ai-note/server/global"
)

type TaScreenshot struct {
	global.GVA_MODEL
	UserId      uint   `json:"userId" gorm:"index;comment:所属用户"`
	Url         string `json:"url" gorm:"type:varchar(500);comment:MinIO图片地址"`
	Description string `json:"description" gorm:"type:text;comment:截图说明"`
	Tag         string `json:"tag" gorm:"type:varchar(100);comment:分类标签"`
}

func (TaScreenshot) TableName() string {
	return "ta_screenshots"
}
