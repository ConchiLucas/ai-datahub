package request

type AddJsonSnippetReq struct {
	Title   string `json:"title" binding:"required"`
	Content string `json:"content" binding:"required"`
}

type UpdateJsonSnippetReq struct {
	ID      uint   `json:"id" binding:"required"`
	Title   string `json:"title"`
	Content string `json:"content"`
}

type DeleteJsonSnippetReq struct {
	ID uint `json:"id" binding:"required"`
}
