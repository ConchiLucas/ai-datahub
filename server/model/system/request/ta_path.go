package request

type AddPathReq struct {
	Category    string `json:"category"` // Required stripped from here to allow 'uncategorized'
	Title       string `json:"title" binding:"required"`
	Path        string `json:"path" binding:"required"`
	Description string `json:"description"`
	Content     string `json:"content"`
}

type UpdatePathReq struct {
	ID          uint   `json:"id" binding:"required"`
	Category    string `json:"category"`
	Title       string `json:"title" binding:"required"`
	Path        string `json:"path" binding:"required"`
	Description string `json:"description"`
	Content     string `json:"content"`
}

type DeletePathReq struct {
	ID uint `json:"id" binding:"required"`
}
