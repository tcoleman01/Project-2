import { userId } from "./main.js";

export function userStats() {
  const me = {};

  me.refreshStats = async () => {
    try {
      const res = await fetch(`/api/userGames/stats/${userId}`);
      const data = await res.json();

      const stats = data.stats || {};
      document.getElementById("total-games").innerText = stats.totalGames || 0;
      document.getElementById("completed-games").innerText = stats.totalCompleted || 0;
      document.getElementById("hours-logged").innerText = stats.totalHours || 0;
      document.getElementById("total-spent").innerText =
        `$${stats.totalSpent?.toFixed(2) || "0.00"}`;
    } catch (err) {
      console.error("Error fetching stats:", err);
    }
  };
  return me;
}

export const myStats = userStats();
