/**
 * MinimalBooks
 * ui/Shell.tsx
 *
 * Top-level chrome once a company exists: tab bar (NAV_TABS) -> sidebar
 * groups for the selected tab -> the selected entry's component. Adding a
 * screen is purely a ui/nav.ts edit -- this file never changes.
 */

import { useState } from "preact/hooks";
import { NAV_TABS } from "./nav";
import { signOut } from "../lib/auth";
import { currentCompany } from "./store";

export function Shell() {
  const [tabKey, setTabKey] = useState(NAV_TABS[0]!.key);
  const tab = NAV_TABS.find((t) => t.key === tabKey)!;
  const firstEntry = tab.groups[0]?.entries[0];
  const [entryKey, setEntryKey] = useState(firstEntry?.key);

  function selectTab(key: string) {
    setTabKey(key);
    const nextTab = NAV_TABS.find((t) => t.key === key)!;
    setEntryKey(nextTab.groups[0]?.entries[0]?.key);
  }

  const entry = tab.groups.flatMap((g) => g.entries).find((e) => e.key === entryKey);
  const Screen = entry?.component;

  return (
    <div class="shell">
      <header class="shell-header">
        <span class="shell-company-name">{currentCompany.value?.name}</span>
        <nav class="shell-tabs">
          {NAV_TABS.map((t) => (
            <button key={t.key} class={t.key === tabKey ? "active" : ""} onClick={() => selectTab(t.key)}>
              {t.label}
            </button>
          ))}
        </nav>
        <button class="link-button" onClick={() => signOut()}>
          Sign out
        </button>
      </header>
      <div class="shell-body">
        <aside class="shell-sidebar">
          {tab.groups.map((group) => (
            <div class="shell-sidebar-group" key={group.heading}>
              <h3>{group.heading}</h3>
              <ul>
                {group.entries.map((e) => (
                  <li key={e.key}>
                    <button class={e.key === entryKey ? "active" : ""} onClick={() => setEntryKey(e.key)}>
                      {e.label}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </aside>
        <main class="shell-content">{Screen && <Screen />}</main>
      </div>
    </div>
  );
}
