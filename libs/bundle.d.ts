// Generated by dts-bundle v0.7.3

export function crawling_(videoId: string, limit: any): Promise<string[][]>;
export function crawlingCallback_(videoId: string, limit: any, callback: (arr: string[][], end: boolean) => void): Promise<void>;
export function crawlingIterator_(videoId: string, limit: any): Promise<AsyncGenerator<string[][], any, unknown>>;
export const crawling: typeof crawling_;
export const crawlingCallback: typeof crawlingCallback_;
export const crawlingIterator: typeof crawlingIterator_;

