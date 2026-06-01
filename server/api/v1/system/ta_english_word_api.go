package system

import (
	"github.com/conchi/ai-note/server/model/common/response"
	"github.com/conchi/ai-note/server/model/system"
	"github.com/conchi/ai-note/server/utils"
	"github.com/gin-gonic/gin"
)

type EnglishWordApi struct{}

func (a *EnglishWordApi) CreateWord(c *gin.Context) {
	var word system.TaEnglishWord
	if err := c.ShouldBindJSON(&word); err != nil {
		response.FailWithMessage("参数错误", c)
		return
	}
	word.UserId = utils.GetUserID(c)
	if err := englishWordService.CreateWord(&word); err != nil {
		response.FailWithMessage("创建成功", c)
	} else {
		response.OkWithMessage("创建成功", c)
	}
}

func (a *EnglishWordApi) DeleteWord(c *gin.Context) {
	var req struct {
		Ids []int `json:"ids"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		response.FailWithMessage("参数错误", c)
		return
	}
	userId := utils.GetUserID(c)
	if err := englishWordService.DeleteWord(req.Ids, userId); err != nil {
		response.FailWithMessage("删除失败", c)
	} else {
		response.OkWithMessage("删除成功", c)
	}
}

func (a *EnglishWordApi) UpdateWord(c *gin.Context) {
	var word system.TaEnglishWord
	if err := c.ShouldBindJSON(&word); err != nil {
		response.FailWithMessage("参数错误", c)
		return
	}
	userId := utils.GetUserID(c)
	if err := englishWordService.UpdateWord(&word, userId); err != nil {
		response.FailWithMessage("更新失败", c)
	} else {
		response.OkWithMessage("更新成功", c)
	}
}

func (a *EnglishWordApi) GetWordList(c *gin.Context) {
	userId := utils.GetUserID(c)
	words, err := englishWordService.GetWordList(userId)
	if err != nil {
		response.FailWithMessage("获取失败", c)
		return
	}
	response.OkWithData(words, c)
}
