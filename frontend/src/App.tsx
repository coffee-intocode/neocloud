import Chat from './Chat.tsx'
import { ModeToggle } from './components/mode-toggle.tsx'
import { cn } from './lib/utils.ts'

export default function App() {
  return (
    <div className="flex h-screen flex-col overflow-hidden bg-background">
      <header className="border-b bg-background/80 backdrop-blur">
        <div className="mx-auto flex w-full max-w-5xl items-center justify-between px-4 py-3">
          <div>
            <h1 className="text-lg font-semibold">Neocloud</h1>
            <p className="text-sm text-muted-foreground">Barebones client/server scaffold with a public chat surface.</p>
          </div>
          <ModeToggle />
        </div>
      </header>
      <div className="flex flex-1 flex-col justify-center overflow-hidden">
        <div
          className={cn(
            'flex flex-col max-w-4xl mx-auto relative w-full basis-[100vh] overflow-hidden',
            'has-[.stick-to-bottom:empty]:overflow-visible has-[.stick-to-bottom:empty]:basis-[0px] transition-[flex-basis] duration-200',
          )}
        >
          <Chat />
        </div>
      </div>
    </div>
  )
}
