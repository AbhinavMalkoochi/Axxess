"use client"

import { useEffect, useState } from "react"
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
import PrescribedMedications from "./components/Medications"
import { supabase } from "./supabaseClient"
import AppointmentCalendar from "./components/AppointmentCalendar"
import OpenAI from "openai"
const data = [
    { date: "Jan 1", "Blood Pressure": 120, "Heart Rate": 80 },
    { date: "Jan 2", "Blood Pressure": 125, "Heart Rate": 82 },
    { date: "Jan 3", "Blood Pressure": 122, "Heart Rate": 79 },
    { date: "Jan 4", "Blood Pressure": 128, "Heart Rate": 85 },
    { date: "Jan 5", "Blood Pressure": 124, "Heart Rate": 81 },
]
interface MedicationItem {
    name: string;
    dosage: string;
}


export default function ProviderDashboard() {
    const [audioFile, setAudioFile] = useState<File | null>(null);
    const [audioSummary, setAudioSummary] = useState<string>("")
    // State for storing call summaries per patient update (keyed by index)
    const [callSummaries, setCallSummaries] = useState<{ [key: number]: string } | null>({})
    // State for tracking loading status per patient update
    const [callLoading, setCallLoading] = useState<{ [key: number]: boolean }>({})
    const [appointments, setAppointments] = useState<any[]>([])
    const openai = new OpenAI({
        apiKey: "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", dangerouslyAllowBrowser: true
    });
    const [isProcessing, setIsProcessing] = useState(false)
    const extractMedications = (summary: string): MedicationItem[] => {
        try {
            // Match the JSON object in the summary text
            const jsonMatch = summary.match(/\{.*?\}/s);
            if (!jsonMatch) return []; // If no JSON is found, return an empty array

            // Extract the JSON string
            const jsonString = jsonMatch[0];

            // Parse the JSON string
            const parsed = JSON.parse(jsonString);

            // Safely access the medications array
            const medications = parsed.medications || [];

            // Convert array format to MedicationItem objects
            return medications.map((item: string[]) => ({
                name: item[0] || 'Unknown',
                dosage: item[1] || 'Dosage not specified'
            }));
        } catch (error) {
            console.error('Error parsing medications:', error);
            return [];
        }
    };


    const handleAudioUpload = async (file: File) => {
        let transcriptionResponse;
        try {
            setIsProcessing(true);

            // Call the transcription API directly with the File object.
            transcriptionResponse = await openai.audio.transcriptions.create({
                file: file,
                model: "whisper-1",
            });
            console.log("Transcription:", transcriptionResponse.text);
            setAudioSummary(transcriptionResponse.text);
        } catch (error) {
            console.error("Error processing audio:", error);
            setAudioSummary("Error processing audio file");
        } finally {
            setIsProcessing(false);
        }
        //summarize the audio file
        const completion = await openai.chat.completions.create({
            model: "gpt-4o",
            store: true,
            messages: [
                {
                    "role": "user",
                    "content": `Given this audio transcription, summarize this conversation between a doctor and patient in a pargraph with detailed information.  for medication extraction:
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
     Make sure to  Conversation:**Doctor:** Good morning, Mr. Thompson. How are you feeling today?  

**Patient:** Morning, doctor. I’m still feeling a bit weak on my right side, and my speech is a little slow. But I think it's improving.  

**Doctor:** That’s good to hear. Based on your progress, you’re showing signs of recovery, but we need to keep monitoring your condition closely. Let's go over a few things. You had an **ischemic stroke** about a week ago, caused by a blood clot blocking an artery in your brain. Do you remember experiencing any symptoms before it happened?  

**Patient:** Yes, I remember my right arm suddenly feeling numb, and I had trouble speaking. My wife noticed my face was drooping and called 911 right away.  

**Doctor:** That was absolutely the right thing to do. Getting medical help quickly can make a big difference in stroke treatment. When you arrived at the hospital, we gave you **tPA (tissue plasminogen activator)** to dissolve the clot since you were within the treatment window. Have you noticed any new or worsening symptoms since then?  

**Patient:** No, nothing new. Just some weakness and trouble finding words sometimes.  

**Doctor:** That’s expected, but with physical and speech therapy, you should continue to improve. Let’s talk about your medications. You're on **clopidogrel (Plavix)** as a blood thinner to prevent future clots and **atorvastatin (Lipitor)** to help lower your cholesterol. Have you had any side effects?  

**Patient:** No major side effects, but I do feel a little dizzy sometimes.  

**Doctor:** That can happen, especially when adjusting to blood thinners. Make sure you're drinking enough water and standing up slowly to avoid dizziness. I also see you have **high blood pressure and diabetes**, which are major risk factors for strokes. Your **lisinopril** for blood pressure and **metformin** for diabetes are essential in preventing another stroke. Have you been monitoring your blood sugar and pressure at home?  

**Patient:** Yes, I check my blood pressure every morning, and it’s usually around **135/85**, which is better than before. My blood sugar has been stable, too.  

**Doctor:** That’s a good improvement, but we want your blood pressure closer to **120/80** to reduce stroke risk. Keep taking your medications as prescribed, and let’s also focus on diet and exercise. Are you following a **low-sodium, heart-healthy diet**?  

**Patient:** I’ve cut down on salt and fried foods, and I’ve started walking 20 minutes a day.  

**Doctor:** That’s great progress! Keep it up. Regular exercise, along with a **Mediterranean-style diet** rich in vegetables, whole grains, and healthy fats, can lower your risk significantly.  

**Patient:** I’ll do my best. How long will I need to take these medications?  

**Doctor:** Some, like **clopidogrel**, may be temporary, but others, like **atorvastatin and lisinopril**, could be lifelong, depending on your condition. We’ll reassess in a few months.  

**Patient:** Understood. Thank you, doctor.  

**Doctor:** You’re doing well, Mr. Thompson. Keep up with your rehab, stay consistent with your medications, and we’ll see you for a follow-up in four weeks. Let me know if you have any concerns before then.  

**Patient:** Will do. Thanks again, doctor.`
                }
            ]
        });
        const messageContent = completion.choices[0].message.content || ""; // Default to an empty string if null
        console.log("Completion:", messageContent);
        setAudioSummary(messageContent); // Now it's guaranteed to be a string
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setAudioFile(file);
            await handleAudioUpload(file);
        }
    };



    // The handleCall function uses a fixed phone number (for demo purposes).
    // It sends a call request and then, after a delay, fetches the call summary.
    const handleCall = async (index: number) => {
        // Mark this patient update as loading
        setCallLoading(prev => ({ ...prev, [index]: true }))
        console.log("AUDIO SUMMary", audioSummary)
        // For demonstration, using a fixed phone number.
        const phoneNumber = "6307310098"
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
- Ask about specific symptoms mentioned in the transcription
- Check if prescribed medications/treatments are being followed
- Compare current state with previously reported conditions
Example Questions:
- "During your last visit, you mentioned [specific symptom from transcription]. How has that changed since then?"
- "Dr. [Name] prescribed [medication from transcription]. How are you responding to that?"
- "Last time, you reported [specific issue from transcription]. Is this still occurring?"

3. New Symptoms or Concerns
- Ask if any new symptoms have developed since the last visit
- Inquire about side effects from prescribed treatments
- Check for any lifestyle changes recommended in the previous visit

4. Treatment Adherence
- Verify if patient is following the treatment plan from last visit
- Ask about any difficulties with prescribed medications
- Check if they're following any lifestyle recommendations mentioned in the transcription

5. Appointment Scheduling
- Reference any follow-up timeline mentioned in the transcription
- Offer appointments starting from February 22, 2025
- Schedule follow-up based on urgency of symptoms discussed

6. Summary and Documentation
- Summarize changes since last visit
- Confirm current medications and treatments
- Document any new concerns for the doctor

End the call by:
1. Summarizing key differences from last visit
2. Confirming next steps
3. Providing emergency contact information if needed

Required Mention Points:
${audioSummary.split('.').map(point => `- Follow up on: ${point.trim()}`).join('\n')}

Remember to:
- Keep referencing specific details from the previous visit transcription
- Compare current symptoms with those in the transcription
- Focus follow-up questions on previously discussed issues
- Note any improvements or deterioration since last visit`

        const options = {
            method: "POST",
            headers: {
                authorization:
                    "org_26902c159dcdba4cde64a6c5323b1f20f5e6419bc471ef2ad1f17a572e587d97e57fc3ba05cae0f1077469",
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                phone_number: phoneNumber,
                // pathway_id: "0a95378e-e442-47ea-8b7b-07b1bee01b54",
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
                    if (!detailsResponse.ok) {
                        throw new Error(
                            `Failed to fetch call details: ${detailsResponse.statusText}`,
                        )
                    }
                    const detailsData = await detailsResponse.json()
                    console.log("Call Summary:", detailsData.summary)
                    const openAIResponse = await openai.chat.completions.create({
                        model: "gpt-4",
                        messages: [
                            {
                                role: "system",
                                content: `Extract the appointment date and name from the following conversation summary. Return only a JSON object with 'date' (in ISO format) and 'name' fields.  Following is the summary: ${detailsData.summary}`
                            },

                        ],
                    });

                    console.log("OpenAI Response:", openAIResponse.choices[0].message.content)
                    // Parse the OpenAI response
                    const extractedData = JSON.parse(openAIResponse.choices[0].message.content || "{}");
                    console.log("Extracted Data:", extractedData.date, extractedData.name)

                    // Update appointments state with new appointment
                    setAppointments(prev => [...prev, {
                        date: extractedData.date,
                        name: extractedData.name
                    }]);
                    // Store in database (example using Supabase)
                    const { error } = await supabase
                        .from('appointments')
                        .insert([
                            {
                                date: extractedData.date,
                                name: extractedData.name,
                            }
                        ]);
                    if (error) throw new Error(`Database insert failed: ${error.message}`)
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
            }, 180000) // Wait for 120 seconds before fetching call details
        } catch (error: any) {
            console.error("Error:", error.message)
            setCallSummaries(prev => ({ ...prev, [index]: error.message }))
            setCallLoading(prev => ({ ...prev, [index]: false }))
        }
    }
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
    }, [])
    return (
        <div className="flex min-h-screen bg-background">
            {/* Sidebar */}
            <button onClick={() => handleCall(0)}>BOB TEST</button>
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
                            <AppointmentCalendar />
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
                                                {callSummaries && callSummaries[i] ? (
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
                                <input type="file" onChange={handleFileChange} />
                                <AudioSummary summary={audioSummary} />
                            </CardContent>
                        </Card>
                        <Card className="w-full">
                            <CardHeader>
                                <CardTitle>Prescribed Medications</CardTitle>
                                <CardDescription>Current patient medications</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <PrescribedMedications medications={extractMedications(audioSummary)} />
                            </CardContent>
                        </Card>
                    </div>
                </main>
            </div>
        </div>
    )
}
