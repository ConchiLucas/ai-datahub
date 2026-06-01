package system

import (
	v1 "github.com/conchi/ai-note/server/api/v1"
	"github.com/gin-gonic/gin"
)

type AiNoteRouter struct{}

func (s *AiNoteRouter) InitAiNoteRouter(Router *gin.RouterGroup) {
	noteRouter := Router.Group("ai-note")
	noteApi := v1.ApiGroupApp.SystemApiGroup.AiNoteApi
	{
		noteRouter.GET("list", noteApi.GetNoteList)
		noteRouter.GET(":id", noteApi.GetNoteById)
		noteRouter.POST("page", noteApi.GetNotePage)
		noteRouter.POST("saveOrUpdate", noteApi.SaveOrUpdateNote)
		noteRouter.DELETE("delete/:ids", noteApi.DeleteNote)
		noteRouter.POST("move", noteApi.MoveNote)
		noteRouter.POST("favorite", noteApi.ToggleFavorite)
		noteRouter.GET("search", noteApi.SearchNotes)
		noteRouter.POST("vector-search", noteApi.VectorSearchNotes)
	}
}
