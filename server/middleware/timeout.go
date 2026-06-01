package middleware

import (
	"context"
	"github.com/gin-gonic/gin"
	"net/http"
	"time"
)

func TimeoutMiddleware(timeout time.Duration) gin.HandlerFunc {
	return func(c *gin.Context) {
		ctx, cancel := context.WithTimeout(c.Request.Context(), timeout)
		defer cancel()

		c.Request = c.Request.WithContext(ctx)

		done := make(chan struct{}, 1)
		panicChan := make(chan interface{}, 1)

		go func() {
			defer func() {
				if p := recover(); p != nil {
					select {
					case panicChan <- p:
					default:
					}
				}
				select {
				case done <- struct{}{}:
				default:
				}
			}()
			c.Next()
		}()

		select {
		case p := <-panicChan:
			panic(p)
		case <-done:
			return
		case <-ctx.Done():
			c.Header("Connection", "close")
			c.AbortWithStatusJSON(http.StatusGatewayTimeout, gin.H{
				"code": 504,
				"msg":  "请求超时",
			})
			return
		}
	}
}
