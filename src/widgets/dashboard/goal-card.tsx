"use client";
import { money, percent } from "@/src/shared/lib/money";
import type { Goal } from "@/src/shared/types";
import { IconBox, Progress } from "@/src/shared/ui";

export function GoalCard({ goal, onClick }: { goal: Goal; onClick: () => void }) {
  const p = percent(goal.allocated, goal.target);
  return (
    <button className={`goal-card ${goal.color}`} onClick={onClick}>
      <div className="goal-name">
        <IconBox name={goal.icon} color={goal.icon === "heart" ? "pink" : goal.color} size={22} />
        <h3>{goal.name}</h3>
      </div>
      <div className="goal-total">
        <strong>
          {money(goal.target, false)} <small>сом</small>
        </strong>
        <span>{p}%</span>
      </div>
      <Progress value={p} color={goal.color} label={goal.name} />
      <div className="goal-caption">
        {money(goal.allocated, false)} <span>/ {money(goal.target)}</span>
      </div>
    </button>
  );
}
