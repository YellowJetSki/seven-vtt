interface StatCardProps {
  label: string;
  value: number;
  icon: string;
}

export default function StatCard({ label, value, icon }: StatCardProps) {
  return (
    <div className="premium-card rounded-xl p-4">
      <div className="text-2xl mb-2">{icon}</div>
      <div className="text-2xl font-bold text-white">{value}</div>
      <div className="text-xs text-surface-400 mt-1">{label}</div>
    </div>
  );
}
