import { createFileRoute } from '@tanstack/react-router';
import Test from '../Test';
import ProviderDashboard from '../Landing';

export const Route = createFileRoute('/')({
    component: ProviderDashboard,
});
