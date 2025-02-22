import type React from "react"
import { useRef } from "react"
import { Button } from "./ui/button"
import { Upload } from "lucide-react"

interface AudioUploaderProps {
    onUpload: (file: File) => void
}

const AudioUploader: React.FC<AudioUploaderProps> = ({ onUpload }) => {
    const fileInputRef = useRef<HTMLInputElement>(null)

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0]
        if (file) {
            onUpload(file)
        }
    }

    return (
        <div className="flex flex-col items-center space-y-4">
            <input type="file" accept="audio/*" onChange={handleFileChange} ref={fileInputRef} className="hidden" />
            <Button onClick={() => fileInputRef.current?.click()}>
                <Upload className="mr-2 h-4 w-4" /> Upload Audio
            </Button>
            <Button
                className="bg-black text-white hover:bg-gray-800"
            >
                Provide Summary
            </Button>
        </div>
    )
}

export default AudioUploader

