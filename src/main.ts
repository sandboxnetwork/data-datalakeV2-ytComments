// eslint-disable-next-line node/no-unpublished-import
import {VideoCommentCrawling} from './crawling';

export async function crawling_(videoId: string, limit) {
  return await new VideoCommentCrawling(videoId, limit).execute();
}
export async function crawlingCallback_(
  videoId: string,
  limit,
  callback: (arr: string[][], end: boolean) => void
) {
  return await new VideoCommentCrawling(videoId, limit).executePatialCallback(
    callback
  );
}

export const crawling = crawling_;
export const crawlingCallback = crawlingCallback_;
