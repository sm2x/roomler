module.exports = {
  url: 'wss://mcu.xplorify.net/janus_ws',
  iceServers: [{
    urls: 'turn:94.130.141.98:3478?transport=tcp', // process.env.TURN_URL || 'turn:numb.viagenie.ca',
    username: 'hammer', // process.env.TURN_USERNAME || 'webrtc@live.com',
    credential: 'somepassword' // process.env.TURN_PASSWORD || 'muazkh'
  }],
  plugins: {
    videoroom: 'janus.plugin.videoroom',
    textroom: 'janus.plugin.textroom',
    streaming: 'janus.plugin.streaming'
  },
  audioCodecs: ['opus', 'isac32', 'isac16', 'pcmu', 'pcma'],
  videoCodecs: ['vp8', 'vp9', 'h264']
}
