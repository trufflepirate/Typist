import './App.css';
import NavigationBar from './components/NavigationBar';
import { TextWritingArea } from './components/TextWritingArea';
// import 
import { debug_init } from './utilities';
import { StateHandler } from "./StateHandler";


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
    return "kek"

  } else if(location === "/Typist/RemoteRecorder"){
    return "lmao"

  } else {
    return "default"
  }
}

function App() {
  console.log(window.location.pathname)
  return oneTimeLocationCheckbecauseImNotGoingtoUseReactRouter()
}

export default App;
