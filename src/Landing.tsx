"use client"

import { useState } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "./components/ui/avatar"
import { Button } from "./components/ui/button"
import { Calendar } from "./components/ui/calendar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./components/ui/card"
import { Input } from "./components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./components/ui/select"
import { Separator } from "./components/ui/separator"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "./components/ui/sheet"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./components/ui/tabs"
import { Bell, CalendarIcon, ChevronDown, MessageSquare, Search, Stethoscope, Users } from "lucide-react"
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"
import AudioSummary from "./components/AudioSummary"
import AudioUploader from "./components/AudioUploader"
import PrescribedMedications from "./components/Medications"

const data = [
    { date: "Jan 1", "Blood Pressure": 120, "Heart Rate": 80 },
    { date: "Jan 2", "Blood Pressure": 125, "Heart Rate": 82 },
    { date: "Jan 3", "Blood Pressure": 122, "Heart Rate": 79 },
    { date: "Jan 4", "Blood Pressure": 128, "Heart Rate": 85 },
    { date: "Jan 5", "Blood Pressure": 124, "Heart Rate": 81 },
]

export default function ProviderDashboard() {
    const [audioFile, setAudioFile] = useState<File | null>(null)
    const [audioSummary, setAudioSummary] = useState<string>("")
    // State for storing call summaries per patient update (keyed by index)
    const [callSummaries, setCallSummaries] = useState<{ [key: number]: string }>({})
    // State for tracking loading status per patient update
    const [callLoading, setCallLoading] = useState<{ [key: number]: boolean }>({})

    const handleAudioUpload = (file: File) => {
        setAudioFile(file)
        // Simulate audio analysis (replace with actual API call in production)
        setTimeout(() => {
            setAudioSummary(
                "Patient reports persistent cough and shortness of breath. Recommends follow-up chest X-ray and pulmonary function tests.",
            )
        }, 2000)
    }

    // The handleCall function uses a fixed phone number (for demo purposes).
    // It sends a call request and then, after a delay, fetches the call summary.
    const handleCall = async (index: number) => {
        // Mark this patient update as loading
        setCallLoading(prev => ({ ...prev, [index]: true }))

        // For demonstration, using a fixed phone number.
        const phoneNumber = "6307310098"
        const chatbotPrompt = `RRoles:\n\n    AI Assistant (You) – A virtual medical assistant that updates the patient on their condition, collects health updates, and books appointments.\n    Patient (User) – A patient calling to receive an update, discuss their condition, and potentially schedule an appointment.\n\nConversation Flow:\n1. Greet the Patient & Verify Identity\n\n    Start with a warm, professional greeting.\n    Verify the patient's name and confirm that they are ready to receive an update.\n    Ensure a calm and reassuring tone throughout the conversation.\n\nExample:\n💬 AI: \"Hello, this is your AI assistant from [Clinic Name]. Am I speaking with [Patient's Name]? I have your latest update from the doctor. Is this a good time to go over your condition and discuss any concerns you may have?\"\n2. Provide a Detailed Update on the Patient's Condition\n\n    Summarize the doctor's latest notes, including:\n        Current Diagnosis & Status – Any improvements or concerns noted.\n        Medication & Dosage Changes – Any new prescriptions or adjustments.\n        Treatment Plan Updates – Lifestyle changes, physical therapy, or dietary recommendations.\n        Next Steps – Whether further testing, check-ups, or precautions are necessary.\n    Provide reassurance and explain medical instructions clearly.\n\nExample:\n💬 AI: \"Based on your last appointment, your doctor noted that your recovery is progressing well. However, they still recommend continuing your current medication for another two weeks. They also mentioned that your inflammation levels have decreased slightly, but it's important to monitor any recurring symptoms. Additionally, they suggest light exercise such as short walks to aid circulation and energy levels. How have you been feeling since your last visit?\"\n3. Gather Patient Updates on Their Condition\n\n    Encourage the patient to describe their current symptoms and any noticeable changes since their last appointment.\n    Follow up based on their responses to get specific details.\n    Ask about daily activities, pain levels, sleep quality, appetite, mood, and side effects from medication.\n\nExample Questions:\n\n    \"Have you noticed any improvement or worsening of your symptoms?\"\n    \"Are you experiencing any side effects from your medication, such as nausea or dizziness?\"\n    \"How is your energy level throughout the day? Do you feel fatigued more often?\"\n    \"Has your sleep been restful, or are you waking up frequently?\"\n    \"Are you able to eat properly, or have you noticed any changes in appetite?\"\n\nExample Interaction:\n💬 Patient: \"I feel a little better, but I still have some fatigue, especially in the mornings.\"\n\n💬 AI: \"I'm glad you're seeing some improvement. Morning fatigue can sometimes be related to hydration, sleep quality, or medication side effects. Have you been sleeping well, or do you feel unrested when you wake up?\"\n\n💬 Patient: \"I wake up feeling tired, even if I sleep for a full 8 hours.\"\n\n💬 AI: \"That's important to note. Sometimes, this can indicate an issue with sleep quality rather than sleep duration. Have you experienced any trouble falling asleep or waking up in the middle of the night?\"\n\n💬 Patient: \"Not really, but I do feel sluggish for the first couple of hours after waking up.\"\n\n💬 AI: \"Understood. Your doctor might want to check if this is related to your medication or an underlying factor like low blood pressure in the morning. I'll make a note of that for your next visit. Are you experiencing any dizziness or headaches alongside the fatigue?\"\n4. Offer to Book an Appointment\n\n    Ask if the patient would like to schedule a follow-up appointment.\n    If they agree, ask for a preferred date and time (starting from February 22, 2025).\n    If their requested time is unavailable, suggest an alternative slot.\n    Confirm the booking and provide details.\n\nExample Interaction:\n💬 AI: \"Would you like to schedule a follow-up appointment to discuss your progress? The doctor is available starting from February 22, 2025.\"\n\n💬 Patient: \"Yes, I'd like to book one for February 24 at 10 AM.\"\n\n💬 AI: \"I've scheduled your appointment for February 24 at 10 AM with Dr. [Doctor's Name]. You will receive a confirmation text shortly. Would you like a reminder a day before your appointment?\"\n\n💬 Patient: \"Yes, that would be helpful.\"\n\n💬 AI: \"Great! I'll set up a reminder for you. Is there anything else I can assist you with today?\"\n5. End the Call with Reassurance\n\n    Provide a summary of key points discussed.\n    Offer any final reminders about their medication or treatment plan.\n    End on a supportive note.\n\nExample:\n💬 AI: \"To summarize, your doctor noted improvement but recommends continuing medication and monitoring fatigue levels. You mentioned experiencing morning sluggishness, which we've noted for discussion at your appointment on February 24 at 10 AM. Please continue with light exercise and stay hydrated. If you notice any sudden changes in your condition, feel free to reach out. Have a great day!\n
    `

        const options = {
            method: "POST",
            headers: {
                authorization:
                    "org_71429208a172f5e77eab330b5200fc8a123197d25094a20cdce5d22345279ea8045ab193cad162b8f8e869",
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                phone_number: phoneNumber,
                pathway_id: "f3678bfa-b298-41f8-b975-34207fc3b6a6",
                task: chatbotPrompt,
                voice: "evelyn",
                language: "en",
                record: true,
                metadata: {},
            }),
        }

        try {
            const response = await fetch("https://api.bland.ai/v1/calls", options)
            if (!response.ok)
                throw new Error(`Call initiation failed: ${response.statusText}`)

            const responseData = await response.json()
            if (!responseData.call_id) throw new Error("No call ID returned from API.")

            console.log("Call initiated:", responseData)
            const callId = responseData.call_id

            // After a delay, fetch the call details and update the summary for this update.
            setTimeout(async () => {
                try {
                    console.log("Fetching call details...")
                    const getOptions = {
                        method: "GET",
                        headers: { authorization: options.headers.authorization },
                    }
                    const detailsResponse = await fetch(
                        `https://api.bland.ai/v1/calls/${callId}`,
                        getOptions,
                    )
                    if (!detailsResponse.ok)
                        throw new Error(
                            `Failed to fetch call details: ${detailsResponse.statusText}`,
                        )
                    const detailsData = await detailsResponse.json()
                    console.log("Call Summary:", detailsData.summary)
                    // Update the call summary for this particular patient update
                    setCallSummaries(prev => ({ ...prev, [index]: detailsData.summary }))
                } catch (error: any) {
                    console.error("Error fetching call details:", error.message)
                    setCallSummaries(prev => ({
                        ...prev,
                        [index]: "Failed to retrieve call summary.",
                    }))
                } finally {
                    setCallLoading(prev => ({ ...prev, [index]: false }))
                }
            }, 60000) // Wait for 60 seconds before fetching call details
        } catch (error: any) {
            console.error("Error:", error.message)
            setCallSummaries(prev => ({ ...prev, [index]: error.message }))
            setCallLoading(prev => ({ ...prev, [index]: false }))
        }
    }

    return (
        <div className="flex min-h-screen bg-background">
            {/* Sidebar */}
            <div className="hidden w-72 flex-col border-r bg-muted/10 md:flex">
                <div className="p-6">
                    <div className="flex items-center gap-2">
                        <Stethoscope className="h-6 w-6 text-primary" />
                        <h2 className="text-lg font-semibold">MedCare Pro</h2>
                    </div>
                    <div className="mt-6">
                        <div className="relative">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                type="search"
                                placeholder="Search patients..."
                                className="w-full bg-background pl-8"
                            />
                        </div>
                    </div>
                    <nav className="mt-6 flex flex-col gap-4">
                        <div className="flex items-center gap-2">
                            <Users className="h-4 w-4" />
                            <span className="text-sm font-medium">Patients</span>
                        </div>
                        {/* Patient List */}
                        <div className="space-y-2">
                            {Array.from({ length: 5 }).map((_, i) => (
                                <Button
                                    key={i}
                                    variant="ghost"
                                    className="w-full justify-start gap-2 font-normal"
                                >
                                    <Avatar className="h-6 w-6">
                                        <AvatarImage src={`/placeholder.svg?height=32&width=32`} />
                                        <AvatarFallback>P{i + 1}</AvatarFallback>
                                    </Avatar>
                                    <span>Patient {i + 1}</span>
                                </Button>
                            ))}
                        </div>
                    </nav>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1">
                <header className="flex h-14 items-center gap-4 border-b bg-muted/10 px-6">
                    <Button variant="ghost" size="icon" className="md:hidden">
                        <ChevronDown className="h-4 w-4" />
                    </Button>
                    <div className="flex flex-1 items-center gap-4 md:gap-8">
                        <h1 className="text-lg font-semibold md:text-xl">
                            Provider Dashboard
                        </h1>
                        <nav className="flex items-center gap-2">
                            <Button variant="ghost" className="hidden md:inline-flex">
                                Overview
                            </Button>
                            <Button variant="ghost" className="hidden md:inline-flex">
                                Patients
                            </Button>
                            <Button variant="ghost" className="hidden md:inline-flex">
                                Calendar
                            </Button>
                        </nav>
                    </div>
                    <div className="flex items-center gap-4">
                        <Button variant="ghost" size="icon">
                            <Bell className="h-4 w-4" />
                        </Button>
                        <Avatar>
                            <AvatarImage src="/placeholder.svg?height=32&width=32" />
                            <AvatarFallback>DR</AvatarFallback>
                        </Avatar>
                    </div>
                </header>

                <main className="flex-1 space-y-4 p-6 md:p-8">
                    <div className="grid gap-4 md:grid-cols-3">
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">
                                    Total Patients
                                </CardTitle>
                                <Users className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">245</div>
                                <p className="text-xs text-muted-foreground">
                                    +4 from last week
                                </p>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">
                                    Appointments Today
                                </CardTitle>
                                <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">12</div>
                                <p className="text-xs text-muted-foreground">
                                    2 urgent consultations
                                </p>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Messages</CardTitle>
                                <MessageSquare className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">18</div>
                                <p className="text-xs text-muted-foreground">
                                    6 unread messages
                                </p>
                            </CardContent>
                        </Card>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                        <Card className="md:col-span-4">
                            <CardHeader>
                                <CardTitle>Patient Health Trends</CardTitle>
                                <CardDescription>
                                    Monitor vital signs and health metrics over time
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="h-[200px]">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <LineChart data={data}>
                                            <XAxis
                                                dataKey="date"
                                                stroke="#888888"
                                                fontSize={12}
                                                tickLine={false}
                                                axisLine={false}
                                            />
                                            <YAxis
                                                stroke="#888888"
                                                fontSize={12}
                                                tickLine={false}
                                                axisLine={false}
                                                tickFormatter={(value: any) => `${value}`}
                                            />
                                            <Tooltip />
                                            <Line
                                                type="monotone"
                                                dataKey="Blood Pressure"
                                                stroke="#006FEE"
                                                strokeWidth={2}
                                                dot={false}
                                            />
                                            <Line
                                                type="monotone"
                                                dataKey="Heart Rate"
                                                stroke="#17C964"
                                                strokeWidth={2}
                                                dot={false}
                                            />
                                        </LineChart>
                                    </ResponsiveContainer>
                                </div>
                            </CardContent>
                        </Card>
                        <Card className="md:col-span-3">
                            <CardHeader>
                                <CardTitle>Upcoming Appointments</CardTitle>
                                <CardDescription>View and manage your schedule</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <Calendar className="w-full" mode="single" />
                            </CardContent>
                        </Card>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        <Card className="md:col-span-2 lg:col-span-3">
                            <CardHeader className="flex flex-row items-center space-y-0">
                                <CardTitle>Recent Patient Updates</CardTitle>
                                <Select defaultValue="today">
                                    <SelectTrigger className="ml-auto w-36">
                                        <SelectValue placeholder="Select timeframe" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="today">Today</SelectItem>
                                        <SelectItem value="week">This Week</SelectItem>
                                        <SelectItem value="month">This Month</SelectItem>
                                    </SelectContent>
                                </Select>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    {Array.from({ length: 3 }).map((_, i) => (
                                        <div key={i} className="flex items-start gap-4">
                                            <Avatar className="mt-1">
                                                <AvatarImage src={`/placeholder.svg?height=32&width=32`} />
                                                <AvatarFallback>P{i + 1}</AvatarFallback>
                                            </Avatar>
                                            <div className="space-y-1">
                                                <div className="flex items-center gap-2">
                                                    <h4 className="font-semibold">Patient {i + 1}</h4>
                                                    <span className="text-sm text-muted-foreground">
                                                        2 hours ago
                                                    </span>
                                                </div>
                                                {/* Replace the default text with the call summary if available */}
                                                {callSummaries[i] ? (
                                                    <p className="text-sm text-muted-foreground">
                                                        {callSummaries[i]}
                                                    </p>
                                                ) : (
                                                    <p className="text-sm text-muted-foreground">
                                                        Reported mild symptoms including headache and fatigue.
                                                        AI analysis suggests possible seasonal allergies.
                                                    </p>
                                                )}
                                                <div className="flex gap-2">
                                                    <Sheet>
                                                        <SheetTrigger asChild>
                                                            <Button variant="outline" size="sm">
                                                                View Details
                                                            </Button>
                                                        </SheetTrigger>
                                                        <SheetContent>
                                                            <SheetHeader>
                                                                <SheetTitle>Patient Details</SheetTitle>
                                                                <SheetDescription>
                                                                    View complete patient information and history
                                                                </SheetDescription>
                                                            </SheetHeader>
                                                            <Tabs defaultValue="overview" className="mt-4">
                                                                <TabsList>
                                                                    <TabsTrigger value="overview">
                                                                        Overview
                                                                    </TabsTrigger>
                                                                    <TabsTrigger value="history">
                                                                        History
                                                                    </TabsTrigger>
                                                                    <TabsTrigger value="medications">
                                                                        Medications
                                                                    </TabsTrigger>
                                                                </TabsList>
                                                                <TabsContent value="overview" className="space-y-4">
                                                                    <div className="space-y-2">
                                                                        <h4 className="font-medium">
                                                                            Recent Symptoms
                                                                        </h4>
                                                                        <p className="text-sm text-muted-foreground">
                                                                            Patient reported headache and fatigue starting two
                                                                            days ago. Symptoms are mild to moderate in intensity.
                                                                        </p>
                                                                    </div>
                                                                    <Separator />
                                                                    <div className="space-y-2">
                                                                        <h4 className="font-medium">AI Analysis</h4>
                                                                        <p className="text-sm text-muted-foreground">
                                                                            Based on reported symptoms and patient history, likely
                                                                            cause is seasonal allergies. Recommend antihistamine
                                                                            treatment and follow-up in one week if symptoms persist.
                                                                        </p>
                                                                    </div>
                                                                </TabsContent>
                                                            </Tabs>
                                                        </SheetContent>
                                                    </Sheet>
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => handleCall(i)}
                                                        disabled={!!callLoading[i]}
                                                    >
                                                        {callLoading[i] ? "Loading..." : "Send AI Voice Response"}
                                                    </Button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
                        <Card className="w-full">
                            <CardHeader>
                                <CardTitle>Audio Upload & Analysis</CardTitle>
                                <CardDescription>
                                    Upload patient audio for AI analysis
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <AudioUploader onUpload={handleAudioUpload} />
                                <AudioSummary summary={audioSummary} />
                            </CardContent>
                        </Card>
                        <Card className="w-full">
                            <CardHeader>
                                <CardTitle>Prescribed Medications</CardTitle>
                                <CardDescription>Current patient medications</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <PrescribedMedications />
                            </CardContent>
                        </Card>
                    </div>
                </main>
            </div>
        </div>
    )
}
