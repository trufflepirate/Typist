import React, { useCallback, useState } from 'react';
import {QRCodeSVG} from 'qrcode.react';

const RecordingButtonContainer = (props) => {
    const [recording, setRecording] = useState(false)
    
    const updateStateReal = (newstate) => {
        // const state = {
        //     connectionStatus: this.RemoteWebSocket.isConnected(),
        //     state: this.state,
        //     connectedDevices: this.connectedDevices,
        //     expDetails: this.expDetails
        // }
        
        const recstate = newstate.state
        if (recstate === "recording"){
            setRecording(true)
        } else {
            setRecording(false)
        }
    }
    props.audioBackend.hookUiCallback("recordingButton", updateStateReal)
    
    const recBtnCallback = useCallback(() => {
        if (props.audioBackend.state === "recording"){
            props.audioBackend.sendStopRecord()
        } else {
            props.audioBackend.sendStartRecord()
        }}
    ,[props.audioBackend])

    return <RecordingButton onClick={recBtnCallback} recording={recording}/>
}

const RecordingButton = (props) => {
    const btnColor  = props.recording? "bg-slate-500" : "bg-red-500 animate-pulse"
    const disabled = props.recording? "disabled" : ""
    
    return (
        <div className={`btn relative w-32 h-32 m-2 btn-circle ${btnColor} ${disabled}`} onClick={props.onClick}>
            <div className="absolute inset-0 flex items-center justify-center text-white font-bold text-4xl">
                rec
            </div>
        </div>
    );
};

const WordCard = (props) => {
    // return a grey rounded cornder box with the word in it
    // this box should also display a count of how many times the word has been recorded
    // return props.word
    const onClick = () => {
        props.updateSelected({word:props.word})
    }

    const selected = props.word === props.picked
    const color = selected ? "text-red-500" : "text-gray-500"
    const classname = `flex-none max-w-fit select-none mx-1 text-3xl whitespace-pre-wrap break-words ${color}`
    return (
        <div className={classname} onClick={onClick}>
            <a className='m-0'>
                {props.word}
            </a>
            <a className="text-xs">
                {props.count}
            </a>
        </div>
    );
}

const WordsContainer = (props) => {

    const [state, updateState] = useState(
        {participantID: null, sessionID: null, word: null,
            ip: "localhost", port: 8001
        });
    const selected = state.word
    const session = state.sessionID
    const pid = state.participantID
    const ip = state.url
    const port = state.port
    
    const updateStateReal = useCallback((payload) => {
        const newExpData = props.audioBackend.expDetails = {...props.audioBackend.expDetails, ...payload}
        props.audioBackend.updateURL(`ws://${newExpData.ip}:${newExpData.port}`)
        console.log(newExpData)
        updateState(newExpData)
    },[props.audioBackend])
        


    const words = props.words;
    const wordCards = Object.keys(words).map((word) => {
        return <WordCard key={word} word={word} count={words[word]} updateSelected={updateStateReal} picked={selected} />;
    });
    // return a container that holds all the word cards
    // container should be scrollable
    // word cards should be arranged in a grid pattern
    return (
        <div>
            <div className='flex flex-col'>
                <div className='flex flex-row'>
                    <div className=' text-lg font-bold mx-1 text-red-500'>
                        {`Current Word: ${selected}`}
                    </div>
                    <div className='flex-1'/>
                    <div className='flex flex-row'>
                    <span className="label-text-alt">IP</span>
                    <input type="text" placeholder="IP" className="input w-full max-w-xs input-xs mx-2" onChange={(e)=>{updateStateReal({ip:e.target.value})}}/>
                    <span className="label-text-alt">Port</span>
                    <input type="text" placeholder="port" className="input w-full max-w-[5rem] input-xs" onChange={(e)=>{updateStateReal({port:e.target.value})}}/>
                    </div>
                </div>
                <div className='flex flex-row'>
                    <div className=' text-lg font-bold mx-1'>
                        {`Current Pid: ${pid}`}
                    </div>
                    <div className='flex-1'/>
                    <input type="text" placeholder="Pid" className="input w-full max-w-xs input-xs" onChange={(e)=>{updateStateReal({participantID:e.target.value})}}/>
                </div>
                <div className='flex flex-row'>
                    <div className=' text-lg font-bold mx-1 '>
                        {`Current Session: ${session}`}
                    </div>
                    <div className='flex-1'/>
                    <input type="text" placeholder="SessionID" className="input w-full max-w-xs input-xs" onChange={(e)=>{updateStateReal({sessionID:e.target.value})}} />
                </div>
            </div>
            <div className="grid grid-cols-4 gap-1 overflow-y-auto h-64">
                {wordCards}
            </div>
        </div>
    );
};

const QR_Actual = (props) => {
    return (
        <div className='flex justify-center items-center align-middle min-h-[320px] min-w-[320px] bg-white'>
        <QRCodeSVG value={props.finalURL} size={256}/>
        </div>
    )
}

const QRmodal = (props) => {
    const urlbase = props.audioBackend.RemoteWebSocket.url

    const [name, setName] = useState(null) 

    let finalURL = null
    if (name !== null){
        const org = window.location.origin + "/Typist/RemoteRecorder"
        finalURL = `${org}?ip=${props.audioBackend.expDetails.ip}&port=${props.audioBackend.expDetails.port}&name=${name}`
    }
    else {
        finalURL = `lolno`
    }
    

    return (
        <dialog id="my_modal_3" className="modal">
          <form method="dialog" className="modal-box">
            <h1 className="text-lg font-bold">Fill Device Name</h1>
            <button className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2">✕</button>
            <input type="text" placeholder="name" className="input w-full max-w-xs input-xs" onChange={(e)=>{setName(e.target.value)}}/>
            <QR_Actual finalURL={finalURL}/>
          </form>
        </dialog>
    )
}


const Device = ({ deviceName,connectionState}) => {

    const color = connectionState ? "text-green-500" : "text-red-500"
    const connectText = connectionState ? "Connected" : "Disconnected"

    return (
        <div className={`flex flex-col justify-center ${color}`}>
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-20 h-20">
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 1.5H8.25A2.25 2.25 0 006 3.75v16.5a2.25 2.25 0 002.25 2.25h7.5A2.25 2.25 0 0018 20.25V3.75a2.25 2.25 0 00-2.25-2.25H13.5m-3 0V3h3V1.5m-3 0h3m-3 18.75h3" />
                </svg>
            <span className="font-bold text-center">{deviceName}</span>
            <span className="font-bold text-center text-sm">{connectText}</span>
        </div>
    );
}

const DevicesContainer = (props) => {

    const audioBackend = props.audioBackend
    const [state, updateState] = useState({devices: {}, serverStatus: 'disconnected'});

    const updateStateReal = (newstate) => {
        // const state = {
        //     connectionStatus: this.RemoteWebSocket.isConnected(),
        //     state: this.state,
        //     connectedDevices: this.connectedDevices,
        //     expDetails: this.expDetails
        // }
        console.log(newstate)
        const devices = newstate.connectedDevices
        const serverStatus = newstate.connectionStatus ? "connected" : "disconnected"
        updateState({devices: devices, serverStatus: serverStatus})
    }
    audioBackend.hookUiCallback("deviceContainer", updateStateReal)
    
    const devices = state.devices
    const serverStatus = state.serverStatus
    
    const connect = useCallback(() => {
        if (serverStatus !== "disconnected") {
            return 
        }
        audioBackend.connect()
    },[serverStatus])

    
    const serverStatusColor = serverStatus === "connected" ? "text-green-500" : "text-red-500"
    const deviceCards = Object.keys(devices).map((id) => {
        const conn = devices[id]["connectionState"] === "connected"
        return <Device key={id} deviceName={id} connectionState={conn}/>;
    });

    const qrModal = QRmodal({state:state, audioBackend:audioBackend})
    
    return (
        <div className='flex flex-col m-3 items-center'>
            {qrModal}
            <span className='' onClick={connect}> 
                <a className=' text-xl font-bold text-center'> Server Status:</a>
                <a className={` text-xl font-bold text-center ${serverStatusColor}`}> {serverStatus} </a>
            </span>
            <span>
                <button className="text-m font-bold text-center" onClick={()=>window.my_modal_3.showModal()}>show QR </button>
            </span>
            <div className="flex flex-row justify-center space-x-4 overflow-x-auto py-2">
                {deviceCards}
            </div>
        </div>
    );
};

const RemoteDeviceRecorder = (props) => {

    const audioBackend = props.audioBackend
    const [state, updateState] = useState({
        connectionStatus: false,
        state: 'pre-init'
    });

    const updateStateReal = (newstate) => {
        // const state = {
                // name: audioBackend.name,
        //     connectionStatus: this.RemoteWebSocket.isConnected(),
        //     state: this.AudioRecorder.state
        // }
        console.log("updated State")
        updateState(newstate)
    }
    audioBackend.hookUiCallback("global", updateStateReal)

    
    
    if (state.error !== null && state.error !== undefined){
        const stateJson = JSON.stringify(state,null,4)
        const currentLocation = window.location.origin
        // 
        //test
        // chrome://flags/#unsafely-treat-insecure-origin-as-secure

        return (
            <div className={`w-min-[100%] h-min-[100%]`}>
                <div className='text-m whitespace-pre-wrap'>{stateJson}</div>
                <br></br>
                <div className=' text-m whitespace-pre-wrap'>{`CurrentLocation:\n`}</div>
                <div className=' text-l whitespace-pre-wrap'>{currentLocation}</div>
                <a className="text-l link" href="chrome://flags/#unsafely-treat-insecure-origin-as-secure" target="_blank">Link To Enable Secure Context</a>
            </div>
        )
    }

    

    if (audioBackend.RemoteWebSocket.isDisconnected()){
        audioBackend.connect()
    }
    if (audioBackend.AudioRecorder.state==="pre-init"){
        audioBackend.startAudioService()
    }   

    const stateJson = JSON.stringify(state,null,4)
    const colors = state.state=='recording' ? "bg-red-500":"bg-slate-800" 
    return (
        <div className={`w-min-[100%] h-min-[100%]   ${colors}`}>
            <div className=' text-m whitespace-pre-wrap'>{stateJson}</div>
        </div>
            
    )
}


const AudioRecorderReact = (props) => {
    const audioBackend= props.audioBackend
    const recBtn = RecordingButtonContainer({audioBackend:audioBackend});

    const wordsBase = ["use","any","there","see","only","so","his","when","contact","here","business"]

    let words  = {}
    for (let i = 0; i < wordsBase.length; i++) {
        words[wordsBase[i]] = 0
    }
    const wordsContainer = WordsContainer({audioBackend:audioBackend,words: words})
    // const qrModal = QRmodal({audioBackend:audioBackend})
    const devicesContainer = DevicesContainer({audioBackend:audioBackend})
    return (
        <div  className='flex flex-col items-center'> 
            {/* {qrModal} */}
            {wordsContainer}
            {devicesContainer}
            {recBtn}
        </div>
        )
}

export { AudioRecorderReact, RecordingButton, WordsContainer, DevicesContainer ,RemoteDeviceRecorder}
export default AudioRecorderReact;
