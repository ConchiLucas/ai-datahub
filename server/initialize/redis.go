package initialize

import (
	"context"
	"github.com/conchi/ai-note/server/global"
	"github.com/redis/go-redis/v9"
	"go.uber.org/zap"
)

func Redis() {
	redisCfg := global.GVA_CONFIG.Redis
	client := redis.NewClient(&redis.Options{
		Addr:     redisCfg.Addr,
		Password: redisCfg.Password,
		DB:       redisCfg.DB,
	})
	pong, err := client.Ping(context.Background()).Result()
	if err != nil {
		global.GVA_LOG.Error("redis connect ping failed, err:", zap.Error(err))
		panic(err)
	} else {
		global.GVA_LOG.Info("redis connect ping response:", zap.String("pong", pong))
		global.GVA_REDIS = client
	}
}

/*func RedisList() {
	redisCfg := global.GVA_CONFIG.RedisList
	global.GVA_REDISList = make(map[string]redis.UniversalClient)
	for k, v := range redisCfg {
		client := redis.NewUniversalClient(&redis.UniversalOptions{
			Addrs:    []string{v.Addr},
			Password: v.Password,
			DB:       v.DB,
		})
		pong, err := client.Ping(context.Background()).Result()
		if err != nil {
			global.GVA_LOG.Error("redis connect ping failed, err:", zap.Any("name", k), zap.Error(err))
			panic(err)
		} else {
			global.GVA_LOG.Info("redis connect ping response:", zap.Any("name", k), zap.String("pong", pong))
			global.GVA_REDISList[k] = client
		}
	}
}*/
