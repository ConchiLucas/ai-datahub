import service from '@/utils/request';

// @Tags PathManagement
// @Summary 获取路径列表和分类
// @Security ApiKeyAuth
// @Produce  application/json
// @Router /path/getPathData [get]
export const getPathData = () => {
    return service({
        url: '/path/getPathData',
        method: 'get',
    });
};

// @Tags PathManagement
// @Summary 添加路径
// @Security ApiKeyAuth
// @accept application/json
// @Produce application/json
// @Param data body request.AddPathReq true "创建路径记录"
// @Router /path/addPath [post]
export const addPath = (data: any) => {
    return service({
        url: '/path/addPath',
        method: 'post',
        data,
    });
};

// @Tags PathManagement
// @Summary 更新路径信息
// @Security ApiKeyAuth
// @accept application/json
// @Produce application/json
// @Param data body request.UpdatePathReq true "更新路径内容"
// @Router /path/updatePath [put]
export const updatePath = (data: any) => {
    return service({
        url: '/path/updatePath',
        method: 'put',
        data,
    });
};

// @Tags PathManagement
// @Summary 删除单条明细
// @Security ApiKeyAuth
// @accept application/json
// @Produce application/json
// @Param data body request.DeletePathReq true "根据ID删除指定数据"
// @Router /path/deletePath [delete]
export const deletePath = (data: any) => {
    return service({
        url: '/path/deletePath',
        method: 'delete',
        data,
    });
};
