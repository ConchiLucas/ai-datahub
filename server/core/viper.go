package core

import (
	"flag"
	"fmt"
	"os"
	"path/filepath"
	"strings"

	"github.com/conchi/ai-note/server/core/internal"
	"github.com/conchi/ai-note/server/global"
	"github.com/fsnotify/fsnotify"
	"github.com/spf13/viper"
)

func Viper() *viper.Viper {
	config := getConfigPath()
	localConfig := strings.TrimSuffix(config, filepath.Ext(config)) + ".local.yaml"
	if _, err := os.Stat(localConfig); err == nil {
		config = localConfig
	}

	v := viper.New()
	v.SetConfigFile(config)
	v.SetConfigType("yaml")
	for key, env := range map[string]string{
		"pgsql.path": "PGHOST", "pgsql.port": "PGPORT", "pgsql.db-name": "PGDATABASE",
		"pgsql.username": "PGUSER", "pgsql.password": "PGPASSWORD",
	} {
		if err := v.BindEnv(key, env); err != nil {
			panic(err)
		}
	}
	err := v.ReadInConfig()
	if err != nil {
		panic(fmt.Errorf("fatal error config file: %w", err))
	}
	v.WatchConfig()

	v.OnConfigChange(func(e fsnotify.Event) {
		fmt.Println("config file changed:", e.Name)
		if err = v.Unmarshal(&global.GVA_CONFIG); err != nil {
			fmt.Println(err)
		}
	})
	if err = v.Unmarshal(&global.GVA_CONFIG); err != nil {
		panic(fmt.Errorf("fatal error unmarshal config: %w", err))
	}

	return v
}

func getConfigPath() (config string) {
	flag.StringVar(&config, "c", "", "choose config file.")
	flag.Parse()
	if config != "" {
		fmt.Printf("您正在使用命令行的 '-c' 参数传递的值, config 的路径为 %s\n", config)
		return
	}
	if env := os.Getenv(internal.ConfigEnv); env != "" {
		config = env
		fmt.Printf("您正在使用 %s 环境变量, config 的路径为 %s\n", internal.ConfigEnv, config)
		return
	}

	config = internal.ConfigDefaultFile
	fmt.Printf("您正在单系统环境模式运行, config 的默认路径为 %s\n", config)

	return
}
