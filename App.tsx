import { ExpoRoot } from 'expo-router';

export default function App() {
  const ctx = (require as any).context('./app');
  return <ExpoRoot context={ctx} />;
}
