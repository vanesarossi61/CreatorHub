// Auth layout -- centered card layout for sign-in/sign-up/onboarding
export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-background to-muted">
      <div className="w-full max-w-md space-y-6 px-4">
        <div className="text-center">
          <h1 className="text-3xl font-bold tracking-tight">
            Creator<span className="text-primary">Hub</span>
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            La plataforma que conecta creadores con marcas
          </p>
        </div>
        {children}
      </div>
    </div>
  );
}
