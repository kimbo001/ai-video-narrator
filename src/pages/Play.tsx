import FlappyNarrator from '@/components/FlappyNarrator';
import { useUser } from '@clerk/clerk-react';   // or your auth hook

export default function PlayPage() {
  const { user } = useUser();
  if (!user) return <p className="text-center mt-10">Sign in to play</p>;
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 to-black text-white">
      <div className="pt-10">
        <FlappyNarrator userId={user.id} />
      </div>
    </div>
  );
}
