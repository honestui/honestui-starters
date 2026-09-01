import { createFileRoute } from '@tanstack/react-router'
import { StarterHome } from '@/components/starter-home'

export const Route = createFileRoute('/')({ component: Home })

function Home() {
  return <StarterHome framework="TanStack Start" />
}
