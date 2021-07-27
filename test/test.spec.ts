// tslint:disable-next-line:no-import-side-effect
import 'jasmine';
import {crawling, crawlingCallback, crawlingIterator} from '../src/main';

jasmine.DEFAULT_TIMEOUT_INTERVAL = 26000;
describe('crawling comment test 10', () => {
  it('crawling comments 10', async () => {
    const result = await crawling('QIccuFGe-mc', 10);
    expect(result.length).toEqual(10);
  });
});

describe('crawling comment test 20', () => {
  it('crawling comments 20', async () => {
    const result = await crawling('QIccuFGe-mc', 20);
    expect(result.length).toEqual(20);
  });
});

describe('crawling comment test 30', () => {
  it('crawling comments 30', async () => {
    const result = await crawling('QIccuFGe-mc', 30);
    expect(result.length).toEqual(30);
  });
});

describe('crawling comment test 200', () => {
  it('crawling comments 200', async () => {
    const result = await crawling('gdZLi9oWNZg', 200);
    expect(result.length).toEqual(200);
  });
});

describe('crawling callback comment test', () => {
  it('crawling callback comment', done => {
    crawlingCallback('QIccuFGe-mc', 1, (arr, end) => {
      if (arr.length > 1 && end) {
        done();
      }
    });
  });
});
describe('crawling itorable comment test 230', () => {
  it('crawling itorable comment', async () => {
    const itor = await crawlingIterator('UcgvY9v6QmQ', 230);
    let d = false;
    let length = 0;
    while (!d) {
      const {value, done} = await itor.next();
      length += value ? value.length : 0;
      d = done;
    }
    expect(length).toEqual(230);
  });
});
describe('crawling callback comment test 230', () => {
  it('crawling callback comment', done => {
    let total = 0;
    crawlingCallback('gdZLi9oWNZg', 230, (arr, end) => {
      total += arr.length;
      if (arr.length > 1 && end) {
        if (end === true && total >= 230) {
          done();
        }
      }
    });
  });
});
