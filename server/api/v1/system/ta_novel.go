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

type TaNovelApi struct{}

// CreateTaNovel 创建
func (taNovelApi *TaNovelApi) CreateTaNovel(c *gin.Context) {
	var taNovel system.TaNovel
	err := c.ShouldBindJSON(&taNovel)
	if err != nil {
		response.FailWithMessage(err.Error(), c)
		return
	}
	taNovel.UserId = utils.GetUserID(c)
	if err := taNovelService.CreateTaNovel(&taNovel); err != nil {
		global.GVA_LOG.Error("创建失败!", zap.Error(err))
		response.FailWithMessage("创建失败", c)
	} else {
		response.OkWithMessage("创建成功", c)
	}
}

// DeleteTaNovel 删除
func (taNovelApi *TaNovelApi) DeleteTaNovel(c *gin.Context) {
	var taNovel system.TaNovel
	err := c.ShouldBindJSON(&taNovel)
	if err != nil {
		response.FailWithMessage(err.Error(), c)
		return
	}
	if err := taNovelService.DeleteTaNovel(taNovel); err != nil {
		global.GVA_LOG.Error("删除失败!", zap.Error(err))
		response.FailWithMessage("删除失败", c)
	} else {
		response.OkWithMessage("删除成功", c)
	}
}

// UpdateTaNovel 更新
func (taNovelApi *TaNovelApi) UpdateTaNovel(c *gin.Context) {
	var taNovel system.TaNovel
	err := c.ShouldBindJSON(&taNovel)
	if err != nil {
		response.FailWithMessage(err.Error(), c)
		return
	}
	taNovel.UserId = utils.GetUserID(c)
	if err := taNovelService.UpdateTaNovel(taNovel); err != nil {
		global.GVA_LOG.Error("更新失败!", zap.Error(err))
		response.FailWithMessage("更新失败", c)
	} else {
		response.OkWithMessage("更新成功", c)
	}
}

// GetTaNovel 用id查询
func (taNovelApi *TaNovelApi) GetTaNovel(c *gin.Context) {
	idStr := c.Query("id")
	id, err := strconv.Atoi(idStr)
	if err != nil || id == 0 {
		response.FailWithMessage("无效的ID参数", c)
		return
	}
	if reTaNovel, err := taNovelService.GetTaNovel(uint(id)); err != nil {
		global.GVA_LOG.Error("查询失败!", zap.Error(err))
		response.FailWithMessage("查询失败", c)
	} else {
		response.OkWithData(gin.H{"reTaNovel": reTaNovel}, c)
	}
}

// GetTaNovelList 分页获取列表
func (taNovelApi *TaNovelApi) GetTaNovelList(c *gin.Context) {
	var pageInfo request.TaNovelSearch
	err := c.ShouldBindQuery(&pageInfo)
	if err != nil {
		response.FailWithMessage(err.Error(), c)
		return
	}
	pageInfo.UserId = utils.GetUserID(c)
	if list, total, err := taNovelService.GetTaNovelInfoList(pageInfo); err != nil {
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
