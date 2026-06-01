# 典型踩坑实录 (Typical Errors Record)

## 1. Vite Proxy 未配置导致 API 报 404
**错误现象**：新增了一个后端模块（如 Billing / Account），开发了所有的接口（Router、API、Service），前端也写好了 axios 请求 `/billing/create`，但在联调测试时直接报 404 Not Found。
**出错原因**：在本地开发环境下，前端使用了 Vite Dev Server（运行在类似 5174 或 5173 端口）。如果在 `vite.config.ts` 的 `proxy` 数组中**没有**加入新增的路由前缀（例如 `'/billing'`），那么 Vite 就不会将这个请求反向代理到本地和后台对接的 `8888` 端口，而是将其当成了前端路由从而导致找不到资源 (404)。
**防范方案**：每次设计并新建属于完全**独立的一级路由**模块时，**必须第一时间**去到 `vite.config.ts` 中的 proxy 配置里，将它追加进拦截白名单内。

## 2. Go GORM 的 Service 导出重名或前缀带错
**错误现象**：在定义 API 接口时出现 `undefined: xxxService`，或 `SystemApiGroup.xxxApi undefined` 的报错。
**出错原因**：基于现有的三层架构，容易在 `enter.go` 忘记把新模块对应的结构体写进 `ServiceGroup` 或 `ApiGroup`，或者在局部 API 文件中因为复制粘贴，定义了和全局别名相同的局部变量（比如 `var billingService = ...`）。
**防范方案**：始终统一将所有的外网入口和微服务实体统一挂载到全局聚合文件（`enter.go`, `enter_api.go`）的底部，并保持首字母大写的命名规范导出。并且只在 `api/v1/.../enter.go` 中统一定义服务类的实例（小写单例变量），各个 API 中直接调用它，切忌在独立文件里擅自重新定义。

*(文档持续更新中...)*
