package system

import (
	"github.com/conchi/ai-note/server/global"
	commonReq "github.com/conchi/ai-note/server/model/common/request"
	"github.com/conchi/ai-note/server/model/common/response"
	"github.com/conchi/ai-note/server/model/system"
	"github.com/conchi/ai-note/server/model/system/request"
	"github.com/conchi/ai-note/server/utils"
	"github.com/gin-gonic/gin"
	"go.uber.org/zap"
)

type LearningApi struct{}

// =======================
// Learning Item
// =======================

func (a *LearningApi) CreateLearningItem(c *gin.Context) {
	userId := utils.GetUserID(c)
	var req system.TaLearningItem
	if err := c.ShouldBindJSON(&req); err != nil {
		response.FailWithMessage("参数错误", c)
		return
	}

	if item, err := learningService.CreateLearningItem(userId, req); err != nil {
		global.GVA_LOG.Error("创建失败!", zap.Error(err))
		response.FailWithMessage("创建失败", c)
	} else {
		response.OkWithDetailed(item, "创建成功", c)
	}
}

func (a *LearningApi) UpdateLearningItem(c *gin.Context) {
	userId := utils.GetUserID(c)
	var req system.TaLearningItem
	if err := c.ShouldBindJSON(&req); err != nil {
		response.FailWithMessage("参数错误", c)
		return
	}

	if err := learningService.UpdateLearningItem(userId, req); err != nil {
		global.GVA_LOG.Error("更新失败!", zap.Error(err))
		response.FailWithMessage("更新失败", c)
	} else {
		response.OkWithMessage("更新成功", c)
	}
}

func (a *LearningApi) DeleteLearningItem(c *gin.Context) {
	userId := utils.GetUserID(c)
	var req commonReq.GetById
	if err := c.ShouldBindJSON(&req); err != nil {
		response.FailWithMessage("参数错误", c)
		return
	}

	if err := learningService.DeleteLearningItem(userId, req.Uint()); err != nil {
		global.GVA_LOG.Error("删除失败!", zap.Error(err))
		response.FailWithMessage("删除失败", c)
	} else {
		response.OkWithMessage("删除成功", c)
	}
}

func (a *LearningApi) GetLearningItemList(c *gin.Context) {
	userId := utils.GetUserID(c)
	var pageInfo request.TaLearningItemSearch
	
	_ = c.ShouldBindJSON(&pageInfo)

	if list, total, err := learningService.GetLearningItemList(userId, pageInfo); err != nil {
		global.GVA_LOG.Error("获取失败!", zap.Error(err))
		response.FailWithMessage("获取失败", c)
	} else {
		response.OkWithDetailed(response.PageResult{
			List:     list,
			Total:    total,
			Page:     pageInfo.Page,
			PageSize: pageInfo.PageSize,
		}, "获取成功", c)
	}
}

// =======================
// Learning Chapter
// =======================

func (a *LearningApi) CreateChapter(c *gin.Context) {
	userId := utils.GetUserID(c)
	var req system.TaLearningChapter
	if err := c.ShouldBindJSON(&req); err != nil {
		response.FailWithMessage("参数错误", c)
		return
	}

	if item, err := learningService.CreateChapter(userId, req); err != nil {
		global.GVA_LOG.Error("创建失败!", zap.Error(err))
		response.FailWithMessage("创建失败", c)
	} else {
		response.OkWithDetailed(item, "创建成功", c)
	}
}

func (a *LearningApi) UpdateChapter(c *gin.Context) {
	userId := utils.GetUserID(c)
	var req system.TaLearningChapter
	if err := c.ShouldBindJSON(&req); err != nil {
		response.FailWithMessage("参数错误", c)
		return
	}

	if err := learningService.UpdateChapter(userId, req); err != nil {
		global.GVA_LOG.Error("更新失败!", zap.Error(err))
		response.FailWithMessage("更新失败", c)
	} else {
		response.OkWithMessage("更新成功", c)
	}
}

func (a *LearningApi) ToggleChapterCompleted(c *gin.Context) {
	userId := utils.GetUserID(c)
	var req request.TaLearningChapterUpdateStatus
	if err := c.ShouldBindJSON(&req); err != nil {
		response.FailWithMessage("参数错误", c)
		return
	}

	if err := learningService.ToggleChapterCompleted(userId, req); err != nil {
		global.GVA_LOG.Error("修改状态失败!", zap.Error(err))
		response.FailWithMessage("修改状态失败", c)
	} else {
		response.OkWithMessage("修改状态成功", c)
	}
}

func (a *LearningApi) DeleteChapter(c *gin.Context) {
	userId := utils.GetUserID(c)
	var req commonReq.GetById
	if err := c.ShouldBindJSON(&req); err != nil {
		response.FailWithMessage("参数错误", c)
		return
	}

	if err := learningService.DeleteChapter(userId, req.Uint()); err != nil {
		global.GVA_LOG.Error("删除失败!", zap.Error(err))
		response.FailWithMessage("删除失败", c)
	} else {
		response.OkWithMessage("删除成功", c)
	}
}

// =======================
// Learning Note
// =======================

func (a *LearningApi) CreateNote(c *gin.Context) {
	userId := utils.GetUserID(c)
	var req system.TaLearningNote
	if err := c.ShouldBindJSON(&req); err != nil {
		response.FailWithMessage("参数错误", c)
		return
	}

	if item, err := learningService.CreateNote(userId, req); err != nil {
		global.GVA_LOG.Error("创建失败!", zap.Error(err))
		response.FailWithMessage("创建失败", c)
	} else {
		response.OkWithDetailed(item, "创建成功", c)
	}
}

func (a *LearningApi) UpdateNote(c *gin.Context) {
	userId := utils.GetUserID(c)
	var req system.TaLearningNote
	if err := c.ShouldBindJSON(&req); err != nil {
		response.FailWithMessage("参数错误", c)
		return
	}

	if err := learningService.UpdateNote(userId, req); err != nil {
		global.GVA_LOG.Error("更新失败!", zap.Error(err))
		response.FailWithMessage("更新失败", c)
	} else {
		response.OkWithMessage("更新成功", c)
	}
}

func (a *LearningApi) DeleteNote(c *gin.Context) {
	userId := utils.GetUserID(c)
	var req commonReq.GetById
	if err := c.ShouldBindJSON(&req); err != nil {
		response.FailWithMessage("参数错误", c)
		return
	}

	if err := learningService.DeleteNote(userId, req.Uint()); err != nil {
		global.GVA_LOG.Error("删除失败!", zap.Error(err))
		response.FailWithMessage("删除失败", c)
	} else {
		response.OkWithMessage("删除成功", c)
	}
}
