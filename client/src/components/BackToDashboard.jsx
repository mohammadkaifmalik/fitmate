import React from "react";
import { Link } from "react-router-dom";

export default function BackToDashboard() {
  return (
    <div className="mb-2">
      <Link to="/" className="inline-flex items-center gap-2 text-sm text-brand-700 hover:underline">
        ← Back to Dashboard
      </Link>
    </div>
  );
}
