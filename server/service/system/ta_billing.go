package system

import (
	"github.com/conchi/ai-note/server/global"
	"github.com/conchi/ai-note/server/model/system"
)

type BillingService struct{}

func (s *BillingService) CreateBilling(billing *system.TaBilling) error {
	return global.GVA_DB.Create(billing).Error
}

func (s *BillingService) DeleteBilling(userId uint, id uint) error {
	return global.GVA_DB.Where("id = ? AND user_id = ?", id, userId).Delete(&system.TaBilling{}).Error
}

func (s *BillingService) GetBillingList(userId uint) ([]system.TaBilling, error) {
	var list []system.TaBilling
	// 默认返回该用户所有数据供前端本地计算（前端根据年份/月份下拉框本地过滤）
	err := global.GVA_DB.Where("user_id = ?", userId).Order("id desc").Find(&list).Error
	return list, err
}
