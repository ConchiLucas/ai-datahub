package system

import (
	"github.com/conchi/ai-note/server/global"
	"github.com/conchi/ai-note/server/model/system"
)

type PortService struct{}

// CreateHost 创建主机记录
func (portService *PortService) CreateHost(host system.TaHost) (err error) {
	err = global.GVA_DB.Create(&host).Error
	return err
}

// DeleteHost 删除主机记录
func (portService *PortService) DeleteHost(id uint, userId uint) (err error) {
	err = global.GVA_DB.Where("id = ? AND user_id = ?", id, userId).Delete(&system.TaHost{}).Error
	return err
}

// UpdateHost 更新主机记录
func (portService *PortService) UpdateHost(host system.TaHost) (err error) {
	err = global.GVA_DB.Where("id = ? AND user_id = ?", host.ID, host.UserId).Updates(&host).Error
	return err
}

// GetHostList 获取主机的列表
func (portService *PortService) GetHostList(userId uint) (list []system.TaHost, err error) {
	err = global.GVA_DB.Where("user_id = ?", userId).Order("created_at desc").Find(&list).Error
	return
}

// CreatePort 创建端口记录
func (portService *PortService) CreatePort(port system.TaPort) (err error) {
	err = global.GVA_DB.Create(&port).Error
	return err
}

// DeletePort 删除端口记录
func (portService *PortService) DeletePort(id uint, userId uint) (err error) {
	err = global.GVA_DB.Where("id = ? AND user_id = ?", id, userId).Delete(&system.TaPort{}).Error
	return err
}

// UpdatePort 更新端口记录
func (portService *PortService) UpdatePort(port system.TaPort) (err error) {
	err = global.GVA_DB.Where("id = ? AND user_id = ?", port.ID, port.UserId).Updates(&port).Error
	return err
}

// GetPortList 获取端口记录列表
func (portService *PortService) GetPortList(userId uint) (list []system.TaPort, err error) {
	err = global.GVA_DB.Where("user_id = ?", userId).Order("created_at desc").Find(&list).Error
	return
}
