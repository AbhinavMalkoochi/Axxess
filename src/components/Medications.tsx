import type React from "react"

const PrescribedMedications: React.FC = () => {
    const medications = [
        { name: "Lisinopril", dosage: "10mg", frequency: "Once daily" },
        { name: "Metformin", dosage: "500mg", frequency: "Twice daily" },
        { name: "Atorvastatin", dosage: "20mg", frequency: "Once daily at bedtime" },
    ]

    return (
        <div className="space-y-4">
            {medications.map((med, index) => (
                <div key={index} className="flex justify-between items-center">
                    <div>
                        <h4 className="font-medium">{med.name}</h4>
                        <p className="text-sm text-muted-foreground">{med.dosage}</p>
                    </div>
                    <p className="text-sm">{med.frequency}</p>
                </div>
            ))}
        </div>
    )
}

export default PrescribedMedications

