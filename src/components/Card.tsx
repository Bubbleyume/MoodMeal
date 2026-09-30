import React from "react";

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  padded?: boolean;
}

export default function Card({ padded = true, className = "", children, ...rest }: CardProps) {
  return (
    <div className={`card ${padded ? "" : "p-0"} ${className}`} {...rest}>
      {children}
    </div>
  );
}
