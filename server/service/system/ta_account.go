package system

import (
	"github.com/conchi/ai-note/server/global"
	"github.com/conchi/ai-note/server/model/system"
)

type AccountService struct{}

func (s *AccountService) CreateAccount(account *system.TaAccount) error {
	return global.GVA_DB.Create(account).Error
}

func (s *AccountService) UpdateAccount(account system.TaAccount) error {
	return global.GVA_DB.Model(&system.TaAccount{}).
		Where("id = ? AND user_id = ?", account.ID, account.UserId).
		Updates(map[string]interface{}{
			"account":     account.Account,
			"password":    account.Password,
			"website":     account.Website,
			"description": account.Description,
		}).Error
}

func (s *AccountService) DeleteAccount(userId uint, id uint) error {
	return global.GVA_DB.Where("id = ? AND user_id = ?", id, userId).Delete(&system.TaAccount{}).Error
}

func (s *AccountService) GetAccountList(userId uint) ([]system.TaAccount, error) {
	var list []system.TaAccount
	err := global.GVA_DB.Where("user_id = ?", userId).Order("id desc").Find(&list).Error
	return list, err
}
