package request

type TaCreateBillingReq struct {
	Type       string  `json:"type" binding:"required"`
	CategoryId string  `json:"categoryId" binding:"required"`
	Amount     float64 `json:"amount" binding:"required"`
	Note       string  `json:"note"`
}

type TaDeleteBillingReq struct {
	Id uint `json:"id" binding:"required"`
}
