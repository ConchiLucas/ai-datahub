import service from '@/utils/request';

// @Tags TaSkill
// @Summary 创建技能片段
// @Security ApiKeyAuth
// @accept application/json
// @Produce application/json
// @Param data body request.CreateSkillReq true "创建技能片段"
// @Success 200 {object} response.Response{msg=string} "创建成功"
// @Router /skill/create [post]
export const createTaSkill = (data: any) => {
  return service({
    url: '/skill/create',
    method: 'post',
    data
  });
};

// @Tags TaSkill
// @Summary 更新技能片段
// @Security ApiKeyAuth
// @accept application/json
// @Produce application/json
// @Param data body request.UpdateSkillReq true "更新技能片段"
// @Success 200 {object} response.Response{msg=string} "更新成功"
// @Router /skill/update [put]
export const updateTaSkill = (data: any) => {
  return service({
    url: '/skill/update',
    method: 'put',
    data
  });
};

// @Tags TaSkill
// @Summary 切换收藏状态
// @Security ApiKeyAuth
// @accept application/json
// @Produce application/json
// @Param data body request.ToggleSkillStarReq true "切换收藏状态"
// @Success 200 {object} response.Response{msg=string} "操作成功"
// @Router /skill/star [put]
export const toggleSkillStar = (data: any) => {
  return service({
    url: '/skill/star',
    method: 'put',
    data
  });
};

// @Tags TaSkill
// @Summary 删除技能片段
// @Security ApiKeyAuth
// @accept application/json
// @Produce application/json
// @Param data body request.GetById true "删除技能片段"
// @Success 200 {object} response.Response{msg=string} "删除成功"
// @Router /skill/delete [delete]
export const deleteTaSkill = (data: { id: number }) => {
  return service({
    url: '/skill/delete',
    method: 'delete',
    data
  });
};

// @Tags TaSkill
// @Summary 获取技能片段列表
// @Security ApiKeyAuth
// @accept application/json
// @Produce application/json
// @Param data query request.SearchSkillParams true "分页获取技能片段列表"
// @Success 200 {object} response.Response{data=response.PageResult,msg=string} "获取成功"
// @Router /skill/list [get]
export const getTaSkillList = (params: any) => {
  return service({
    url: '/skill/list',
    method: 'get',
    params
  });
};
