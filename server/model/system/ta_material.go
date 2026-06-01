package system

import (
	"database/sql/driver"
	"encoding/json"
	"errors"
	"github.com/conchi/ai-note/server/global"
)

// MaterialTags JSONB类型 - 存储标签数组
type MaterialTags []string

func (t *MaterialTags) Scan(val interface{}) error {
	b, ok := val.([]byte)
	if !ok {
		s, okStr := val.(string)
		if !okStr {
			return errors.New("type assertion to []byte failed")
		}
		b = []byte(s)
	}
	return json.Unmarshal(b, &t)
}

func (t MaterialTags) Value() (driver.Value, error) {
	if t == nil {
		t = MaterialTags{}
	}
	return json.Marshal(t)
}

// TaMaterial 素材管理模型
type TaMaterial struct {
	global.GVA_MODEL
	UserId      uint         `json:"userId" gorm:"column:user_id;comment:归属用户ID"`
	Title       string       `json:"title" gorm:"column:title;comment:素材标题"`
	Type        string       `json:"type" gorm:"column:type;comment:素材类型(image/prompt/video/copywriting)"`
	Content     string       `json:"content" gorm:"column:content;type:text;comment:素材内容/链接"`
	Tags        MaterialTags `json:"tags" gorm:"column:tags;type:jsonb;comment:标签列表"`
	Description string       `json:"description" gorm:"column:description;type:text;comment:素材描述"`
}

// TableName 表名
func (TaMaterial) TableName() string {
	return "ta_material"
}
