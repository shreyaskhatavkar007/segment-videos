import React, {useState,useEffect} from 'react';
import axios from 'axios';
import validator from 'validator'

function SegmentComponent() {
    const [message, setDisplayMessage] = useState(' ');
    const [url, setUrl] = useState('');
    const [duration, setDuration] = useState('');
    const [videos, setVideos] = useState([]);

    useEffect(() => {
        axios.get('http://localhost:8080/api/process-interval')
    }, []);

    function setUrlFunc(value) {
        if (validator.isURL(value)) {
            setUrl(value);
            setDisplayMessage('');
        } else {
            setDisplayMessage('Not a Valid URL');
        }
    }

    function setDurationFunc(value) {
        if (value > 0) {
            setDuration(value);
            setDisplayMessage('');
        } else {
            setDisplayMessage('Duration should be greater than zero');
        }
    }

    const handleSubmit =async (e) => {
        let data = {
            "video_link": url, 
            "interval_duration": duration
        };
        setDisplayMessage(' ');
        axios.post('http://localhost:8080/api/process-interval', data)
        .then((res) => {
            var elems = [];
            res.data.map(videoData => {
                return elems.push(
                    <video crossOrigin="anonymous" className= {"segmented-video-source-" + videoData.index} width="500" height="500" controls>
                        <source src={videoData.video_url} className={"segmented-video-source-" + videoData.index} type="video/mp4"/>
                    </video>
                );
                
            })
            setVideos(elems);
            setDisplayMessage('');
        })
        .catch(err => {
            setDisplayMessage(err.response.data);
        });
    };

    return (
        <div>
            <h2>Segment Video</h2>
                <div className="group">
                    <input name="video_link" className="video-link" type="text" id="videoLink" placeholder="Video Link" required="" onChange={e => setUrlFunc(e.target.value)}/>
                </div>
                <div className="group">
                    <select name="segmentSetting" id="segmentSetting">
                        <option value="duration">Interval Duration</option>
                    </select>
                </div>
                <div className="group">
                    <input name="interval_duration" className="interval-duration" type="number" id="intervalDuration" onChange={e => setDurationFunc(e.target.value)} placeholder="Interval Duration (in seconds)..." required=""/>
                </div>
                <div className="group">
                    <button onClick={handleSubmit} type="submit" id="segmentVideo" className="process-video" disabled = {message !== ''}>Segment Video</button>
                </div>
            <div>
                {message}
            </div>
            <div className="group">
                {videos.map(elem => elem)}
            </div>
        </div>
    )
}

export default SegmentComponent
