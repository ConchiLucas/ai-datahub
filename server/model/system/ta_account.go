package system

import "github.com/conchi/ai-note/server/global"

// TaAccount 账号模型
type TaAccount struct {
	global.GVA_MODEL
	UserId      uint   `json:"userId" gorm:"column:user_id;comment:用户ID"`
	Account     string `json:"account" gorm:"column:account;comment:账号"`
	Password    string `json:"password" gorm:"column:password;comment:密码"`
	Website     string `json:"website" gorm:"column:website;comment:网页地址"`
	Description string `json:"description" gorm:"column:description;comment:描述"`
}

// TableName 表名
func (TaAccount) TableName() string {
	return "ta_account"
}
