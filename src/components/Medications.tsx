import { Card, CardContent } from "../components/ui/card";
interface MedicationItem {
    name: string;
    dosage: string;
}

const PrescribedMedications: React.FC<{ medications?: MedicationItem[] }> = ({ medications }) => {
    if (!medications?.length) {
        return (
            <div className="text-muted-foreground text-center p-4 bg-gray-100 dark:bg-gray-800 rounded-lg">
                No medications prescribed
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {medications.map((med, index) => (
                <Card key={index} className="border border-gray-200 dark:border-gray-700 shadow-sm rounded-xl">
                    <CardContent className="p-4 flex justify-between items-center">
                        <div>
                            <h4 className="font-semibold text-lg text-gray-900 dark:text-gray-100">{med.name}</h4>
                            <p className="text-sm text-gray-600 dark:text-gray-400">{med.dosage}</p>
                        </div>
                    </CardContent>
                </Card>
            ))}
        </div>
    );
};

export default PrescribedMedications;
