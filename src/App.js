import { BrowserRouter, Switch } from 'react-router-dom';
import { Link, Route } from 'react-router-dom';
import SegmentComponent from './components/SegmentComponent.js';
import CombineComponent from './components/CombineComponent.js';
import './App.css';

function App() {
  return (
    <div className="App">
      <h1>Home</h1>
      <BrowserRouter>
        <ul>
          <li><Link to="/api/process-interval">Segment Videos</Link></li>
          <li><Link to="/api/combine-video">Combine Videos</Link></li>
        </ul>
        <Switch>
          <Route path="/api/process-interval" component={SegmentComponent}/>
          <Route path="/api/combine-video" component={CombineComponent}/>
        </Switch>
      </BrowserRouter>
    </div>
  );
}

export default App;
