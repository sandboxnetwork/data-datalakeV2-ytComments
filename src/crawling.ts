import axios from 'axios';
import * as FormDataNode from 'form-data';

export interface iComments {
  count?: number;
  comments: Array<string>;
  continuation?: string;
  nextTrack?: string;
  token: string;
}

export interface iCommentConfig {
  token: string;
  apikey: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  context: any;
  clientVersion: string;
  clientName: string;
}

export interface iContinuationConfig {
  endpoint: {
    sendPost: boolean;
    apiUrl: string;
  };
  command: {
    token: string;
    request: string;
  };
  clickTrackingParams: string;
}

export type CommentCallback = (arr: string[], end: boolean) => void;

export class VideoCommentCrawling {
  private vidoeId: string;
  private limit: number;
  private YOUTUBE_CONFIG_VARIABLE_NAME = 'ytcfg.set';
  private comments = [];
  constructor(videoId: string, commentCount = 200) {
    this.vidoeId = videoId;
    this.limit = commentCount;
  }

  private async getHtml() {
    try {
      const result = await axios.get(
        `https://www.youtube.com/watch?v=${this.vidoeId}`
      );
      return result;
    } catch (error) {
      return null;
    }
  }

  decodeUnicode(unicodeString) {
    const r = /\\u([\d\w]{4})/gi;
    unicodeString = unicodeString.replace(r, (match, grp) => {
      return String.fromCharCode(parseInt(grp, 16));
    });
    return unescape(unicodeString);
  }

  private analizeContinuationsInfo(data: string): iContinuationConfig | null {
    try {
      const findIndex = data.indexOf('ytInitialData = ');
      if (findIndex >= 0) {
        const InitText = data.slice(findIndex);
        const initDatas = InitText.match(new RegExp(' = ({.*?});', 'ig'));
        if (initDatas && initDatas.length > 0) {
          const ytInitialData = JSON.parse(initDatas[0].slice(3).slice(0, -1));
          const ytContents =
            ytInitialData.contents.twoColumnWatchNextResults.results.results
              .contents;
          let commentItemSection = null;
          ytContents.forEach(item => {
            if (item.itemSectionRenderer !== undefined) {
              const identifier = item.itemSectionRenderer.sectionIdentifier;
              if (identifier === 'comment-item-section') {
                commentItemSection = item.itemSectionRenderer;
              }
            }
          });

          const commentContents = commentItemSection.contents;
          if (commentContents && commentContents.length > 0) {
            const continuationItem =
              commentContents[0].continuationItemRenderer;
            const endpoint =
              continuationItem.continuationEndpoint.commandMetadata
                .webCommandMetadata;
            const command =
              continuationItem.continuationEndpoint.continuationCommand;

            const contiuation: iContinuationConfig = {
              endpoint: endpoint,
              command: command,
              clickTrackingParams: commentItemSection.trackingParams,
            };
            return contiuation;
          }
        }
      }
    } catch (e) {
      throw 'Youtube api contination extract fail';
    }
  }

  private analizeCommentConfigExtract(data: string): iCommentConfig | null {
    try {
      const findIndex = data.indexOf('ytcfg.set({"CLIENT_CANARY_STATE');
      if (findIndex >= 0) {
        const cfgText = data.slice(findIndex);
        const cfgDatas = cfgText.match(
          new RegExp(this.YOUTUBE_CONFIG_VARIABLE_NAME + '\\(({.*?})\\);', 'ig')
        );

        if (cfgDatas && cfgDatas.length > 0) {
          const cfgJsonText = cfgDatas[0].slice(10).slice(0, -2);
          const cfgInfos = JSON.parse(cfgJsonText);
          const configInfo: iCommentConfig = {
            token: cfgInfos.XSRF_TOKEN,
            apikey: cfgInfos.INNERTUBE_API_KEY,
            context: cfgInfos.INNERTUBE_CONTEXT,
            clientVersion: cfgInfos.INNERTUBE_CLIENT_VERSION,
            clientName: cfgInfos.INNERTUBE_CONTEXT_CLIENT_NAME,
          };
          return configInfo;
        }
        return null;
      }
    } catch (e) {
      throw 'Youtube api config extract fail';
      return null;
    }
  }

  private async extractComment(
    config: iCommentConfig,
    continuation: iContinuationConfig,
    isFirst: boolean,
    callback: CommentCallback | null
  ) {
    try {
      const endpoint = continuation.endpoint;
      const clickTrackingParams = continuation.clickTrackingParams;
      const command = continuation.command;

      const CommentUrl = `https://www.youtube.com${endpoint.apiUrl}?key=${config.apikey}`;
      const requestBody = {
        continuation: command.token,
        context: {
          client: config.context.client,
          user: config.context.user,
          request: config.context.request,
          clickTracking: {
            clickTrackingParams: clickTrackingParams,
          },
        },
      };
      const requestHeader = {
        'Content-Type': 'application/json',
        'x-youtube-client-name': config.clientName,
        'x-youtube-client-version': config.clientVersion,
      };

      const result = await axios({
        method: 'post',
        url: CommentUrl,
        data: requestBody,
        headers: requestHeader,
      });
      if (result.status === 200) {
        const nextCommentData = result.data;
        let responseRecievedEndPoint = null;
        let continuationItems = null;
        if (isFirst) {
          responseRecievedEndPoint =
            nextCommentData.onResponseReceivedEndpoints;
          continuationItems =
            responseRecievedEndPoint[1].reloadContinuationItemsCommand
              .continuationItems;
        } else {
          responseRecievedEndPoint =
            nextCommentData.onResponseReceivedEndpoints;
          continuationItems =
            responseRecievedEndPoint[0].appendContinuationItemsAction
              .continuationItems;
        }

        const comments = [];
        let nextClickTrack = null;
        let nextEndpoint = null;
        let nextCommend = null;

        continuationItems.forEach(item => {
          const commentThreadRenderer = item.commentThreadRenderer;
          const continuationItemRenderer = item.continuationItemRenderer;
          if (commentThreadRenderer) {
            const commentRenderer =
              commentThreadRenderer.comment.commentRenderer;
            const commentTextRuns = commentRenderer.contentText.runs;
            const comment = commentTextRuns.map(runs => runs.text).join('');
            comments.push(comment);
          } else if (continuationItemRenderer) {
            nextClickTrack =
              continuationItemRenderer.continuationEndpoint.clickTrackingParams;
            nextEndpoint =
              continuationItemRenderer.continuationEndpoint.commandMetadata
                .webCommandMetadata;
            nextCommend =
              continuationItemRenderer.continuationEndpoint.continuationCommand;
          }
        });
        this.comments = this.comments.concat(comments);

        if (this.comments.length >= this.limit || !nextClickTrack) {
          if (this.comments.length >= this.limit) {
            const gapCount = this.comments.length - this.limit;
            this.comments = this.comments.slice(0, this.limit);
            if (callback) {
              callback(comments.slice(0, gapCount), true);
            }
          } else {
            if (callback) {
              callback(comments, true);
            }
          }
          return this.comments;
        }
        if (callback) {
          callback(comments, false);
        }
        return this.extractComment(
          config,
          {
            endpoint: nextEndpoint,
            command: nextCommend,
            clickTrackingParams: nextClickTrack,
          },
          false,
          callback
        );
      }
    } catch (e) {
      throw 'Extract comment error';
    }
  }

  private async *extractCommentItorable(
    config: iCommentConfig,
    continuation: iContinuationConfig,
    isFirst: boolean
  ) {
    try {
      const endpoint = continuation.endpoint;
      const clickTrackingParams = continuation.clickTrackingParams;
      const command = continuation.command;

      const CommentUrl = `https://www.youtube.com${endpoint.apiUrl}?key=${config.apikey}`;
      const requestBody = {
        continuation: command.token,
        context: {
          client: config.context.client,
          user: config.context.user,
          request: config.context.request,
          clickTracking: {
            clickTrackingParams: clickTrackingParams,
          },
        },
      };
      const requestHeader = {
        'Content-Type': 'application/json',
        'x-youtube-client-name': config.clientName,
        'x-youtube-client-version': config.clientVersion,
      };

      const result = await axios({
        method: 'post',
        url: CommentUrl,
        data: requestBody,
        headers: requestHeader,
      });
      if (result.status === 200) {
        const nextCommentData = result.data;
        let responseRecievedEndPoint = null;
        let continuationItems = null;
        if (isFirst) {
          responseRecievedEndPoint =
            nextCommentData.onResponseReceivedEndpoints;
          continuationItems =
            responseRecievedEndPoint[1].reloadContinuationItemsCommand
              .continuationItems;
        } else {
          responseRecievedEndPoint =
            nextCommentData.onResponseReceivedEndpoints;
          continuationItems =
            responseRecievedEndPoint[0].appendContinuationItemsAction
              .continuationItems;
        }

        const comments = [];
        let nextClickTrack = null;
        let nextEndpoint = null;
        let nextCommend = null;

        continuationItems.forEach(item => {
          const commentThreadRenderer = item.commentThreadRenderer;
          const continuationItemRenderer = item.continuationItemRenderer;
          if (commentThreadRenderer) {
            const commentRenderer =
              commentThreadRenderer.comment.commentRenderer;
            const commentTextRuns = commentRenderer.contentText.runs;
            const comment = commentTextRuns.map(runs => runs.text).join('');
            comments.push(comment);
          } else if (continuationItemRenderer) {
            nextClickTrack =
              continuationItemRenderer.continuationEndpoint.clickTrackingParams;
            nextEndpoint =
              continuationItemRenderer.continuationEndpoint.commandMetadata
                .webCommandMetadata;
            nextCommend =
              continuationItemRenderer.continuationEndpoint.continuationCommand;
          }
        });
        this.comments = this.comments.concat(comments);

        if (this.comments.length >= this.limit || !nextClickTrack) {
          const gepCount = this.comments.length - this.limit;
          this.comments = this.comments.slice(0, this.limit);
          yield comments.slice(0, gepCount);
          return;
        }

        yield comments;

        yield* this.extractCommentItorable(
          config,
          {
            endpoint: nextEndpoint,
            command: nextCommend,
            clickTrackingParams: nextClickTrack,
          },
          false
        );
      }
    } catch (e) {
      throw 'Extract comment error';
    }
  }

  public async executeComment(
    data: string,
    callback: CommentCallback | null = null
  ) {
    const config = this.analizeCommentConfigExtract(data);
    const continuation = this.analizeContinuationsInfo(data);
    return this.extractComment(config, continuation, true, callback);
  }

  public executeCommentItorable(data: string) {
    const config = this.analizeCommentConfigExtract(data);
    const continuation = this.analizeContinuationsInfo(data);
    return this.extractCommentItorable(config, continuation, true);
  }

  public async executePatialItorator() {
    const html = await this.getHtml();
    if (html) {
      return this.executeCommentItorable(html.data);
    } else {
      throw 'Can not get video page';
    }
  }
  public async executePatialCallback(callback: CommentCallback = null) {
    const html = await this.getHtml();
    if (html) {
      return await this.executeComment(html.data, callback);
    } else {
      throw 'Can not get video page';
    }
  }

  public async execute() {
    const html = await this.getHtml();
    if (html) {
      return await this.executeComment(html.data);
    } else {
      throw 'Can not get video page';
    }
  }
}

export default VideoCommentCrawling;
