export interface PaginationParams {
  page: number;
  limit: number;
  sortBy: string;
  sortDir: 'asc' | 'desc';
}

export const getPaginationParams = (query: any): PaginationParams => {
  const page = parseInt(query.page as string) || 1;
  const limit = parseInt(query.limit as string) || 10;
  const sortBy = (query.sortBy as string) || 'createdAt';
  const sortDir = (query.sortDir as string)?.toLowerCase() === 'asc' ? 'asc' : 'desc';

  return {
    page: page > 0 ? page : 1,
    limit: limit > 0 ? limit : 10,
    sortBy,
    sortDir,
  };
};

export const getPaginationData = (totalRows: number, page: number, limit: number) => {
  const totalPage = Math.ceil(totalRows / limit);
  
  return {
    page,
    totalPage,
    totalRows,
  };
};

export const getSkipTake = (page: number, limit: number) => {
  return {
    skip: (page - 1) * limit,
    take: limit,
  };
};
