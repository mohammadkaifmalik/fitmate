import React from "react";

export default function Logo({ size = "h-9", className = "" }) {
  return (
    <img
      src="/logo.png"  
      alt="FitMate Logo"
      className={`${size} w-auto ${className}`}
    />
  );
}
