package request

type AddCommandCategoryReq struct {
	Name string `json:"name" binding:"required"`
}

type DeleteCommandCategoryReq struct {
	Name string `json:"name" binding:"required"`
}

type AddCommandReq struct {
	Category    string `json:"category" binding:"required"`
	Title       string `json:"title" binding:"required"`
	Command     string `json:"command" binding:"required"`
	Description string `json:"description"`
}

type UpdateCommandReq struct {
	ID          uint   `json:"id" binding:"required"`
	Category    string `json:"category" binding:"required"`
	Title       string `json:"title" binding:"required"`
	Command     string `json:"command" binding:"required"`
	Description string `json:"description"`
}

type DeleteCommandReq struct {
	ID uint `json:"id" binding:"required"`
}
