import RemoteWebSocket from "./RemoteWebsocket.js";
import AudioRecorder from "./AudioRecorder.js";


class RemoteMaster{
    constructor(url, callbacks) {
        const name = "master"
        this.name = name;
        this.RemoteWebSocket = new RemoteWebSocket(url, name, callbacks);
        this.uiCallbacks = {}

        // states
        const validState = ["idle", "start-waiting", "recording", "stop-waiting", "idle"]
        this.state = "idle"
        this.connectedDevices = []
        this.syncronizationBeep = new Audio(window.location.origin + "/Typist/440hz.ogg")
        this.syncronizationBeep.onpause = () => {
            this.syncronizationBeep.currentTime = 0
        }
        console.log("created new Play!")

        this.syncronizationBeep.loop = true
        

        this.expDetails = {
            "participantID": null,
            "sessionID": null,
            "word":null,
            "ip": window.location.hostname, "port": 8001
        }

        const WebSocketCallbacks = {
            onMessage: this.onWebsocketMessage.bind(this),
            onOpen: this.onWebsocketOpen.bind(this),
        }
        
        this.RemoteWebSocket = new RemoteWebSocket(url, name, WebSocketCallbacks);
    }
    // websocket Message Handler
    hookUiCallback(callbackID,callback){
        this.uiCallbacks[callbackID] = callback
    }
    callUICallback(callbackID){
        const state = {
            connectionStatus: this.RemoteWebSocket.isConnected(),
            state: this.state,
            connectedDevices: this.connectedDevices,
            expDetails: this.expDetails
        }
        if (this.uiCallbacks[callbackID] !== null){
            this.uiCallbacks[callbackID](state)
        }
    }
    updateURL(url) {
        this.RemoteWebSocket.updateURL(url);
    }

    onWebsocketOpen(event) {
        this.callUICallback("deviceContainer")
    }

    onWebsocketMessage(event) {
        const data =JSON.parse(event.data)
        if (data.type === "master_reply") {
            // TODO: implement this
            if (data.payload === "prepareRecordOK") {
                this.handlePrepareRecordOK()
                this.callUICallback("recordingButton")
            }
            else if (data.payload === "startRecordOK") {
                this.handleStartRecordOK()
                this.callUICallback("recordingButton")
            }
            else if (data.payload === "stopRecordOK") {
                this.handleStopRecordOK()
                this.callUICallback("recordingButton")
            }
            else if (data.payload === "updateConnectedDevice") {
                this.handleUpdateConnectedDevice(data.devices)
                this.callUICallback("deviceContainer")
            }
            else {
                console.log(`Unknown master reply: ${data}`)
            }
        } else {
            console.log(`Unknown message type: ${data}`)
        }

    }

    // sending Commands
    sendStartRecord(details) {
        if (details === undefined){
            details = this.expDetails
            if (details["participantID"] === null || details["sessionID"] === null || details["word"] === null){
                console.log("Unable to Record! No Details")
                this.callUICallback("recordingButton")
                return false
            }
            if (details["participantID"] === undefined || details["sessionID"] === undefined || details["word"] === undefined){
                console.log("Unable to Record! No Details")
                this.callUICallback("recordingButton")
                return false
            }
        } 

        console.log(`Sending start command with details: ${JSON.stringify(details)}`)

        if (this.RemoteWebSocket.isConnected() !== true) {
            console.log("Unable to Record! Not connected")
            this.callUICallback("recordingButton")
            return false
        }

        if (this.state === 'idle'){
            console.log(`Sending start command`)
            const msg = JSON.stringify({"type": "master_command", "id": this.name, "payload": "startRecord", "details": details});
            this.RemoteWebSocket.send(msg)
            this.state = 'start-waiting'
            this.callUICallback("recordingButton")
            return true
        }

        else if ( this.state !== 'idle') {
            console.log(`Unable to start recording. Current state is ${this.state}`)
            this.callUICallback("recordingButton")
            return false
        } else {
            console.log(`Unable to start recording. Weird State ${this.state}`)
            this.callUICallback("recordingButton")
            return false
        }
    }
    
    sendStopRecord() {
        if (this.RemoteWebSocket.isConnected() !== true) {
            console.log("Unable to Stop Record! Not connected")
            this.callUICallback("recordingButton")
            return false
        }
        
        if (this.state !== 'recording') {
            console.log(`Unable to stop recording. Current state is ${this.state}`)
            this.callUICallback("recordingButton")
            return false
        } else {
            console.log(`Sending stop command`)
            this.syncronizationBeep.pause()
            const msg = JSON.stringify({"type": "master_command", "id": this.name, "payload": "stopRecord"});
            this.RemoteWebSocket.send(msg)
            this.state = 'stop-waiting'
            this.callUICallback("recordingButton")
        }
    }

    sendReset(){
        console.log("reset not implemented yet!")
    }

    setSessionDetails(details) {
        // deprecate this Send on startRecord instead

        if (this.RemoteWebSocket.isConnected() !== true) {
            console.log("Unable to set session details! Not connected")
            return false
        }
        
        if (this.state !== 'idle') {
            console.log(`Unable to set session details. Current state is ${this.state}`)
            return false
        } else {
            console.log(`Sending session details: ${JSON.stringify(details)}`)
            const msg = JSON.stringify({"type": "master_command", "id": this.name, "payload": "setSessionDetails", "details": details});
            this.RemoteWebSocket.send(msg)
            this.expDetails = details
        }
    }


    // recordingHandler
    handlePrepareRecordOK() {
        console.log("handlePrepareRecordOK not implemented yet! (it's okay tho)")
    }

    handleStartRecordOK() {
        if (this.state !== 'start-waiting') {
            console.log(`Unable to start recording for OK. Current state is ${this.state}`)
        } else {
            this.state = 'recording'
            this.syncronizationBeep.play()
            console.log(`Recording started`)
        }

    }
    handleStopRecordOK() {
        if (this.state !== 'stop-waiting') {
            console.log(`Unable to stop recording. Current state is ${this.state}`)
        } else {
            this.state = 'idle'
            console.log(`Recording Done!`)
        }
    }

    // state Management
    handleUpdateConnectedDevice(newConnectedDevices){
        this.connectedDevices = {...newConnectedDevices}
        // for printing
        let printStr = '===Current Connections===\n'
        const devs = Object.entries(this.connectedDevices)
        for (const [name, state] of devs) {
            printStr += `${name}--> `
            const state_props = Object.entries(state)
            for (const [key, value] of state_props) {
                printStr += `${key} : ${value} `
            }
            printStr += '\n'
        }

        console.log(`Set Connected Devices: ${printStr}`)
    }
    
    connect(){
        this.RemoteWebSocket.connect();
    }


}


class RemoteAudioDeviceClient{
    constructor(url, name, callbacks, video=false) {
        //

        const WebSocketCallbacks = {
            onMessage: this.onWebsocketMessage.bind(this),
            onOpen: this.onWebsocketOpen.bind(this),
            onError : this.onError.bind(this),
        }

        const AudioRecorderCallbacks = {
            onStartRecording: this.onStartRecording.bind(this),
            onStopRecording: this.onStopRecording.bind(this),
            onSendRecordingToServer: this.onSendRecordingToServer.bind(this),
            onError : this.onError.bind(this),
            onInitMediaStream: this.onInitMediaStream.bind(this),
        }

        this.AudioRecorder = new AudioRecorder(AudioRecorderCallbacks,video);   
        this.RemoteWebSocket = new RemoteWebSocket(url, name, WebSocketCallbacks);
        this.name = name
        this.uiCallbacks = {}

    }

    hookUiCallback(callbackID,callback){
        this.uiCallbacks[callbackID] = callback
    }
    callUICallback(callbackID){
        const state = {
            name: this.name,
            connectionStatus: this.RemoteWebSocket.isConnected(),
            state: this.AudioRecorder.state,
            extra: this.AudioRecorder.extra,
            error: this.AudioRecorder.error
        }
        if (this.uiCallbacks[callbackID] !== null){
            this.uiCallbacks[callbackID](state)
        }
    }

    onInitMediaStream(event){
        this.callUICallback("global")
    }

    onWebsocketOpen(event) {
        this.callUICallback("global")
    }
    // websocket Message Handler
    onWebsocketMessage(event) {
        const data =JSON.parse(event.data)
        if ((data.type === "command")){
            if (data.payload === "startRecord") {
                this.AudioRecorder.startRecording(data.details);
            }
            else if (data.payload === "stopRecord") {
                this.AudioRecorder.stopRecording();
            }
            else if (data.payload === "prepareRecord") {
                // do nothing
            }
            else if (data.payload === "saveRecord") {
                // return the results
                
                const meta = {deviceID: this.name,audioRecorderState:this.AudioRecorder.state,extra:this.AudioRecorder.extra }
                const res = this.AudioRecorder.sendRecordingToServer(meta)
            }
            this.callUICallback("global")
        }
    }

    onStartRecording() {
        const msg = JSON.stringify({"type": "command_reply", "id": this.name, "payload": "startRecordOK"});
        console.log(msg)
        this.RemoteWebSocket.send(msg);
        this.callUICallback("global")
    }

    onStopRecording() {
        const msg = JSON.stringify({"type": "command_reply", "id": this.name, "payload": "stopRecordOK"});

        // potentially save to local storage here

        this.RemoteWebSocket.send(msg);
        this.callUICallback("global")
    }

    onSendRecordingToServer(data) {
        // yeah i know, inconsistent naming
        const msg = JSON.stringify({"type": "saveResult", "id": this.name, "payload": data});
        this.RemoteWebSocket.send(msg);
        this.callUICallback("global")
    }

    onError(errMsg) {
        this.callUICallback("global")
        const msg = JSON.stringify({"type": "command_reply", "id": this.name, "payload": errMsg});
        this.RemoteWebSocket.send(msg);
        // this.callUICallback("global")
    }

    connect(){
        this.RemoteWebSocket.connect();
    }
    
    startAudioService(){
        this.AudioRecorder.initMediaStream()
    }

}
export default RemoteAudioDeviceClient;
export {RemoteMaster, RemoteAudioDeviceClient};
