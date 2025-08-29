export async function generatePlan(payload:{
    gender:"Male"|"Female"|"Other";
    heightCm:number; weightKg:number;
    goal:"lose"|"gain"|"maintain";
    activityLevel:"sedentary"|"light"|"moderate"|"active"|"athlete";
    preferences?: string[];
  }) {
    const res = await fetch("/api/plan/generate-plan",{
      method:"POST",
      headers:{ "Content-Type":"application/json", "Authorization": `Bearer ${localStorage.getItem("token")}` },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (!res.ok || !data.ok) throw new Error(data.error || "Failed to generate plan");
    return data.plan;
  }
  