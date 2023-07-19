import './App.css';
import NavigationBar from './components/NavigationBar';
import { TextWritingArea } from './components/TextWritingArea';
import AudioRecorderReact from './audiocomponents/AudioRecorderReact';
import {RemoteDeviceRecorder} from './audiocomponents/AudioRecorderReact';
// import 
import { debug_init } from './utilities';
import { StateHandler } from "./StateHandler";
import {RemoteMaster, RemoteAudioDeviceClient} from "./audiocomponents/RemoteRecordingDevice.js"

function parseURL(host,port){
  return "ws://"+host+":"+port
}

function oneTimeLocationCheckbecauseImNotGoingtoUseReactRouter(){
  const location = window.location.pathname
  if(location === "/" || location === "/Typist"){
    const components = (
      <div>
        <NavigationBar></NavigationBar>
        <TextWritingArea/>
      </div>
    )
    return components
  } else if (location === "/Typist/RecordMaster"){
    const cbacks = {}
    const master = new RemoteMaster(parseURL('localhost', 8001),"master", cbacks );
    return <AudioRecorderReact audioBackend = {master}/>

  } else if(location === "/Typist/RemoteRecorder"){
    const urlParams = new URLSearchParams(window.location.search);
    const ip = urlParams.get('ip') || null
    const port = urlParams.get('port') || null
    const name = urlParams.get('name') || null

    if (ip === null || port === null){
      return <div className=' text-2xl text-red-600'>"Error: ip or port not specified"</div>
    }

    const client = new RemoteAudioDeviceClient(parseURL(ip, port), name)
    return <RemoteDeviceRecorder audioBackend = {client} />

  } else {
    return "default"
  }
}

function App() {
  console.log(window.location.pathname)
  return oneTimeLocationCheckbecauseImNotGoingtoUseReactRouter()
}

export default App;
