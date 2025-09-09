"use client";

import { ReactElement, ReactNode, useState } from "react";

type TabProps = { title: string; children: ReactNode };

export function Tabs({ children }: { children: ReactElement<TabProps> | Array<ReactElement<TabProps>> }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const tabs = (Array.isArray(children) ? children : [children]) as ReactElement<TabProps>[];
  const active = tabs[activeIndex] as ReactElement<TabProps>;
  return (
    <div className="space-y-4">
      <div className="card p-2 flex gap-1 flex-wrap">
        {tabs.map((child: ReactElement<TabProps>, idx: number) => (
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

export function Tab({ children }: TabProps) {
  return <div>{children}</div>;
}


