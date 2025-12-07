import {useState, useEffect} from "react"
import {useNavigate} from "react-router-dom";
import axios from "axios";
import ThemeInput from "./ThemeInput.jsx";
import LoadingStatus from "./LoadingStatus.jsx";
import {API_BASE_URL} from "../util.js";

function StoryGenerator() {
    const navigate = useNavigate()
    const [theme, setTheme] = useState("")
    const [jobId, setJobId] = useState(null)
    const [jobStatus, setJobStatus] = useState(null)
    const [error, setError] = useState(null)
    const [loading, setLoading] = useState(false)

    // --- FIX 1: UPDATE THE STATUS CHECK ---
    // Now we check for "pending" OR "processing"
    const isPolling = jobStatus === "pending" || jobStatus === "processing";

    useEffect(() => {
        let pollInterval;

        // Start loop if we have an ID and the status is active (pending/processing)
        if (jobId && isPolling) {
            pollInterval = setInterval(() => {
                pollJobStatus(jobId)
            }, 5000)
        }

        return () => {
            if (pollInterval) clearInterval(pollInterval)
        }
    }, [jobId, jobStatus]) // Dependency array handles the updates

    const generateStory = async (theme) => {
        setLoading(true)
        setError(null)
        setTheme(theme)

        try {
            // Added timeout to prevent early frontend aborts
            const response = await axios.post(
                `${API_BASE_URL}/stories/create`, 
                {theme},
                { timeout: 120000 }
            )
            
            // --- FIX 2: USE THE EXACT KEY FROM YOUR SCREENSHOT ---
            const { job_id, status } = response.data
            
            if (!job_id) throw new Error("No job_id received")

            setJobId(job_id)
            setJobStatus(status) // This will be "pending", which triggers the useEffect now
            
        } catch (e) {
            setLoading(false)
            setError(`Failed to generate story: ${e.message}`)
        }
    }

    const pollJobStatus = async (id) => {
        try {
            const response = await axios.get(`${API_BASE_URL}/jobs/${id}`)
            const {status, story_id, error: jobError} = response.data
            
            console.log("Polling status:", status); // Debug log
            setJobStatus(status)

            if (status === "completed" && story_id) {
                fetchStory(story_id)
            } else if (status === "failed" || jobError) {
                setError(jobError || "Failed to generate story")
                setLoading(false)
            }
            // If status is still "pending" or "processing", the useEffect loop keeps going automatically
        } catch (e) {
            if (e.response?.status !== 404) {
                setError(`Failed to check story status: ${e.message}`)
                setLoading(false)
            }
        }
    }

    const fetchStory = async (id) => {
        try {
            setLoading(false)
            setJobStatus("completed")
            navigate(`/story/${id}`)
        } catch (e) {
            setError(`Failed to load story: ${e.message}`)
            setLoading(false)
        }
    }

    const reset = () => {
        setJobId(null)
        setJobStatus(null)
        setError(null)
        setTheme("")
        setLoading(false)
    }

    return (
        <div className="story-generator">
            {error && <div className="error-message">
                <p>{error}</p>
                <button onClick={reset}>Try Again</button>
            </div>}

            {!jobId && !error && !loading && <ThemeInput onSubmit={generateStory}/>}

            {loading && <LoadingStatus theme={theme} />}
        </div>
    )
}

export default StoryGenerator