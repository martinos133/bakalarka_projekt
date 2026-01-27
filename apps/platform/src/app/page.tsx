export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="z-10 max-w-5xl w-full items-center justify-between font-mono text-sm">
        <h1 className="text-4xl font-bold mb-8">Inzertná Platforma</h1>
        <p className="text-lg mb-4">Verejná časť platformy</p>
        <div className="mt-8">
          <h2 className="text-2xl font-semibold mb-4">Funkcie:</h2>
          <ul className="list-disc list-inside space-y-2">
            <li>Zobrazenie inzerátov</li>
            <li>Vyhľadávanie a filtrovanie</li>
            <li>Detail inzerátu</li>
            <li>Kontakt na predajcu</li>
          </ul>
        </div>
      </div>
    </main>
  )
}
