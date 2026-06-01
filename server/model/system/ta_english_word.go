package system

import (
	"github.com/conchi/ai-note/server/global"
)

type TaEnglishWord struct {
	global.GVA_MODEL
	UserId            uint   `json:"userId" gorm:"column:user_id;index;comment:所属用户ID"`
	Word              string `json:"word" gorm:"column:word;type:varchar(100);not null;comment:单词"`
	Meaning           string `json:"meaning" gorm:"column:meaning;type:varchar(500);comment:释义"`
	Phrase            string `json:"phrase" gorm:"column:phrase;type:text;comment:例句"`
	PhraseTranslation string `json:"phraseTranslation" gorm:"column:phrase_translation;type:text;comment:例句翻译"`
	Link              string `json:"link" gorm:"column:link;type:varchar(500);comment:字典链接"`
	Date              string `json:"date" gorm:"column:date;type:varchar(50);index;comment:添加日期"`
	Mastery           int    `json:"mastery" gorm:"column:mastery;type:int;default:0;comment:掌握程度:0=生词,1=熟悉,2=掌握"`
}

func (TaEnglishWord) TableName() string {
	return "ta_english_word"
}
