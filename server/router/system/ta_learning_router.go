package system

import (
	v1 "github.com/conchi/ai-note/server/api/v1"
	"github.com/gin-gonic/gin"
)

type LearningRouter struct{}

func (s *LearningRouter) InitLearningRouter(Router *gin.RouterGroup) {
	// Learning Item
	itemRouter := Router.Group("learningItem")
	learningApi := v1.ApiGroupApp.SystemApiGroup.LearningApi
	{
		itemRouter.POST("create", learningApi.CreateLearningItem)
		itemRouter.DELETE("delete", learningApi.DeleteLearningItem)
		itemRouter.PUT("update", learningApi.UpdateLearningItem)
		itemRouter.POST("list", learningApi.GetLearningItemList) // Uses POST due to payload
	}

	// Learning Chapter
	chapterRouter := Router.Group("learningChapter")
	{
		chapterRouter.POST("create", learningApi.CreateChapter)
		chapterRouter.DELETE("delete", learningApi.DeleteChapter)
		chapterRouter.PUT("update", learningApi.UpdateChapter)
		chapterRouter.PUT("toggle", learningApi.ToggleChapterCompleted)
	}

	// Learning Note
	noteRouter := Router.Group("learningNote")
	{
		noteRouter.POST("create", learningApi.CreateNote)
		noteRouter.DELETE("delete", learningApi.DeleteNote)
		noteRouter.PUT("update", learningApi.UpdateNote)
	}
}
