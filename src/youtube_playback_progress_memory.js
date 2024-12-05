if (window.injected){
    return
}

const get_page_class = (url) => {
    url = url.toLowerCase()
    if (url.startsWith('https://m.youtube.com')) {
        if (url.includes('shorts')) {
            return 'shorts'
        }
        if (url.includes('watch')) {
            return 'watch'
        }
        if (url.includes('library')) {
            return 'library'
        }
        if (url.includes('subscriptions')) {
            return 'subscriptions'
        }
        if (url.includes('@')) {
            return '@'
        }
        return 'home'
    }
    return 'unknown'
}


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

                    // memory progress
                    node.addEventListener('timeupdate', () => {
                        if (node.currentTime !== 0){
                            localStorage.setItem('progress-' + get_video_id(location.href),
                            node.currentTime.toString())
                        }
                    })
                }
                
                if (node.id === 'movie_player') {
                    window.last_player_state = -1
                    node.addEventListener('onStateChange', (data) => {
                        if(data in [1, 3] && window.last_player_state === -1 && get_page_class(location.href) === 'watch'){
                            // resume progress
                            const saved_time = localStorage.getItem('progress-' + get_video_id(location.href)) || '0'
                            node.seekTo(parseInt(saved_time))
                        }
                        window.last_player_state = data
                    })
                } 
            })
        }
    }
})
observer.observe(document.body, {
    childList: true,
    subtree: true
})

window.injected = true