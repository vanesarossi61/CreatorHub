import Link from "next/link";

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col">
      {/* Hero */}
      <header className="border-b">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <Link href="/" className="text-xl font-bold ch-gradient-text">
            CreatorHub
          </Link>
          <nav className="flex items-center gap-4">
            <Link
              href="/explore"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Explorar
            </Link>
            <Link
              href="/sign-in"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Iniciar sesion
            </Link>
            <Link
              href="/sign-up"
              className="inline-flex items-center justify-center rounded-lg ch-gradient px-4 py-2 text-sm font-medium text-white hover:opacity-90 transition-opacity"
            >
              Crear cuenta
            </Link>
          </nav>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero Section */}
        <section className="container mx-auto px-4 py-24 text-center">
          <h1 className="text-4xl font-bold tracking-tight sm:text-6xl">
            Conecta con los mejores{" "}
            <span className="ch-gradient-text">creadores de contenido</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
            CreatorHub es el marketplace donde marcas encuentran Clippers, UGC
            Creators, Influencers y Replicators para llevar su contenido al
            siguiente nivel.
          </p>
          <div className="mt-10 flex items-center justify-center gap-4">
            <Link
              href="/sign-up"
              className="inline-flex items-center justify-center rounded-lg ch-gradient px-6 py-3 text-sm font-medium text-white hover:opacity-90 transition-opacity"
            >
              Empezar gratis
            </Link>
            <Link
              href="/explore"
              className="inline-flex items-center justify-center rounded-lg border px-6 py-3 text-sm font-medium hover:bg-accent/10 transition-colors"
            >
              Explorar creadores
            </Link>
          </div>
        </section>

        {/* Roles Section */}
        <section className="border-t bg-muted/50 py-24">
          <div className="container mx-auto px-4">
            <h2 className="text-center text-3xl font-bold">Cuatro roles, infinitas posibilidades</h2>
            <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {[
                {
                  role: "Clipper",
                  emoji: "scissors",
                  desc: "Recorta y edita los mejores momentos de streams y videos largos.",
                },
                {
                  role: "UGC Creator",
                  emoji: "camera",
                  desc: "Crea contenido autentico estilo usuario para marcas.",
                },
                {
                  role: "Influencer",
                  emoji: "star",
                  desc: "Promociona productos con tu audiencia y engagement.",
                },
                {
                  role: "Replicator",
                  emoji: "repeat",
                  desc: "Adapta contenido exitoso a diferentes plataformas y formatos.",
                },
              ].map((item) => (
                <div key={item.role} className="ch-card text-center">
                  <div className="text-3xl mb-3" aria-label={item.emoji}>
                    {item.emoji === "scissors" && "[scissors]"}
                    {item.emoji === "camera" && "[camera]"}
                    {item.emoji === "star" && "[star]"}
                    {item.emoji === "repeat" && "[repeat]"}
                  </div>
                  <h3 className="font-semibold text-lg">{item.role}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-24">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl font-bold">Listo para empezar?</h2>
            <p className="mx-auto mt-4 max-w-xl text-muted-foreground">
              Crea tu perfil en minutos y empieza a conectar con marcas o
              creadores que se ajustan a tu estilo.
            </p>
            <Link
              href="/sign-up"
              className="mt-8 inline-flex items-center justify-center rounded-lg ch-gradient px-8 py-3 text-sm font-medium text-white hover:opacity-90 transition-opacity"
            >
              Crear cuenta gratis
            </Link>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t py-8">
        <div className="container mx-auto flex items-center justify-between px-4 text-sm text-muted-foreground">
          <p>2026 CreatorHub. Todos los derechos reservados.</p>
          <nav className="flex gap-4">
            <Link href="#" className="hover:text-foreground transition-colors">
              Terminos
            </Link>
            <Link href="#" className="hover:text-foreground transition-colors">
              Privacidad
            </Link>
            <Link href="#" className="hover:text-foreground transition-colors">
              Contacto
            </Link>
          </nav>
        </div>
      </footer>
    </div>
  );
}