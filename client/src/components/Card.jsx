import React from "react";

export default function Card({ title, children, footer, className = "" }) {
  return (
    <div className={`card ${className}`}>
      <div className="card-pad">
        {title && <h3 className="text-lg font-semibold mb-3">{title}</h3>}
        {children}
      </div>
      {footer && <div className="border-t border-slate-200 p-4">{footer}</div>}
    </div>
  );
}
