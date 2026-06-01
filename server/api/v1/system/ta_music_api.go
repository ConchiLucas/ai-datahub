package system

import (
	"strconv"

	"github.com/conchi/ai-note/server/global"
	"github.com/conchi/ai-note/server/model/common/response"
	"github.com/conchi/ai-note/server/utils"
	"github.com/gin-gonic/gin"
	"go.uber.org/zap"
)

type MusicApi struct{}

// UploadMusic
// @Tags Music
// @Summary 上传音乐文件
// @Security ApiKeyAuth
// @accept multipart/form-data
// @Produce application/json
// @Param file formData file true "音乐文件"
// @Param duration formData string false "前端传入计算好的时常秒数"
// @Success 200 {object} response.Response{data=system.TaMusic,msg=string} "上传成功"
// @Router /music/upload [post]
func (a *MusicApi) UploadMusic(c *gin.Context) {
	_, header, err := c.Request.FormFile("file")
	if err != nil {
		response.FailWithMessage("接收文件失败", c)
		return
	}

	durationStr := c.PostForm("duration")
	duration, _ := strconv.ParseFloat(durationStr, 64)
	userId := utils.GetUserID(c)

	music, err := musicService.UploadMusic(header, userId, duration)
	if err != nil {
		global.GVA_LOG.Error("上传音乐失败!", zap.Error(err))
		response.FailWithMessage("上传失败", c)
		return
	}

	response.OkWithDetailed(music, "上传成功", c)
}

// GetMusicList
// @Tags Music
// @Summary 获取音乐列表
// @Security ApiKeyAuth
// @Produce application/json
// @Success 200 {object} response.Response{data=[]system.TaMusic,msg=string} "成功"
// @Router /music/list [get]
func (a *MusicApi) GetMusicList(c *gin.Context) {
	userId := utils.GetUserID(c)
	list, err := musicService.GetMusicList(userId)
	if err != nil {
		global.GVA_LOG.Error("获取音乐列表失败!", zap.Error(err))
		response.FailWithMessage("获取失败", c)
		return
	}
	response.OkWithDetailed(list, "获取成功", c)
}

// DeleteMusic
// @Tags Music
// @Summary 删除音乐
// @Security ApiKeyAuth
// @Produce application/json
// @Param id body map[string]uint true "音乐ID"
// @Success 200 {object} response.Response{msg=string} "成功"
// @Router /music/delete [post]
func (a *MusicApi) DeleteMusic(c *gin.Context) {
	var req struct {
		ID uint `json:"id"`
	}
	_ = c.ShouldBindJSON(&req)
	userId := utils.GetUserID(c)

	err := musicService.DeleteMusic(userId, req.ID)
	if err != nil {
		global.GVA_LOG.Error("删除失败!", zap.Error(err))
		response.FailWithMessage("删除失败", c)
		return
	}
	response.OkWithMessage("删除成功", c)
}

// ToggleFavorite 切换喜欢状态
func (a *MusicApi) ToggleFavorite(c *gin.Context) {
	userId := utils.GetUserID(c)
	type reqPath struct {
		Id uint `json:"id"`
	}
	var req reqPath
	if err := c.ShouldBindJSON(&req); err != nil {
		response.FailWithMessage("参数错误", c)
		return
	}

	if err := musicService.ToggleFavorite(userId, req.Id); err != nil {
		global.GVA_LOG.Error("设置喜欢失败!", zap.Error(err))
		response.FailWithMessage("设置喜欢失败", c)
		return
	}
	response.OkWithMessage("设置成功", c)
}

// LogPlay 记录播放记录
func (a *MusicApi) LogPlay(c *gin.Context) {
	userId := utils.GetUserID(c)
	type reqPath struct {
		Id uint `json:"id"`
	}
	var req reqPath
	if err := c.ShouldBindJSON(&req); err != nil {
		response.FailWithMessage("参数错误", c)
		return
	}

	if err := musicService.LogPlayback(userId, req.Id); err != nil {
		global.GVA_LOG.Error("记录播放失败!", zap.Error(err))
		response.FailWithMessage("记录播放失败", c)
		return
	}
	response.OkWithMessage("记录成功", c)
}
