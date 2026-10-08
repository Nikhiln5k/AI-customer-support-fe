export type ArticleStatus = 'draft' | 'published' | 'archived';

export interface Article {
  id: string;
  title: string;
  category: string;
  content: string;
  tags: string[];
  status: ArticleStatus;
  author: string;
  updatedAt: string;
}

export type ArticleInput = Pick<Article, 'title' | 'category' | 'content' | 'tags' | 'status'>;

export interface RagSource {
  articleId: string;
  title: string;
  snippet: string;
  score: number;
}

export interface RagAnswer {
  answer: string;
  sources: RagSource[];
}
