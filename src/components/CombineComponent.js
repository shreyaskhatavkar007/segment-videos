import React, {useState, useEffect} from 'react';
import axios from 'axios';

function CombineComponent() {
    const [message, setDisplayMessage] = useState(' ');
    const [rows, setRows] = useState([]);
    const [videos, setVideos] = useState('');

    useEffect(() => {
        axios.get('http://localhost:8080/api/combine-video')
    }, []);

    const addNewRow = () => {
        setDisplayMessage('');
        var index = rows.length;
        var element = <div className="group" key={index}>
            <input name="url" className={"combine-video-" + index} type="text" placeholder="Video Link" required=""/>
            <input name="startDuration" className={"commonStart combine-video-range-duration-start-" + index} type="number" placeholder="Start (in seconds)" required=""/>
            <input name="endDuration" className={"commonEnd combine-video-range-duration-end-" + index} type="number" placeholder="End (in seconds)" required=""/>
            <button onClick={deleteRow} type="button" className={"commonDelete delete-combine-video-range-duration-" + index}>Delete</button>
        </div>;
        setRows(state  => [...state, element])
    }

    const deleteRow = (index) => {
        console.log(index);
    }

    const handleSubmit = (e) => {
        e.preventDefault();
        var i, data = [], children = e.target.children;
        for (i = 0; i < children.length - 1; i++) {
            data.push(
                {
                    "url": children[i].children[0].value,
                    "startDuration": children[i].children[1].value,
                    "endDuration": children[i].children[2].value,
                }
            );
        }
        setDisplayMessage(' ');
        axios.post('http://localhost:8080/api/combine-video', data)
        .then((res) => {
            var videoData = res.data[0];
            var elem = <video crossOrigin="anonymous" className= "combined-video" width="500" height="500" controls>
                        <source src={videoData.video_url} className="combined-video-source" type="video/mp4"/>
                    </video>
                
            setVideos(elem);
            setDisplayMessage('');
        })
        .catch(err => {
            setDisplayMessage(err.response.data);
        });
    };

    return (
        <div>
            <h2>Combine Video</h2>
            <div className="group">
                <button onClick={addNewRow} type="click" id="addVideoBtn" className="add-video">Add Video</button>
            </div>
            <form onSubmit={handleSubmit}>
                {rows.map(elem => elem)}
                <div className="group">
                    <button disabled = {message !== ''} type="submit" id="combineVideoBtn" className="combine-video">Combine Video</button>
                </div>
            </form>
            <div className="group">
                {message}
            </div>
            <div className="group">
                {videos}
            </div>
        </div>
    )
}

export default CombineComponent
