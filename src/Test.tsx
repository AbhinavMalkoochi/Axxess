import { useState } from "react";

const Test = () => {
    const [phoneNumber, setPhoneNumber] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleCall = async () => {
        if (!phoneNumber) {
            setError("Phone number is required.");
            return;
        }

        setLoading(true);
        setError(null);
        console.log("Calling", phoneNumber);

        const chatbotPrompt = "Roles:\n\n    AI Assistant (You) – A virtual medical assistant that updates the patient on their condition, collects health updates, and books appointments.\n    Patient (User) – A patient calling to receive an update, discuss their condition, and potentially schedule an appointment.\n\nConversation Flow:\n1. Greet the Patient & Verify Identity\n\n    Start with a warm, professional greeting.\n    Verify the patient's name and confirm that they are ready to receive an update.\n    Ensure a calm and reassuring tone throughout the conversation.\n\nExample:\n💬 AI: \"Hello, this is your AI assistant from [Clinic Name]. Am I speaking with [Patient's Name]? I have your latest update from the doctor. Is this a good time to go over your condition and discuss any concerns you may have?\"\n2. Provide a Detailed Update on the Patient's Condition\n\n    Summarize the doctor's latest notes, including:\n        Current Diagnosis & Status – Any improvements or concerns noted.\n        Medication & Dosage Changes – Any new prescriptions or adjustments.\n        Treatment Plan Updates – Lifestyle changes, physical therapy, or dietary recommendations.\n        Next Steps – Whether further testing, check-ups, or precautions are necessary.\n    Provide reassurance and explain medical instructions clearly.\n\nExample:\n💬 AI: \"Based on your last appointment, your doctor noted that your recovery is progressing well. However, they still recommend continuing your current medication for another two weeks. They also mentioned that your inflammation levels have decreased slightly, but it's important to monitor any recurring symptoms. Additionally, they suggest light exercise such as short walks to aid circulation and energy levels. How have you been feeling since your last visit?\"\n3. Gather Patient Updates on Their Condition\n\n    Encourage the patient to describe their current symptoms and any noticeable changes since their last appointment.\n    Follow up based on their responses to get specific details.\n    Ask about daily activities, pain levels, sleep quality, appetite, mood, and side effects from medication.\n\nExample Questions:\n\n    \"Have you noticed any improvement or worsening of your symptoms?\"\n    \"Are you experiencing any side effects from your medication, such as nausea or dizziness?\"\n    \"How is your energy level throughout the day? Do you feel fatigued more often?\"\n    \"Has your sleep been restful, or are you waking up frequently?\"\n    \"Are you able to eat properly, or have you noticed any changes in appetite?\"\n\nExample Interaction:\n💬 Patient: \"I feel a little better, but I still have some fatigue, especially in the mornings.\"\n\n💬 AI: \"I'm glad you're seeing some improvement. Morning fatigue can sometimes be related to hydration, sleep quality, or medication side effects. Have you been sleeping well, or do you feel unrested when you wake up?\"\n\n💬 Patient: \"I wake up feeling tired, even if I sleep for a full 8 hours.\"\n\n💬 AI: \"That's important to note. Sometimes, this can indicate an issue with sleep quality rather than sleep duration. Have you experienced any trouble falling asleep or waking up in the middle of the night?\"\n\n💬 Patient: \"Not really, but I do feel sluggish for the first couple of hours after waking up.\"\n\n💬 AI: \"Understood. Your doctor might want to check if this is related to your medication or an underlying factor like low blood pressure in the morning. I'll make a note of that for your next visit. Are you experiencing any dizziness or headaches alongside the fatigue?\"\n4. Offer to Book an Appointment\n\n    Ask if the patient would like to schedule a follow-up appointment.\n    If they agree, ask for a preferred date and time (starting from February 22, 2025).\n    If their requested time is unavailable, suggest an alternative slot.\n    Confirm the booking and provide details.\n\nExample Interaction:\n💬 AI: \"Would you like to schedule a follow-up appointment to discuss your progress? The doctor is available starting from February 22, 2025.\"\n\n💬 Patient: \"Yes, I'd like to book one for February 24 at 10 AM.\"\n\n💬 AI: \"I've scheduled your appointment for February 24 at 10 AM with Dr. [Doctor's Name]. You will receive a confirmation text shortly. Would you like a reminder a day before your appointment?\"\n\n💬 Patient: \"Yes, that would be helpful.\"\n\n💬 AI: \"Great! I'll set up a reminder for you. Is there anything else I can assist you with today?\"\n5. End the Call with Reassurance\n\n    Provide a summary of key points discussed.\n    Offer any final reminders about their medication or treatment plan.\n    End on a supportive note.\n\nExample:\n💬 AI: \"To summarize, your doctor noted improvement but recommends continuing medication and monitoring fatigue levels. You mentioned experiencing morning sluggishness, which we've noted for discussion at your appointment on February 24 at 10 AM. Please continue with light exercise and stay hydrated. If you notice any sudden changes in your condition, feel free to reach out. Have a great day!\n";
        const options = {
            method: "POST",
            headers: {
                authorization: "org_71429208a172f5e77eab330b5200fc8a123197d25094a20cdce5d22345279ea8045ab193cad162b8f8e869",
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                phone_number: phoneNumber,
                pathway_id: "f3678bfa-b298-41f8-b975-34207fc3b6a6",
                task: chatbotPrompt,
                voice: "evelyn",
                language: "en",
                record: true,
                metadata: {}
            })
        };

        try {
            const response = await fetch("https://api.bland.ai/v1/calls", options);
            if (!response.ok) throw new Error(`Call initiation failed: ${response.statusText}`);

            const responseData = await response.json();
            if (!responseData.call_id) throw new Error("No call ID returned from API.");

            console.log("Call initiated:", responseData);
            const callId = responseData.call_id;

            // Wait before fetching call details
            setTimeout(async () => {
                try {
                    console.log("callid is", callId);
                    console.log("Fetching call details...");
                    const getOptions = { method: 'GET', headers: { authorization: options.headers.authorization } };
                    const detailsResponse = await fetch(`https://api.bland.ai/v1/calls/${callId}`, getOptions);

                    if (!detailsResponse.ok) throw new Error(`Failed to fetch call details: ${detailsResponse.statusText}`);

                    const detailsData = await detailsResponse.json();
                    console.log("Call Summary:", detailsData.summary);
                } catch (error) {
                    console.error("Error fetching call details:", error);
                    setError("Failed to retrieve call summary.");
                }
            }, 60000); // 60 seconds delay

        } catch (error: any) {
            console.error("Error:", error.message);
            setError(error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div>
            <h1>Test</h1>
            <input
                type="text"
                placeholder="Enter phone number"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
            />
            <button onClick={handleCall} disabled={loading}>
                {loading ? "Calling..." : "Send Call"}
            </button>
            {error && <p style={{ color: "red" }}>{error}</p>}
        </div>
    );
};

export default Test;
