package system

import "github.com/conchi/ai-note/server/global"

// TaError 报错管理模型
type TaError struct {
	global.GVA_MODEL
	UserId        uint   `json:"userId" gorm:"column:user_id;comment:归属用户ID"`
	Title         string `json:"title" gorm:"column:title;comment:报错标题"`
	Project       string `json:"project" gorm:"column:project;comment:所属项目"`
	Scenario      string `json:"scenario" gorm:"column:scenario;type:text;comment:触发场景"`
	WrongOutput   string `json:"wrongOutput" gorm:"column:wrong_output;type:text;comment:AI报错信息"`
	CorrectAnswer string `json:"correctAnswer" gorm:"column:correct_answer;type:text;comment:正确做法"`
	Model         string `json:"model" gorm:"column:model;comment:AI模型"`
	Severity      string `json:"severity" gorm:"column:severity;comment:严重程度"`
}

// TableName 表名
func (TaError) TableName() string {
	return "ta_error"
}
