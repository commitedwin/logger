let lastTime = 0

document.addEventListener('mousemove', function(event) {
    const now = Date.now()
    
    if (now - lastTime > 500){
        console.log('mouse at', event.clientX, event.clientY)
        lastTime = now
    }
})

document.addEventListener('visibilitychange', function() {
    if (document.visibilityState === 'hidden') {
        console.log('User left tab')
    } else {
        console.log('User came back')
    }
    
})

document.addEventListener('copy', function() {
    console.log('user copied something')
})

document.addEventListener('paste', function() {
    console.log('user pasted something')
})

window.addEventListener('focus', function() {
    console.log('window is focused')
})

window.addEventListener('blur', function() {
    console.log('window lost focus')
})

console.log('screen size', screen.width, 'x', screen.height)
console.log('language', navigator.language)
console.log('platform', navigator.platform)