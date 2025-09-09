"use client";

import { PropsWithChildren, ReactElement, ReactNode, useState } from "react";

export function Tabs({ children }: PropsWithChildren<object>) {
  const [activeIndex, setActiveIndex] = useState(0);
  const tabs = (Array.isArray(children) ? children : [children]) as ReactElement[];
  const active = tabs[activeIndex] as ReactElement;
  return (
    <div className="space-y-4">
      <div className="card p-2 flex gap-1 flex-wrap">
        {tabs.map((child: ReactElement, idx: number) => (
          <button
            key={idx}
            className={`btn h-9 px-3 ${idx === activeIndex ? 'btn-primary' : 'btn-ghost'}`}
            onClick={() => setActiveIndex(idx)}
            type="button"
          >
            {child.props.title}
          </button>
        ))}
      </div>
      <div>{active}</div>
    </div>
  );
}

export function Tab({ children }: { children: ReactNode; title: string }) {
  return <div>{children}</div>;
}


