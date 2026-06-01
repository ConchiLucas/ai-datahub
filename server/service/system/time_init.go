package system

import "time"

var timeNow time.Time

func init() {
	timeNow = time.Now()
}
