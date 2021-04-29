# Sandbox Youtube Comment Crawling
![alt text](https://raw.githubusercontent.com/jisueo/sycl-sample/master/sd_min.png) Youtube video comment crawling module just crawling web page (SYC)

* **pure crawling youtube video site and public api**
* **this module do not use headless browser, just use ajax.**
* **this module can get comment from video website**
* **this module do not use youtube/google api, don't worry google api quota**

**Sample Code**
-

- [Sample nodejs code](https://github.com/jisueo/sycl-sample)

**Install**
-
```
npm install sandbox-youtube-comments
```
- this module name is **SYC**

**Support features:**
-

- Get comments from youtube video web site
- this SYC don't use headless browser and selector library like cheerio or scrapy, just use ajax, so fast and light
    - use public youtube API: https://www.youtube.com/comment_service_ajax
- this works on nodejs and electron
    - unfortunately, not support common modern browser because CORS or SOP error
- Typescript support

**Dependency:**
-
- axios
- form-data

**SYC APIS**
-
* SYCL Funcitons(Typescript)
    **comment crawling** : return all comments
    ```ts
    import {crawling, crawlingCallback} from 'sandbox-youtube-comments';
    const result = await crawling('QIccu1Ge-mc', 20);
    ```
    - crawling(videoid: string, limit: number)
        - videoID: Youtube video id
        - limit: how many comment

    **comment crawling callback**: when each comments obtain from youtube api, callback is called. commonly 20 comments are obtained at once  
    - if you want 200 comment, callback is called 10 times approximately 
    ```ts
    import {crawlingCallback} from 'sandbox-youtube-comments';
     crawlingCallback('QIccu1Ge-mc', 1, (arr, end) => {
     });
    ```
    - crawlingCallback(videoid: string, limit: number, callback: (results, end))
        - videoID: Youtube video id
        - limit: how many comment
        - callback
            - results: comments
            - end: is end or not

* SYCL Funcitons(Nodejs)
 **comment crawling** : return all comments
    ```js
    const syc = require('sandbox-youtube-comments');

    async function test() {
        const result = await syc.crawling('ONpwVdyngpY', 30);
        console.log(result);    
    }
    ```
* Output
    - output data is string[][], 
    - each comment is splited '\n'
    - if string[0] is ['ABCD', '\n', 'EFGH], this comment present in site like
    ```
    ABCD
    EFGH
    ```

    - example 7 comments
    ```
    [
        [ 'Sandbox network ct dev team' ],
        [ 'WOW!!!' ],
        [ 'Que clipe' ],
        [ 'wow....wonderfull' ],
        [
            '“We are literally strong.'
        ],
        [
            "Popular opinion"
        ],
        [
            'this is',
            '\n',
            '\n',
            'Me: ',
            '*almost broke my leg*'
        ],
    ]
    ```
   
**SYC LICENSE**
- SANDBOX NETWORK ISC
```
Copyright (c) 2021 year, Sandboxnetwork Inc CT-DEV

Permission to use, copy, modify, and/or distribute this software for any purpose with or without fee is hereby granted, provided that the above copyright notice and this permission notice appear in all copies.

THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT, INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR PERFORMANCE OF THIS SOFTWARE.
```