package request

import "fmt"

type InitDB struct {
	DBType   string `json:"dbType"`
	Host     string `json:"host"`
	Port     string `json:"port"`
	UserName string `json:"userName"`
	Password string `json:"password"`
	DBName   string `json:"dbName"`
}

func (i *InitDB) MysqlEmpty() bool {
	if i.Host == "" || i.Port == "" || i.UserName == "" || i.Password == "" || i.DBName == "" {
		return true
	}
	return false
}

func (i *InitDB) PgsqlEmpty() bool {
	if i.Host == "" || i.Port == "" || i.UserName == "" || i.Password == "" || i.DBName == "" {
		return true
	}
	return false
}

func (i *InitDB) SqliteEmpty() bool {
	if i.DBName == "" {
		return true
	}
	return false
}

func (i *InitDB) MssqlEmpty() bool {
	if i.Host == "" || i.Port == "" || i.UserName == "" || i.Password == "" || i.DBName == "" {
		return true
	}
	return false
}

func (i *InitDB) ToMysqlConfig() string {
	return fmt.Sprintf("%s:%s@tcp(%s:%s)/%s", i.UserName, i.Password, i.Host, i.Port, i.DBName)
}

func (i *InitDB) ToPgsqlConfig() string {
	return fmt.Sprintf("host=%s user=%s password=%s port=%s dbname=%s sslmode=disable TimeZone=Asia/Shanghai", i.Host, i.UserName, i.Password, i.Port, i.DBName)
}

func (i *InitDB) ToSqliteConfig() string {
	return i.DBName + ".db"
}

func (i *InitDB) ToMssqlConfig() string {
	return fmt.Sprintf("sqlserver://%s:%s@%s:%s?database=%s", i.UserName, i.Password, i.Host, i.Port, i.DBName)
}
