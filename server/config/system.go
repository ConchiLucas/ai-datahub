package config

type System struct {
	Env                string `mapstructure:"env" json:"env" yaml:"env"`
	DbType             string `mapstructure:"db-type" json:"db-type" yaml:"db-type"`
	RouterPrefix       string `mapstructure:"router-prefix" json:"router-prefix" yaml:"router-prefix"`
	Addr               int    `mapstructure:"addr" json:"addr" yaml:"addr"`
	UseMultipoint      bool   `mapstructure:"use-multipoint" json:"use-multipoint" yaml:"use-multipoint"`
	UseRedis           bool   `mapstructure:"use-redis" json:"use-redis" yaml:"use-redis"`
	DisableAutoMigrate bool   `mapstructure:"disable-auto-migrate" json:"disable-auto-migrate" yaml:"disable-auto-migrate"`
}
