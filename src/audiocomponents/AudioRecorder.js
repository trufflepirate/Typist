class AudioRecorder {
    constructor(callbacks) {
        //media strea
        this.recorder = null;

        //states
        this.audioChunks = [];
        this.results = null;
        this.state = "pre-init"
        this.metadata = {}
        this.callbacks = callbacks;
        this.extra = {}
        this.error = null

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
                const audioDevices = devices.filter(device => device.kind === 'audioinput');
                this.extra.devices = audioDevices
                console.log(audioDevices)
            })
            navigator.mediaDevices.getUserMedia(
                { audio: {
                    sampleRate: {'ideal': 48000},
                    sampleSize: {'ideal': 16},
                    channelCount: {'ideal': 2},
                    echoCancellation: {'exact': false},
                    autoGainControl: {'exact': false},
                    noiseSuppression: {'exact': false},
                }}
                )
                .then(stream => {
                    // this function callback for post initialization
                    const streamSettings = stream.getAudioTracks()[0].getSettings()
                    const capabilities = stream.getAudioTracks()[0].getCapabilities()
                    this.extra.capabilities = capabilities
                    this.extra.streamSettings = streamSettings
    
    
                    this.metadata["streamSettings"] = streamSettings;
    
                    this.recorder = new MediaRecorder(stream);
                    
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
                }).then(() => {});         
        } catch (myerr) {
            console.error(myerr);
            this.error = myerr.toString();
            this.callbacks.onError(myerr)
        }
    }

    resetBuffers(){
        this.audioChunks = [];
        this.results = null;
        this.metadata = {}
    }

    onStartRecording() {
        this.state = "recording";
        this.metadata["start"] = new Date().toString();
        if (this.callbacks.onStartRecording !== undefined) {
            this.callbacks.onStartRecording();
        }
        console.log("Media Recorder started Recording");
    }

    startRecording() {
        if ((this.state === "ready") && (this.recorder !== null)) {
            this.resetBuffers();            
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
        this.metadata["stop"] = new Date().toString();
        console.log("Stopping recording");

        // wrapping File
        const audioBlob = new Blob(this.audioChunks);
        const reader = new FileReader();
        reader.readAsDataURL(audioBlob);
        reader.onloadend = () => {
            // process Results
            // const base64AudioTuple = reader.result.split(',');
            // const base64Audio = base64AudioTuple[1];

            const base64Audio = reader.result;

            console.log("Audio Recording Complete");
            // console.log(`Data: ${base64Audio}`);

            // update state
            this.results = base64Audio;
            this.state = "awaiting-retrieval";

            if (this.callbacks.onStopRecording !== undefined) {
                this.callbacks.onStopRecording();
            }
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
            // console.log(`Data: ${this.results}`);
            const data = {'audio': this.results, 'metadata': this.metadata}
            
            if (additionalMetadata !== undefined) {
                data['metadata'] = {...data['metadata'], ...additionalMetadata}
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
        if ((this.results) && (this.state === "awaiting-retrieval") ) {
            const data = this.result.split(',')[1]
            const audio = new Audio(`data:audio/wav;base64,${data}`);
            audio.play();
        } else {
            console.log("No recording to play");
        }
    }
    }

export default AudioRecorder;
