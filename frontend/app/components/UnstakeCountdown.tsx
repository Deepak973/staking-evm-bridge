"use client";

interface CountdownProps {
  startTime: bigint;
  duration: number;
}

const DURATION_IN_DAYS = {
  0: 30, // 1 month
  1: 180, // 6 months
  2: 365, // 1 year
  3: 730, // 2 years
};

export function UnstakeCountdown({ startTime, duration }: CountdownProps) {
  const startTimeMs = Number(startTime) * 1000;
  const durationDays =
    DURATION_IN_DAYS[duration as keyof typeof DURATION_IN_DAYS];
  const endTimeMs = startTimeMs + durationDays * 24 * 60 * 60 * 1000;
  const now = Date.now();
  const daysLeft = Math.ceil((endTimeMs - now) / (1000 * 60 * 60 * 24));

  if (daysLeft <= 0) {
    return (
      <span className="text-sm text-green-600">Ready for auto-unstake</span>
    );
  }

  return (
    <span className="text-sm text-gray-500">
      {`Auto-unstake in ${daysLeft} days`}
    </span>
  );
}
