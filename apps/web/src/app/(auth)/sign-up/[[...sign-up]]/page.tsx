import { SignUp } from "@clerk/nextjs";

export default function SignUpPage() {
  return (
    <SignUp
      appearance={{
        elements: {
          rootBox: "mx-auto",
          card: "shadow-lg border border-border bg-card",
          headerTitle: "text-foreground",
          headerSubtitle: "text-muted-foreground",
          formButtonPrimary:
            "bg-primary hover:bg-primary/90 text-primary-foreground",
          footerActionLink: "text-primary hover:text-primary/80",
          formFieldInput:
            "border-input bg-background text-foreground focus:ring-primary",
        },
      }}
      path="/sign-up"
      signInUrl="/sign-in"
      fallbackRedirectUrl="/onboarding"
    />
  );
}
