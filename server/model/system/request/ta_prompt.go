package request

type AddPromptCategoryReq struct {
	Name string `json:"name" binding:"required"`
}

type DeletePromptCategoryReq struct {
	Name string `json:"name" binding:"required"`
}

type AddPromptReq struct {
	Category string `json:"category" binding:"required"`
	Title    string `json:"title" binding:"required"`
	Content  string `json:"content" binding:"required"`
}

type UpdatePromptReq struct {
	ID       uint   `json:"id" binding:"required"`
	Category string `json:"category" binding:"required"`
	Title    string `json:"title" binding:"required"`
	Content  string `json:"content" binding:"required"`
}

type DeletePromptReq struct {
	ID uint `json:"id" binding:"required"`
}
