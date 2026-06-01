package system

import (
	"github.com/conchi/ai-note/server/global"
	"github.com/conchi/ai-note/server/model/system"
)

type EnglishWordService struct{}

func (s *EnglishWordService) CreateWord(word *system.TaEnglishWord) error {
	return global.GVA_DB.Create(word).Error
}

func (s *EnglishWordService) DeleteWord(ids []int, userId uint) error {
	if len(ids) == 0 {
		return nil
	}
	// 验证必须是该用户的记录
	return global.GVA_DB.Where("id IN ? AND user_id = ?", ids, userId).Delete(&system.TaEnglishWord{}).Error
}

func (s *EnglishWordService) UpdateWord(word *system.TaEnglishWord, userId uint) error {
	// 验证归属
	var existing system.TaEnglishWord
	if err := global.GVA_DB.Where("id = ? AND user_id = ?", word.ID, userId).First(&existing).Error; err != nil {
		return err
	}
	return global.GVA_DB.Updates(word).Error
}

func (s *EnglishWordService) GetWordList(userId uint) ([]system.TaEnglishWord, error) {
	var words []system.TaEnglishWord
	err := global.GVA_DB.Where("user_id = ?", userId).Order("id desc").Find(&words).Error
	return words, err
}
