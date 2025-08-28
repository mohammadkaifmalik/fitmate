import React from "react";
import Card from "../components/Card";
import { useAuth } from "../context/AuthContext";
import { api } from "../lib/api";
import { useNavigate } from "react-router-dom";

function computeBmi(h, w){const m=h/100;const bmi=m?+(w/(m*m)).toFixed(1):0;return bmi}
function bmiCat(b){return b<18.5?"Underweight":b<25?"Normal":b<30?"Overweight":"Obese"}

export default function GoalSettings() {
  const { user, setUser } = useAuth();
  const nav = useNavigate();
  const heightCm = user?.profile?.heightCm ?? 170;

  const [goal, setGoal] = React.useState(user?.profile?.goal || "maintain");
  const [weightKg, setWeightKg] = React.useState(user?.profile?.weightKg || "");
  const [regen, setRegen] = React.useState(true);
  const [busy, setBusy] = React.useState(false);
  const [msg, setMsg] = React.useState("");

  const bmi = computeBmi(heightCm, Number(weightKg||0));
  const cat = bmiCat(bmi);

  async function submit(e){
    e.preventDefault();
    setBusy(true); setMsg("Saving…");
    try{
      const r = await api.patch("/profile/goal", {
        goal,
        currentWeightKg: Number(weightKg),
        regenerate: regen,
      });
      setUser(r.data.user);  // updates calories target & profile on client
      if (regen && r.data.needsRegen) {
        setMsg("Regenerating this week’s plan…");
        await api.post("/profile/generate");
      }
      setMsg("Saved!");
      nav("/progress", { replace:true }); // jump to progress so change is visible
    }catch(err){
      console.error(err);
      setMsg(err?.response?.data?.error || err.message || "Failed to update");
    }finally{
      setBusy(false);
      setTimeout(()=>setMsg(""), 1800);
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h2 className="text-2xl font-semibold">Update Goal & Weight</h2>
      <p className="text-slate-600">Enter your current weight, choose a goal, and optionally regenerate your weekly plan. We’ll compute BMI/BMR and adjust your daily calories.</p>

      <Card>
        <form onSubmit={submit} className="space-y-5">
          <div className="grid md:grid-cols-3 gap-3">
            <div>
              <label className="font-medium">Goal</label>
              <select className="mt-2 w-full border rounded-xl px-3 py-2"
                value={goal} onChange={e=>setGoal(e.target.value)}>
                <option value="lose">Lose weight</option>
                <option value="maintain">Maintain</option>
                <option value="gain">Gain weight</option>
              </select>
            </div>

            <div>
              <label className="font-medium">Current weight (kg)</label>
              <input className="mt-2 w-full border rounded-xl px-3 py-2" type="number" min="30" max="250"
                value={weightKg} onChange={e=>setWeightKg(e.target.value)} required />
            </div>

            <div>
              <label className="font-medium">Height (cm)</label>
              <input className="mt-2 w-full border rounded-xl px-3 py-2 bg-slate-50" value={heightCm} readOnly />
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-3">
            <div><div className="text-sm text-slate-600">BMI</div><div className="text-lg font-semibold">{bmi || "—"}</div></div>
            <div><div className="text-sm text-slate-600">Category</div><div className="text-lg font-semibold">{bmi ? cat : "—"}</div></div>
            <div><div className="text-sm text-slate-600">Current daily target</div><div className="text-lg font-semibold">{user?.caloriesTarget ?? 0} kcal</div></div>
          </div>

          <label className="inline-flex items-center gap-2">
            <input type="checkbox" checked={regen} onChange={e=>setRegen(e.target.checked)} />
            <span className="text-sm">Regenerate this week’s plan after saving</span>
          </label>

          <div className="flex items-center gap-3">
            <button disabled={busy} className="px-4 py-3 rounded-xl bg-slate-900 text-white disabled:opacity-60">
              {busy ? "Saving…" : "Save"}
            </button>
            <div className="text-sm text-slate-600">{msg}</div>
          </div>
        </form>
      </Card>
    </div>
  );
}
