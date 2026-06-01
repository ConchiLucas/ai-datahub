package request

import "github.com/conchi/ai-note/server/model/system"

type AddWebNavCategoryReq struct {
	Name string `json:"name" binding:"required"`
}

type DeleteWebNavCategoryReq struct {
	ID uint `json:"id" binding:"required"`
}

type UpdateWebNavCategoryReq struct {
	ID   uint   `json:"id" binding:"required"`
	Name string `json:"name" binding:"required"`
}

type AddWebNavSiteReq struct {
	CategoryId uint   `json:"categoryId"`
	Title      string `json:"title" binding:"required"`
	Desc       string `json:"desc"`
	Url        string `json:"url" binding:"required"`
	IconPath   string `json:"iconPath"`
	Accounts   string `json:"accounts"`
}

type UpdateWebNavSiteReq struct {
	ID         uint   `json:"id" binding:"required"`
	CategoryId uint   `json:"categoryId"`
	Title      string `json:"title" binding:"required"`
	Desc       string `json:"desc"`
	Url        string `json:"url" binding:"required"`
	IconPath   string `json:"iconPath"`
	Accounts   string `json:"accounts"`
}

type DeleteWebNavSiteReq struct {
	ID uint `json:"id" binding:"required"`
}

type WebNavListResponse struct {
	Categories []system.TaWebNavCategory `json:"categories"`
	Sites      []system.TaWebNavSite     `json:"sites"`
}
