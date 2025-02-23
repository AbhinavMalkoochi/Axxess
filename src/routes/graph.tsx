import { createFileRoute } from '@tanstack/react-router'
import NetworkVisualization from '../Graph'

export const Route = createFileRoute('/graph')({
  component: NetworkVisualization,
})

