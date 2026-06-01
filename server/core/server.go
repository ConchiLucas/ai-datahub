package core

import (
	"fmt"
	"github.com/conchi/ai-note/server/global"
	"github.com/conchi/ai-note/server/initialize"
	"time"
)

func RunServer() {
	if global.GVA_CONFIG.System.UseRedis {
		// initialize.Redis()
		// initialize.RedisList()
	}

	Router := initialize.Routers()

	address := fmt.Sprintf(":%d", global.GVA_CONFIG.System.Addr)

	fmt.Printf(`
	欢迎使用 ai-note
	当前版本:%s
	默认前端文件运行地址:http://127.0.0.1%s
`, global.Version, address)
	initServer(address, Router, 10*time.Minute, 10*time.Minute)
}
