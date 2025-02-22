
import './App.css'
import { RouterProvider, createRouter } from '@tanstack/react-router';
import { routeTree } from './routeTree.gen';
const router = createRouter({ routeTree });
import { queryClient } from './queryClient';
import { QueryClientProvider } from '@tanstack/react-query';


declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}

function App() {

  return (
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  )
}

export default App
