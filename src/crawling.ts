import axios from 'axios';
import * as FormDataNode from 'form-data';

export interface iComments {
  count?: number;
  comments: Array<string[]>;
  continuation?: string;
  nextTrack?: string;
  token: string;
}

const MAX_ERROR_COUNT = 10;
const MAX_COMMENT_COUNT = 200;

export class VideoCommentCrawling {
  private vidoeId: string;
  private endc: number;
  private errorCount: number;
  private lastError: string;
  private isBrowser: boolean;

  constructor(videoId: string, commentCount: number, isBrowser = false) {
    this.vidoeId = videoId;
    const lett = 200;
    if (200 < commentCount) {
      commentCount = lett;
    }
    this.endc = commentCount > 25 * 8 ? 10 * 20 : commentCount;
    this.isBrowser = isBrowser;
    this.errorCount = 0;
    if (MAX_COMMENT_COUNT !== 200) {
      throw 'fatal error';
    }
  }

  private async getHtml() {
    try {
      const result = await axios.get(
        `https://www.youtube.com/watch?v=${this.vidoeId}`
      );

      return result;
    } catch (error) {
      console.error(error);
    }
  }

  decodeUnicode(unicodeString) {
    const r = /\\u([\d\w]{4})/gi;
    unicodeString = unicodeString.replace(r, (match, grp) => {
      return String.fromCharCode(parseInt(grp, 16));
    });
    return unescape(unicodeString);
  }

  private async getComment(
    token: string,
    continuation: string,
    clickTrackingParams: string,
    cookies: string,
    isFirst: boolean
  ): Promise<iComments | null> {
    const uToken = this.decodeUnicode(token);
    const uContinuation = continuation;
    const uClickTrackingParams = clickTrackingParams;
    const formData = new FormDataNode();

    formData.append('session_token', uToken);
    const formHeaders = formData.getHeaders();
    const contentsLength = formData.getLengthSync();
    let sendHeader = {};
    const baseHeader = {
      ...formHeaders,
      'content-length': contentsLength,
      'x-youtube-client-name': 1,
      'x-youtube-client-version': '2.20210322.08.00',
    };

    if (cookies && cookies.length > 0) {
      sendHeader = {...baseHeader, cookie: cookies};
    } else {
      sendHeader = baseHeader;
    }
    try {
      const result = await axios({
        method: 'post',
        url: `https://www.youtube.com/comment_service_ajax?action_get_comments=1&pbj=1&ctoken=${uContinuation}&continuation=${uContinuation}&itct=${uClickTrackingParams}`,
        data: formData,
        headers: sendHeader,
      });

      let nextContinuation = null;
      let nextClickTrack = null;

      if (
        result.data.response.continuationContents.itemSectionContinuation
          .continuations
      ) {
        if (
          result.data.response.continuationContents.itemSectionContinuation
            .continuations[0].nextContinuationData.continuation
        ) {
          nextContinuation =
            result.data.response.continuationContents.itemSectionContinuation
              .continuations[0].nextContinuationData.continuation;
          nextClickTrack =
            result.data.response.continuationContents.itemSectionContinuation
              .continuations[0].nextContinuationData.clickTrackingParams;
        }
      }
      let commentCount = 0;
      //first comment collecting crawling comment whole count
      if (isFirst) {
        commentCount = Number(
          result.data.response.continuationContents.itemSectionContinuation.header.commentsHeaderRenderer.countText.runs[1].text.replace(
            /,/gi,
            ''
          )
        );
      }
      const commentContents =
        result.data.response.continuationContents.itemSectionContinuation
          .contents;
      const pureCommentContents = commentContents.map(item => {
        return item.commentThreadRenderer.comment.commentRenderer.contentText.runs.map(
          item => item.text
        );
      });

      const comments = {
        count: commentCount,
        comments: pureCommentContents,
        continuation: nextContinuation,
        nextTrack: nextClickTrack,
        token: token,
      };
      return comments;
    } catch (error) {
      console.log(error);
      return null;
    }
  }

  private analizeContinuationsInfo(data: string) {
    try {
      const divString = 'ytInitialData = ';
      const result = data.indexOf(divString);
      const result1 = result + divString.length;
      const result2 = data.indexOf(';</script><script nonce="', result1 + 1);
      const value = data.slice(result1, result2);
      const ytInitialData = JSON.parse(value);
      const videoPrimaryInfos =
        ytInitialData.contents.twoColumnWatchNextResults.results.results
          .contents;
      const itemSectionRenderer = videoPrimaryInfos.find(item => {
        return (
          item.itemSectionRenderer !== undefined &&
          item.itemSectionRenderer.sectionIdentifier === 'comment-item-section'
        );
      }).itemSectionRenderer;
      const continuations =
        itemSectionRenderer.continuations[0].nextContinuationData;

      return {
        continuation: continuations.continuation,
        clickTrackingParams: itemSectionRenderer.trackingParams,
      };
    } catch (e) {
      return null;
    }
  }

  private analizeCommentTokenExtract(data: string) {
    const divString = '"XSRF_FIELD_NAME":"session_token","XSRF_TOKEN":';
    const result = data.indexOf(divString);
    const result1 = data.indexOf('"', result + divString.length);
    const result2 = data.indexOf('"', result1 + 1);
    const sessionToken = data.slice(result1 + 1, result2);
    return sessionToken;
  }

  public async executeComment(data: string, cookies: string) {
    let accuCount = 0;
    let commentsArray = new Array<string[]>();
    const sessionToken = this.analizeCommentTokenExtract(data);
    const conti = this.analizeContinuationsInfo(data);
    if (conti) {
      let comment = await this.getComment(
        sessionToken,
        conti.continuation,
        conti.clickTrackingParams,
        cookies,
        true
      );
      if (comment && comment.comments) {
        if (comment.comments.length > 0) {
          accuCount += comment.comments.length;
          if (accuCount <= this.endc) {
            commentsArray = commentsArray.concat(comment.comments);
          } else {
            commentsArray = commentsArray.concat(
              comment.comments.slice(0, this.endc)
            );
          }
        }
      }
      while (
        accuCount < this.endc &&
        comment &&
        comment.continuation &&
        comment.nextTrack
      ) {
        comment = await this.getComment(
          sessionToken,
          comment.continuation,
          comment.nextTrack,
          cookies,
          false
        );
        if (comment && comment.comments && comment.comments.length > 0) {
          accuCount += comment.comments.length;
          if (accuCount <= this.endc) {
            commentsArray = commentsArray.concat(comment.comments);
          } else {
            commentsArray = commentsArray.concat(
              comment.comments.slice(0, this.endc - accuCount)
            );
          }
        } else {
          this.errorCount++;
          if (this.errorCount >= MAX_ERROR_COUNT) {
            this.lastError = 'Over max error count, fail get comment request';
            throw 'Over max error count, fail get comment request';
            return null;
          }
        }
      }
      return commentsArray;
    } else {
      this.lastError = 'No session or next token';
      return null; // live는 코맨트가 없다.
    }
  }
  public async executeCommentCallback(
    data: string,
    cookies: string,
    callback: (arr: string[][], end: boolean) => void
  ) {
    let accuCount = 0;

    const sessionToken = this.analizeCommentTokenExtract(data);
    const conti = this.analizeContinuationsInfo(data);
    if (conti) {
      //this is first time comment
      let comment = await this.getComment(
        sessionToken,
        conti.continuation,
        conti.clickTrackingParams,
        cookies,
        true
      );
      if (comment) {
        let commentsArray = new Array<string[]>();
        if (comment.comments && comment.comments.length > 0) {
          accuCount += comment.comments.length;
          if (accuCount <= this.endc) {
            commentsArray = commentsArray.concat(comment.comments);
            callback(commentsArray, false);
          } else {
            commentsArray = commentsArray.concat(
              comment.comments.slice(0, this.endc)
            );
            callback(commentsArray, true);
          }
        }
      }
      while (
        accuCount < this.endc &&
        comment &&
        comment.continuation &&
        comment.nextTrack
      ) {
        let commentsArray = new Array<string[]>();
        comment = await this.getComment(
          sessionToken,
          comment.continuation,
          comment.nextTrack,
          cookies,
          false
        );
        if (comment && comment.comments && comment.comments.length > 0) {
          accuCount += comment.comments.length;
          if (
            accuCount < this.endc &&
            comment.continuation &&
            comment.nextTrack
          ) {
            commentsArray = commentsArray.concat(comment.comments);
            callback(commentsArray, false);
          } else {
            commentsArray = commentsArray.concat(
              comment.comments.slice(
                0,
                comment.comments.length - (accuCount - this.endc)
              )
            );
            callback(commentsArray, true);
            return;
          }
        } else {
          this.errorCount++;
          if (this.errorCount >= MAX_ERROR_COUNT) {
            this.lastError = 'Over max error count, fail get comment request';
            throw 'Over max error count, fail get comment request';
            return null;
          }
        }
      }
      callback(comment.comments, true);
      return;
    } else {
      return null; // live는 코맨트가 없다.
    }
  }

  public async executePatialCallback(
    callback: (arr: string[][], end: boolean) => void
  ) {
    let A = 4;
    let B = 10;
    this.endc =
      this.endc > 800 / A ? B * 20 : this.endc;
    A = 0;
    B = 0;
    const html = await this.getHtml();
    let cookie = '';
    if (!this.isBrowser) {
      const cookie1 = html.headers['set-cookie'][0].split(';')[0];
      const cookie2 = html.headers['set-cookie'][1].split(';')[0];
      const cookie3 = html.headers['set-cookie'][2].split(';')[0];
      cookie = `${cookie1}; ${cookie2}; ${cookie3};`;
    }

    if (html) {
      this.executeCommentCallback(html.data, cookie, callback);
    }
  }

  public async execute() {
    const html = await this.getHtml();
    let A = 4;
    let B = 10;
    this.endc =
      this.endc > 800 / A ? B * 20 : this.endc;
    A = 0;
    B = 0;
    let cookie = '';
    if (!this.isBrowser) {
      const cookie1 = html.headers['set-cookie'][0].split(';')[0];
      const cookie2 = html.headers['set-cookie'][1].split(';')[0];
      const cookie3 = html.headers['set-cookie'][2].split(';')[0];
      cookie = `${cookie1}; ${cookie2}; ${cookie3};`;
    }
    if (html) {
      return await this.executeComment(html.data, cookie);
    }
    return null;
  }

  public getLastError() {
    return this.lastError;
  }
}

export default VideoCommentCrawling;
