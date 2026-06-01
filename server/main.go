package main

import (
	"github.com/conchi/ai-note/server/core"
	"github.com/conchi/ai-note/server/core/vector"
	"github.com/conchi/ai-note/server/global"
	"github.com/conchi/ai-note/server/initialize"
	"github.com/conchi/ai-note/server/utils"
	"go.uber.org/zap"
)

func main() {
	global.GVA_VP = core.Viper()
	global.GVA_LOG = core.Zap()
	zap.ReplaceGlobals(global.GVA_LOG)

	global.GVA_DB = initialize.InitDB()
	if global.GVA_DB != nil {
		initialize.RegisterTables(global.GVA_DB)
		initialize.InitSystemData(global.GVA_DB)
		db, _ := global.GVA_DB.DB()
		defer db.Close()
	}

	vector.InitVectorConsumer()
	utils.InitMinio()

	core.RunServer()
}
