import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card';
import { supabase } from '../supabaseClient';
// Define TypeScript interfaces
interface Appointment {
    id: number;
    date: string;
    name: string;
}


const AppointmentCalendar = () => {
    const [appointments, setAppointments] = useState<Appointment[]>([]);
    const [currentDate, setCurrentDate] = useState(new Date());

    useEffect(() => {
        const getAppointments = async () => {
            const { data, error } = await supabase.from('appointments').select('date,id,name');
            if (error) {
                console.error('Error fetching appointments:', error);
                return;
            }
            setAppointments(data);
        };
        getAppointments();
    }, []);

    // Get the first day of the month
    const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);

    // Get the last day of the month
    const lastDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);

    // Get number of days in month
    const daysInMonth = lastDayOfMonth.getDate();

    // Get the day of week the month starts on (0-6)
    const startDay = firstDayOfMonth.getDay();

    // Helper to check if a date is today
    const isToday = (date: Date) => {
        const today = new Date();
        return date.getDate() === today.getDate() &&
            date.getMonth() === today.getMonth() &&
            date.getFullYear() === today.getFullYear();
    };

    // Helper to check if two dates are the same day
    const isSameDay = (date1: Date, date2: Date) => {
        return date1.getDate() === date2.getDate() &&
            date1.getMonth() === date2.getMonth() &&
            date1.getFullYear() === date2.getFullYear();
    };

    // Get appointments for a specific day
    const getAppointmentsForDay = (date: Date) => {
        return appointments.filter(apt => {
            const aptDate = new Date(apt.date);
            return isSameDay(aptDate, date);
        });
    };

    const navigateMonth = (direction: 'prev' | 'next') => {
        setCurrentDate(prev => {
            const newDate = new Date(prev);
            newDate.setMonth(newDate.getMonth() + (direction === 'next' ? 1 : -1));
            return newDate;
        });
    };

    // Generate calendar days array
    const generateCalendarDays = () => {
        const days = [];
        const totalDays = startDay + daysInMonth;
        const totalCells = Math.ceil(totalDays / 7) * 7;

        for (let i = 0; i < totalCells; i++) {
            if (i < startDay || i >= totalDays) {
                days.push(null);
            } else {
                const currentDay = new Date(
                    currentDate.getFullYear(),
                    currentDate.getMonth(),
                    i - startDay + 1
                );
                days.push(currentDay);
            }
        }
        return days;
    };

    const monthNames = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
    ];
    const formatTime = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };
    console.log(appointments)
    return (
        <Card className="w-full max-w-4xl">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-2xl font-bold">
                    {`${monthNames[currentDate.getMonth()]} ${currentDate.getFullYear()}`}
                </CardTitle>
                <div className="space-x-2">
                    <button
                        onClick={() => navigateMonth('prev')}
                        className="px-3 py-1 text-sm bg-gray-100 rounded hover:bg-gray-200"
                    >
                        Previous
                    </button>
                    <button
                        onClick={() => navigateMonth('next')}
                        className="px-3 py-1 text-sm bg-gray-100 rounded hover:bg-gray-200"
                    >
                        Next
                    </button>
                </div>
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-7 gap-1 mb-2">
                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                        <div key={day} className="text-center font-semibold p-2">
                            {day}
                        </div>
                    ))}
                </div>
                <div className="grid grid-cols-7 gap-1">
                    {generateCalendarDays().map((date, index) => (
                        <div
                            key={index}
                            className={`min-h-24 p-2 border rounded ${date && isToday(date) ? 'bg-blue-50' : ''
                                }`}
                        >
                            {date && (
                                <>
                                    <div className="font-medium mb-1">
                                        {date.getDate()}
                                    </div>
                                    <div className="space-y-1">
                                        {getAppointmentsForDay(date).map(apt => (
                                            <div
                                                key={apt.id}
                                                className="text-sm p-1 bg-blue-100 rounded break-words"
                                                title={`${formatTime(apt.date)} - ${apt.name}`}
                                            >
                                                <div className="text-xs text-gray-600">
                                                    {formatTime(apt.date)}
                                                </div>
                                                {apt.name}
                                            </div>
                                        ))}
                                    </div>
                                </>
                            )}
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
};

export default AppointmentCalendar;