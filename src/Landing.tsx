"use client"

import type React from "react"

import { useState } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "./components/ui/avatar"
import { Button } from "./components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./components/ui/card"
import { Input } from "./components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./components/ui/select"
import { Separator } from "./components/ui/separator"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "./components/ui/sheet"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./components/ui/tabs"
import { Bell, CalendarIcon, ChevronDown, MessageSquare, Search, Stethoscope, Users, Upload } from "lucide-react"
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"
import AudioSummary from "./components/AudioSummary"
import PrescribedMedications from "./components/Medications"
import { supabase } from "./supabaseClient"
import AppointmentCalendar from "./components/AppointmentCalendar"
import OpenAI from "openai"
import { Navigate } from "react-router-dom";
import { IconButton } from "@mui/material";
import GraphIcon from '@mui/icons-material/InsertChartOutlined'; // A graph icon
import { useNavigate } from "@tanstack/react-router"
import { useGraphStore } from "./store"
const data = [
  { date: "Jan 1", "Blood Pressure": 120, "Heart Rate": 80 },
  { date: "Jan 2", "Blood Pressure": 125, "Heart Rate": 82 },
  { date: "Jan 3", "Blood Pressure": 122, "Heart Rate": 79 },
  { date: "Jan 4", "Blood Pressure": 128, "Heart Rate": 85 },
  { date: "Jan 5", "Blood Pressure": 124, "Heart Rate": 81 },
]
interface MedicationItem {
  name: string
  dosage: string
}

export default function ProviderDashboard() {
  const [audioFile, setAudioFile] = useState<File | null>(null)
  const [audioSummary, setAudioSummary] = useState<string>("")
  // State for storing call summaries per patient update (keyed by index)
  const [callSummaries, setCallSummaries] = useState<{ [key: number]: string } | null>({})
  // State for tracking loading status per patient update
  const [callLoading, setCallLoading] = useState<{ [key: number]: boolean }>({})
  const [appointments, setAppointments] = useState<any[]>([])
  const openai = new OpenAI({
    apiKey: `${import.meta.env.VITE_OPENAI_API_KEY}`,
    dangerouslyAllowBrowser: true,
  })
  const { value, setValue } = useGraphStore()
  const [isProcessing, setIsProcessing] = useState(false)
  const extractMedications = (summary: string): MedicationItem[] => {
    try {
      // Match the JSON object in the summary text
      const jsonMatch = summary.match(/\{.*?\}/s)
      if (!jsonMatch) return [] // If no JSON is found, return an empty array

      // Extract the JSON string
      const jsonString = jsonMatch[0]

      // Parse the JSON string
      const parsed = JSON.parse(jsonString)

      // Safely access the medications array
      const medications = parsed.medications || []

      // Convert array format to MedicationItem objects
      return medications.map((item: string[]) => ({
        name: item[0] || "Unknown",
        dosage: item[1] || "Dosage not specified",
      }))
    } catch (error) {
      console.error("Error parsing medications:", error)
      return []
    }
  }

  const handleAudioUpload = async (file: File) => {
    let transcriptionResponse
    try {
      setIsProcessing(true)

      // Call the transcription API directly with the File object.
      transcriptionResponse = await openai.audio.transcriptions.create({
        file: file,
        model: "whisper-1",
      })
      console.log("Transcription:", transcriptionResponse.text)
      setAudioSummary(transcriptionResponse.text)
    } catch (error) {
      console.error("Error processing audio:", error)
      setAudioSummary("Error processing audio file")
    } finally {
      setIsProcessing(false)
    }
    //summarize the audio file
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      store: true,
      messages: [
        {
          role: "user",
          content: `Given this audio transcription, summarize this conversation between a doctor and patient in a pargraph with detailed information.  for medication extraction:
- Include ONLY medications explicitly mentioned with their dosages
- If dosage isn't specified, use "dosage not specified"
- Maintain exact medication names as mentioned
- Include any frequency or duration if mentioned
- The array must be properly formatted JSON

2. Provide a paragraph summary of the conversation.

Format your response exactly like this:
{
    "medications": [
        ["medication_name1", "dosage1"],
        ["medication_name2", "dosage2"]
    ],
                }
     Following is the conversation between the doctor and patient: ${transcriptionResponse?.text || ""}`,
        },
      ],
    })
    const messageContent = completion.choices[0].message.content || "" // Default to an empty string if null
    setValue(value + messageContent)
    console.log("Completion:", messageContent)
    setAudioSummary(messageContent) // Now it's guaranteed to be a string
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      setAudioFile(file)
      await handleAudioUpload(file)
    }
  }

  // The handleCall function uses a fixed phone number (for demo purposes).
  // It sends a call request and then, after a delay, fetches the call summary.
  const handleCall = async (index: number) => {
    // Mark this patient update as loading
    setCallLoading((prev) => ({ ...prev, [index]: true }))
    console.log("AUDIO SUMMary", audioSummary)
    // For demonstration, using a fixed phone number.
    const phoneNumber = "9454009396"
    const chatbotPrompt = `Role: AI Medical Assistant conducting a follow-up call based on previous doctor's visit transcription

Context from Previous Visit:
Should I book an appointment Febuary 22, 2025 at 5pm?
Yes, book it 
Instructions:
1. Reference the above transcription throughout the conversation. Make sure to specifically mention the patient's symptoms, medications, and any other relevant details from the transcription.
2. Ask specific follow-up questions about symptoms/conditions mentioned in the transcription
3. Compare current state with previously reported conditions
4. Verify if prescribed treatments from last visit were effective

Conversation Flow:

1. Initial Greeting & Context Setting
- Greet the patient professionally
- Reference specific details from their last visit (using transcription)
Example: "Hello, I'm calling about your recent visit where you discussed [specific symptoms from transcription]. I'd like to follow up on how you're doing with [specific treatment/medication mentioned]."

2. Detailed Follow-up Questions (Based on Transcription)
- Tell the patient what the doctor diagnosed them with
- Inform the patient on their issues and how they should proceed
- Ask about specific symptoms mentioned in the transcription
- Check if prescribed medications/treatments are being followed
- Compare current state with previously reported conditions
Example Questions:
- "Last time, you reported [specific issue from transcription]. Is this still occurring?"

4. Treatment Adherence
- Verify if patient is following the treatment plan from last visit
-
5. Appointment Scheduling
- Reference any follow-up timeline mentioned in the transcription
- Offer appointments starting from February 23, 2025
- Schedule follow-up based on urgency of symptoms discussed
- Specify an exact day, year, and time for the appointment

6. Summary and Documentation
- Summarize changes since last visit
- Document any new concerns for the doctor

End the call by:
1. Summarizing key differences from last visit
2. Confirming next steps
3. Providing emergency contact information if needed

Required Mention Points:
${audioSummary
  .split(".")
  .map((point) => `- Follow up on: ${point.trim()}`)
  .join("\n")}

Remember to:
- Keep referencing specific details from the previous visit transcription
- Compare current symptoms with those in the transcription
- Focus follow-up questions on previously discussed issues
- Note any improvements or deterioration since last visit`

    const options = {
      method: "POST",
      headers: {
        authorization: `${import.meta.env.VITE_BLAND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        phone_number: phoneNumber,
        // pathway_id: "0a95378e-e442-47ea-8b7b-07b1bee01b54",
        task: chatbotPrompt,
        voice: "Public - Hawaii Female",
        language: "en",
        record: true,
        metadata: {},
      }),
    }

    try {
      const response = await fetch("https://api.bland.ai/v1/calls", options)
      if (!response.ok) throw new Error(`Call initiation failed: ${response.statusText}`)

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
          const detailsResponse = await fetch(`https://api.bland.ai/v1/calls/${callId}`, getOptions)
          if (!detailsResponse.ok) {
            throw new Error(`Failed to fetch call details: ${detailsResponse.statusText}`)
          }
          const detailsData = await detailsResponse.json()
          console.log("Call Summary:", detailsData.summary)
          setValue(value + detailsData.summary)
          const openAIResponse = await openai.chat.completions.create({
            model: "gpt-4",
            messages: [
              {
                role: "system",
                content: `Extract the appointment date and name from the following conversation summary. Return only a JSON object with 'date' (in ISO format) and 'name' fields.  Following is the summary: ${detailsData.summary}`,
              },
            ],
          })

          console.log("OpenAI Response:", openAIResponse.choices[0].message.content)
          // Parse the OpenAI response
          const extractedData = JSON.parse(openAIResponse.choices[0].message.content || "{}")
          console.log("Extracted Data:", extractedData.date, extractedData.name)

          // Update appointments state with new appointment
          setAppointments((prev) => [
            ...prev,
            {
              date: extractedData.date,
              name: extractedData.name,
            },
          ])
          // Store in database (example using Supabase)
          const { error } = await supabase.from("appointments").insert([
            {
              date: extractedData.date,
              name: extractedData.name,
            },
          ])
          if (error) throw new Error(`Database insert failed: ${error.message}`)
          // Update the call summary for this particular patient update
          setCallSummaries((prev) => ({ ...prev, [index]: detailsData.summary }))
        } catch (error: any) {
          console.error("Error fetching call details:", error.message)
          setCallSummaries((prev) => ({
            ...prev,
            [index]: "Failed to retrieve call summary.",
          }))
        } finally {
          setCallLoading((prev) => ({ ...prev, [index]: false }))
        }
      }, 180000) // Wait for 120 seconds before fetching call details
    } catch (error: any) {
      console.error("Error:", error.message)
      setCallSummaries((prev) => ({ ...prev, [index]: error.message }))
      setCallLoading((prev) => ({ ...prev, [index]: false }))
    }
  }
  const navigate = useNavigate()
  /*
    useEffect(() => {
        const generateGraph = async () => {
            let prompt = `You are a helpful assistant that generates graph nodes and relationships. Given the input data text, generate an array of nodes and relations. Create edges between nodes that are related and define the label of the edge to define the relationship type. The nodes will contain the following properties: id, name (string), category (string), description (string). The result should be a valid JSON array with the nodes and edges all in a single line with no line breaks, spaces, or additional formatting. The format should be exactly as follows, all on one line: { "nodes": [ { "id": 1, "name": "Node 1", "category": "Category 1", "description": "Description 1" }, { "id": 2, "name": "Node 2", "category": "Category 2", "description": "Description 2" } ], "edges": [ { "source": 1, "target": 2, "label": "Edge 1" } ] }. Do not add any formatting, line breaks, or other formatting styles such as "/n" or "/t". Return only the valid JSON in a single line.`;
            const chatCompletion = await openai.chat.completions.create({
                model: 'gpt-3.5-turbo',
                messages: [{ role: 'user', content: prompt }, { role: 'system', content: prompt }],
            });
            console.log(chatCompletion.choices[0].message.content)
        }
        generateGraph()
    }, [])*/
  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Sidebar */}
      <div className="hidden w-80 flex-col border-r bg-white dark:bg-gray-800 shadow-sm md:flex">
        <div className="p-6">
          <div className="flex items-center gap-3 mb-8">
            <Stethoscope className="h-8 w-8 text-primary" />
            <h2 className="text-2xl font-bold">MedCare Pro</h2>
          </div>
          <div className="mb-8">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search patients..."
                className="w-full bg-gray-50 dark:bg-gray-700 pl-10 h-12 rounded-xl"
              />
            </div>
          </div>
          <nav className="space-y-6">
            <div>
              <div className="flex items-center gap-2 mb-4 px-2">
                <Users className="h-5 w-5" />
                <span className="text-sm font-semibold">Patients</span>
              </div>
              <div className="space-y-1">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Button
                    key={i}
                    variant="ghost"
                    className="w-full justify-start gap-3 rounded-xl h-14 hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={`/placeholder.svg?height=32&width=32`} />
                      <AvatarFallback>P{i + 1}</AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col items-start">
                      <span className="font-medium">Patient {i + 1}</span>
                      <span className="text-xs text-muted-foreground">Last visit: 2 days ago</span>
                    </div>
                  </Button>
                ))}
              </div>
            </div>
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        <header className="h-16 border-b bg-white dark:bg-gray-800 shadow-sm px-6 flex items-center gap-4 sticky top-0 z-10">
          <Button variant="ghost" size="icon" className="md:hidden">
            <ChevronDown className="h-5 w-5" />
          </Button>
          <div className="flex flex-1 items-center gap-8">
            <h1 className="text-xl font-bold">Provider Dashboard</h1>
            <nav className="hidden md:flex items-center gap-1">
              <Button variant="ghost" className="h-9 rounded-lg font-medium" onClick={() => navigate({ to: "/graph" })}>
                Graph
              </Button>
            </nav>
          </div>
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="h-5 w-5" />
              <span className="absolute top-2 right-2 h-2 w-2 bg-red-500 rounded-full" />
            </Button>
            <Avatar className="h-9 w-9">
              <AvatarImage src="/placeholder.svg?height=36&width=36" />
              <AvatarFallback>DR</AvatarFallback>
            </Avatar>
          </div>
        </header>

        <main className="flex-1 p-6 md:p-8 space-y-8">
          <div className="grid gap-6 md:grid-cols-3">
            <Card className="bg-white dark:bg-gray-800 shadow-sm hover:shadow-md transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-semibold">Total Patients</CardTitle>
                <Users className="h-5 w-5 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold mb-1">245</div>
                <p className="text-sm text-emerald-500 font-medium">+4 from last week</p>
              </CardContent>
            </Card>
            <Card className="bg-white dark:bg-gray-800 shadow-sm hover:shadow-md transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-semibold">Appointments Today</CardTitle>
                <CalendarIcon className="h-5 w-5 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold mb-1">12</div>
                <p className="text-sm text-emerald-500 font-medium">2 urgent consultations</p>
              </CardContent>
            </Card>
            <Card className="bg-white dark:bg-gray-800 shadow-sm hover:shadow-md transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-semibold">Messages</CardTitle>
                <MessageSquare className="h-5 w-5 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold mb-1">18</div>
                <p className="text-sm text-red-500 font-medium">6 unread messages</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-6">
            <Card className="w-full bg-white dark:bg-gray-800 shadow-sm">
              <CardHeader>
                <CardTitle className="text-xl">Patient Health Trends</CardTitle>
                <CardDescription>Monitor vital signs and health metrics</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={data}>
                      <XAxis dataKey="date" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                      <YAxis
                        stroke="#888888"
                        fontSize={12}
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={(value: any) => `${value}`}
                      />
                      <Tooltip />
                      <Line type="monotone" dataKey="Blood Pressure" stroke="#006FEE" strokeWidth={2} dot={false} />
                      <Line type="monotone" dataKey="Heart Rate" stroke="#17C964" strokeWidth={2} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
            <Card className="w-full bg-white dark:bg-gray-800 shadow-sm">
              <AppointmentCalendar refresh={callSummaries} />
            </Card>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <Card className="bg-white dark:bg-gray-800 shadow-sm">
              <CardHeader className="border-b">
                <CardTitle className="text-xl">Audio Analysis</CardTitle>
                <CardDescription>Upload and analyze patient recordings</CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-xl">
                  <Upload className="h-8 w-8 text-muted-foreground mb-4" />
                  <input type="file" onChange={handleFileChange} className="hidden" id="audio-upload" />
                  <label
                    htmlFor="audio-upload"
                    className="button bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2 rounded-lg cursor-pointer"
                  >
                    Upload Audio
                  </label>
                </div>
                <div className="mt-6">
                  <AudioSummary summary={audioSummary} />
                </div>
              </CardContent>
            </Card>
            <Card className="bg-white dark:bg-gray-800 shadow-sm">
              <CardHeader className="border-b">
                <CardTitle className="text-xl">Prescribed Medications</CardTitle>
                <CardDescription>Current patient medications</CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <PrescribedMedications medications={extractMedications(audioSummary)} />
              </CardContent>
            </Card>
          </div>

          {/* Patient Updates Section */}
          <Card className="bg-white dark:bg-gray-800 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between border-b">
              <CardTitle className="text-xl">Recent Patient Updates</CardTitle>
              <Select defaultValue="today">
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Select timeframe" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="today">Today</SelectItem>
                  <SelectItem value="week">This Week</SelectItem>
                  <SelectItem value="month">This Month</SelectItem>
                </SelectContent>
              </Select>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="space-y-6">
                {Array.from({ length: 3 }).map((_, i) => {
                  const [isLoading, setIsLoading] = useState(false)
                  return (
                    <div key={i} className="flex gap-4 p-4 rounded-xl bg-gray-50 dark:bg-gray-700">
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={`/placeholder.svg?height=48&width=48`} />
                        <AvatarFallback>P{i + 1}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 space-y-3">
                        <div className="flex items-center gap-2">
                          <h4 className="font-semibold">Patient {i + 1}</h4>
                          <span className="text-sm text-muted-foreground">2 hours ago</span>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {callSummaries && callSummaries[i]
                            ? callSummaries[i]
                            : "Reported mild symptoms including headache and fatigue. AI analysis suggests possible seasonal allergies."}
                        </p>
                        <div className="flex gap-3">
                          <Sheet>
                            <SheetTrigger asChild>
                              <Button variant="outline" size="sm" className="rounded-lg">
                                View Details
                              </Button>
                            </SheetTrigger>
                            <SheetContent>
                              <SheetHeader>
                                <SheetTitle>Patient Details</SheetTitle>
                                <SheetDescription>View complete patient information and history</SheetDescription>
                              </SheetHeader>
                              <Tabs defaultValue="overview" className="mt-4">
                                <TabsList>
                                  <TabsTrigger value="overview">Overview</TabsTrigger>
                                  <TabsTrigger value="history">History</TabsTrigger>
                                  <TabsTrigger value="medications">Medications</TabsTrigger>
                                </TabsList>
                                <TabsContent value="overview" className="space-y-4">
                                  <div className="space-y-2">
                                    <h4 className="font-medium">Recent Symptoms</h4>
                                    <p className="text-sm text-muted-foreground">
                                      Patient reported headache and fatigue starting two days ago. Symptoms are mild to
                                      moderate in intensity.
                                    </p>
                                  </div>
                                  <Separator />
                                  <div className="space-y-2">
                                    <h4 className="font-medium">AI Analysis</h4>
                                    <p className="text-sm text-muted-foreground">
                                      Based on reported symptoms and patient history, likely cause is seasonal
                                      allergies. Recommend antihistamine treatment and follow-up in one week if symptoms
                                      persist.
                                    </p>
                                  </div>
                                </TabsContent>
                              </Tabs>
                            </SheetContent>
                          </Sheet>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setIsLoading(true)
                              handleCall(i)
                            }}
                            disabled={isLoading || !!callLoading[i]}
                            className="rounded-lg"
                          >
                            {isLoading || !!callLoading[i] ? "Loading..." : "Send AI Voice Response"}
                          </Button>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  )
}

