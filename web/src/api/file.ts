import request from '@/utils/request';

/** Excel Sheet 数据 */
export interface ExcelSheet {
  name: string;
  rows: string[][];
  total?: number;
  truncated?: boolean;
}

/** 文件预览响应 */
export interface FilePreviewResponse {
  code: number;
  msg: string;
  data: {
    /** 预览类型：text（文本）| excel（表格） */
    type?: 'text' | 'excel';
    /** 文本内容（type=text 时有效） */
    content?: string;
    encoding?: string;
    size?: number;
    /** Excel 数据（type=excel 时有效） */
    sheets?: ExcelSheet[];
  };
}

/**
 * 获取文件预览内容
 * - 文本文件返回 { type: 'text', content, encoding, size }
 * - Excel/CSV 返回 { type: 'excel', sheets: [...], size }
 */
export const fetchFilePreview = async (fileId: string): Promise<FilePreviewResponse> => {
  const res = await request.get<any, FilePreviewResponse>(`/file/preview/${fileId}`);
  return res;
};
