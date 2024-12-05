// ==UserScript==
// @name         YouTube播放进度记忆
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  记录和恢复播放进度
// @author       hhst
// @match        https://www.youtube.com/watch?v=*
// @match        https://m.youtube.com/watch?v=*
// @run-at       document-start
// @icon         https://www.google.com/s2/favicons?sz=64&domain=youtube.com
// @grant        GM_getValue
// @grant        GM_setValue
// @license      MIT
// ==/UserScript==

(function() {
    'use strict';

    // return the youtube video id like 'A9oByH9Ci24'
    const get_video_id = (url) => {
        try {
            const match = url.match(/watch\?v=([^&#]+)/)
            return match ? match[1] : null
        } catch (error) {
            console.error('Error getting video ID:', error)
            return null
        }
    }

    const observer = new MutationObserver((mutationsList) => {
        for (const mutation of mutationsList) {
            if (mutation.type === 'childList') {
                mutation.addedNodes.forEach((node) => {
                    if (node.nodeType === 1 && node.classList.contains('video-stream')){
                        console.log("准备记录...")
                        // memory progress
                        node.addEventListener('timeupdate', () => {
                            if (node.currentTime !== 0){
                                GM_setValue('progress-' + get_video_id(location.href), node.currentTime.toString())
                            }
                        })
                    }

                    if (node.id === 'movie_player') {
                        window.last_player_state = -1
                        node.addEventListener('onStateChange', (data) => {
                            /* 根据youtube iframe开发文档: https://developers.google.com/youtube/iframe_api_reference:
                            onStateChange
                            此事件在每次播放器的状态改变时触发。 API传递给事件监听器函数的事件对象的data属性会指定一个与新播放器状态相对应的整数。 可能的值包括：
                            -1（未开始）
                            0（已结束）
                            1（正在播放）
                            2（已暂停）
                            3（正在缓冲）
                            5（视频已插入）
                            */ 
                            if(data in [1 , 3] && window.last_player_state === -1 ){
                                console.log("准备恢复...")
                                // resume progress
                                // get the last progress time, default 0
                                const saved_time = GM_getValue('progress-' + get_video_id(location.href)) || '0'
                                console.log("恢复到", saved_time)
                                node.seekTo(parseInt(saved_time))
                            }
                            window.last_player_state = data
                        })
                    }
                })
            }
        }
    })

    observer.observe(document.documentElement, {
        childList: true,
        subtree: true
    })

})();