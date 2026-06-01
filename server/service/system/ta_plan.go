package system

import (
	"errors"
	"time"

	"github.com/conchi/ai-note/server/global"
	"github.com/conchi/ai-note/server/model/system"
	"github.com/conchi/ai-note/server/model/system/request"
)

type PlanService struct{}

var PlanServiceApp = new(PlanService)

func (s *PlanService) CreatePlan(userId uint, req request.TaCreatePlanReq) (*system.TaPlan, error) {
	plan := &system.TaPlan{
		UserId:      userId,
		Title:       req.Title,
		Description: req.Description,
		Priority:    req.Priority,
		Progress:    req.Progress,
	}
	err := global.GVA_DB.Create(plan).Error
	return plan, err
}

func (s *PlanService) DeletePlan(userId uint, id uint) error {
	var count int64
	global.GVA_DB.Model(&system.TaPlan{}).Where("id = ? AND user_id = ?", id, userId).Count(&count)
	if count == 0 {
		return errors.New("任务不存在或无权限删除")
	}
	err := global.GVA_DB.Where("id = ? AND user_id = ?", id, userId).Delete(&system.TaPlan{}).Error
	return err
}

func (s *PlanService) UpdatePlan(userId uint, req request.TaUpdatePlanReq) error {
	var count int64
	global.GVA_DB.Model(&system.TaPlan{}).Where("id = ? AND user_id = ?", req.ID, userId).Count(&count)
	if count == 0 {
		return errors.New("任务不存在或无权限更新")
	}

	updateData := map[string]interface{}{
		"title":       req.Title,
		"description": req.Description,
		"priority":    req.Priority,
		"progress":    req.Progress,
	}

	err := global.GVA_DB.Model(&system.TaPlan{}).Where("id = ? AND user_id = ?", req.ID, userId).Updates(updateData).Error
	return err
}

func (s *PlanService) UpdatePlanProgress(userId uint, req request.TaUpdatePlanProgressReq) error {
	var count int64
	global.GVA_DB.Model(&system.TaPlan{}).Where("id = ? AND user_id = ?", req.ID, userId).Count(&count)
	if count == 0 {
		return errors.New("任务不存在或无权限更新")
	}

	err := global.GVA_DB.Model(&system.TaPlan{}).Where("id = ? AND user_id = ?", req.ID, userId).Update("progress", req.Progress).Error
	return err
}

func (s *PlanService) GetPlanList(userId uint, info request.TaSearchPlanParams) (list []request.TaPlanResponse, total int64, err error) {
	db := global.GVA_DB.Model(&system.TaPlan{}).Where("user_id = ?", userId)

	if info.Priority != "" && info.Priority != "all" {
		db = db.Where("priority = ?", info.Priority)
	}

	// Status can be used if we need to filter exclusively by completed
	if info.Status == "completed" {
		db = db.Where("progress = ?", 100)
	} else if info.Status == "todo" {
		db = db.Where("progress < ?", 100)
	}

	err = db.Count(&total).Error
	if err != nil {
		return
	}

	// Calculate pagination if strictly needed, or we just bring all back if it's small to sort on frontend
	var plans []system.TaPlan
	if info.PageSize > 0 {
		offset := (info.Page - 1) * info.PageSize
		db = db.Offset(offset).Limit(info.PageSize)
	}

	// Sort logic on backend: Completed tasks (100) go last, highest progress goes first otherwise
	// We can use a raw order clause, however since the user asked to sort on frontend, we can also just fetch all and sort there.
	// But let's add basic ORDER BY created_at DESC as default
	err = db.Order("created_at desc").Find(&plans).Error

	for _, p := range plans {
		createdAtStr := formatFriendlyTime(p.CreatedAt)
		list = append(list, request.TaPlanResponse{
			TaPlan:       p,
			CreatedAtStr: createdAtStr,
		})
	}
	return
}

func formatFriendlyTime(t time.Time) string {
	now := time.Now()
	diff := now.Sub(t)

	if diff.Hours() < 24 && now.Day() == t.Day() {
		return "今天"
	}
	if diff.Hours() < 48 && now.Day()-t.Day() == 1 {
		return "昨天"
	}
	return t.Format("2006-01-02")
}
