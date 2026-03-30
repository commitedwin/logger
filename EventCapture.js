function logEvent(message) {
    const log = document.getElementById('log')
    const time = new Date().toLocaleTimeString()
    log.innerHTML += `<p>${time} — ${message}</p>`
}

// load backend + browser info on startup
fetch('/BackendInfo')
    .then(response => response.json())
    .then(data => {
        logEvent(`IP: ${data.ip}`)
        logEvent(`User agent: ${data.userAgent}`)
        logEvent(`Language: ${data.language}`)
        logEvent(`Screen: ${screen.width} x ${screen.height}`)
        logEvent(`Timezone: ${Intl.DateTimeFormat().resolvedOptions().timeZone}`)
        logEvent(`Cores: ${navigator.hardwareConcurrency}`)
        logEvent(`Memory: ${navigator.deviceMemory}GB`)
    })

// mouse movement
let lastTime = 0
document.addEventListener('mousemove', function(event) {
    const now = Date.now()
    if (now - lastTime > 500) {
        logEvent(`mouse at ${event.clientX}, ${event.clientY}`)
        lastTime = now
    }
})

// tab visibility
document.addEventListener('visibilitychange', function() {
    if (document.visibilityState === 'hidden') {
        logEvent('user left tab')
    } else {
        logEvent('user came back')
    }
})

// copy paste
document.addEventListener('copy', function() { logEvent('user copied something') })
document.addEventListener('paste', function() { logEvent('user pasted something') })

// window focus
window.addEventListener('focus', function() { logEvent('window focused') })
window.addEventListener('blur', function() { logEvent('window lost focus') })

