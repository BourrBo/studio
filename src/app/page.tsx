import CryptKeeperForm from "@/components/cryptkeeper/CryptKeeperForm";
import AuthButtons from "@/components/auth/AuthButtons";

export default function HomePage() {
  return (
    <div className="relative min-h-screen">
      <div className="absolute top-4 right-4 md:top-8 md:right-8 z-10">
        <AuthButtons />
      </div>
      <main className="min-h-screen flex flex-col items-center justify-center bg-background py-6 px-4">
        <CryptKeeperForm />
      </main>
    </div>
  );
}
