package system

import "github.com/conchi/ai-note/server/global"

// TaBilling 记账流水模型
type TaBilling struct {
	global.GVA_MODEL
	UserId     uint    `json:"userId" gorm:"column:user_id;comment:归属用户ID"`
	Type       string  `json:"type" gorm:"column:type;comment:类型(income/expense)"`
	CategoryId string  `json:"categoryId" gorm:"column:category_id;comment:明细分类标识(与前端预设对应)"`
	Amount     float64 `json:"amount" gorm:"column:amount;comment:金额"`
	Date       string  `json:"date" gorm:"column:date;comment:记账日期格式化文本或者时间戳;type:varchar(64)"`
	Note       string  `json:"note" gorm:"column:note;comment:备注"`
}

// TableName 表名
func (TaBilling) TableName() string {
	return "ta_billing"
}
