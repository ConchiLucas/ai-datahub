export type PromptCategory = string;

export interface Prompt {
  id: number;
  title: string;
  category: PromptCategory;
  content: string;
  createdAt: number;
}
