package system

import "github.com/conchi/ai-note/server/global"

// TaAppAppError 报错管理模型
type TaAppError struct {
	global.GVA_MODEL
	UserId       uint   `json:"userId" gorm:"column:user_id;comment:归属用户ID"`
	Title        string `json:"title" gorm:"column:title;comment:报错标题"`
	ErrorMessage string `json:"errorMessage" gorm:"column:error_message;type:text;comment:错误信息"`
	Solution     string `json:"solution" gorm:"column:solution;type:text;comment:解决方案"`
	Status       string `json:"status" gorm:"column:status;comment:状态(unsolved/solved)"`
	Severity     string `json:"severity" gorm:"column:severity;comment:严重程度(critical/normal/minor)"`
	Tag          string `json:"tag" gorm:"column:tag;comment:标签"`
}

// TableName 表名
func (TaAppError) TableName() string {
	return "ta_app_error"
}
