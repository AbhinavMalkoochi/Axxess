import type React from "react"
import { Textarea } from "./ui/textarea"
interface AudioSummaryProps {
    summary: string
}

const AudioSummary: React.FC<AudioSummaryProps> = ({ summary }) => {
    return (
        <div className="mt-4">
            <h4 className="mb-2 font-medium">AI Analysis Summary</h4>
            <Textarea
                value={summary}
                readOnly
                placeholder="Audio analysis will appear here..."
                className="h-24 resize-none"
            />
        </div>
    )
}

export default AudioSummary

