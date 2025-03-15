import { ConnectButton } from "./components/ConnectButton";

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-8">
      <h1 className="text-4xl font-bold">Staking Bridge</h1>
      <ConnectButton />
    </div>
  );
}
