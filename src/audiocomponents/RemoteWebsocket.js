

class RemoteWebSocket {
    constructor(url, name, callbacks) {
        this.url = url;
        this.socket = null;
        this.name = name;
        this.callbacks = callbacks;
    }

    updateURL(url) {
        this.url = url;
    }

    connect() {
        console.log("connecting to " + this.url)
        this.socket = new WebSocket(this.url);

        this.socket.addEventListener('open', this.onOpen.bind(this));
        this.socket.addEventListener('message', this.onMessage.bind(this));
        this.socket.addEventListener('close', this.onClose.bind(this));
        this.socket.addEventListener('error', this.onError.bind(this));

    }

    isConnected() {
        if (this.socket === null){
            return false
        }
        return this.socket.readyState === WebSocket.OPEN;
    }
    isDisconnected() {
        if (this.socket === null){
            return true
        }
        return this.socket.readyState === WebSocket.CLOSED;
    }

    send(data) {
        if (this.socket.readyState === WebSocket.OPEN) {
            this.socket.send(data);
        } else {
            console.error('WebSocket is not open');
        }
    }

    close() {
        this.socket.close();
    }

    onOpen(event) {
        console.log(`WebSocket connection established for ${this.name}`);
        this.send(RemoteWebSocket.initMsg(this.name));
        if (this.callbacks.onOpen !== undefined) {
            this.callbacks.onOpen(event);
        }
    }

    onMessage(event) {
        console.log(`Received message for ${this.name}: ${event.data}`);
        if (this.callbacks.onMessage !== undefined) {
            this.callbacks.onMessage(event);
        }
    }

    onClose(event) {
        console.log(`WebSocket connection closed for ${this.name}`);
        if (this.callbacks.onClose !== undefined) {
            this.callbacks.onClose(event);
        }
    }

    onError(event) {
        console.error(`WebSocket error for ${this.name}:`, event);
        if (this.callbacks.onError !== undefined) {
            this.callbacks.onError(event);
        }
    }

    // Convenience functions for generating JSON message strings
    static initMsg(name) {
        return JSON.stringify({"type": "init", "id": name});
    }

    static textMsg(text) {
        return JSON.stringify({"type": "text", "payload": text});
    }

    static commandMsg(command) {
        return JSON.stringify({"type": "command", "payload": command});
    }

    static statusMsg(status) {
        return JSON.stringify({"type": "status", "payload": status});
    }

}

class RemoteDeviceSimulator {
    constructor(name, callbacks,ip) {
        this.name = name;
        let callbacks2 = {}
        callbacks2.onMessage = this.onMessage.bind(this);
        this.remoteWebSocket = new RemoteWebSocket(ip, name, callbacks2);
    }

    connect() {
        this.remoteWebSocket.connect();
    }

    send(data) {
        this.remoteWebSocket.send(data);
    }

    close() {
        this.remoteWebSocket.close();
    }

    onMessage(event) {
        const data =JSON.parse(event.data)

        if ((data.type === "command") && (data.payload === "saveRecord")) {
            console.log(`saveRecord sending for ${this.name}`);
            
            this.send(JSON.stringify({"type": "saveResult", "id": this.name, "payload": "+++RecordingData+++"}));
        }
    }

    simulate_connect() {
        // connect to the server and wait for init
        this.connect();
    }

    simulate_send_master_startRecord() {
        this.startRecording();
        this.send(JSON.stringify({"type": "master_command", "id": this.name, "payload": "startRecord"}))
    }

    simulate_send_master_stopRecord() {
        this.stopRecording();
        this.send(JSON.stringify({"type": "master_command", "id": this.name, "payload": "stopRecord"}))
    }

    simulate_send_master_prepareRecord() {
        this.send(JSON.stringify({"type": "master_command", "id": this.name, "payload": "prepareRecord"}))
    }

    simulate_master() {
        setTimeout(this.simulate_send_master_prepareRecord.bind(this), 2000);
        setTimeout(this.simulate_send_master_startRecord.bind(this), 3000);
        setTimeout(this.simulate_send_master_stopRecord.bind(this), 4000);
    }

}

export {RemoteDeviceSimulator};
export default RemoteWebSocket;