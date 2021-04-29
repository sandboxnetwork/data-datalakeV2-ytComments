# Sandbox Youtube Comment Crawling Lite
![alt text](https://raw.githubusercontent.com/jisueo/sycl-sample/master/sd_min.png) Youtube video comment crawling module just crawling web page (SYCL)

* **pure crawling youtube video site and public api**
* **this module do not use headless browser, just use ajax.**
* **this module can get 200 comment from video website**
* **this module Do not use youtube/google api, don't worry google api quota**
* this is lite version. lite version just support 200 comments
* pro-version(unlimited comments crawling) is planned

**Sample Code**
-

- [Sample nodejs code](https://github.com/jisueo/sycl-sample)

**Install**
-
```
npm install sandbox-youtube-comments-lite
```
- this module name is **SYCL**

**Support features:**
-

- Get comments from youtube video web site
- this SYCL don't use headless browser and selector library like cheerio or spider, just use ajax, so fast and light
    - use public youtube API: https://www.youtube.com/comment_service_ajax
- this works in nodejs and electron
    - unfortunately, not support common modern browser because CORS or SOP error
- Typescript support

**Dependency:**
-
- axios
- form-data

**SYCL APIS**
-
* SYCL Funcitons(Typescript)
    **comment crawling** : return all comments
    ```ts
    import {crawling, crawlingCallback} from 'sandbox-youtube-comments-lite';
    const result = await crawling('QIccu1Ge-mc', 20);
    ```
    - crawling(videoid: string, limit: number)
        - videoID: Youtube video id
        - limit: how many comment, this lite version can get 200 comment max 

    **comment crawling callback**: when Each comments obtain from youtube api,  callback is called. commonly 20 comments are obtained at once  
    - if you want 200 comment, callback is called 20 times approximately 
    ```ts
    import {crawlingCallback} from 'sandbox-youtube-comments-lite';
     crawlingCallback('QIccu1Ge-mc', 1, (arr, end) => {
     });
    ```
    - crawlingCallback(videoid: string, limit: number, callback: (results, end))
        - videoID: Youtube video id
        - limit: how many comment, this lite version can get 200 comment max 
        - callback
            - results: comments
            - end: is end or not

* SYCL Funcitons(Nodejs)
 **comment crawling** : return all comments
    ```js
    const sycl = require('sandbox-youtube-comments-lite');

    async function test() {
        const result = await sycl.crawling('ONpwVdyngpY', 30);
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
   
**SYCL LICENSE**
- SANDBOX NETWORK ISC
```
Copyright (c) 2021 year, Sandboxnetwork Inc CT-DEV

Permission to use, copy, modify, and/or distribute this software for any purpose with or without fee is hereby granted, provided that the above copyright notice and this permission notice appear in all copies.

THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT, INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR PERFORMANCE OF THIS SOFTWARE.
```