const robots = {
    input: require('./robots/input.js'),
    text: require('./robots/text'),
    state: require('./robots/state'),
    image: require('./robots/image'),
    video: require('./robots/video'),
    youtube: require('./robots/youtube')
}

async function start() {

    robots.input.inputRobot()
    await robots.text.textRobot()
    await robots.image.imageRobot()
    await robots.video.videoRobot()
    await robots.youtube.youtubeRobot()

}

start()









