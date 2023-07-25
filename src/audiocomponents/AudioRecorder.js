import { saveAs } from 'file-saver';


function checkMIMETYPES() {
    const VIDEO_TYPES = ['webm', 'mp4', 'x-matroska', 'ogg'];
    const AUDIO_TYPES = ['webm', 'mp3', 'mp4', 'x-matroska', 'ogg', 'wav'];

    const VIDEO_CODECS = ['vp9', 'vp9.0', 'vp8', 'vp8.0', 'avc1', 'av1', 'h265', 'h.265', 'h264', 'h.264', 'mpeg', 'theora'];
    const AUDIO_CODECS = ['opus', 'vorbis', 'aac', 'mpeg', 'mp4a', 'pcm'];

    const results = []

    const testType = (mimeType) => {
        if (MediaRecorder.isTypeSupported(mimeType)) {
            console.log(` ${mimeType}`);
            results.push(mimeType)
        }
    };

    console.log();
    console.log('Supported Video MIME Types:');

    for (let i = 0; i < VIDEO_TYPES.length; ++i) {
        const videoType = VIDEO_TYPES[i];
        for (let j = 0; j < VIDEO_CODECS.length; ++j) {
            const videoCodec = VIDEO_CODECS[j];
            testType(`video/${videoType};codecs=${videoCodec}`);
        }
    }

    console.log();
    console.log('Supported Audio MIME Types:');

    for (let i = 0; i < AUDIO_TYPES.length; ++i) {
        const audioType = AUDIO_TYPES[i];
        for (let j = 0; j < AUDIO_CODECS.length; ++j) {
            const audioCodec = AUDIO_CODECS[j];
            testType(`audio/${audioType};codecs=${audioCodec}`);
        }
    }

    console.log();
    console.log('Supported Video/Audio MIME Types:');

    for (let i = 0; i < VIDEO_TYPES.length; ++i) {
        const videoType = VIDEO_TYPES[i];
        for (let j = 0; j < VIDEO_CODECS.length; ++j) {
            const videoCodec = VIDEO_CODECS[j];
            for (let k = 0; k < AUDIO_CODECS.length; ++k) {
                const audioCodec = AUDIO_CODECS[k];
                testType(`video/${videoType};codecs=${videoCodec},${audioCodec}`);
            }
        }
    }

    console.log();
    console.log('Supported Other MIME Types:');

    testType('video/webm');
    testType('video/x-matroska');
    testType('video/webm;codecs=vp8,vp9,opus');
    testType('video/webm;codecs=h264,vp9,opus');
    testType('audio/webm');
    return results
}

class AudioRecorder {
    constructor(callbacks, video = false) {
        //media strea
        this.recorder = null;
        this.doVideo = video

        //states
        this.audioChunks = [];
        this.results = null;
        this.state = "pre-init"
        this.videoState = "pre-init"

        this.metadata = {}
        this.callbacks = callbacks;
        this.extra = {}
        this.error = []

        // this.extra.supportedTypes = checkMIMETYPES()

    }

    initMediaStream() {
        if (this.state !== "pre-init") {
            console.log(`Cannot Initialize Media Stream: ${this.state}`);
            return;
        }
        this.state = "initializing";
        console.log("Initializing Audio Recorder Media Stream");
        try {
            navigator.mediaDevices.enumerateDevices().then(devices => {
                // const audioDevices = devices.filter(device => device.kind === 'audioinput');
                const audioDevices = devices
                this.extra.devices = audioDevices
                const SpeakerPhone = devices.filter(device => device.label === 'Speakerphone')
                const Earpiece = devices.filter(device => device.label === 'Headset earpiece')
                
                const special = devices.filter(device => device.deviceId === '1a58e267d93a4668c66e214b992f99c648388ec75155a3ff5e715f4ab1d97839')

                let preferredDevice = 'default'
                let deviceId = 'default'


                if (SpeakerPhone.length > 0) {
                    preferredDevice = 'Speakerphone'
                    deviceId = SpeakerPhone[0].deviceId
                } else if (Earpiece.length > 0) {
                    preferredDevice = 'Headset earpiece'
                    deviceId = Earpiece[0].deviceId
                } else if (special.length > 0) {
                    preferredDevice = 'special'
                    deviceId = special[0].deviceId
                }
                this.extra.preferredDevice = { preferredDevice: preferredDevice, deviceId: deviceId }

                console.log(audioDevices)
            }).then(() => {
                const dev = this.extra.preferredDevice
                const audioConstraints = {
                    deviceId: { ideal: dev.deviceId },
                    sampleRate: { 'ideal': 48000 },
                    sampleSize: { 'ideal': 16 },
                    channelCount: { 'ideal': 2 },
                    echoCancellation: { 'exact': false },
                    autoGainControl: { 'exact': false },
                    noiseSuppression: { 'exact': false },
                }

                const videoConstraints = {
                    width: { 'ideal': 1080 },
                    height: { 'ideal':  1920},
                    frameRate: { 'ideal': 60 },
                    facingMode: { "ideal": "environment" },

                }

                if (this.doVideo) {
                    return navigator.mediaDevices.getUserMedia(
                        { audio: audioConstraints, video: videoConstraints }
                    )
                } else {
                    return navigator.mediaDevices.getUserMedia(
                        { audio: audioConstraints, video: false }
                    )
                }
            }).then(stream => {
                // this function callback for post initialization
                const streamSettings = stream.getAudioTracks().map(track => track.getSettings())
                const capabilities = stream.getAudioTracks().map(track => track.getCapabilities())
                this.extra.StreamAudioCapabilities = capabilities
                this.extra.StreamAudioSettings = streamSettings

                //video settings
                if (this.doVideo) {
                    const streamSettings = stream.getVideoTracks().map(track => track.getSettings())
                    const capabilities = stream.getVideoTracks().map(track => track.getCapabilities())
                    this.extra.StreamVideoCapabilities = capabilities
                    this.extra.StreamVideoSettings = streamSettings
                }


                // checking MIME TYPES Audio
                this.extra.MIMEOPTIONS={}
                if (!this.doVideo) {
                    const prefferedAudioTypes = ['audio/webm;codecs=opus']
                    for (let i = 0; i < prefferedAudioTypes.length; i++) {
                        if (MediaRecorder.isTypeSupported(prefferedAudioTypes[i])) {
                            const AudioMIMEOPTIONS = { mimeType: prefferedAudioTypes[i] }
                            this.extra.MIMEOPTIONS = AudioMIMEOPTIONS
                            break
                        }

                    }
                } else if (this.doVideo) {
                    // checking MIME TYPES Video
                    const prefferedVideoTypes = ['video/webm;codecs=vp9,opus','video/webm;codecs=h264,opus','video/webm;codecs=vp9.0,opus','video/webm;codecs=vp8,opus','video/webm;codecs=vp8.0,opus']
                    for (let i = 0; i < prefferedVideoTypes.length; i++) {
                        if (MediaRecorder.isTypeSupported(prefferedVideoTypes[i])) {
                            const VideoMIMEOPTIONS = { mimeType: prefferedVideoTypes[i] }
                            this.extra.MIMEOPTIONS = {...VideoMIMEOPTIONS,...{bitsPerSecond:250000}}
                            break
                        }
                    }
                }
                this.recorder = new MediaRecorder(stream, this.extra.MIMEOPTIONS);
                this.extra.MIMEOPTIONS = {mimeType: this.recorder.mimeType}

                // hooking out handlers for the audio device
                this.recorder.addEventListener('start', () => {
                    this.onStartRecording();
                });

                this.recorder.addEventListener('stop', () => {
                    this.onStopRecording();
                });

                this.recorder.addEventListener('dataavailable', event => {
                    if (this.state === "recording") {
                        this.audioChunks.push(event.data);
                    }
                });

                this.state = "ready";
                console.log(`Audio Recorder Media Stream Initialized!`);
                if (this.callbacks.onInitMediaStream !== undefined) {
                    this.callbacks.onInitMediaStream();
                }
            })
        } catch (myerr) {
            console.error(myerr);
            this.error.push(myerr.toString());
            this.callbacks.onError(myerr)
        }
    }

    resetBuffers() {
        this.audioChunks = [];
        this.results = null;
        this.metadata = {}
        this.extra.details = undefined
    }

    onStartRecording() {
        this.state = "recording";
        this.metadata["start"] = Date.now();
        if (this.callbacks.onStartRecording !== undefined) {
            this.callbacks.onStartRecording();
        }
        console.log("Media Recorder started Recording");
    }

    startRecording(details) {
        if ((this.state === "ready") && (this.recorder !== null)) {
            this.resetBuffers();
            this.extra.details = details
            this.recorder.start();
            return true;
        } else {
            const errMsg = `Cannot Start Recording: ${this.state}`;
            console.log(errMsg);
            this.callbacks.onError(errMsg)
            return false;
        }
    }

    onStopRecording() {
        this.state = "stopping";
        this.metadata["stop"] = Date.now();
        console.log("Stopping recording");

        // wrapping File
        try {
            const audioBlob = new Blob(this.audioChunks);
            const reader = new FileReader();
            reader.readAsDataURL(audioBlob);
            reader.onloadend = () => {

                const base64Audio = reader.result;

                console.log("Audio Recording Complete");
                // console.log(`Data: ${base64Audio}`);

                // update state
                this.results = base64Audio;
                this.state = "awaiting-retrieval";
                if (this.doVideo || true) {
                    var vid = new Blob([this.results], {type: "text/plain;charset=utf-8"})
                    if (this.extra.details !== undefined) {
                        // {"participantID":self.session_participant_name,"sessionID":self.session_id,"word":self.session_word}
                        const c_pid = this.extra.details.participantID
                        const c_sid = this.extra.details.sessionID
                        const c_word = this.extra.details.word
                        const c_word_instance_id = this.extra.details.wordInstanceID
                        saveAs(vid, `${c_pid}_${c_sid}_${c_word}_${c_word_instance_id}.cache`);
                    }
                    
                }


                if (this.callbacks.onStopRecording !== undefined) {
                    this.callbacks.onStopRecording();
                }
            }
        } catch (err) {
            console.error(err);
            this.error.push(err.toString());
            this.callbacks.onError(err)
        }

    }

    stopRecording() {
        if (this.state === "recording") {
            this.recorder.stop();
            return true;
        } else {
            const errMsg = `Cannot Stop Recording: ${this.state}`;
            console.log(errMsg);
            this.callbacks.onError(errMsg)
            return false;
        }
    }

    sendRecordingToServer(additionalMetadata) {
        if (this.state === "awaiting-retrieval") {
            // send to server
            console.log("Sending recording to server");

            // adding data 
            const data = { 'metadata': this.metadata }
            if (this.doVideo) {
                // Video Takes to long to transfer
                // just Send the metadata
                data['video'] = this.results
            } else {
                data['audio'] = this.results
            }

            if (additionalMetadata !== undefined) {
                data['metadata'] = { ...data['metadata'], ...additionalMetadata }
            }

            if (this.callbacks.onSendRecordingToServer !== undefined) {
                this.callbacks.onSendRecordingToServer(data);
            }

            // reset
            this.resetBuffers();
            this.state = "ready";
            return true

        } else {
            const errMsg = `Cannot Send Recording: ${this.state}`;
            console.log(errMsg);
            this.callbacks.onError(errMsg)
            return false
        }
    }

    playCurrentRecording() {
        if ((this.results) && (this.state === "awaiting-retrieval")) {
            const data = this.result.split(',')[1]
            const audio = new Audio(`data:audio/wav;base64,${data}`);
            audio.play();
        } else {
            console.log("No recording to play");
        }
    }
}

export default AudioRecorder;
