import './App.css';
import NavigationBar from './components/NavigationBar';
import { debug_init } from './utilities';
import { TextWritingArea } from './components/TextWritingArea';
import { StateHandler } from "./StateHandler";


function App() {
  return (
    <div>
    <NavigationBar ></NavigationBar>
    <TextWritingArea />
    </div>
  );
}

export default App;
