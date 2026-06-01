package request

type AddMarkdownSnippetReq struct {
	Title   string `json:"title" binding:"required"`
	Content string `json:"content"`
}

type UpdateMarkdownSnippetReq struct {
	ID      uint   `json:"id" binding:"required"`
	Title   string `json:"title"`
	Content string `json:"content"`
}

type DeleteMarkdownSnippetReq struct {
	ID uint `json:"id" binding:"required"`
}
