package system

import (
	"strconv"

	"github.com/conchi/ai-note/server/global"
	"github.com/conchi/ai-note/server/model/common/response"
	"github.com/conchi/ai-note/server/model/system"
	"github.com/conchi/ai-note/server/model/system/request"
	"github.com/conchi/ai-note/server/utils"
	"github.com/gin-gonic/gin"
	"go.uber.org/zap"
)

type TaNovelChapterApi struct{}

// CreateTaNovelChapter 创建
func (taNovelChapterApi *TaNovelChapterApi) CreateTaNovelChapter(c *gin.Context) {
	var taNovelChapter system.TaNovelChapter
	err := c.ShouldBindJSON(&taNovelChapter)
	if err != nil {
		response.FailWithMessage(err.Error(), c)
		return
	}
	taNovelChapter.UserId = utils.GetUserID(c)
	if err := taNovelChapterService.CreateTaNovelChapter(&taNovelChapter); err != nil {
		global.GVA_LOG.Error("创建失败!", zap.Error(err))
		response.FailWithMessage("创建失败", c)
	} else {
		response.OkWithMessage("创建成功", c)
	}
}

// DeleteTaNovelChapter 删除
func (taNovelChapterApi *TaNovelChapterApi) DeleteTaNovelChapter(c *gin.Context) {
	var taNovelChapter system.TaNovelChapter
	err := c.ShouldBindJSON(&taNovelChapter)
	if err != nil {
		response.FailWithMessage(err.Error(), c)
		return
	}
	if err := taNovelChapterService.DeleteTaNovelChapter(taNovelChapter); err != nil {
		global.GVA_LOG.Error("删除失败!", zap.Error(err))
		response.FailWithMessage("删除失败", c)
	} else {
		response.OkWithMessage("删除成功", c)
	}
}

// UpdateTaNovelChapter 更新
func (taNovelChapterApi *TaNovelChapterApi) UpdateTaNovelChapter(c *gin.Context) {
	var taNovelChapter system.TaNovelChapter
	err := c.ShouldBindJSON(&taNovelChapter)
	if err != nil {
		response.FailWithMessage(err.Error(), c)
		return
	}
	taNovelChapter.UserId = utils.GetUserID(c)
	if err := taNovelChapterService.UpdateTaNovelChapter(taNovelChapter); err != nil {
		global.GVA_LOG.Error("更新失败!", zap.Error(err))
		response.FailWithMessage("更新失败", c)
	} else {
		response.OkWithMessage("更新成功", c)
	}
}

// GetTaNovelChapter 用id查询
func (taNovelChapterApi *TaNovelChapterApi) GetTaNovelChapter(c *gin.Context) {
	idStr := c.Query("id")
	id, err := strconv.Atoi(idStr)
	if err != nil || id == 0 {
		response.FailWithMessage("无效的ID参数", c)
		return
	}
	if reTaNovelChapter, err := taNovelChapterService.GetTaNovelChapter(uint(id)); err != nil {
		global.GVA_LOG.Error("查询失败!", zap.Error(err))
		response.FailWithMessage("查询失败", c)
	} else {
		response.OkWithData(gin.H{"reTaNovelChapter": reTaNovelChapter}, c)
	}
}

// GetTaNovelChapterList 分页获取列表
func (taNovelChapterApi *TaNovelChapterApi) GetTaNovelChapterList(c *gin.Context) {
	var pageInfo request.TaNovelChapterSearch
	err := c.ShouldBindQuery(&pageInfo)
	if err != nil {
		response.FailWithMessage(err.Error(), c)
		return
	}
	pageInfo.UserId = utils.GetUserID(c)
	if list, total, err := taNovelChapterService.GetTaNovelChapterInfoList(pageInfo); err != nil {
		global.GVA_LOG.Error("获取失败!", zap.Error(err))
		response.FailWithMessage("获取失败", c)
	} else {
		response.OkWithDetailed(response.PageResult{
			List:  list,
			Total: total,
			Page:  pageInfo.Page,
			PageSize: pageInfo.PageSize,
		}, "获取成功", c)
	}
}
