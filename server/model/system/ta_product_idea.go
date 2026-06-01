package system

import (
	"database/sql/driver"
	"encoding/json"
	"errors"
	"github.com/conchi/ai-note/server/global"
)

type KeyPoint struct {
	Id   string `json:"id"`
	Text string `json:"text"`
	Done bool   `json:"done"`
}

type KeyPoints []KeyPoint

func (k *KeyPoints) Scan(val interface{}) error {
	b, ok := val.([]byte)
	if !ok {
		// PostgreSQL returns JSONB as string or byte slice depending on driver, ensure we handle string too
		s, okString := val.(string)
		if !okString {
			return errors.New("type assertion to []byte failed")
		}
		b = []byte(s)
	}
	return json.Unmarshal(b, &k)
}

func (k KeyPoints) Value() (driver.Value, error) {
	if k == nil {
		k = KeyPoints{}
	}
	return json.Marshal(k)
}

// TaProductIdea 产品思路模型
type TaProductIdea struct {
	global.GVA_MODEL
	UserId      uint      `json:"userId" gorm:"column:user_id;comment:归属用户ID"`
	Title       string    `json:"title" gorm:"column:title;comment:思路标题"`
	Product     string    `json:"product" gorm:"column:product;comment:所属产品"`
	Description string    `json:"description" gorm:"column:description;type:text;comment:核心描述"`
	KeyPoints   KeyPoints `json:"keyPoints" gorm:"column:key_points;type:jsonb;comment:要点列表"`
	Notes       string    `json:"notes" gorm:"column:notes;type:text;comment:补充备注"`
	Priority    string    `json:"priority" gorm:"column:priority;comment:优先级"`
}

// TableName 表名
func (TaProductIdea) TableName() string {
	return "ta_product_idea"
}
