package request

import (
	"github.com/conchi/ai-note/server/global"
	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
)

type CustomClaims struct {
	BaseClaims
	BufferTime int64
	jwt.RegisteredClaims
}

type BaseClaims struct {
	UUID        uuid.UUID
	ID          uint
	Username    string
	NickName    string
	AuthorityId uint
}

type ValidateAuth struct {
	Token string               `json:"token"`
	User  global.GVA_MODEL     `json:"user"`
	Claim *CustomClaims        `json:"claim"`
}
