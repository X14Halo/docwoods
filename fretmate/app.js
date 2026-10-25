/* Fretmate — minimal chord progression builder (light pads) with key setting and suggestions. Built on core.js */
(function () {
'use strict';
const C = window.Changes;
const { store, theory: T, ui, audio } = C;
const { el, ICON } = ui;

const ICON_SPARK = '<svg viewBox="0 0 20 20" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round" aria-hidden="true"><path d="M10 2.5l1.7 4.3 4.3 1.7-4.3 1.7L10 14.5l-1.7-4.3L4 8.5l4.3-1.7z"/><path d="M15.5 13.5l.7 1.8 1.8.7-1.8.7-.7 1.8-.7-1.8-1.8-.7 1.8-.7z"/></svg>';
const ICON_DICE = '<svg viewBox="0 0 20 20" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true"><rect x="3" y="3" width="14" height="14" rx="3.5"/><circle cx="7" cy="7" r="1.2" fill="currentColor" stroke="none"/><circle cx="13" cy="7" r="1.2" fill="currentColor" stroke="none"/><circle cx="10" cy="10" r="1.2" fill="currentColor" stroke="none"/><circle cx="7" cy="13" r="1.2" fill="currentColor" stroke="none"/><circle cx="13" cy="13" r="1.2" fill="currentColor" stroke="none"/></svg>';
const ICON_LOCK = '<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="4.5" y="9" width="11" height="8" rx="2"/><path class="shackle" d="M7 9V6.5a3 3 0 016 0V9"/></svg>';
const ICON_FRETS = '<svg viewBox="0 0 20 20" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" aria-hidden="true"><path d="M5 3v14M8.3 3v14M11.7 3v14M15 3v14M5 3.5h10M5 8h10M5 12.5h10"/><circle cx="8.3" cy="10.2" r="1.7" fill="currentColor" stroke="none"/><circle cx="11.7" cy="5.8" r="1.7" fill="currentColor" stroke="none"/></svg>';
const ICON_SOLO = '<svg viewBox="0 0 20 20" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M8 15.5V4.5l8-1.8v11"/><circle cx="5.8" cy="15.5" r="2.2"/><circle cx="13.8" cy="13.7" r="2.2"/></svg>';
const ICON_DOTS = '<svg viewBox="0 0 20 20" width="20" height="20" fill="currentColor" aria-hidden="true"><circle cx="4.5" cy="10" r="1.7"/><circle cx="10" cy="10" r="1.7"/><circle cx="15.5" cy="10" r="1.7"/></svg>';
const ICON_CHEV = '<svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 6l4 4 4-4"/></svg>';

const CSS = `
.app {
  --bg: #F4F5F7; --panel: #FFFFFF; --ink: #15171C; --muted: #646A77; --faint: #A3A8B3; --line: #E3E5EA; --cap: #F1F2F5;
  --accent: #4A63E8; --warn: #B45309;
  --fn-tonic: #4A63E8; --fn-pre: #12A266; --fn-dom: #E58A00; --fn-out: #C24FD6;
  --pk-bg: #FFFFFF; --pk-fg: #15171C; --pk-muted: #646A77; --pk-line: #E3E5EA; --pk-chip: #F1F2F5; --pk-warn: #B45309;
  --pk-accent: #4A63E8; --pk-accent-fg: #FFFFFF; --pk-sel-bg: #15171C; --pk-sel-fg: #FFFFFF; --pk-scrim: rgba(21,23,28,.32);
  --pk-font: 'Barlow', system-ui, sans-serif; --pk-display: 'Chakra Petch', 'Barlow', sans-serif; --pk-display-weight: 700; --pk-radius: 24px;
  --pk-key-white: #FFFFFF; --pk-key-black: #2A2D35; --pk-key-black-fg: #C9CCD5; --pk-danger: #D92D20;
  --tt-bg: #15171C; --tt-fg: #FFFFFF; --tt-btn-bg: rgba(255,255,255,.16); --tt-btn-fg: #FFFFFF;
  position: absolute; inset: 0; display: flex; flex-direction: column; background: var(--bg); color: var(--ink);
  font-family: 'Barlow', system-ui, sans-serif;
}
.app .top button, .app .grid button, .app .bar button, .app .tabs button, .app .keybtn, .app .lockbtn { font: inherit; color: inherit; cursor: pointer; border: 0; background: none; padding: 0; }
.app button:focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; }
.app [hidden] { display: none !important; }

.app .top { flex: none; display: flex; align-items: center; justify-content: space-between; padding: 10px 12px 4px 20px; }
.app .brand { font-family: 'Chakra Petch', sans-serif; font-weight: 700; font-size: 16px; letter-spacing: .24em; }
.app .songbtn { display: flex; align-items: center; gap: 6px; min-height: 44px; min-width: 0; padding: 0 8px 0 0 !important; text-align: left; }
.app .songbtn-txt { display: flex; flex-direction: column; min-width: 0; line-height: 1.15; }
.app .songbtn-app { font-family: 'Chakra Petch', sans-serif; font-size: 11px; font-weight: 700; letter-spacing: .24em; color: var(--muted); }
.app .songbtn-name { font-family: 'Chakra Petch', sans-serif; font-size: 18px; font-weight: 700; letter-spacing: .02em; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 52vw; }
.app .songbtn-name.untitled { color: var(--muted); }
.app .songbtn .key-chev { flex: none; }
.app .songs-list { display: flex; flex-direction: column; gap: 8px; }
.app .song-row { display: flex; align-items: stretch; border: 1px solid var(--line); border-radius: 16px; background: #FFFFFF; overflow: hidden; }
.app .song-row.on { border: 2px solid var(--accent); }
.app .song-open { flex: 1; min-width: 0; display: flex; flex-direction: column; align-items: flex-start; gap: 3px; padding: 12px 14px; border: 0; background: none; color: var(--ink); font: inherit; text-align: left; cursor: pointer; }
.app .song-open:active { background: var(--cap); }
.app .song-name { font-weight: 700; font-size: 17px; }
.app .song-meta { font-size: 14px; color: var(--muted); }
.app .song-chords { font-family: 'Chakra Petch', sans-serif; font-size: 15px; color: var(--ink); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 100%; }
.app .song-del { flex: none; width: 52px; border: 0; border-left: 1px solid var(--line); background: none; color: var(--muted); display: flex; align-items: center; justify-content: center; cursor: pointer; }
.app .song-del:active { color: var(--pk-danger); background: var(--cap); }
.app .save-row { display: flex; gap: 8px; }
.app .save-row input { flex: 1; min-width: 0; min-height: 50px; border-radius: 14px; border: 1.5px solid var(--line); padding: 0 14px; font: inherit; font-size: 17px; color: var(--ink); background: #FFFFFF; }
.app .save-row input:focus { outline: none; border-color: var(--accent); }
.app .save-row .rowbtn { flex: none; }
.app .saved-note { font-size: 14px; color: var(--muted); display: flex; align-items: center; gap: 6px; }
.app .saved-note b { color: #12A266; }
.app .tools { display: flex; gap: 2px; }
.app .ic { width: 44px; height: 44px; border-radius: 12px; display: flex; align-items: center; justify-content: center; color: var(--muted) !important; transition: background .15s, opacity .15s; }
.app .ic:active { background: var(--cap) !important; }
.app .ic:disabled { opacity: .35; cursor: default; }

.app .keybar { flex: none; margin: 6px 16px 0; height: 58px; border-radius: 16px; background: var(--panel); border: 1px solid var(--line); display: flex; align-items: center; padding-left: 7px; box-shadow: 0 1px 2px rgba(21,23,28,.04); }
.app .lockbtn { flex: none; width: 44px; height: 44px; border-radius: 12px; display: flex; align-items: center; justify-content: center; color: var(--faint) !important; transition: background .2s, color .2s, transform .12s; }
.app .lockbtn:active { transform: scale(.9); }
.app .lockbtn.on { background: color-mix(in srgb, var(--accent) 12%, #FFFFFF) !important; color: var(--accent) !important; }
.app .lockbtn svg { width: 20px; height: 20px; }
.app .lockbtn:disabled { opacity: .35; cursor: default; }
.app .lockbtn .shackle { transition: transform .25s cubic-bezier(.2,.8,.2,1); transform-origin: 13px 9px; }
.app .lockbtn:not(.on) .shackle { transform: translateX(4px) rotate(18deg); }
.app .keybtn { flex: 1; min-width: 0; height: 56px; border-radius: 0 16px 16px 0; background: transparent !important; border: 0 !important;
  display: flex; align-items: center; gap: 10px; padding: 0 14px 0 18px !important; box-shadow: 0 1px 2px rgba(21,23,28,.04); text-align: left; transition: transform .14s, background .15s; }
.app .keybtn:active { background: var(--cap) !important; }
.app .key-label { font-family: 'Chakra Petch', sans-serif; font-size: 14px; font-weight: 600; letter-spacing: .18em; color: var(--muted); display: flex; align-items: center; gap: 5px; }
.app .key-label svg { width: 13px; height: 13px; color: var(--accent); }
.app .key-name { margin-left: auto; display: flex; align-items: baseline; gap: 8px; font-family: 'Chakra Petch', sans-serif; white-space: nowrap; min-width: 0; }
.app .key-main { font-size: 24px; font-weight: 700; letter-spacing: .04em; }
.app .key-rel { font-size: 16px; font-weight: 600; letter-spacing: .06em; color: var(--muted); }
.app .key-rel::before { content: "/ "; color: var(--faint); }
.app .key-name.none { font-size: 16px; font-weight: 600; letter-spacing: .02em; color: var(--faint); font-family: 'Barlow', sans-serif; }
.app .key-chev { color: var(--faint); display: flex; }
.app .key-name { overflow: hidden; }
@media (max-width: 400px) { .app .key-label { display: none; } .app .key-main { font-size: 22px; } .app .key-rel { font-size: 14px; } .app .keybtn { padding-left: 10px !important; } }
@media (max-width: 340px) { .app .key-rel { display: none; } }

.app .main { flex: 1; min-height: 0; overflow-y: auto; -webkit-overflow-scrolling: touch; padding: 16px 16px 20px; }
.app .grid { position: relative; display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 12px; }
@media (min-width: 480px) { .app .grid { grid-template-columns: repeat(4, minmax(0, 1fr)); } }
.app .pad { --fn: var(--fn-tonic); position: relative; aspect-ratio: 1; max-width: 100%; border-radius: 18px; display: flex; align-items: center; justify-content: center;
  background: color-mix(in srgb, var(--fn) 7%, #FFFFFF) !important; border: 1.5px solid color-mix(in srgb, var(--fn) 50%, transparent) !important;
  box-shadow: 0 6px 16px -10px color-mix(in srgb, var(--fn) 70%, transparent), inset 0 0 18px color-mix(in srgb, var(--fn) 9%, transparent);
  -webkit-user-select: none; user-select: none; -webkit-touch-callout: none; touch-action: manipulation;
  transition: transform .14s ease, background .25s, border-color .25s, box-shadow .25s; }
.app .pad.fn-predominant { --fn: var(--fn-pre); } .app .pad.fn-dominant { --fn: var(--fn-dom); } .app .pad.fn-outside { --fn: var(--fn-out); }
.app .pad.off { --fn: var(--warn); border-style: dashed !important; }
.app .pad:active { transform: scale(.96); }
.app .pad-name { font-family: 'Chakra Petch', sans-serif; font-weight: 700; line-height: 1; letter-spacing: .01em; padding: 0 8px; text-align: center; overflow-wrap: anywhere; color: var(--ink); }
.app .pad-x { position: absolute !important; top: 3px; right: 3px; width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: var(--faint) !important; }
.app .pad-x svg { width: 9px; height: 9px; }
.app .pad-x::before { content: ""; position: absolute; inset: -6px; }
.app .pad-x:active { color: var(--pk-danger) !important; }
.app .pad-flag { position: absolute; top: 7px; left: 7px; width: 22px; height: 22px; border-radius: 50%; background: var(--warn); color: #FFFFFF;
  font: 700 14px/1 'Chakra Petch', sans-serif; display: none; align-items: center; justify-content: center; pointer-events: none; }
.app .pad.off .pad-flag { display: flex; }
.app .pad-info { position: absolute; top: 7px; left: 7px; width: 22px; height: 22px; border-radius: 50%; background: #8E3FC7; color: #FFFFFF;
  font: 700 14px/1 system-ui, sans-serif; display: none; align-items: center; justify-content: center; pointer-events: none; }
.app .pad.color .pad-info { display: flex; }
.app .info-dot { display: inline-flex; width: 19px; height: 19px; border-radius: 50%; background: #8E3FC7; color: #FFFFFF; font: 700 13px/1 system-ui, sans-serif; align-items: center; justify-content: center; vertical-align: 1px; margin-right: 6px; }
.app .idea-chord.bor, .app .ns-chip.bor { box-shadow: inset 0 0 0 1.5px #B57EDC; }
.app .idea-note, .app .ns-note { font-size: 14px; color: #6B2F96; line-height: 1.4; display: flex; gap: 6px; align-items: flex-start; text-align: left; }
.app .idea-note .info-dot, .app .ns-note .info-dot { flex: none; margin-top: 1px; }
.app .pad.flash { animation: app-flash .42s ease-out; }
@keyframes app-flash { 0% { background: color-mix(in srgb, var(--fn) 30%, #FFFFFF); box-shadow: 0 0 0 4px color-mix(in srgb, var(--fn) 25%, transparent), 0 8px 22px -8px var(--fn); } 100% { } }
.app .pad.cx-pressing { transform: scale(.94); transition-duration: .28s; }
.app .pad.cx-placeholder { opacity: .25; box-shadow: none; }
.app .pad.cx-ghost { box-shadow: 0 18px 36px -12px rgba(21,23,28,.35), 0 0 0 1.5px color-mix(in srgb, var(--fn) 60%, transparent); background: #FFFFFF !important; }
.app .add { aspect-ratio: 1; max-width: 100%; border-radius: 18px; border: 1.5px dashed #C9CDD6 !important; display: flex; align-items: center; justify-content: center; color: var(--muted) !important; transition: background .15s, transform .14s; }
.app .add:active { transform: scale(.96); background: var(--cap) !important; }
.app .empty { grid-column: 2 / -1; align-self: center; font-size: 16px; color: var(--muted); line-height: 1.4; padding-left: 4px; }
.app .hint { margin-top: 14px; font-size: 15px; color: var(--muted); text-align: center; line-height: 1.5; }
.app .flag-dot { display: inline-flex; width: 19px; height: 19px; border-radius: 50%; background: var(--warn); color: #FFFFFF; font: 700 13px/1 'Chakra Petch', sans-serif; align-items: center; justify-content: center; vertical-align: 1px; margin-right: 6px; }

.app .bar { flex: none; display: flex; gap: 10px; padding: 8px 16px 16px; }
.app .vibes { flex: none; display: flex; align-items: center; gap: 6px; overflow-x: auto; scrollbar-width: none; padding: 8px 16px 0; }
.app .vibes::-webkit-scrollbar { display: none; }
.app .vibe-label { flex: none; font-family: 'Chakra Petch', sans-serif; font-size: 13px; font-weight: 600; letter-spacing: .18em; color: var(--muted); padding-right: 4px; }
.app .vibe { flex: none; min-height: 34px; padding: 0 13px; border-radius: 999px; border: 1px solid var(--line); background: var(--panel); color: var(--muted); font: inherit; font-size: 16px; font-weight: 600; cursor: pointer; transition: background .2s, color .2s, transform .12s; }
.app .vibe:active { transform: scale(.95); }
.app .vibe.on { background: color-mix(in srgb, var(--accent) 12%, #FFFFFF); color: #2E44B8; border-color: color-mix(in srgb, var(--accent) 45%, transparent); }
.app .vibe-sep { flex: none; width: 1px; height: 20px; background: var(--line); margin: 0 4px; }
.app .vibe.borrow { display: inline-flex; align-items: center; gap: 7px; }
.app .vibe.borrow .sw { width: 22px; height: 13px; border-radius: 7px; background: #CDD1DA; position: relative; transition: background .2s; }
.app .vibe.borrow .sw::after { content: ""; position: absolute; top: 2px; left: 2px; width: 9px; height: 9px; border-radius: 50%; background: #FFFFFF; transition: transform .2s; }
.app .vibe.borrow.on { background: #F6EEFB; color: #6B2F96; border-color: #D9BDEB; }
.app .vibe.borrow.on .sw { background: #8E3FC7; }
.app .vibe.borrow.on .sw::after { transform: translateX(9px); }
.app .pk-body .vibes { padding: 0; margin: 0 -20px; padding-left: 20px; padding-right: 20px; }
.app .bar button { min-width: 0; padding: 0 10px; height: 52px; border-radius: 999px; display: flex; align-items: center; justify-content: center; gap: 8px; font-family: 'Chakra Petch', sans-serif; font-weight: 700; font-size: 16px; letter-spacing: .08em; transition: transform .14s, opacity .15s; }
.app .bar button:active { transform: scale(.97); }
.app .bar .ideas { flex: 1; background: var(--panel) !important; border: 1px solid var(--line) !important; color: var(--ink) !important; }
.app .bar .ideas:disabled { opacity: .45; }
.app .bar .dice { display: flex; }
.app .bar .addbtn { flex: 1; background: var(--ink) !important; color: #FFFFFF !important; box-shadow: 0 8px 20px -10px rgba(21,23,28,.6); }
.app .ideas .count { min-width: 22px; height: 22px; border-radius: 11px; background: var(--warn); color: #FFFFFF; font-size: 13px; display: inline-flex; align-items: center; justify-content: center; padding: 0 5px; letter-spacing: 0; }

.app .tabs { flex: none; display: flex; align-items: stretch; gap: 22px; overflow-x: auto; scrollbar-width: none; margin: 10px 16px 0; border-bottom: 1px solid var(--line); }
.app .tabs::-webkit-scrollbar { display: none; }
.app .tab { flex: none; height: 44px; padding: 0 1px; border: 0 !important; background: none !important; color: var(--faint) !important; border-radius: 0 !important;
  font-family: 'Chakra Petch', sans-serif !important; font-weight: 700; font-size: 16px; letter-spacing: .12em; display: flex; align-items: center; gap: 5px;
  box-shadow: inset 0 -3px 0 transparent; transition: color .2s, box-shadow .25s; }
.app .tab.on { color: var(--ink) !important; box-shadow: inset 0 -3px 0 var(--accent); }
.app .tab .chev { display: flex; color: var(--muted); }
.app .tab .chev svg { width: 12px; height: 12px; }
.app .tab.addtab { color: var(--accent) !important; font-family: 'Barlow', sans-serif !important; font-size: 16px; letter-spacing: .02em; font-weight: 700; gap: 4px; }
.app .tab.addtab svg { width: 13px; height: 13px; }
.app .names { display: flex; flex-wrap: wrap; gap: 6px; }
.app .names button { min-height: 40px; padding: 0 14px; border-radius: 999px; border: 1px solid var(--line); background: #FFFFFF; color: var(--ink); font: inherit; font-weight: 600; cursor: pointer; }
.app .names button.on { background: var(--ink); color: #FFFFFF; border-color: var(--ink); }
.app .rowbtn { display: flex; align-items: center; gap: 10px; min-height: 50px; padding: 0 16px; border-radius: 14px; border: 1px solid var(--line); background: #FFFFFF; color: var(--ink); font: inherit; font-weight: 600; cursor: pointer; }
.app .rowbtn.danger { color: var(--pk-danger); }
.app .rowbtn:disabled { opacity: .4; cursor: default; }

.app .ns-card { border: 1px solid var(--line); border-radius: 18px; padding: 14px; display: flex; flex-direction: column; gap: 12px; background: #FFFFFF; }
.app .ns-top { display: flex; align-items: center; justify-content: space-between; gap: 10px; }
.app .ns-desc { font-size: 16px; color: var(--muted); }
.app .ns-btns { display: flex; gap: 6px; flex: none; }
.app .ns-roll, .app .ns-hear { min-height: 40px; border-radius: 999px; border: 1px solid var(--line); background: #FFFFFF; color: var(--ink); font: inherit; font-weight: 700; display: flex; align-items: center; gap: 6px; padding: 0 14px; cursor: pointer; transition: transform .12s; }
.app .ns-hear { width: 40px; padding: 0; justify-content: center; }
.app .ns-hear svg { width: 16px; height: 16px; }
.app .ns-roll:active, .app .ns-hear:active { transform: scale(.95); }
.app .ns-roll .dice { display: flex; }
.app .ns-chords { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 8px; }
.app .ns-chip { min-height: 56px; border-radius: 14px; border: 1.5px solid color-mix(in srgb, var(--accent) 40%, transparent); background: color-mix(in srgb, var(--accent) 6%, #FFFFFF); color: var(--ink); font-family: 'Chakra Petch', sans-serif; font-weight: 700; font-size: 17px; cursor: pointer; padding: 0 4px; overflow-wrap: anywhere; }
.app .ns-chip:active { transform: scale(.95); }
.app .ns-actions { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 8px; }
.app .ns-actions .rowbtn { justify-content: center; }
.app .rowbtn.primary { background: var(--ink); color: #FFFFFF; border-color: var(--ink); }

.app .fretbtn.on { background: color-mix(in srgb, var(--accent) 12%, #FFFFFF) !important; color: var(--accent) !important; }
.app .pad-gd { display: none; }
.app.frets-on .pad { flex-direction: column; gap: 2px; padding: 8px 6px 4px; aspect-ratio: .84; justify-content: flex-start; }
.app.frets-on .add { aspect-ratio: .84; }
.app.frets-on .pad-name { font-size: 17px !important; padding-right: 22px; padding-left: 22px; line-height: 1.2; min-height: 20px; display: flex; align-items: center; }
.app.frets-on .pad-gd { display: block; width: 84%; max-width: 110px; color: var(--ink); --gd-dot: var(--ink); --gd-num: #FFFFFF; }
.app .pad-gd svg { display: block; width: 100%; height: auto; }
.app .pk-extra { display: flex; flex-direction: column; gap: 14px; padding: 12px 14px; border: 1px solid var(--line); border-radius: 16px; --gd-hl: #E2502A; }
.app .fg-main { display: flex; gap: 16px; align-items: center; }
.app .fg-sub { display: flex; flex-direction: column; gap: 8px; border-top: 1px solid var(--line); padding-top: 12px; }
.app .fg-strip { display: flex; gap: 8px; overflow-x: auto; scrollbar-width: none; margin: 0 -14px; padding: 2px 14px 4px; scroll-snap-type: x proximity; }
.app .fg-strip::-webkit-scrollbar { display: none; }
.app .fg-mini { flex: none; width: 78px; border-radius: 12px; border: 1.5px solid var(--line); background: #FFFFFF; color: var(--ink); padding: 4px 4px 2px; cursor: pointer; display: flex; flex-direction: column; align-items: center; scroll-snap-align: center; transition: border-color .15s, transform .12s; --gd-dot: var(--ink); }
.app .fg-mini svg { width: 100%; height: auto; display: block; }
.app .fg-mini.on { border-color: var(--accent); background: color-mix(in srgb, var(--accent) 7%, #FFFFFF); }
.app .fg-mini:active { transform: scale(.95); }
.app .fg-mini-pos { font-size: 13px; color: var(--muted); font-weight: 600; }
.app .fg-tw { display: flex; flex-direction: column; gap: 8px; padding: 10px 0 2px; }
.app .fg-tw + .fg-tw { border-top: 1px dashed var(--line); }
.app .fg-tw-title { font-size: 16px; font-weight: 700; }
.app .fg-tw-row { display: grid; grid-template-columns: 70px 14px 70px minmax(0, 1fr); gap: 6px; align-items: center; }
.app .fg-tw-dia { color: var(--ink); --gd-dot: var(--ink); }
.app .fg-tw-dia svg { width: 100%; height: auto; display: block; }
.app .fg-tw-arrow { color: var(--faint); display: flex; }
.app .fg-tw-steps { margin: 0; padding-left: 18px; font-size: 15px; line-height: 1.4; color: var(--ink); }
.app .fg-tw-steps li::marker { color: #E2502A; font-weight: 700; }
.app .fg-use { align-self: flex-start; min-height: 36px; padding: 0 14px; border-radius: 999px; border: 1px solid var(--line); background: #FFFFFF; color: var(--accent); font: inherit; font-weight: 700; font-size: 15px; cursor: pointer; }
.app .fg-dia { width: 140px; flex: none; color: var(--ink); --gd-dot: var(--ink); --gd-num: #FFFFFF; }
.app .fg-dia svg { display: block; width: 100%; height: auto; }
.app .fg-info { display: flex; flex-direction: column; gap: 6px; min-width: 0; }
.app .fg-tab { font-family: 'Chakra Petch', sans-serif; font-weight: 700; font-size: 20px; letter-spacing: .12em; overflow-wrap: anywhere; }
.app .fg-pos { font-size: 15px; color: var(--muted); }
.app .fg-nav { display: flex; gap: 8px; margin-top: 4px; }
.app .fg-btn { width: 44px; height: 40px; border-radius: 12px; border: 1px solid var(--line); background: #FFFFFF; color: var(--ink); display: flex; align-items: center; justify-content: center; cursor: pointer; transition: transform .12s; }
.app .fg-btn:active { transform: scale(.93); }
.app .fg-btn:disabled { opacity: .35; cursor: default; }

.app .modes.three { grid-template-columns: repeat(3, minmax(0, 1fr)); }
.app .modes.three button { font-size: 15px; padding: 0 4px; }
.app .solo-head { display: flex; flex-direction: column; gap: 2px; }
.app .solo-name { font-family: 'Chakra Petch', sans-serif; font-weight: 700; font-size: 22px; letter-spacing: .02em; }
.app .solo-sub { font-size: 16px; color: var(--muted); }
.app .fb-wrap { overflow-x: auto; -webkit-overflow-scrolling: touch; margin: 0 -20px; padding: 4px 20px; scrollbar-width: thin; }
.app .fb { display: block; font-family: 'Chakra Petch', sans-serif; }
.app .fb-band { fill: color-mix(in srgb, var(--accent) 9%, #FFFFFF); stroke: color-mix(in srgb, var(--accent) 35%, transparent); stroke-dasharray: 4 3; }
.app .fb-fret { stroke: #C9CDD6; stroke-width: 1.5; }
.app .fb-nut { stroke: var(--ink); stroke-width: 4; }
.app .fb-str { stroke: #9AA0AC; }
.app .fb-sn { font-size: 13px; font-weight: 700; fill: var(--muted); }
.app .fb-fn { font-size: 13px; font-weight: 700; fill: var(--muted); }
.app .fb-inlay { fill: #E3E5EA; }
.app .fb-n { cursor: pointer; transform-box: fill-box; transform-origin: center; }
.app .fb-n text { font-size: 12px; font-weight: 700; pointer-events: none; }
.app .fb-n.root circle { fill: var(--accent); } .app .fb-n.root text { fill: #FFFFFF; }
.app .fb-n.pent circle { fill: var(--ink); } .app .fb-n.pent text { fill: #FFFFFF; }
.app .fb-n.extra circle { fill: #FFFFFF; stroke: var(--ink); stroke-width: 1.5; } .app .fb-n.extra text { fill: var(--ink); }
.app .fb-n.blue circle { fill: #E58A00; } .app .fb-n.blue text { fill: #FFFFFF; }
.app .fb-legend { display: flex; flex-wrap: wrap; gap: 6px 14px; font-size: 14px; color: var(--muted); }
.app .fb-legend span { display: inline-flex; align-items: center; gap: 6px; }
.app .lg { width: 12px; height: 12px; border-radius: 50%; display: inline-block; }
.app .lg.root { background: var(--accent); } .app .lg.pent { background: var(--ink); } .app .lg.extra { border: 1.5px solid var(--ink); } .app .lg.blue { background: #E58A00; }
.app .solo-tips { margin: 0; padding-left: 18px; display: flex; flex-direction: column; gap: 6px; font-size: 16px; line-height: 1.45; color: var(--ink); }

.app .pad-play { position: absolute !important; right: 6px; bottom: 6px; width: 38px; height: 38px; border-radius: 50% !important; display: flex; align-items: center; justify-content: center;
  background: color-mix(in srgb, var(--fn) 16%, #FFFFFF) !important; color: color-mix(in srgb, var(--fn) 75%, #15171C) !important; transition: background .15s; z-index: 1; }
.app .pad-play svg { width: 16px; height: 16px; margin-left: 2px; }
.app .pad-play::before { content: ""; position: absolute; inset: -6px; }
.app .pad-play:active { background: color-mix(in srgb, var(--fn) 32%, #FFFFFF) !important; }
.app.frets-on .pad { aspect-ratio: .66; padding-bottom: 44px; }
.app.frets-on .add { aspect-ratio: .66; }
.app.frets-on .pad-play { left: 6px; right: 6px; width: auto; height: 32px; border-radius: 11px !important; }
.app .pad-tag { position: absolute; bottom: 9px; left: 11px; right: auto; text-align: left; font-family: 'Chakra Petch', sans-serif; font-size: 11px; font-weight: 700; letter-spacing: .16em; color: var(--muted); display: none; pointer-events: none; }
.app .pad.hard .pad-tag { display: block; }
.app.frets-on .pad.hard .pad-tag { display: none; }
.app .capo { margin-top: 14px; display: flex; align-items: center; gap: 12px; padding: 12px 12px 12px 16px; border-radius: 16px; background: #FFFFFF; border: 1px solid color-mix(in srgb, var(--accent) 35%, transparent); box-shadow: 0 1px 2px rgba(21,23,28,.04); }
.app .capo-txt { display: flex; flex-direction: column; gap: 2px; min-width: 0; font-size: 15px; line-height: 1.35; }
.app .capo-txt b { font-size: 16px; }
.app .capo-txt span { color: var(--muted); }
.app .capo-btn { flex: none; min-height: 44px; padding: 0 16px; border-radius: 999px; border: 0; background: var(--accent); color: #FFFFFF; font: inherit; font-weight: 700; font-size: 15px; cursor: pointer; }
.app .capo-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 10px; }
.app .capo-card { display: flex; flex-direction: column; align-items: center; gap: 2px; padding: 10px 6px 8px; border-radius: 16px; border: 1px solid var(--line); background: #FFFFFF; color: var(--ink); cursor: pointer; font: inherit; }
.app .capo-shape { font-family: 'Chakra Petch', sans-serif; font-weight: 700; font-size: 20px; }
.app .capo-dia { width: 86%; color: var(--ink); --gd-dot: var(--ink); } .app .capo-dia svg { width: 100%; height: auto; display: block; }
.app .capo-real { font-size: 13px; color: var(--muted); }
.app .rollgrp { display: flex; padding: 0 !important; overflow: hidden; height: 52px; border-radius: 999px; flex: 1.2 !important; min-width: 0; }
.app .rollgrp button:active { background: rgba(255,255,255,.1) !important; }
.app .rollgrp button { height: 52px; border: 0; background: transparent; color: #FFFFFF; font: inherit; cursor: pointer; display: flex; align-items: center; justify-content: center; }
.app .roll-main { flex: 1; gap: 8px; padding: 0 4px 0 14px !important; min-width: 0; border-radius: 0 !important; }
.app .roll-txt { display: flex; flex-direction: column; align-items: flex-start; line-height: 1.05; font-family: 'Chakra Petch', sans-serif; font-weight: 700; font-size: 16px; letter-spacing: .08em; }
.app .roll-vibe { font-family: 'Barlow', sans-serif; font-size: 12px; font-weight: 600; letter-spacing: .02em; opacity: .8; }
.app .roll-more { width: 42px; flex: none; padding: 0 !important; border-radius: 0 !important; border-left: 1px solid rgba(255,255,255,.22) !important; }
.app .roll-more svg { width: 16px; height: 16px; }
.app .vibe-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 8px; }
.app .vibe-grid .vibe { min-height: 46px; padding: 0 6px; }
.app .swrow { display: flex; align-items: center; justify-content: space-between; gap: 14px; text-align: left; padding: 12px 16px; border-radius: 14px; border: 1px solid var(--line); background: #FFFFFF; color: var(--ink); font: inherit; cursor: pointer; }
.app .swrow-txt { display: flex; flex-direction: column; gap: 2px; }
.app .swrow-txt b { font-size: 16px; } .app .swrow-txt span { font-size: 14px; color: var(--muted); line-height: 1.35; }
.app .swrow-sw { flex: none; width: 44px; height: 26px; border-radius: 13px; background: #CDD1DA; position: relative; transition: background .2s; }
.app .swrow-sw::after { content: ""; position: absolute; top: 3px; left: 3px; width: 20px; height: 20px; border-radius: 50%; background: #FFFFFF; box-shadow: 0 1px 3px rgba(0,0,0,.2); transition: transform .22s cubic-bezier(.2,.8,.2,1); }
.app .swrow.on .swrow-sw { background: var(--accent); }
.app .swrow.on .swrow-sw::after { transform: translateX(18px); }
.app .rowbtn { gap: 12px; }
.app .sw-pair { display: flex; flex-direction: column; gap: 6px; }
.app .sw-pair + .sw-pair { border-top: 1px dashed var(--line); padding-top: 10px; }
.app .sw-names { display: flex; align-items: center; gap: 8px; font-family: 'Chakra Petch', sans-serif; font-size: 17px; }
.app .sw-names span { display: flex; color: var(--faint); }
.app .sw-tips { margin: 0; padding-left: 18px; font-size: 15px; line-height: 1.45; display: flex; flex-direction: column; gap: 4px; }

.app .pk-body .pk-label, .app .pk-body .sh-label { color: var(--ink); font-size: 13px; font-weight: 800; letter-spacing: .12em; }
.app .pk-label .pk-hint { color: var(--muted); font-weight: 500; letter-spacing: 0; font-size: 14px; text-transform: none; }
.app .pk-pane .pk-extra { border: 0; padding: 0; border-radius: 0; }
.app .pk-pane .fg-sub { padding-top: 18px; }
.app .pk-pane .pk-sec + .pk-sec, .app .pk-pane .pk-sec + .pk-delete { border-top: 1px solid var(--line); padding-top: 18px; }
.app .pk-noteline { font-size: 15px; }
.app .pk-pane .pk-sugg { flex-wrap: wrap; overflow: visible; margin: 0; padding: 0; }

.app .hv-row { display: flex; gap: 14px; align-items: flex-start; }
.app .hv-dia { width: 84px; flex: none; color: var(--ink); --gd-dot: var(--ink); } .app .hv-dia svg { width: 100%; height: auto; display: block; }
.app .hv-txt { display: flex; flex-direction: column; gap: 8px; font-size: 15px; line-height: 1.45; margin: 0; }
.app .hv-txt p { margin: 0; } .app .hv-sub { color: var(--muted); }

/* sheets */
.app .pk-rn, .app .pk-notes { display: none; }
.app .sh-sec { display: flex; flex-direction: column; gap: 8px; }
.app .sh-label { font-size: 13px; font-weight: 700; letter-spacing: .12em; text-transform: uppercase; color: var(--muted); }
.app .idea { display: flex; flex-direction: column; align-items: flex-start; gap: 6px; text-align: left; padding: 12px 14px; border-radius: 16px; border: 1px solid var(--line); background: #FFFFFF; color: var(--ink); cursor: pointer; font: inherit; transition: transform .12s, background .15s; }
.app .idea:active { transform: scale(.98); background: var(--cap); }
.app .idea-top { display: flex; justify-content: space-between; align-items: baseline; width: 100%; gap: 10px; }
.app .idea-name { font-weight: 700; font-size: 17px; }
.app .idea-desc { font-size: 14px; color: var(--muted); text-align: right; }
.app .idea-chords { display: flex; flex-wrap: wrap; gap: 5px; }
.app .idea-chord { font-family: 'Chakra Petch', sans-serif; font-weight: 700; font-size: 16px; padding: 3px 8px; border-radius: 8px; background: var(--cap); }
.app .idea-chord.chg { background: color-mix(in srgb, var(--accent) 14%, #FFFFFF); color: #2E44B8; }
.app .fix { padding: 12px 14px; border-radius: 16px; border: 1.5px dashed color-mix(in srgb, var(--warn) 60%, transparent); background: color-mix(in srgb, var(--warn) 5%, #FFFFFF); display: flex; flex-direction: column; gap: 10px; }
.app .fix-top { font-size: 16px; } .app .fix-top b { font-family: 'Chakra Petch', sans-serif; }
.app .fix-chips { display: flex; flex-wrap: wrap; gap: 6px; }
.app .fix-chip { min-height: 44px; padding: 4px 14px; border-radius: 14px; border: 1px solid var(--line); background: #FFFFFF; color: var(--ink); cursor: pointer; font: inherit; display: flex; flex-direction: column; align-items: flex-start; justify-content: center; transition: transform .12s; }
.app .fix-chip:active { transform: scale(.96); }
.app .fix-chip b { font-family: 'Chakra Petch', sans-serif; font-size: 17px; }
.app .fix-chip span { font-size: 13px; color: var(--muted); }
.app .note { margin: 0; font-size: 16px; color: var(--muted); line-height: 1.45; }
.app .auto { display: flex; align-items: center; justify-content: space-between; min-height: 52px; padding: 0 16px; border-radius: 14px; border: 1px solid var(--line); background: #FFFFFF; color: var(--ink); font: inherit; cursor: pointer; }
.app .auto.on { border: 2px solid var(--ink); }
.app .auto b { font-weight: 700; } .app .auto span { color: var(--muted); font-size: 16px; }
.app .modes { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); background: var(--cap); border-radius: 12px; padding: 3px; }
.app .modes button { min-height: 40px; border: 0; border-radius: 10px; background: transparent; font: inherit; font-weight: 600; color: var(--muted); cursor: pointer; transition: background .2s, color .2s; }
.app .modes button.on { background: #FFFFFF; color: var(--ink); box-shadow: 0 1px 3px rgba(21,23,28,.12); }
.app .tonics { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 8px; }
.app .tonics button { min-height: 50px; border-radius: 14px; border: 1px solid var(--line); background: #FFFFFF; color: var(--ink); font-family: 'Chakra Petch', sans-serif; font-weight: 700; font-size: 17px; cursor: pointer; transition: transform .12s, background .15s; }
.app .tonics button:active { transform: scale(.95); }
.app .tonics button.on { background: var(--ink); color: #FFFFFF; border-color: var(--ink); }
@media (prefers-reduced-motion: reduce) { .app .pad { transition: none; } .app .pad.flash { animation: none; } }
`;

/* ───────── theory helpers for suggestions ───────── */
const SCALE = { major: [0, 2, 4, 5, 7, 9, 11], minor: [0, 2, 3, 5, 7, 8, 10] };
const has = (c, semi) => T.Q[c.q].iv.some(([s]) => T.mod(s) === semi);
const isMaj = c => has(c, 4) && !has(c, 3);
const isMin = c => has(c, 3) && !has(c, 4);
const core = c => T.Q[c.q].iv.filter(([s]) => s < 12).map(([s]) => T.mod(c.root + s));
const common = (a, b) => { const s = new Set(core(a)); return core(b).filter(p => s.has(p)).length; };
const same = (a, b) => a.root === b.root && a.q === b.q && (a.bass == null ? null : a.bass) === (b.bass == null ? null : b.bass);
const MODES = { Dorian: [0, 2, 3, 5, 7, 9, 10], Phrygian: [0, 1, 3, 5, 7, 8, 10], Lydian: [0, 2, 4, 6, 7, 9, 11], Mixolydian: [0, 2, 4, 5, 7, 9, 10] };
/* Why is a chord outside the key? kind 'color' = a deliberate, named borrowing; kind 'off' = doesn't fit */
function explain(c, key, a) {
  a = a || T.analyze(c, key);
  if (!key || a.inKey) return null;
  const name = T.chordName(c), tn = T.keyTonicName(key), iv = ivOf(c, key);
  if (a.tag === 'secondary') {
    const target = T.diatonic(key, false).find(d => d.chord.root === T.mod(c.root + 5));
    return { kind: 'color', short: 'Leads somewhere', text: name + ' pulls strongly toward ' + (target ? T.chordName(target.chord) : 'the next chord') + ', so it sounds great right before it. (Theory name: secondary dominant.)' };
  }
  if (a.tag === 'blues') return { kind: 'color', short: 'Bluesy', text: name + ' gives it a bluesy sound. Blues uses 7th chords like this all the time.' };
  if (iv === 1 && has(c, 4) && has(c, 10)) return { kind: 'color', short: 'Jazzy swap', text: name + ' is a jazzy stand-in for the chord that leads home. (Theory name: tritone sub.)' };
  if (a.tag === 'borrowed') {
    const par = T.keyName(T.parallelKey(key));
    return { kind: 'color', short: 'Borrowed', text: name + ' adds a ' + (key.mode === 'major' ? 'darker, moodier' : 'brighter') + ' color. It isn’t in the ' + T.keyName(key) + ' scale, it’s borrowed from ' + par + ', which is a common trick.' };
  }
  const cp = core(c).map(p => T.mod(p - key.tonic));
  for (const [mode, sc] of Object.entries(MODES)) {
    if (cp.every(p => sc.includes(p))) return { kind: 'color', short: 'Borrowed', text: name + ' adds a fresh, unexpected color from outside the scale. (It comes from ' + tn + ' ' + mode + '.)' };
  }
  return { kind: 'off', short: 'Clashes', text: name + ' may sound off here. It uses notes that clash with ' + T.keyName(key) + '.' };
}
const isOffC = (c, key, a) => { const e = key && explain(c, key, a); return !!e && e.kind === 'off'; };
const isColorC = (c, key, a) => { const e = key && explain(c, key, a); return !!e && e.kind === 'color'; };
function listNotes(list, key) {
  if (!key) return [];
  const seen = new Set(), out = [];
  list.forEach(c => { const e = explain(c, key); const n = T.chordName(c); if (e && !seen.has(n)) { seen.add(n); out.push(e.text); } });
  return out;
}
const ivOf = (c, key) => T.mod(c.root - key.tonic);
const degOf = (c, key) => SCALE[key.mode].indexOf(ivOf(c, key));
function accFor(pc, key) {
  const i = SCALE[key.mode].map(x => T.mod(key.tonic + x)).indexOf(T.mod(pc));
  if (i < 0) return 'b';
  const n = T.scaleNotes(key)[i];
  return n.includes('♭') ? 'b' : (n.includes('♯') || n.includes('x')) ? '#' : T.keyAcc(key);
}
const mk = (pc, q, key) => { const acc = accFor(pc, key); return { root: T.mod(pc), acc, q, bass: null, bassAcc: acc }; };
const vary = (c, q) => ({ root: c.root, acc: c.acc, q, bass: c.bass == null ? null : c.bass, bassAcc: c.bassAcc || c.acc });
/* what a chord "is" in the key — power and sus chords count as the triad they imply */
function kindOf(c, key) {
  if (isMaj(c)) return 'maj';
  if (isMin(c)) return T.Q[c.q].fam === 'dim' ? 'dim' : 'min';
  const d = degOf(c, key);
  if (d >= 0) { const q = T.diatonic(key, false)[d].chord.q; return q === 'm' ? 'min' : q === 'dim' ? 'dim' : 'maj'; }
  return 'maj';
}
const isPlain = c => isMaj(c) || isMin(c);
const asTriad = (c, key) => { const k = kindOf(c, key); return vary(c, k === 'maj' ? 'maj' : k === 'min' ? 'm' : 'dim'); };

/* style of a progression: power chords, sevenths or triads */
function styleOf(chords) {
  if (!chords.length) return 'triad';
  const n = q => chords.filter(c => q(c)).length / chords.length;
  if (n(c => c.q === '5') >= 0.5) return 'power';
  if (n(c => T.Q[c.q].iv.length >= 4) >= 0.5) return 'seventh';
  return 'triad';
}
/* ───────── beginner helpers ───────── */
const FINGER = ['', 'index', 'middle', 'ring', 'pinky'];
function changeTips(a, b) {
  const va = Guitar.voicing(a), vb = Guitar.voicing(b);
  if (!va || !vb) return [];
  const STR = Guitar.STR, nb = T.chordName(b);
  if (T.chordName(a) === nb && va.frets.join() === vb.frets.join()) return ['Same chord, no change needed.'];
  const keep = [], slide = [];
  for (let s = 0; s < 6; s++) {
    const fa = va.frets[s], fb = vb.frets[s], g = va.fingers[s];
    if (fa > 0 && fb > 0 && g && g === vb.fingers[s]) {
      if (fa === fb) keep.push('Keep your ' + FINGER[g] + ' finger on the ' + STR[s] + ' string, fret ' + fa + '. It stays put.');
      else if (Math.abs(fa - fb) <= 2) slide.push('Slide your ' + FINGER[g] + ' finger along the ' + STR[s] + ' string from fret ' + fa + ' to ' + fb + '.');
    }
  }
  const fa = va.frets.filter(f => f > 0), fb = vb.frets.filter(f => f > 0);
  const sameMute = va.frets.every((f, i) => (f < 0) === (vb.frets[i] < 0));
  if (sameMute && !va.frets.includes(0) && !vb.frets.includes(0) && fa.length === fb.length) {
    const d = vb.pos - va.pos;
    if (d && va.frets.every((f, i) => f < 0 || vb.frets[i] - f === d)) return ['Same shape. Keep your hand in this shape and slide it ' + (d > 0 ? 'up' : 'down') + ' from fret ' + va.pos + ' to fret ' + vb.pos + '.'];
  }
  if (keep.length || slide.length) return keep.slice(0, 2).concat(slide.slice(0, keep.length ? 1 : 2));
  if (!fb.length) return [nb + ' only uses open strings, so just lift your fingers off.'];
  return ['No fingers stay in place. Picture the ' + nb + ' shape and put all ' + fb.length + ' fingers down together. Practice this change slowly.'];
}
/* a capo position that turns barre chords into easy open shapes */
function capoPlan(chords) {
  if (!chords.length || !window.Guitar) return null;
  const hardN = chords.filter(c => !Guitar.isEasy(c)).length;
  if (!hardN) return null;
  let best = null;
  for (let k = 1; k <= 7; k++) {
    const shapes = chords.map(c => { const r = T.mod(c.root - k); const acc = [1, 3, 8, 10].includes(r) ? (r === 1 || r === 8 ? '#' : 'b') : '#'; return { root: r, acc, q: c.q, bass: c.bass == null ? null : T.mod(c.bass - k), bassAcc: acc, v: 0 }; });
    const easy = shapes.filter(x => Guitar.isEasy(x)).length;
    if (!best || easy > best.easy) best = { capo: k, shapes, easy, total: chords.length };
    if (easy === chords.length) break;
  }
  return best && best.easy > chords.length - hardN ? best : null;
}
const EASY_KEYS = [[7, 'major'], [0, 'major'], [2, 'major'], [9, 'major'], [4, 'major'], [4, 'minor'], [9, 'minor'], [2, 'minor']];

/* ───────── song-section generator ───────── */
const SEC_TYPES = ['Intro', 'Verse', 'Pre-chorus', 'Chorus', 'Bridge', 'Solo', 'Outro'];
const typeOf = name => SEC_TYPES.find(t => name && name.replace(/ \d+$/, '') === t) || 'Verse';
const SEC_DESC = { Intro: 'Sets the scene', Verse: 'Tells the story', 'Pre-chorus': 'Builds into the chorus', Chorus: 'The big moment', Bridge: 'Something new before the last chorus', Solo: 'Room to stretch out', Outro: 'Brings it home' };
const RN_DEF = { I: [0, 'maj'], ii: [2, 'min'], iii: [4, 'min'], IV: [5, 'maj'], iv: [5, 'min'], V: [7, 'maj'], vi: [9, 'min'], 'vii°': [11, 'dim'], bVI: [8, 'maj'], bVII: [10, 'maj'], bIII: [3, 'maj'],
  II: [2, 'maj'], bII: [1, 'maj'], i: [0, 'min'], 'ii°': [2, 'dim'], III: [3, 'maj'], v: [7, 'min'], VI: [8, 'maj'], VII: [10, 'maj'] };
const LIB = {
  major: {
    Intro: ['I IV', 'vi IV', 'I V vi IV', 'IV I', 'I bVII', 'I iii IV IV'],
    Verse: ['I V vi IV', 'I vi IV V', 'I IV vi V', 'vi IV I V', 'I iii IV V', 'I V IV IV', 'I IV I V', 'ii V I I', 'I bVII IV I', 'I vi ii V', 'I IV ii V', 'vi ii V I'],
    'Pre-chorus': ['ii IV V', 'vi IV V', 'IV V', 'ii iii IV V', 'IV iv', 'vi V IV V', 'ii V', 'IV vi V'],
    Chorus: ['IV V I vi', 'I V vi IV', 'vi IV I V', 'IV I V vi', 'I IV vi V', 'IV V iii vi', 'I V IV V', 'IV I V V', 'vi V IV V', 'I bVII IV I'],
    Bridge: ['vi iii IV V', 'bVI bVII I', 'IV iv I', 'ii vi IV V', 'iii vi ii V', 'vi V IV IV', 'IV V vi vi', 'bVI IV I V', 'bIII IV I', 'ii iii IV V'],
    Solo: ['vi IV I V', 'I bVII IV I', 'ii V I vi', 'I IV', 'I vi IV V'],
    Outro: ['IV iv I', 'IV V I', 'vi IV I', 'bVI bVII I', 'ii V I', 'IV I'],
  },
  minor: {
    Intro: ['i VI', 'i VII', 'i iv', 'VI VII i', 'i III VII VI'],
    Verse: ['i VI III VII', 'i iv v i', 'i VII VI VII', 'i VI iv V', 'i iv VI V', 'i III VII iv', 'i VII iv i', 'i v VI iv', 'i VI VII i', 'i iv VII III'],
    'Pre-chorus': ['iv VI V', 'VI VII', 'iv V', 'ii° V', 'VI iv V', 'III iv V'],
    Chorus: ['VI VII i i', 'i VI III VII', 'VI III VII i', 'III VII i VI', 'iv VI III VII', 'VI VII III i', 'i VII VI V', 'III VII VI VII'],
    Bridge: ['III VII iv V', 'VI iv i V', 'iv i VI V', 'VI III iv V', 'III iv VI V', 'iv VII III VI'],
    Solo: ['i VII VI VII', 'i iv', 'VI VII i i', 'i VI III VII'],
    Outro: ['iv V i', 'VI VII i', 'iv i', 'VI V i', 'iv VI i'],
  },
};
const rnd = a => a[(Math.random() * a.length) | 0];
const shuffle = a => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = (Math.random() * (i + 1)) | 0; [a[i], a[j]] = [a[j], a[i]]; } return a; };
const sigOf = list => list.map(T.chordName).join(' ');
const plainList = list => list.map(({ id, ...c }) => c);
/* guitar-friendly keys, weighted toward the common ones */
const KEY_POOL = [[7, 'major', 4], [0, 'major', 4], [2, 'major', 4], [9, 'major', 3], [4, 'major', 3], [5, 'major', 2], [10, 'major', 1], [3, 'major', 1],
  [4, 'minor', 4], [9, 'minor', 4], [2, 'minor', 3], [11, 'minor', 2], [6, 'minor', 2], [0, 'minor', 1], [7, 'minor', 1], [1, 'minor', 1]];
const randomKey = (vibe, avoid, mode, easy) => {
  const want = mode || (VIBES[vibe] && VIBES[vibe].mode) || (Math.random() < 0.6 ? 'major' : 'minor');
  const pool = KEY_POOL.filter(k => k[1] === want && !(avoid && avoid.tonic === k[0] && avoid.mode === k[1]) && (!easy || EASY_KEYS.some(e => e[0] === k[0] && e[1] === k[1])));
  let r = Math.random() * pool.reduce((a, k) => a + k[2], 0);
  for (const k of pool) { if ((r -= k[2]) <= 0) return { tonic: k[0], mode: k[1] }; }
  return { tonic: pool[0][0], mode: pool[0][1] };
};
const transpose = (c, d, key) => { const root = T.mod(c.root + d), acc = accFor(root, key); const bass = c.bass == null ? null : T.mod(c.bass + d); return { root, acc, q: c.q, bass, bassAcc: bass == null ? acc : accFor(bass, key) }; };

/* how many chords a player might use for each kind of section */
const LEN_DIST = {
  Intro: [[1, 0.05], [2, 0.4], [4, 0.55]],
  Verse: [[2, 0.07], [3, 0.06], [4, 0.66], [5, 0.04], [6, 0.07], [8, 0.1]],
  'Pre-chorus': [[2, 0.35], [3, 0.3], [4, 0.35]],
  Chorus: [[3, 0.05], [4, 0.68], [5, 0.05], [6, 0.1], [8, 0.12]],
  Bridge: [[3, 0.15], [4, 0.58], [6, 0.15], [8, 0.12]],
  Solo: [[2, 0.3], [4, 0.6], [8, 0.1]],
  Outro: [[2, 0.25], [3, 0.35], [4, 0.32], [5, 0.08]],
};
function pickLen(type) { let r = Math.random(); for (const [n, p] of LEN_DIST[type] || LEN_DIST.Verse) { if ((r -= p) <= 0) return n; } return 4; }

/* style of a progression: power chords, sevenths or triads */
function styleOf(chords) {
  if (!chords.length) return 'triad';
  const n = q => chords.filter(c => q(c)).length / chords.length;
  if (n(c => c.q === '5') >= 0.5) return 'power';
  if (n(c => T.Q[c.q].iv.length >= 4) >= 0.5) return 'seventh';
  return 'triad';
}
function styled(iv, kind, style, key) {
  let q = kind === 'maj' ? 'maj' : kind === 'min' ? 'm' : 'dim';
  if (style === 'power') q = '5';
  else if (style === 'seventh') q = kind === 'maj' ? (iv === 7 || iv === 10 ? '7' : 'maj7') : kind === 'min' ? 'm7' : 'm7b5';
  return mk(key.tonic + iv, q, key);
}
const fromTemplate = (str, style, key) => str.split(' ').map(rn => { const [iv, k] = RN_DEF[rn]; return styled(iv, k, style, key); });
function colorize(list, style, key) {
  if (style !== 'triad' || Math.random() < 0.6) return list;
  const out = list.slice(); const i = (Math.random() * out.length) | 0; const c = out[i]; const k = kindOf(c, key); const iv = ivOf(c, key);
  out[i] = vary(c, rnd(k === 'maj' ? (iv === 7 ? ['7', 'sus4'] : ['add9', 'sus2', 'maj7']) : k === 'min' ? ['m7', 'madd9'] : ['m7b5']));
  return out;
}
function variations(seed, key, style) {
  const tri = T.diatonic(key, false).map(d => d.chord);
  const restyle = c => styled(ivOf(c, key), kindOf(c, key), style, key);
  const ops = [
    l => { const i = (Math.random() * l.length) | 0; const c = l[i]; const opts = tri.filter(t => t.root !== c.root && common(t, asTriad(c, key)) >= 2); if (!opts.length) return l; const n = l.slice(); n[i] = restyle(rnd(opts)); return n; },
    l => { const i = (Math.random() * l.length) | 0; const n = l.slice(); n[i] = restyle(rnd(tri)); return n; },
    l => { if (l.length < 3) return l; const k = 1 + ((Math.random() * (l.length - 1)) | 0); return l.slice(k).concat(l.slice(0, k)); },
    l => { if (l.length < 2) return l; const i = (Math.random() * (l.length - 1)) | 0; const n = l.slice(); [n[i], n[i + 1]] = [n[i + 1], n[i]]; return n; },
    l => { const n = l.slice(); const maj = key.mode === 'major';
      const i = n.findIndex(c => (maj ? ivOf(c, key) === 5 && kindOf(c, key) === 'maj' : ivOf(c, key) === 7 && kindOf(c, key) === 'min'));
      if (i >= 0) { n[i] = styled(ivOf(n[i], key), maj ? 'min' : 'maj', style, key); return n; }
      n[n.length - 1] = styled(maj ? 10 : 7, 'maj', style, key); return n; },
    l => { const n = l.slice(); const last = n[n.length - 1]; n[n.length - 1] = ivOf(last, key) === 0 ? styled(7, 'maj', style, key) : styled(0, key.mode === 'major' ? 'maj' : 'min', style, key); return n; },
    l => { if (style === 'power') return l; const n = l.slice(); const i = (Math.random() * n.length) | 0; const c = n[i]; const k = kindOf(c, key);
      n[i] = vary(c, k === 'maj' ? rnd(['add9', 'sus2', 'maj7', '6']) : k === 'min' ? rnd(['m7', 'm9', 'madd9']) : 'm7b5'); return n; },
  ];
  const out = [];
  for (let t = 0; t < 12; t++) { let l = seed.slice(); const n = 1 + (Math.random() < 0.55 ? 1 : 0); for (let j = 0; j < n; j++) l = rnd(ops)(l); out.push(l); }
  return out;
}
/* stretch or trim a progression the way a player would: repeat with a new ending, or add a turnaround */
function shapeTo(list, n, type, key, style) {
  if (!n || !list.length || list.length === n) return list;
  const minor = key.mode === 'minor';
  const I = styled(0, minor ? 'min' : 'maj', style, key), V = styled(7, 'maj', style, key);
  const IV = styled(5, minor ? 'min' : 'maj', style, key), ii = minor ? styled(8, 'maj', style, key) : styled(2, 'min', style, key);
  if (n < list.length) return (type === 'Outro' || type === 'Pre-chorus') ? list.slice(-n) : list.slice(0, n);
  const homeEnd = type === 'Outro' || (type === 'Chorus' && chance(0.5)) || (type === 'Verse' && chance(0.25));
  if (n >= list.length * 2) {
    const second = list.slice();
    if (second.length >= 2 && homeEnd) { second[second.length - 2] = V; second[second.length - 1] = I; }
    else if (second.length >= 2) second[second.length - 1] = chance(0.5) ? V : IV;
    let out = list.concat(second);
    while (out.length < n) out = out.concat(list);
    return out.slice(0, n);
  }
  const out = list.slice();
  while (out.length < n) {
    const need = n - out.length;
    out.push(...(need >= 2 ? rnd([[IV, V], [ii, V], [V, I]]) : [rnd([V, IV])]).slice(0, need));
  }
  return out;
}
/* vibes: steer generation toward a feel (scoring picks the progression, color picks the chord types) */
const chance = p => Math.random() < p;
const kindIv = (c, key) => [kindOf(c, key), ivOf(c, key)];
const fracK = (l, key, k) => l.filter(c => kindOf(c, key) === k).length / l.length;
const hasIv = (l, key, iv, k) => l.some(c => ivOf(c, key) === iv && (!k || kindOf(c, key) === k));
/* Each vibe works like a player would: its own typical progressions (tpl), a small budget of
   chord changes, and rules in priority order — signature moves first, everything else stays plain. */
const VIBES = {
  any: { name: 'Any' },
  happy: { name: 'Happy', mode: 'major', desc: 'Bright and simple, a little shimmer',
    tpl: { major: ['I IV V IV', 'I V vi IV', 'I IV I V', 'IV I V V', 'I iii IV V', 'I V IV V', 'I IV vi V'], minor: ['VI VII III III', 'III VII VI VII'] },
    budget: () => [0, 1],
    rules: [
      { m: x => x.iv === 0 && x.k === 'maj', q: ['add9', 'sus2'], p: 0.35 },
      { m: x => x.iv === 5 && x.k === 'maj', q: ['add9', '6', 'maj7'], p: 0.3 },
      { m: x => x.iv === 7 && x.k === 'maj' && !x.last, q: ['sus4'], p: 0.2 },
    ],
    score: (l, key) => fracK(l, key, 'maj') * 1.4 + ([0, 5].includes(ivOf(l[0], key)) ? 0.4 : 0) },
  sad: { name: 'Sad', mode: 'minor', desc: 'Minor colors and the borrowed iv',
    tpl: { major: ['vi IV I V', 'I vi IV V', 'vi V IV V', 'IV iv I I', 'I V vi iii', 'vi IV ii V'], minor: ['i VI III VII', 'i iv VI V', 'i VI iv V', 'i v VI iv', 'i VII VI v'] },
    budget: () => [1, 2],
    rules: [
      { m: x => x.maj && x.iv === 5 && x.k === 'maj', q: x => vary(x.c, 'm'), p: 0.35 },
      { m: x => x.k === 'min', q: ['m7', 'madd9', 'm7'], p: 0.4 },
      { m: x => x.iv === 0 && x.k === 'maj', q: ['maj7', 'add9'], p: 0.25 },
      { m: x => !x.maj && x.iv === 7 && x.k === 'maj', q: ['7'], p: 0.3 },
    ],
    score: (l, key) => fracK(l, key, 'min') * 1.4 + (kindOf(l[0], key) === 'min' ? 0.5 : 0) },
  dreamy: { name: 'Dreamy', desc: 'Major 7ths, ♯11 and 9ths, little tension',
    tpl: { major: ['I IV', 'I iii vi IV', 'IV I', 'I II IV I', 'vi IV I V', 'IV iii ii I', 'I II'], minor: ['i VI', 'VI III', 'i iv VI III', 'VI VII i i'] },
    budget: n => [Math.min(2, n), Math.max(Math.min(2, n), n - 1)],
    rules: [
      { m: x => x.maj && x.iv === 5 && x.k === 'maj', q: ['maj7s11', 'maj7', 'maj9'], p: 0.8 },
      { m: x => x.iv === 0 && x.k === 'maj', q: ['maj7', 'add9', 'maj9', '69'], p: 0.75 },
      { m: x => x.k === 'min', q: ['m9', 'm7', 'madd9', 'm11'], p: 0.6 },
      { m: x => x.iv === 2 && x.k === 'maj', q: ['add9', '9s11'], p: 0.5 },
      { m: x => x.k === 'maj', q: ['add9', 'sus2', 'maj7'], p: 0.4 },
    ],
    score: (l, key) => -0.3 * l.filter(c => ivOf(c, key) === 7).length + (hasIv(l, key, 5) ? 0.3 : 0) },
  dark: { name: 'Dark', mode: 'minor', desc: 'Borrowed minor chords, ♭II and ♭VI',
    tpl: { major: ['vi IV V vi', 'I bVI bVII I', 'vi iii IV IV', 'I bIII IV iv'], minor: ['i VI VII i', 'i bII i i', 'i VI iv V', 'i VII VI V', 'i iv i V', 'i III VI V'] },
    budget: () => [0, 2],
    rules: [
      { m: x => x.maj && x.iv === 5 && x.k === 'maj', q: x => vary(x.c, 'm'), p: 0.45 },
      { m: x => x.maj && x.iv === 9 && x.k === 'min', q: x => mk(x.key.tonic + 8, 'maj', x.key), p: 0.4 },
      { m: x => !x.maj && x.iv === 7 && x.k === 'maj', q: ['7b9', '7'], p: 0.3 },
      { m: x => x.iv === 0 && x.k === 'min', q: ['mmaj7', 'madd9'], p: 0.12 },
    ],
    score: (l, key) => fracK(l, key, 'min') + (hasIv(l, key, 8) ? 0.6 : 0) + (hasIv(l, key, 1) ? 0.4 : 0) },
  epic: { name: 'Epic', desc: 'Big open sounds, ♭VI–♭VII–I',
    tpl: { major: ['I bVI bVII I', 'vi IV I V', 'IV V vi vi', 'I V vi IV', 'bVI bVII I I', 'I bVII IV I'], minor: ['i VI III VII', 'VI VII i i', 'i VI VII VII', 'VI III VII i'] },
    budget: () => [1, 2],
    rules: [
      { m: x => x.iv === 0, q: ['sus2', 'add9', '5'], p: 0.5 },
      { m: x => x.k === 'maj' && x.iv !== 0, q: ['sus2', '5', 'add9'], p: 0.35 },
      { m: x => x.iv === 7 && x.k === 'maj', q: ['sus4'], p: 0.3 },
    ],
    score: (l, key) => (hasIv(l, key, 8, 'maj') ? 0.8 : 0) + (hasIv(l, key, 10, 'maj') ? 0.6 : 0) },
  chill: { name: 'Chill', desc: 'Lo-fi and neo-soul: mostly 7ths and 9ths',
    tpl: { major: ['ii V I I', 'IV iii vi vi', 'I vi ii V', 'IV iii ii I', 'I iii IV iv', 'vi ii V I'], minor: ['i iv VII III', 'i VI ii° V', 'iv v i i', 'i iv v i'] },
    budget: n => [Math.ceil(n * 0.6), n],
    rules: [
      { m: x => x.maj && x.iv === 5 && x.k === 'maj' && x.next === 0, q: x => vary(x.c, 'm7'), p: 0.2 },
      { m: x => x.iv === 7 && x.k === 'maj', q: ['9', '13', '7sus4', '9sus4', '7'], p: 0.9 },
      { m: x => x.k === 'maj', q: ['maj7', 'maj9', '69', 'maj7', '6'], p: 0.75 },
      { m: x => x.k === 'min', q: ['m7', 'm9', 'm11', 'm7'], p: 0.8 },
      { m: x => x.k === 'dim', q: ['m7b5'], p: 0.9 },
    ] },
  bluesy: { name: 'Bluesy', mode: 'major', desc: 'Mostly plain chords, 7ths where they count',
    tpl: { major: ['I IV I V', 'I IV V IV', 'I I IV I', 'I bVII IV I', 'I bIII IV I', 'I IV I I', 'IV IV I I', 'V IV I V'], minor: ['i iv i V', 'i iv v i', 'i VII iv i', 'i iv i i'] },
    budget: () => [1, 2],
    rules: [
      { m: x => x.iv === 7 && x.k === 'maj', q: ['7', '7', '9'], p: 0.6 },
      { m: x => x.iv === 0 && x.k === 'maj' && x.next === 5, q: ['7'], p: 0.6 },
      { m: x => x.iv === 5 && x.k === 'maj', q: ['7', '9'], p: 0.3 },
      { m: x => x.iv === 0 && x.k === 'maj', q: ['7s9', '6', '7'], p: 0.15 },
      { m: x => x.k === 'min', q: ['m7'], p: 0.35 },
    ],
    score: (l, key) => [0, 5, 7].filter(iv => hasIv(l, key, iv)).length * 0.4 },
  jazzy: { name: 'Jazzy', desc: 'ii–V–I, 7ths and color tones throughout',
    tpl: { major: ['ii V I vi', 'I vi ii V', 'iii vi ii V', 'ii V I I', 'I IV iii vi', 'IV iv iii vi'], minor: ['ii° V i i', 'i iv ii° V', 'i VI ii° V', 'iv VII III VI'] },
    budget: n => [n, n],
    rules: [
      { m: x => x.maj && x.k === 'min' && x.iv === 9 && x.next === 2, q: x => vary(x.c, rnd(['7', '7b9'])), p: 0.45 },
      { m: x => x.iv === 7 && x.k === 'maj', q: ['7', '9', '13', '7b9', '7s9', '7alt'], p: 1 },
      { m: x => x.iv === 0 && x.k === 'maj', q: ['maj7', '6', '69', 'maj9'], p: 1 },
      { m: x => x.k === 'maj', q: x => vary(x.c, x.d >= 0 ? rnd(x.iv === 5 ? ['maj7', 'maj9', '6', 'maj7s11'] : ['maj7', 'maj9']) : '7'), p: 1 },
      { m: x => x.k === 'min', q: ['m7', 'm9', 'm7', 'm11'], p: 1 },
      { m: x => x.k === 'dim', q: ['m7b5'], p: 1 },
    ],
    score: l => { let s = 0; for (let i = 0; i < l.length - 1; i++) if (T.mod(l[i + 1].root - l[i].root) === 5) s += 0.35; return s; } },
  heavy: { name: 'Heavy', mode: 'minor', base: 'power', desc: 'Power chords, ♭II and ♭VI riffs',
    tpl: { major: ['I bVII IV I', 'I bIII IV I', 'vi IV V V'], minor: ['i VI VII i', 'i bII i i', 'i iv VI V', 'i VII VI VII', 'i III iv VI', 'i VI III VII'] },
    budget: () => [0, 1],
    rules: [{ m: x => x.last, q: ['sus2'], p: 0.15 }],
    score: (l, key) => (hasIv(l, key, 8) ? 0.5 : 0) + (hasIv(l, key, 10) ? 0.4 : 0) + (hasIv(l, key, 1) ? 0.5 : 0) + fracK(l, key, 'min') * 0.5 },
};
function applyVibe(list, key, vid, style, rebase, strict) {
  const V = VIBES[vid];
  if (!V || !V.rules || !list.length) return list;
  const base = V.base || (style === 'power' ? 'power' : 'triad');
  const l = rebase === false ? list.slice() : list.map(c => { const k = kindOf(c, key); return vary(c, base === 'power' ? '5' : k === 'maj' ? 'maj' : k === 'min' ? 'm' : 'dim'); });
  const n = l.length;
  const [mn, mx] = V.budget(n);
  const target = mn + Math.floor(Math.random() * (mx - mn + 1));
  const done = new Set();
  const ctx = i => { const c = l[i]; return { c, key, i, l, k: kindOf(c, key), iv: ivOf(c, key), d: degOf(c, key), maj: key.mode === 'major', next: n > 1 ? ivOf(l[(i + 1) % n], key) : null, last: i === n - 1 }; };
  const pass = force => {
    for (const r of V.rules) for (const i of shuffle([...Array(n).keys()])) {
      if (done.size >= target) return;
      if (done.has(i)) continue;
      const x = ctx(i);
      if (!r.m(x) || (!force && Math.random() > r.p)) continue;
      const nc = typeof r.q === 'function' ? r.q(x) : vary(x.c, rnd(r.q));
      if (strict && !T.analyze(nc, key).inKey) continue;
      l[i] = nc;
      done.add(i);
    }
  };
  pass(false);
  if (done.size < mn) pass(true);
  return l;
}

/* one fresh progression for a section type */
function generate(type, o) {
  const { key, style, seed, others = [], exclude = new Set() } = o;
  const V = VIBES[o.vibe] || VIBES.any;
  let cands = (LIB[key.mode][type] || LIB[key.mode].Verse).map(t => fromTemplate(t, style, key));
  if (V.tpl) { const extra = (V.tpl[key.mode] || []).map(t => fromTemplate(t, style, key)); cands = cands.concat(extra, extra); }
  if (!V.rules) cands = cands.map(l => colorize(l, style, key));
  const find = t => others.find(x => typeOf(x.name) === t && x.chords.length);
  const verse = find('Verse'), chorus = find('Chorus');
  if (type === 'Intro' && (verse || chorus)) cands.push(plainList((verse || chorus).chords.slice(0, 2)));
  if (type === 'Solo' && (verse || chorus)) cands.push(plainList(rnd([verse, chorus].filter(Boolean)).chords));
  if (type === 'Outro' && chorus) cands.push(plainList(chorus.chords).concat([styled(0, key.mode === 'major' ? 'maj' : 'min', style, key)]));
  if (seed && seed.length) {
    const v = variations(seed, key, style);
    cands = cands.concat(v, v);
  }
  if (o.length) cands = cands.map(l => shapeTo(l, o.length, type, key, style));
  if (V.rules) cands = cands.map(l => applyVibe(l, key, o.vibe, style, true, o.strict));
  const otherSigs = new Set(others.map(x => sigOf(x.chords)));
  const firsts = new Set(others.filter(x => x.chords.length).map(x => x.chords[0].root));
  const ctxChords = [].concat(...others.map(x => x.chords));
  const keepsKey = l => { const d = T.detectKey(ctxChords.concat(l)); return !!d && d.best.tonic === key.tonic && d.best.mode === key.mode; };
  const noneOff = l => l.every(c => !isOffC(c, key));
  const inKeyOnly = l => !o.strict || l.every(c => T.analyze(c, key).inKey);
  let pool = cands.filter(l => l.length && !exclude.has(sigOf(l)) && noneOff(l) && inKeyOnly(l));
  if (!pool.length) pool = cands.filter(l => l.length && noneOff(l) && inKeyOnly(l));
  if (!o.locked) { const k2 = pool.filter(keepsKey); if (k2.length) pool = k2; }
  if (o.easy && window.Guitar) { const e = pool.filter(l => l.every(c => Guitar.isEasy(c))); if (e.length) pool = e; }
  const scored = shuffle(pool).map(l => ({ l,
    s: Math.random() + (V.score ? V.score(l, key) : 0) + (otherSigs.has(sigOf(l)) ? -2 : 0) + ((type === 'Chorus' || type === 'Bridge') && firsts.has(l[0].root) ? -0.5 : 0) }));
  scored.sort((a, b) => b.s - a.s);
  return scored.length ? scored[0].l : null;
}

function replacementsFor(c, key) {
  const pool = [...T.diatonic(key, false), ...T.diatonic(key, true)].map(d => d.chord);
  const n = T.Q[c.q].iv.length;
  const scored = pool.map(d => {
    const cm = common(c, d);
    const score = cm * 2 + (d.root === c.root ? 2.5 : 0) + (T.Q[d.q].iv.length === n ? 0.4 : 0);
    return { chord: d, cm, score };
  }).filter(x => x.cm >= 1 || x.chord.root === c.root).sort((a, b) => b.score - a.score);
  const out = [];
  scored.forEach(x => {
    if (out.length >= 3 || out.some(o => o.chord.root === x.chord.root)) return;
    out.push({ chord: x.chord, tag: x.chord.root === c.root ? 'Same root' : 'Shares ' + x.cm + (x.cm === 1 ? ' note' : ' notes') });
  });
  return out;
}

function flavorsFor(c, key) {
  const out = [];
  const add = (ch, tag) => { if (!same(ch, c) && !out.some(o => same(o.chord, ch))) out.push({ chord: ch, tag }); };
  const d = degOf(c, key), iv = ivOf(c, key), k = kindOf(c, key);
  const M = k === 'maj', m = k === 'min';
  const tri = T.diatonic(key, false), sev = T.diatonic(key, true);
  if (!isPlain(c)) add(asTriad(c, key), 'Full chord');
  tri.filter(t => t.chord.root !== c.root && common(t.chord, asTriad(c, key)) >= 2).slice(0, 2).forEach(t => add(t.chord, 'Swap'));
  if (d >= 0) add(vary(c, sev[d].chord.q), 'Richer');
  else if (M) add(vary(c, '7'), 'Richer');
  if (M) add(vary(c, key.mode === 'major' && iv === 5 ? 'maj7s11' : 'add9'), 'Dreamy');
  if (m) add(vary(c, 'm9'), 'Dreamy');
  if (M || m) add(vary(c, 'sus2'), 'Airy');
  if (M) add(vary(c, 'm'), 'Darker');
  if (m) add(vary(c, 'maj'), 'Brighter');
  if (iv === 7 && M) { add(vary(c, '7'), 'Tense'); add(vary(c, '7sus4'), 'Suspense'); add(vary(c, '7b9'), 'Spicy'); add(mk(key.tonic + 1, '7', key), 'Jazzy sub'); }
  else if (M) add(vary(c, '7'), 'Bluesy');
  if (key.mode === 'major' && iv === 9) add(mk(key.tonic + 8, 'maj', key), 'Epic');
  add(vary(c, '5'), 'Power');
  return out.slice(0, 10);
}

/* whole-progression mood makeovers */
function makeovers(chords, key) {
  const maj = key.mode === 'major';
  const style = styleOf(chords);
  const K = c => kindOf(c, key), IV = c => ivOf(c, key);
  const keep = c => (isPlain(c) ? c : asTriad(c, key));
  const M = [
    { name: 'Full chords', desc: 'Fill in power and sus chords', list: chords.map(c => (isPlain(c) ? c : asTriad(c, key))) },
    { name: 'Brighter', desc: maj ? 'Lift minor chords to major' : 'Dorian lift', list: chords.map(c => {
      const k = K(c), iv = IV(c);
      if (maj) return (iv === 2 || iv === 4) && k === 'min' ? vary(c, 'maj') : keep(c);
      return (iv === 5 || iv === 7) && k === 'min' ? vary(c, 'maj') : keep(c);
    }) },
    { name: 'Open & airy', desc: 'A suspended chord or two', list: applyVibe(chords, key, 'epic', style).map((c, i) => (c.q === '5' ? chords[i] : c)) },
  ];
  ['jazzy', 'chill', 'dreamy', 'bluesy', 'sad', 'dark', 'heavy'].forEach(id => M.push({ name: VIBES[id].name, desc: VIBES[id].desc, list: applyVibe(chords, key, id, style) }));
  const sig = list => list.map(T.chordName).join(' ');
  const seen = new Set([sig(chords)]);
  return M.filter(m => { const s2 = sig(m.list); if (seen.has(s2)) return false; seen.add(s2); return true; });
}

/* re-orderings for different moods (same chords, new order) */
function orderings(chords, an) {
  if (chords.length < 3 || !an.key) return [];
  const key = an.key;
  const G = { I: [], T: [], P: [], D: [], O: [] };
  chords.forEach(c => {
    const a = an.items[c.id]; const iv = ivOf(c, key);
    if (a.fn === 'tonic' && iv === 0) G.I.push(c); else if (a.fn === 'tonic') G.T.push(c);
    else if (a.fn === 'predominant') G.P.push(c); else if (a.fn === 'dominant') G.D.push(c); else G.O.push(c);
  });
  const S = [
    { name: 'Classic loop', desc: 'Home, away, tension, repeat', order: [G.I, G.T, G.P, G.O, G.D] },
    { name: 'Lands home', desc: 'Builds up, resolves at the end', order: [G.P, G.T, G.O, G.D, G.I] },
    { name: 'Melancholy', desc: 'Opens on the minor chord', order: [G.T.filter(c => kindOf(c, key) === 'min'), G.P, G.I, G.T.filter(c => kindOf(c, key) !== 'min'), G.O, G.D] },
    { name: 'Floating', desc: 'Never quite resolves', order: [G.I, G.D, G.T, G.O, G.P] },
    { name: 'Flipped', desc: 'Same chords, reversed', order: [chords.slice().reverse()] },
  ];
  const sig = list => list.map(c => c.id).join(',');
  const seen = new Set([sig(chords)]);
  return S.map(s => ({ ...s, list: [].concat(...s.order) })).filter(s => {
    if (s.list.length !== chords.length) return false;
    const k = sig(s.list); if (seen.has(k)) return false; seen.add(k); return true;
  });
}

function nameSize(name) {
  const n = name.length;
  return n <= 2 ? 36 : n <= 3 ? 31 : n <= 4 ? 27 : n <= 6 ? 21 : n <= 8 ? 17 : 14;
}

function mount(host) {
  if (!document.getElementById('app-css')) document.head.append(el('style', { id: 'app-css', text: CSS }));
  const root = el('div', { class: 'app' });
  host.append(root);
  const undoToast = msg => ui.toast(root, msg, { action: 'Undo', onAction: () => store.undo() });

  /* guitar fingerings */
  audio.setVoicer(ch => { const v = window.Guitar && Guitar.voicing(ch); return v ? v.midi : null; });
  let showFrets = false;
  try { showFrets = localStorage.getItem('changes.frets') === '1'; } catch (e) { /* ignore */ }
  const fretBtn = el('button', { class: 'ic fretbtn', html: ICON_FRETS, onclick: () => {
    showFrets = !showFrets;
    try { localStorage.setItem('changes.frets', showFrets ? '1' : '0'); } catch (e) { /* ignore */ }
    applyFrets(true);
  } });
  function applyFrets(animate) {
    root.classList.toggle('frets-on', showFrets);
    fretBtn.classList.toggle('on', showFrets);
    fretBtn.setAttribute('aria-pressed', showFrets ? 'true' : 'false');
    fretBtn.setAttribute('aria-label', showFrets ? 'Hide guitar fingerings' : 'Show guitar fingerings');
    for (const [, pad] of nodes) { const c = store.find(pad.dataset.id); if (c) drawGd(pad, c); }
    if (animate && !ui.reduceMotion()) grid.querySelectorAll('.pad-gd').forEach((g, i) => g.animate([{ opacity: 0, transform: 'scale(.85)' }, { opacity: 1, transform: 'none' }], { duration: 260, delay: i * 25, easing: ui.EASE, fill: 'backwards' }));
  }
  function drawGd(pad, c) {
    if (!showFrets) { if (pad._gd.innerHTML) { pad._gd.innerHTML = ''; pad._gdKey = ''; } return; }
    const k = c.root + ':' + c.q + ':' + c.bass + ':' + (c.v || 0);
    if (pad._gdKey === k) return;
    pad._gdKey = k;
    pad._gd.innerHTML = Guitar.diagram(Guitar.voicing(c));
  }

  /* top bar */
  const songSlot = el('div', { style: { minWidth: '0', display: 'flex' } });
  const undoBtn = el('button', { class: 'ic', 'aria-label': 'Undo', html: ICON.undo, onclick: () => store.undo() });
  const top = el('header', { class: 'top' }, [
    songSlot,
    el('div', { class: 'tools' }, [
      undoBtn,
      fretBtn,
      el('button', { class: 'ic', 'aria-label': 'More options', html: ICON_DOTS, onclick: () => openMenu() }),
    ]),
  ]);

  /* key button */
  const keyName = el('span', { class: 'key-name', 'aria-live': 'polite' });
  const keyLabel = el('span', { class: 'key-label' });
  const keyBtn = el('button', { class: 'keybtn', onclick: () => openKeySheet() }, [keyLabel, keyName, el('span', { class: 'key-chev', html: ICON_CHEV })]);
  const lockBtn = el('button', { class: 'lockbtn', html: ICON_LOCK, onclick: () => {
    const an = store.analysis;
    if (an.locked) { store.setLock(null); ui.toast(root, 'Key unlocked · it follows your chords'); }
    else if (an.key) { store.setLock(an.key); ui.toast(root, 'Key locked to ' + T.keyName(an.key)); }
  } });
  const keyBar = el('div', { class: 'keybar' }, [lockBtn, keyBtn]);

  /* pads */
  const grid = el('div', { class: 'grid' });
  const addPad = el('button', { class: 'add', 'aria-label': 'Add chord', html: ICON.plus.replace('width="16" height="16"', 'width="24" height="24"'), onclick: () => openPicker(null) });
  const empty = el('div', { class: 'empty', text: 'Tap + to add a chord, or Roll for an idea.' });
  const hint = el('div', { class: 'hint' });
  grid.append(addPad);
  const capoBox = el('div', { class: 'capo', hidden: true });
  const main = el('main', { class: 'main' }, [grid, capoBox, hint]);

  /* bottom bar */
  const ideasCount = el('span', { class: 'count', hidden: true });
  const ideasBtn = el('button', { class: 'ideas', onclick: () => openIdeas() }, [el('span', { html: ICON_SPARK, style: { display: 'flex' } }), 'IDEAS', ideasCount]);
  const diceIcon = el('span', { class: 'dice', html: ICON_DICE });
  const rollVibe = el('span', { class: 'roll-vibe' });
  const rollMain = el('button', { class: 'roll-main', 'aria-label': 'Roll a new idea for this section', onclick: () => roll() }, [diceIcon, el('span', { class: 'roll-txt' }, ['ROLL', rollVibe])]);
  const rollMore = el('button', { class: 'roll-more', 'aria-label': 'Roll settings: vibe and chord choices', html: ICON_CHEV, onclick: () => openRollSettings() });
  const rollBtn = el('div', { class: 'addbtn rollgrp' }, [rollMain, rollMore]);
  const soloBtn = el('button', { class: 'ideas solo', 'aria-label': 'Solo: notes to play over this', onclick: () => openSolo() }, [el('span', { html: ICON_SOLO, style: { display: 'flex' } }), 'SOLO']);
  const bar = el('div', { class: 'bar' }, [ideasBtn, soloBtn, rollBtn]);

  const tabs = el('nav', { class: 'tabs', 'aria-label': 'Song sections' });
  let vibe = 'any';
  try { vibe = localStorage.getItem('changes.vibe') || 'any'; if (!VIBES[vibe]) vibe = 'any'; } catch (e) { /* ignore */ }
  let allowBorrow = false;
  try { allowBorrow = localStorage.getItem('changes.borrow') === '1'; } catch (e) { /* ignore */ }
  const vibeRows = new Set();
  function vibeRow() {
    const row = el('div', { class: 'vibes', role: 'radiogroup', 'aria-label': 'Vibe for new ideas' });
    const draw = () => {
      row.textContent = '';
      row.append(el('span', { class: 'vibe-label', text: 'VIBE' }));
      Object.entries(VIBES).forEach(([id, v]) => row.append(el('button', { class: 'vibe' + (id === vibe ? ' on' : ''), role: 'radio', 'aria-checked': id === vibe ? 'true' : 'false', text: v.name,
        onclick: () => { vibe = id; try { localStorage.setItem('changes.vibe', id); } catch (e) { /* ignore */ } vibeRows.forEach(r => r.draw()); } })));
      row.append(el('span', { class: 'vibe-sep', 'aria-hidden': 'true' }));
      row.append(el('button', { class: 'vibe borrow' + (allowBorrow ? ' on' : ''), 'aria-pressed': allowBorrow ? 'true' : 'false', title: 'Allow chords borrowed from outside the key',
        onclick: () => { allowBorrow = !allowBorrow; try { localStorage.setItem('changes.borrow', allowBorrow ? '1' : '0'); } catch (e) { /* ignore */ } vibeRows.forEach(r => r.draw());
          ui.toast(root, allowBorrow ? 'Ideas can borrow chords from outside the key' : 'Ideas stay in the key'); } },
        [el('span', { class: 'sw', 'aria-hidden': 'true' }), '\u266d Borrowed chords']));
    };
    row.draw = draw; draw(); vibeRows.add(row);
    return row;
  }
  let easyMode = true;
  try { easyMode = localStorage.getItem('changes.easy') !== '0'; } catch (e) { /* ignore */ }
  function setEasy(on) {
    easyMode = on;
    try { localStorage.setItem('changes.easy', on ? '1' : '0'); } catch (e) { /* ignore */ }
    render(store.state, store.analysis, {});
  }
  function updateRollLabel() { rollVibe.textContent = vibe !== 'any' ? VIBES[vibe].name : ''; rollVibe.hidden = vibe === 'any'; }
  const switchRow = (label, desc, get, set) => {
    const b = el('button', { class: 'swrow', role: 'switch' });
    const draw = () => { b.setAttribute('aria-checked', get() ? 'true' : 'false'); b.classList.toggle('on', get()); };
    b.append(el('span', { class: 'swrow-txt' }, [el('b', { text: label }), el('span', { text: desc })]), el('span', { class: 'swrow-sw', 'aria-hidden': 'true' }));
    b.addEventListener('click', () => { set(!get()); draw(); });
    draw();
    return b;
  };
  /* ── saved songs (kept in this browser) ── */
  const SONGS_KEY = 'changes.songs', CUR_KEY = 'changes.currentSong';
  let songs = [], currentId = null;
  try { songs = JSON.parse(localStorage.getItem(SONGS_KEY) || '[]') || []; currentId = localStorage.getItem(CUR_KEY) || null; } catch (e) { songs = []; }
  if (!songs.some(x => x.id === currentId)) currentId = null;
  const persistSongs = () => { try { localStorage.setItem(SONGS_KEY, JSON.stringify(songs)); if (currentId) localStorage.setItem(CUR_KEY, currentId); else localStorage.removeItem(CUR_KEY); } catch (e) { /* storage full or blocked */ } };
  const curSong = () => songs.find(x => x.id === currentId) || null;
  const songName = () => (curSong() ? curSong().name : null);
  const songNameEl = el('span', { class: 'songbtn-name' });
  const songBtn = el('button', { class: 'songbtn', onclick: () => openSongs() }, [
    el('span', { class: 'songbtn-txt' }, [el('span', { class: 'songbtn-app', text: 'FRETMATE' }), songNameEl]),
    el('span', { class: 'key-chev', html: ICON_CHEV }),
  ]);
  songSlot.append(songBtn);
  function drawSongBtn() {
    const n = songName();
    songNameEl.textContent = n || 'Untitled song';
    songNameEl.classList.toggle('untitled', !n);
    songBtn.setAttribute('aria-label', (n ? 'Song: ' + n : 'Untitled song') + '. Open my songs.');
  }
  let autosaveTimer = 0;
  function autosave() {
    const cur = curSong(); if (!cur) return;
    clearTimeout(autosaveTimer);
    autosaveTimer = setTimeout(() => { Object.assign(cur, { data: store.getSong(), savedAt: Date.now() }); persistSongs(); }, 400);
  }
  function saveAs(name) {
    name = (name || '').trim() || 'My song';
    const id = 's' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
    songs.unshift({ id, name, data: store.getSong(), savedAt: Date.now() });
    currentId = id; persistSongs(); drawSongBtn();
    return id;
  }
  const songSummary = d => {
    const secs = (d.sections || []).filter(x => x.chords && x.chords.length);
    const first = secs[0] ? secs[0].chords.slice(0, 6).map(T.chordName).join(' ') : 'No chords yet';
    return { first, secs: (d.sections || []).map(x => x.name).join(' · ') };
  };
  const ago = t => { const m = Math.round((Date.now() - t) / 60000); if (m < 1) return 'just now'; if (m < 60) return m + ' min ago'; const h = Math.round(m / 60); if (h < 24) return h + ' hr ago'; const d = Math.round(h / 24); return d === 1 ? 'yesterday' : d + ' days ago'; };
  function openSongs() {
    const S = ui.sheet(root, { label: 'My songs' });
    const body = el('div', { class: 'pk-body' });
    S.sheet.append(el('div', { class: 'pk-head' }, [el('button', { class: 'pk-cancel', text: 'Close', onclick: () => S.close() }), el('div', { class: 'pk-title', text: 'My songs' }), el('span', { class: 'pk-spacer' })]), body);
    function draw() {
      body.textContent = '';
      const cur = curSong();
      // this song
      const input = el('input', { id: 'song-name', type: 'text', maxlength: '60', placeholder: 'Name this song', value: cur ? cur.name : '', 'aria-label': 'Song name', enterkeyhint: 'done' });
      const saveBtn = el('button', { class: 'rowbtn primary', text: cur ? 'Rename' : 'Save' });
      const doSave = () => {
        const v = input.value.trim();
        if (cur) { if (v && v !== cur.name) { cur.name = v; persistSongs(); drawSongBtn(); ui.toast(root, 'Renamed to ' + v); } }
        else { const nm = v || 'My song'; saveAs(nm); ui.toast(root, 'Saved “' + nm + '”'); }
        draw();
      };
      saveBtn.addEventListener('click', doSave);
      input.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); input.blur(); doSave(); } });
      body.append(el('div', { class: 'sh-sec' }, [
        el('div', { class: 'sh-label', text: 'This song' }),
        el('div', { class: 'save-row' }, [input, saveBtn]),
        cur ? el('div', { class: 'saved-note' }, [el('b', { text: '✓' }), 'Saved. Your edits save automatically.']) : el('p', { class: 'note', text: 'Give it a name to keep it. After that, every change saves automatically.' }),
      ]));
      body.append(el('div', { class: 'sh-sec' }, [
        el('button', { class: 'rowbtn', onclick: () => { currentId = null; persistSongs(); store.loadSong({ sections: [{ name: 'Verse', chords: [] }] }); drawSongBtn(); undoToast('Started a new song'); S.close(); } },
          [el('span', { html: ICON.plus, style: { display: 'flex' } }), 'Start a new song']),
      ]));
      // saved list
      const list = el('div', { class: 'songs-list' });
      songs.forEach(sg => {
        const sum = songSummary(sg.data || {});
        list.append(el('div', { class: 'song-row' + (sg.id === currentId ? ' on' : '') }, [
          el('button', { class: 'song-open', 'aria-label': 'Open ' + sg.name, onclick: () => {
            if (sg.id !== currentId) { currentId = sg.id; persistSongs(); store.loadSong(sg.data); drawSongBtn(); ui.toast(root, 'Opened “' + sg.name + '”'); }
            S.close();
          } }, [
            el('span', { class: 'song-name', text: sg.name }),
            el('span', { class: 'song-chords', text: sum.first }),
            el('span', { class: 'song-meta', text: sum.secs + ' · ' + ago(sg.savedAt) }),
          ]),
          el('button', { class: 'song-del', 'aria-label': 'Delete ' + sg.name, html: ICON.trash, onclick: () => {
            const i = songs.indexOf(sg); songs.splice(i, 1);
            const wasCur = sg.id === currentId; if (wasCur) currentId = null;
            persistSongs(); drawSongBtn(); draw();
            ui.toast(root, 'Deleted “' + sg.name + '”', { action: 'Undo', onAction: () => { songs.splice(i, 0, sg); if (wasCur) currentId = sg.id; persistSongs(); drawSongBtn(); if (S.layer.isConnected) draw(); } });
          } }),
        ]));
      });
      body.append(el('div', { class: 'sh-sec' }, [el('div', { class: 'sh-label', text: songs.length ? 'Saved songs' : 'Saved songs' }),
        songs.length ? list : el('p', { class: 'note', text: 'Nothing saved yet. Songs are kept on this device, in this browser.' })]));
      if (songs.length) body.append(el('p', { class: 'note', text: 'Songs are kept on this device, in this browser.' }));
    }
    draw();
  }

  function openMenu() {
    const S = ui.sheet(root, { label: 'Options' });
    const body = el('div', { class: 'pk-body' });
    S.sheet.append(el('div', { class: 'pk-head' }, [el('button', { class: 'pk-cancel', text: 'Close', onclick: () => S.close() }), el('div', { class: 'pk-title', text: 'Options' }), el('span', { class: 'pk-spacer' })]), body);
    body.append(
      switchRow('Easy chords', 'Prefer open chords in ideas, tag barre chords and suggest a capo.', () => easyMode, setEasy),
      el('button', { class: 'rowbtn', onclick: () => { S.close(); setTimeout(() => ui.presets(root, { onPick: p => undoToast('Loaded ' + p.name) }), 200); } }, [el('span', { html: ICON.book, style: { display: 'flex' } }), 'Example progressions']),
      el('button', { class: 'rowbtn danger', disabled: !store.state.chords.length, onclick: () => { store.clear(); undoToast('Cleared'); S.close(); } }, [el('span', { html: ICON.trash, style: { display: 'flex' } }), 'Clear this section']),
    );
  }
  function openRollSettings() {
    const S = ui.sheet(root, { label: 'Roll settings', onClose: () => { vibeRows.delete(row); updateRollLabel(); } });
    const body = el('div', { class: 'pk-body' });
    S.sheet.append(el('div', { class: 'pk-head' }, [el('button', { class: 'pk-cancel', text: 'Close', onclick: () => S.close() }), el('div', { class: 'pk-title', text: 'Roll settings' }), el('span', { class: 'pk-spacer' })]), body);
    const row = el('div', { class: 'vibe-grid', role: 'radiogroup', 'aria-label': 'Vibe' });
    row.draw = () => { row.textContent = ''; Object.entries(VIBES).forEach(([id, v]) => row.append(el('button', { class: 'vibe' + (id === vibe ? ' on' : ''), role: 'radio', 'aria-checked': id === vibe ? 'true' : 'false', text: v.name,
      onclick: () => { vibe = id; try { localStorage.setItem('changes.vibe', id); } catch (e) { /* ignore */ } vibeRows.forEach(r => r.draw()); updateRollLabel(); } }))); };
    row.draw(); vibeRows.add(row);
    body.append(
      el('div', { class: 'sh-sec' }, [el('div', { class: 'sh-label', text: 'Vibe' }), el('p', { class: 'note', text: 'Pick a feel and Roll writes chords to match.' }), row]),
      el('div', { class: 'sh-sec' }, [
        switchRow('Easy chords', 'Stick to open chords, no barre chords where possible.', () => easyMode, setEasy),
        switchRow('Borrowed chords', 'Allow a few chords from outside the key for extra color.', () => allowBorrow, v => { allowBorrow = v; try { localStorage.setItem('changes.borrow', v ? '1' : '0'); } catch (e) { /* ignore */ } vibeRows.forEach(r => r.draw()); }),
      ]),
      el('button', { class: 'rowbtn primary', onclick: () => { S.close(); setTimeout(roll, 250); } }, [el('span', { html: ICON_DICE, style: { display: 'flex' } }), 'Roll now']),
    );
  }
  root.append(top, keyBar, tabs, main, bar);
  updateRollLabel();
  root.style.setProperty('--tt-bottom', '92px');

  /* ── key display ── */
  let shownKey = null, scrambleTimer = 0;
  const keyMain = el('span', { class: 'key-main' });
  const keyRel = el('span', { class: 'key-rel' });
  function setKey(key, locked) {
    keyLabel.textContent = 'KEY';
    keyBtn.setAttribute('aria-label', (key ? 'Key ' + T.keyName(key) : 'No key yet') + '. Tap to choose a key.');
    lockBtn.classList.toggle('on', !!locked);
    lockBtn.disabled = !key && !locked;
    lockBtn.setAttribute('aria-pressed', locked ? 'true' : 'false');
    lockBtn.setAttribute('aria-label', locked ? 'Key locked. Tap to unlock and follow your chords.' : 'Key follows your chords. Tap to lock it.');
    const name = key ? T.keyName(key) : null;
    if (name === shownKey) return;
    shownKey = name;
    clearInterval(scrambleTimer);
    keyName.textContent = '';
    if (!name) { keyName.className = 'key-name none'; keyName.textContent = 'Add a chord'; return; }
    keyName.className = 'key-name';
    keyName.append(keyMain, keyRel);
    keyRel.textContent = T.keyName(T.relativeKey(key)).toUpperCase();
    if (!ui.reduceMotion()) keyRel.animate([{ opacity: 0, transform: 'translateX(-6px)' }, { opacity: 1, transform: 'none' }], { duration: 320, delay: 200, easing: ui.EASE, fill: 'backwards' });
    const target = name.toUpperCase();
    if (ui.reduceMotion()) { keyMain.textContent = target; return; }
    const glyphs = 'ABCDEFG♯♭#-=';
    let t = 0;
    scrambleTimer = setInterval(() => {
      t++;
      const done = Math.floor(t / 2);
      keyMain.textContent = target.split('').map((ch, i) => (i < done || ch === ' ' ? ch : glyphs[(Math.random() * glyphs.length) | 0])).join('');
      if (done >= target.length) { clearInterval(scrambleTimer); keyMain.textContent = target; }
    }, 28);
  }

  /* ── pads (keyed) ── */
  const nodes = new Map();
  function makePad(c) {
    const name = el('span', { class: 'pad-name' });
    const flag = el('span', { class: 'pad-flag', 'aria-hidden': 'true', text: '!' });
    const info = el('span', { class: 'pad-info', 'aria-hidden': 'true', text: '\u266d' });
    const x = el('button', { class: 'pad-x', 'data-nodrag': '', html: ICON.close, onclick: e => { e.stopPropagation(); removeWithUndo(c.id); } });
    const gd = el('span', { class: 'pad-gd', 'aria-hidden': 'true' });
    const tag = el('span', { class: 'pad-tag', 'aria-hidden': 'true', text: 'BARRE' });
    const play = el('button', { class: 'pad-play', 'data-nodrag': '', html: ICON.play, onclick: e => {
      e.stopPropagation();
      const ch = store.find(pad.dataset.id); if (!ch) return;
      audio.chord(ch);
      flash(pad);
      if (!ui.reduceMotion()) play.animate([{ transform: 'scale(1)' }, { transform: 'scale(.82)' }, { transform: 'scale(1.08)' }, { transform: 'scale(1)' }], { duration: 300, easing: ui.EASE });
    } });
    const pad = el('button', { class: 'pad', 'data-id': c.id }, [flag, info, name, gd, tag, play, x]);
    pad._play = play;
    pad._name = name; pad._x = x; pad._flag = flag; pad._gd = gd;
    pad.addEventListener('click', () => {
      const ch = store.find(pad.dataset.id); if (!ch) return;
      openPicker(ch);
    });
    return pad;
  }
  function flash(pad) { pad.classList.remove('flash'); void pad.offsetWidth; pad.classList.add('flash'); }
  function updatePad(pad, c, a) {
    const name = T.chordName(c);
    if (pad._name.textContent !== name) {
      const had = pad._name.textContent;
      pad._name.textContent = name; pad._name.style.fontSize = nameSize(name) + 'px';
      if (had && pad.isConnected) flash(pad);
    }
    pad.className = pad.className.replace(/\bfn-\S+/g, '').trim() + ' fn-' + (a ? a.fn : 'outside');
    const key = store.analysis.key;
    const off = isOffC(c, key, a), color = !off && isColorC(c, key, a);
    pad.classList.toggle('color', color);
    if (off && !pad.classList.contains('off') && pad.isConnected && !ui.reduceMotion()) {
      pad._flag.animate([{ transform: 'scale(0)' }, { transform: 'scale(1.3)', offset: .6 }, { transform: 'scale(1)' }], { duration: 360, delay: 120, easing: ui.EASE, fill: 'backwards' });
      pad.animate([{ transform: 'rotate(0)' }, { transform: 'rotate(-3deg)' }, { transform: 'rotate(3deg)' }, { transform: 'rotate(-2deg)' }, { transform: 'rotate(0)' }], { duration: 360, delay: 120 });
    }
    pad.classList.toggle('off', off);
    pad.setAttribute('aria-label', name + (off ? ', does not fit the key' : color ? ', borrowed chord' : '') + ', tap to change');
    pad._x.setAttribute('aria-label', 'Remove ' + name);
    pad._play.setAttribute('aria-label', 'Play ' + name);
    const hard = easyMode && !Guitar.isEasy(c);
    pad.classList.toggle('hard', hard);
    if (hard) pad.setAttribute('aria-label', pad.getAttribute('aria-label').replace(', tap to change', ', barre chord, tap to change'));
    drawGd(pad, c);
  }
  function popIn(pad, delay) {
    if (ui.reduceMotion()) return;
    pad.animate([{ transform: 'scale(.6)', opacity: 0 }, { transform: 'scale(1.06)', opacity: 1, offset: .7 }, { transform: 'scale(1)' }], { duration: 300, delay: delay || 0, easing: ui.EASE, fill: 'backwards' });
  }
  function popOut(pad) {
    const sibs = [...grid.children].filter(n => n !== pad && !n.classList.contains('cx-ghost'));
    if (ui.reduceMotion()) { pad.remove(); return; }
    pad.style.pointerEvents = 'none';
    pad.animate([{ transform: 'scale(1)', opacity: 1 }, { transform: 'scale(.5)', opacity: 0 }], { duration: 170, easing: 'ease-in', fill: 'forwards' })
      .onfinish = () => ui.flip(sibs, () => pad.remove(), { duration: 240 });
  }

  function renderTabs(state) {
    tabs.textContent = '';
    state.sections.forEach(sec => {
      const on = sec.id === state.cur;
      tabs.append(el('button', { class: 'tab' + (on ? ' on' : ''), 'aria-current': on ? 'true' : null, 'aria-label': sec.name + (on ? ', tap for section options' : ''),
        onclick: () => (on ? openSectionMenu(sec) : store.switchSection(sec.id)) }, [sec.name.toUpperCase(), on ? el('span', { class: 'chev', html: ICON_CHEV }) : null]));
    });
    tabs.append(el('button', { class: 'tab addtab', 'aria-label': 'Add a song section', onclick: () => openNewSection() }, [el('span', { html: ICON.plus, style: { display: 'flex' } }), 'Section']));
    const on = tabs.querySelector('.on'); if (on) on.scrollIntoView({ block: 'nearest', inline: 'nearest' });
  }

  function render(state, an, change) {
    setKey(an.key, an.locked);
    renderTabs(state);
    if (change && change.type === 'section' && !ui.reduceMotion()) {
      const dx = (change.dir || 1) * 28;
      main.animate([{ opacity: 0, transform: `translateX(${dx}px)` }, { opacity: 1, transform: 'none' }], { duration: 260, easing: ui.EASE });
      main.scrollTop = 0;
    }
    undoBtn.disabled = !store.canUndo();
    const bulk = change && (change.type === 'load' || change.type === 'clear' || change.type === 'undo' || change.type === 'section' || change.type === 'song');
    const ids = new Set(state.chords.map(c => c.id));
    for (const [id, pad] of nodes) {
      if (ids.has(id)) continue;
      nodes.delete(id);
      if (bulk) pad.remove(); else popOut(pad);
    }
    const fresh = [];
    state.chords.forEach(c => {
      let pad = nodes.get(c.id);
      if (!pad) { pad = makePad(c); nodes.set(c.id, pad); fresh.push(pad); }
      updatePad(pad, c, an.items[c.id]);
    });
    const desired = state.chords.map(c => nodes.get(c.id));
    const current = [...grid.querySelectorAll('.pad[data-id]')].filter(n => ids.has(n.dataset.id));
    const inOrder = current.length === desired.length && current.every((n, i) => n === desired[i]);
    const place = () => desired.forEach(n => grid.insertBefore(n, addPad));
    if (inOrder && !fresh.length) { /* nothing to move */ }
    else if (!current.length || (bulk && fresh.length)) place();
    else ui.flip(current, place, { duration: 300 });
    fresh.forEach((p, i) => popIn(p, bulk ? i * 45 : 0));
    if (change && change.type === 'add') {
      const p = nodes.get(change.id); if (p) p.scrollIntoView({ block: 'nearest', behavior: ui.reduceMotion() ? 'auto' : 'smooth' });
    }
    const isEmpty = !state.chords.length;
    if (isEmpty && !empty.isConnected) grid.append(empty);
    if (!isEmpty && empty.isConnected) empty.remove();

    // capo suggestion
    const plan = easyMode ? capoPlan(state.chords) : null;
    capoBox.hidden = !plan;
    if (plan) {
      const key = plan.capo + ':' + plan.shapes.map(T.chordName).join(' ');
      if (capoBox._k !== key) {
        capoBox._k = key;
        capoBox.textContent = '';
        capoBox.append(
          el('div', { class: 'capo-txt' }, [el('b', { text: 'Easier with a capo on fret ' + plan.capo }), el('span', { text: 'Play these simpler shapes: ' + plan.shapes.map(T.chordName).join(' · ') + (plan.easy < plan.total ? ' (most are open chords)' : '') })]),
          el('button', { class: 'capo-btn', onclick: () => openCapo(plan) }, ['Show me']),
        );
        if (!ui.reduceMotion()) capoBox.animate([{ opacity: 0, transform: 'translateY(6px)' }, { opacity: 1, transform: 'none' }], { duration: 260, easing: ui.EASE });
      }
    } else capoBox._k = '';
    const offCount = state.chords.filter(c => isOffC(c, an.key, an.items[c.id])).length;
    const colorCount = state.chords.filter(c => isColorC(c, an.key, an.items[c.id])).length;
    hint.hidden = isEmpty;
    hint.textContent = '';
    hint.append(el('div', { text: showFrets ? 'Tap ▶ to hear a chord · tap the chord to change it or its fingering · hold to move it' : 'Tap ▶ to hear a chord · tap the chord to change it · hold to move it' }));
    if (colorCount) hint.append(el('div', { style: { marginTop: '4px' } }, [el('span', { class: 'info-dot', 'aria-hidden': 'true', text: '\u266d' }), 'Outside the scale on purpose, for color · tap to see why']));
    if (offCount) hint.append(el('div', { style: { marginTop: '4px' } }, [el('span', { class: 'flag-dot', 'aria-hidden': 'true', text: '!' }), 'May sound off here · tap it or open Ideas for a better fit']));
    ideasCount.hidden = !offCount;
    ideasCount.textContent = offCount;
    ideasBtn.disabled = isEmpty;
    ideasBtn.setAttribute('aria-label', 'Ideas' + (offCount ? ', ' + offCount + ' chord' + (offCount > 1 ? 's' : '') + ' to fix' : ''));
  }

  function removeWithUndo(id) {
    const c = store.find(id); if (!c) return;
    const name = T.chordName(c);
    store.remove(id);
    undoToast('Removed ' + name);
  }

  let editCtx = { prev: null, next: null };
  let lastTab = 'play';
  try { lastTab = localStorage.getItem('changes.tab') || 'play'; } catch (e) { /* ignore */ }
  const tagHard = items => items.map(it => (easyMode && !Guitar.isEasy(it.chord) ? { ...it, tag: (it.tag ? it.tag + ' · ' : '') + 'barre' } : it));
  function openPicker(chord) {
    const an = store.analysis, key = an.key;
    const list = store.state.chords, ix = chord ? list.findIndex(c => c.id === chord.id) : list.length;
    editCtx = { prev: ix > 0 ? list[ix - 1] : null, next: chord && ix < list.length - 1 ? list[ix + 1] : null };
    const suggest = [];
    if (chord && key) {
      if (isOffC(chord, key, an.items[chord.id])) suggest.push({ title: 'Better fits', hint: 'in ' + T.keyName(key), tone: 'fix', items: tagHard(replacementsFor(chord, key)) });
      suggest.push({ title: 'Try a different flavor', items: tagHard(flavorsFor(chord, key)) });
    }
    const ex = chord && key ? explain(chord, key, an.items[chord.id]) : null;
    let initial = chord ? lastTab : 'change';
    if (chord && ex && ex.kind === 'off') initial = 'ideas';
    ui.picker({
      host: root,
      tabs: { initial, onTab: k => { if (chord) { lastTab = k; try { localStorage.setItem('changes.tab', k); } catch (e) { /* ignore */ } } } },
      note: ex ? ex.text + (ex.kind === 'off' ? ' Try one of the better fits below.' : '') : null,
      simpleTypes: ['maj', 'm', '7', 'maj7', 'm7', 'sus2', 'sus4', 'add9'],
      noteTone: ex ? ex.kind : null,
      mode: chord ? 'edit' : 'add',
      chord,
      rootStyle: 'pads',
      suggest,
      renderExtra: renderFingering,
      onSubmit: spec => (chord ? store.update(chord.id, spec) : store.add(spec)),
      onDelete: chord ? () => removeWithUndo(chord.id) : null,
    });
  }

  /* guitar section of the chord editor: big diagram, every shape, and how to get there from a shape you know */
  const ARROW_L = '<svg viewBox="0 0 16 16" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M10 3L5 8l5 5"/></svg>';
  const ARROW_R = '<svg viewBox="0 0 16 16" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 3l5 5-5 5"/></svg>';
  function renderFingering(spec, box, setV, setSpec) {
    const vs = Guitar.voicings(spec);
    const i = Math.min(spec.v || 0, Math.max(0, vs.length - 1));
    const v = vs[i] || null;
    const shapeKey = spec.root + ':' + spec.q + ':' + spec.bass;
    const posText = vv => (vv.frets.includes(0) && vv.pos <= 4 ? 'Open position' : 'Fret ' + vv.pos);
    if (box._shape !== shapeKey) {
      box._shape = shapeKey;
      box.textContent = '';
      box._dia = el('div', { class: 'fg-dia' });
      box._tab = el('div', { class: 'fg-tab' });
      box._pos = el('div', { class: 'fg-pos' });
      box._prev = el('button', { class: 'fg-btn', 'aria-label': 'Previous shape', html: ARROW_L });
      box._next = el('button', { class: 'fg-btn', 'aria-label': 'Next shape', html: ARROW_R });
      box._strip = el('div', { class: 'fg-strip', role: 'listbox', 'aria-label': 'All shapes' });
      vs.forEach((x, n) => box._strip.append(el('button', { class: 'fg-mini', role: 'option', 'aria-label': 'Shape ' + (n + 1) + ', ' + Guitar.tab(x), html: Guitar.diagram(x), onclick: () => setV(n) }, [el('span', { class: 'fg-mini-pos', text: x.frets.includes(0) && x.pos <= 4 ? 'open' : 'fr ' + x.pos })])));
      box.append(
        el('div', { class: 'fg-main' }, [box._dia, el('div', { class: 'fg-info' }, [el('div', { class: 'sh-label', text: 'Guitar' }), box._tab, box._pos, el('div', { class: 'fg-nav' }, [box._prev, box._next])])]),
        vs.length > 1 ? el('div', { class: 'fg-sub' }, [el('div', { class: 'sh-label', text: vs.length + ' ways to play it' }), box._strip]) : null,
      );
      const tw = Guitar.tweaks(spec);
      if (tw.length) {
        const sec = el('div', { class: 'fg-sub' }, [el('div', { class: 'sh-label', text: 'Build it from a shape you know' })]);
        tw.forEach(t => {
          const idx = Guitar.indexOfShape(spec, t.target);
          sec.append(el('div', { class: 'fg-tw' }, [
            el('div', { class: 'fg-tw-title', text: 'Start from the ' + t.base.label.replace(/^Open /, 'open ') }),
            el('div', { class: 'fg-tw-row' }, [
              el('div', { class: 'fg-tw-dia', html: Guitar.diagram(t.base.v) }),
              el('span', { class: 'fg-tw-arrow', html: ARROW_R }),
              el('div', { class: 'fg-tw-dia', html: Guitar.diagram(t.target, { hl: t.changed }) }),
              el('ol', { class: 'fg-tw-steps' }, t.steps.map(x => el('li', { text: x }))),
            ]),
            idx >= 0 ? el('button', { class: 'fg-use', text: 'Use this shape', onclick: () => setV(idx) }) : null,
          ]));
        });
        box.append(sec);
      }
    }
    box._dia.innerHTML = Guitar.diagram(v, { fingers: true });
    box._tab.textContent = v ? Guitar.tab(v) : '—';
    box._pos.textContent = !v ? 'No playable shape' : (vs.length > 1 ? 'Shape ' + (i + 1) + ' of ' + vs.length + ' · ' : '') + posText(v);
    box._prev.disabled = box._next.disabled = vs.length < 2;
    box._prev.onclick = () => setV((i - 1 + vs.length) % vs.length);
    box._next.onclick = () => setV((i + 1) % vs.length);
    [...box._strip.children].forEach((b, n) => { b.classList.toggle('on', n === i); b.setAttribute('aria-selected', n === i ? 'true' : 'false'); });
    const on = box._strip.children[i];
    if (on && box._last !== i) { const sr = box._strip; sr.scrollTo({ left: on.offsetLeft - sr.clientWidth / 2 + on.clientWidth / 2, behavior: box._last == null || ui.reduceMotion() ? 'auto' : 'smooth' }); }
    if (box._last != null && box._last !== i && !ui.reduceMotion()) box._dia.animate([{ opacity: 0, transform: 'translateX(8px)' }, { opacity: 1, transform: 'none' }], { duration: 200, easing: ui.EASE });
    box._last = i;
    // heavy distortion tip for full chords
    if (!box._heavy) box._heavy = el('div', { class: 'fg-sub fg-heavy' });
    box.append(box._heavy);
    const ivs = T.Q[spec.q].iv.map(([x]) => T.mod(x));
    const distinct = new Set(ivs).size;
    const hk = spec.root + ':' + spec.q;
    if (box._heavy._k !== hk) {
      box._heavy._k = hk;
      box._heavy.textContent = '';
      const full = spec.q !== '5' && distinct >= 3;
      box._heavy.hidden = !full;
      if (full) {
        const name = T.chordName(spec);
        box._heavy.append(el('div', { class: 'sh-label', text: 'Playing with heavy distortion?' }));
        if (ivs.includes(7)) {
          const pc = { root: spec.root, acc: spec.acc, q: '5', bass: null, bassAcc: spec.acc };
          const pv = Guitar.voicing(pc), pname = T.chordName(pc);
          box._heavy.append(el('div', { class: 'hv-row' }, [
            el('div', { class: 'hv-dia', html: Guitar.diagram(pv) }),
            el('div', { class: 'hv-txt' }, [
              el('p', { text: (distinct >= 4 ? 'Big chords like ' + name + ' turn to mud' : 'Full chords can sound muddy') + ' through a lot of distortion. Rock and metal players usually switch to the power chord: just the root and 5th.' }),
              el('p', { class: 'hv-sub', text: pname + ' fits anywhere ' + name + ' does. It’s neither major nor minor, so the vocals and bass fill that in.' }),
              el('button', { class: 'fg-use', text: 'Swap to ' + pname, onclick: () => setSpec({ q: '5', bass: null, v: 0 }) }),
            ]),
          ]));
        } else {
          box._heavy.append(el('p', { class: 'hv-txt', text: 'The tense notes in ' + name + ' can sound harsh and messy with heavy distortion. Use a cleaner tone, or play only the lowest three strings of the shape.' }));
        }
      }
    }
    if (!box._sw) { box._sw = el('div', { class: 'fg-sub fg-switch' }); box.append(box._sw); }
    else box.append(box._sw);
    box._sw.textContent = '';
    const cur = { ...spec, v: i };
    const pairs = [];
    if (editCtx.prev) pairs.push([editCtx.prev, cur]);
    if (editCtx.next) pairs.push([cur, editCtx.next]);
    if (!pairs.length) { box._sw.hidden = true; return; }
    box._sw.hidden = false;
    box._sw.append(el('div', { class: 'sh-label', text: 'Switching chords' }));
    pairs.forEach(([a, b]) => box._sw.append(el('div', { class: 'sw-pair' }, [
      el('div', { class: 'sw-names' }, [el('b', { text: T.chordName(a) }), el('span', { html: ARROW_R }), el('b', { text: T.chordName(b) })]),
      el('ul', { class: 'sw-tips' }, changeTips(a, b).map(t => el('li', { text: t }))),
    ])));
  }

  /* ── capo sheet ── */
  function openCapo(plan) {
    const S = ui.sheet(root, { label: 'Capo' });
    const body = el('div', { class: 'pk-body' });
    S.sheet.append(el('div', { class: 'pk-head' }, [el('button', { class: 'pk-cancel', text: 'Close', onclick: () => S.close() }), el('div', { class: 'pk-title', text: 'Capo ' + plan.capo }), el('span', { class: 'pk-spacer' })]), body);
    body.append(el('p', { class: 'note', text: 'Clamp a capo across fret ' + plan.capo + '. Then play the shapes below. They sound exactly like your chords, without the hard barre shapes. Fret numbers count up from the capo.' }));
    const grid2 = el('div', { class: 'capo-grid' });
    store.state.chords.forEach((c, i) => {
      const sh = plan.shapes[i];
      const ei = Guitar.easyIndex(sh);
      const v = ei >= 0 ? Guitar.voicings(sh)[ei] : Guitar.voicing(sh);
      grid2.append(el('button', { class: 'capo-card', 'aria-label': 'Sounds like ' + T.chordName(c) + ', play the ' + T.chordName(sh) + ' shape', onclick: () => audio.strum(c) }, [
        el('div', { class: 'capo-shape', text: T.chordName(sh) }),
        el('div', { class: 'capo-dia', html: Guitar.diagram(v) }),
        el('div', { class: 'capo-real', text: 'sounds like ' + T.chordName(c) }),
      ]));
    });
    body.append(grid2);
  }

  /* ── solo guide: which notes to play over the progression ── */
  function openSolo() {
    const an = store.analysis, key = an.key;
    const S = ui.sheet(root, { label: 'Solo notes' });
    const body = el('div', { class: 'pk-body' });
    S.sheet.append(el('div', { class: 'pk-head' }, [el('button', { class: 'pk-cancel', text: 'Close', onclick: () => S.close() }), el('div', { class: 'pk-title', text: 'Solo' }), el('span', { class: 'pk-spacer' })]), body);
    if (!key) { body.append(el('p', { class: 'note', text: 'Add a few chords first, then come back to see which notes to solo with.' })); return; }
    const minor = key.mode === 'minor', t = key.tonic, acc = T.keyAcc(key);
    const bluesy = /Blues/.test(an.flavor || '') || store.state.chords.filter(c => T.Q[c.q].iv.some(([x]) => x === 10) && T.Q[c.q].iv.some(([x]) => x === 4)).length >= 2;
    const tn = T.keyTonicName(key);
    const SC = {
      pent: { label: 'Easy 5-note', iv: minor ? [0, 3, 5, 7, 10] : [0, 2, 4, 7, 9], blue: [] },
      blues: { label: 'Bluesy', iv: [0, 3, 5, 7, 10], blue: [6] },
      full: { label: 'Full scale', iv: minor ? [0, 2, 3, 5, 7, 8, 10] : [0, 2, 4, 5, 7, 9, 11], blue: [] },
    };
    let mode = !minor && bluesy ? 'blues' : 'pent';
    const seg = el('div', { class: 'modes three' });
    const head = el('div', { class: 'solo-head' });
    const wrap = el('div', { class: 'fb-wrap' });
    const tips = el('ul', { class: 'solo-tips' });
    body.append(head, seg, wrap, el('div', { class: 'fb-legend' }, [
      el('span', {}, [el('i', { class: 'lg root' }), 'Root (home)']), el('span', {}, [el('i', { class: 'lg pent' }), 'Scale note']),
      el('span', { class: 'lg-full' }, [el('i', { class: 'lg extra' }), 'Extra scale note']), el('span', { class: 'lg-blue' }, [el('i', { class: 'lg blue' }), 'Blue note']),
    ]), tips);
    const TUN = [64, 59, 55, 50, 45, 40]; // high E on top, like tab
    const SNAMES = ['e', 'B', 'G', 'D', 'A', 'E'];
    const FRETS = 15, FW = 54, X0 = 58, Y0 = 20, SH = 32;
    const fx = f => (f === 0 ? X0 - 19 : X0 + (f - 0.5) * FW);
    function draw() {
      const sc = SC[mode];
      seg.textContent = '';
      ['pent', 'blues', 'full'].forEach(m => seg.append(el('button', { class: m === mode ? 'on' : '', text: SC[m].label, onclick: () => { mode = m; draw(); } })));
      const majPentAsMinor = !minor && mode === 'pent';
      const relMinor = T.mod(t + 9);
      const name = mode === 'blues' ? tn + ' blues scale' : mode === 'full' ? tn + ' ' + key.mode + ' scale' : tn + ' ' + (minor ? 'minor' : 'major') + ' pentatonic';
      head.textContent = '';
      head.append(el('div', { class: 'solo-name', text: name }), el('div', { class: 'solo-sub', text: mode === 'pent' ? 'The easiest scale to solo with. Almost every note sounds good over your chords.' : mode === 'blues' ? 'The 5-note scale plus one gritty “blue” note.' : 'All seven notes of the key, for more melodic lines.' }));
      // box 1: the minor-pentatonic shape rooted on the low E string
      const boxRoot = majPentAsMinor ? relMinor : t;
      let b = T.mod(boxRoot - 4);
      const band = [b, b + 3];
      const pcs = new Map();
      sc.iv.forEach(x => pcs.set(T.mod(t + x), x === 0 ? 'root' : 'pent'));
      sc.blue.forEach(x => pcs.set(T.mod(t + x), 'blue'));
      if (mode === 'full') { const p5 = (minor ? [0, 3, 5, 7, 10] : [0, 2, 4, 7, 9]).map(x => T.mod(t + x)); sc.iv.forEach(x => { const pc = T.mod(t + x); if (!p5.includes(pc)) pcs.set(pc, 'extra'); }); }
      const W = X0 + FRETS * FW + 12, H = Y0 + 5 * SH + 40;
      let g = `<svg class="fb" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img" aria-label="Fretboard showing ${name}">`;
      g += `<rect x="${X0 + (Math.max(band[0], 0.5) - 0.5 - (band[0] === 0 ? 0.3 : 0)) * FW - (band[0] === 0 ? 16 : 0)}" y="${Y0 - 14}" width="${(band[1] - Math.max(band[0], 0.5) + 1) * FW + (band[0] === 0 ? 30 : 0)}" height="${5 * SH + 28}" rx="12" class="fb-band"/>`;
      for (let f = 0; f <= FRETS; f++) g += `<line x1="${X0 + f * FW}" x2="${X0 + f * FW}" y1="${Y0}" y2="${Y0 + 5 * SH}" class="${f === 0 ? 'fb-nut' : 'fb-fret'}"/>`;
      for (let s2 = 0; s2 < 6; s2++) g += `<line x1="${X0}" x2="${X0 + FRETS * FW}" y1="${Y0 + s2 * SH}" y2="${Y0 + s2 * SH}" class="fb-str" stroke-width="${0.8 + s2 * 0.3}"/><text x="6" y="${Y0 + s2 * SH + 4}" class="fb-sn">${SNAMES[s2]}</text>`;
      [3, 5, 7, 9, 12, 15].forEach(f => g += `<text x="${X0 + (f - 0.5) * FW}" y="${Y0 + 5 * SH + 26}" text-anchor="middle" class="fb-fn">${f}</text>`);
      [3, 5, 7, 9, 15].forEach(f => g += `<circle cx="${X0 + (f - 0.5) * FW}" cy="${Y0 + 2.5 * SH}" r="4" class="fb-inlay"/>`);
      g += `<circle cx="${X0 + 11.5 * FW}" cy="${Y0 + 1.5 * SH}" r="4" class="fb-inlay"/><circle cx="${X0 + 11.5 * FW}" cy="${Y0 + 3.5 * SH}" r="4" class="fb-inlay"/>`;
      for (let s2 = 0; s2 < 6; s2++) for (let f = 0; f <= FRETS; f++) {
        const m = TUN[s2] + f, pc = T.mod(m), kind = pcs.get(pc);
        if (!kind) continue;
        const nm = T.noteName(pc, kind === 'blue' ? 'b' : acc);
        g += `<g class="fb-n ${kind}" data-m="${m}"><circle cx="${fx(f)}" cy="${Y0 + s2 * SH}" r="13.5"/><text x="${fx(f)}" y="${Y0 + s2 * SH + 4.5}" text-anchor="middle">${nm}</text></g>`;
      }
      g += '</svg>';
      wrap.innerHTML = g;
      body.querySelector('.lg-full').hidden = mode !== 'full';
      body.querySelector('.lg-blue').hidden = mode !== 'blues';
      requestAnimationFrame(() => { wrap.scrollLeft = Math.max(0, X0 + (Math.max(band[0], 0) - 1) * FW - 10); });
      if (!ui.reduceMotion()) wrap.querySelectorAll('.fb-n').forEach((n, i) => n.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 240, delay: Math.min(i * 4, 300), fill: 'backwards' }));
      tips.textContent = '';
      const tip = x => tips.append(el('li', { text: x }));
      tip('Easiest place to start: the highlighted box at fret' + (b === 0 ? 's 0–3 (open position)' : 's ' + b + '–' + (b + 3)) + '.');
      tip('Blue dots are ' + tn + ', home base. Ending a phrase there sounds resolved.');
      if (majPentAsMinor) tip(tn + ' major pentatonic uses the same notes as ' + T.noteName(relMinor, acc) + ' minor pentatonic. The box starts on ' + T.noteName(relMinor, acc) + ', but think of ' + tn + ' as home.');
      if (mode === 'blues') tip('The orange blue note adds grit. Slide or bend through it rather than resting on it.');
      if (mode === 'full') tip('Outlined notes complete the full scale. Use them as passing notes between the pentatonic ones.');
      if (store.state.chords.some(c => { const a = an.items[c.id]; return a && !a.inKey; })) tip('Over chords outside the key, aim for that chord’s own notes. Tap a chord to see its notes.');
    }
    wrap.addEventListener('click', e => { const n = e.target.closest('.fb-n'); if (!n) return; audio.note(+n.dataset.m); n.animate([{ transform: 'scale(1)' }, { transform: 'scale(1.25)' }, { transform: 'scale(1)' }], { duration: 220, easing: ui.EASE }); });
    draw();
  }

  /* ── roll the dice ── */
  const rollMem = new Map();
  function spinDice() { if (!ui.reduceMotion()) diceIcon.animate([{ transform: 'rotate(0) scale(1)' }, { transform: 'rotate(200deg) scale(1.2)' }, { transform: 'rotate(360deg) scale(1)' }], { duration: 480, easing: ui.EASE }); }
  function roll() {
    const st = store.state, an = store.analysis, sec = st.section;
    const curSig = sigOf(st.chords);
    let m = rollMem.get(sec.id);
    if (!m || !(m.lastSig === curSig || m.recent.includes(curSig) || sigOf(m.seed) === curSig)) { m = { seed: plainList(st.chords), seedKey: an.key, recent: [] }; rollMem.set(sec.id, m); }
    const others = st.sections.filter(x => x.id !== sec.id);
    const songHasOthers = others.some(x => x.chords.length);
    // locked → stay in the key; other sections filled → keep the song together; otherwise a fresh random key
    const key = an.locked ? an.key : (songHasOthers && an.key) ? an.key : randomKey(vibe, an.key, null, easyMode);
    let seed = [];
    if (m.seed.length && m.seedKey) {
      if (m.seedKey.mode === key.mode) seed = m.seed.map(c => transpose(c, key.tonic - m.seedKey.tonic, key));
      else if (chance(0.5)) { const rel = T.relativeKey(m.seedKey); if (rel.mode === key.mode) seed = m.seed.map(c => transpose(c, key.tonic - rel.tonic, key)); }
    }
    const type = typeOf(sec.name);
    const length = seed.length && chance(0.6) ? seed.length : pickLen(type);
    const style = styleOf(m.seed.length ? m.seed : [].concat(...others.map(x => x.chords)));
    const list = generate(type, { key, style, vibe, length, easy: easyMode, strict: !allowBorrow, locked: an.locked, seed, others, exclude: new Set([curSig, ...m.recent]) });
    spinDice();
    if (!list) return;
    m.recent.push(sigOf(list)); if (m.recent.length > 10) m.recent.shift();
    store.load(list);
    m.lastSig = sigOf(store.state.chords);
    undoToast('New ' + (vibe !== 'any' ? VIBES[vibe].name.toLowerCase() + ' ' : '') + sec.name.toLowerCase() + ' idea');
  }
  let playTimers = [];
  function playList(list) {
    playTimers.forEach(clearTimeout); playTimers = [];
    list.slice(0, 8).forEach((c, i) => playTimers.push(setTimeout(() => audio.strum(c, null, { vel: 0.85, ring: 1.2 }), i * 640)));
  }

  /* ── new section sheet ── */
  function openNewSection() {
    const st = store.state;
    const have = new Set(st.sections.map(x => typeOf(x.name)));
    let type = ['Chorus', 'Bridge', 'Pre-chorus', 'Intro', 'Outro', 'Solo', 'Verse'].find(t => !have.has(t)) || 'Chorus';
    const S = ui.sheet(root, { label: 'New section', onClose: () => { playTimers.forEach(clearTimeout); vibeRows.delete(sheetVibes); } });
    const body = el('div', { class: 'pk-body' });
    S.sheet.append(el('div', { class: 'pk-head' }, [el('button', { class: 'pk-cancel', text: 'Cancel', onclick: () => S.close() }), el('div', { class: 'pk-title', text: 'New section' }), el('span', { class: 'pk-spacer' })]), body);
    const typeRow = el('div', { class: 'names' });
    body.append(el('div', { class: 'sh-sec' }, [el('div', { class: 'sh-label', text: 'Section type' }), typeRow]));
    const sheetVibes = vibeRow();
    const origDraw = sheetVibes.draw;
    sheetVibes.draw = () => { origDraw(); };
    sheetVibes.addEventListener('click', e => { if (e.target.closest('.vibe')) { recent = []; gen(true); } });
    body.append(sheetVibes);
    const desc = el('div', { class: 'ns-desc' });
    const chips = el('div', { class: 'ns-chords' });
    const nsNotes = el('div', { style: { display: 'flex', flexDirection: 'column', gap: '4px' } });
    const rollIcon = el('span', { class: 'dice', html: ICON_DICE });
    const rollMini = el('button', { class: 'ns-roll', 'aria-label': 'Roll another idea', onclick: () => gen(true) }, [rollIcon, 'Roll']);
    body.append(el('div', { class: 'sh-sec' }, [
      el('div', { class: 'sh-label', text: 'Suggestion' }),
      el('div', { class: 'ns-card' }, [el('div', { class: 'ns-top' }, [desc, el('div', { class: 'ns-btns' }, [rollMini])]), chips, nsNotes]),
    ]));
    body.append(el('div', { class: 'ns-actions' }, [
      el('button', { class: 'rowbtn', onclick: () => { store.addSection(type, []); S.close(); } }, ['Start empty']),
      el('button', { class: 'rowbtn primary', onclick: () => { const nm = store.nextSectionName(type); store.addSection(type, list); undoToast('Added ' + nm); S.close(); } }, ['Add section']),
    ]));
    let list = [], recent = [];
    function drawTypes() {
      typeRow.textContent = '';
      SEC_TYPES.forEach(t => typeRow.append(el('button', { class: t === type ? 'on' : '', text: t, onclick: () => { type = t; recent = []; drawTypes(); gen(false); } })));
    }
    function gen(spin) {
      const s2 = store.state, an = store.analysis;
      const key = an.key || randomKey(vibe, null, null, easyMode);
      const style = styleOf([].concat(...s2.sections.map(x => x.chords)));
      list = generate(type, { key, style, vibe, length: pickLen(type), easy: easyMode, strict: !allowBorrow, locked: an.locked, others: s2.sections, exclude: new Set(recent) }) || list;
      recent.push(sigOf(list)); if (recent.length > 10) recent.shift();
      desc.textContent = SEC_DESC[type] + (an.key ? ' · ' + T.keyName(an.key) : '');
      chips.textContent = '';
      list.forEach((c, i) => {
        const b = el('button', { class: 'ns-chip' + (key && isColorC(c, key) ? ' bor' : ''), text: T.chordName(c), 'aria-label': 'Hear ' + T.chordName(c), onclick: () => audio.chord(c) });
        chips.append(b);
        if (!ui.reduceMotion()) b.animate([{ opacity: 0, transform: 'translateY(6px) scale(.9)' }, { opacity: 1, transform: 'none' }], { duration: 260, delay: i * 45, easing: ui.EASE, fill: 'backwards' });
      });
      nsNotes.textContent = '';
      listNotes(list, key).forEach(t => nsNotes.append(el('div', { class: 'ns-note' }, [el('span', { class: 'info-dot', 'aria-hidden': 'true', text: '\u266d' }), t])));
      if (spin && !ui.reduceMotion()) rollIcon.animate([{ transform: 'rotate(0)' }, { transform: 'rotate(360deg)' }], { duration: 460, easing: ui.EASE });
    }
    drawTypes(); gen(false);
  }

  /* ── section menu ── */
  function openSectionMenu(sec) {
    const S = ui.sheet(root, { label: 'Section options' });
    const body = el('div', { class: 'pk-body' });
    S.sheet.append(el('div', { class: 'pk-head' }, [el('button', { class: 'pk-cancel', text: 'Close', onclick: () => S.close() }), el('div', { class: 'pk-title', text: sec.name }), el('span', { class: 'pk-spacer' })]), body);
    const names = ['Intro', 'Verse', 'Pre-chorus', 'Chorus', 'Bridge', 'Solo', 'Outro'];
    body.append(el('div', { class: 'sh-sec' }, [el('div', { class: 'sh-label', text: 'Section type' }), el('div', { class: 'names' }, names.map(n => el('button', {
      class: sec.name.replace(/ \d+$/, '') === n ? 'on' : '', text: n,
      onclick: () => { const nm = n === sec.name.replace(/ \d+$/, '') ? sec.name : store.nextSectionName(n); store.renameSection(sec.id, nm); S.close(); },
    })))]));
    body.append(el('div', { class: 'sh-sec' }, [
      el('button', { class: 'rowbtn', onclick: () => { store.duplicateSection(sec.id); undoToast('Duplicated ' + sec.name); S.close(); } }, ['Duplicate section']),
      el('button', { class: 'rowbtn danger', disabled: store.state.sections.length < 2, onclick: () => { store.removeSection(sec.id); undoToast('Deleted ' + sec.name); S.close(); } }, ['Delete section']),
    ]));
  }

  /* ── key sheet ── */
  function openKeySheet() {
    const an = store.analysis;
    const S = ui.sheet(root, { label: 'Set the key' });
    const body = el('div', { class: 'pk-body' });
    S.sheet.append(el('div', { class: 'pk-head' }, [el('button', { class: 'pk-cancel', text: 'Close', onclick: () => S.close() }), el('div', { class: 'pk-title', text: 'Key' }), el('span', { class: 'pk-spacer' })]), body);
    let mode = an.key ? an.key.mode : 'major';
    const modeBtns = ['major', 'minor'].map(m => el('button', { text: m === 'major' ? 'Major' : 'Minor', onclick: () => { mode = m; draw(); } }));
    const tonics = el('div', { class: 'tonics' });
    body.append(el('div', { class: 'sh-sec' }, [el('div', { class: 'modes' }, modeBtns), tonics, el('p', { class: 'note', text: 'Choosing a key locks it. Tap the lock on the main screen to let it follow your chords again.' })]));
    function draw() {
      modeBtns.forEach((b, i) => b.classList.toggle('on', (i === 0) === (mode === 'major')));
      tonics.textContent = '';
      for (let t = 0; t < 12; t++) {
        const k = { tonic: t, mode };
        const on = an.key && an.key.tonic === t && an.key.mode === mode;
        tonics.append(el('button', { class: on ? 'on' : '', text: T.keyTonicName(k) + (mode === 'minor' ? 'm' : ''), 'aria-label': T.keyName(k), onclick: () => { store.setLock(k); S.close(); } }));
      }
    }
    draw();
  }

  /* ── ideas sheet ── */
  function openIdeas() {
    if (!store.state.chords.length) return;
    let unsubIdeas = () => {};
    const S = ui.sheet(root, { label: 'Ideas', onClose: () => unsubIdeas() });
    const body = el('div', { class: 'pk-body' });
    S.sheet.append(el('div', { class: 'pk-head' }, [el('button', { class: 'pk-cancel', text: 'Close', onclick: () => S.close() }), el('div', { class: 'pk-title', text: 'Ideas' }), el('span', { class: 'pk-spacer' })]), body);
    const chordsRow = (list, base) => {
      const key = store.analysis.key;
      return el('div', { class: 'idea-chords' }, list.map((c, i) => el('span', { class: 'idea-chord' + (base && !same(c, base[i]) ? ' chg' : '') + (key && isColorC(c, key) ? ' bor' : ''), text: T.chordName(c) })));
    };
    const notesFor = list => listNotes(list, store.analysis.key).map(t => el('span', { class: 'idea-note' }, [el('span', { class: 'info-dot', 'aria-hidden': 'true', text: '\u266d' }), t]));
    function draw() {
      body.textContent = '';
      const st = store.state, an = store.analysis, key = an.key;
      if (!key) { body.append(el('p', { class: 'note', text: 'Add a few chords first.' })); return; }
      if (!st.chords.length) body.append(el('p', { class: 'note', text: 'This section is empty. Start it from an idea below, or add chords yourself.' }));
      const offs = st.chords.filter(c => isOffC(c, key, an.items[c.id]));
      if (offs.length) {
        const sec = el('div', { class: 'sh-sec' }, [el('div', { class: 'sh-label', text: 'Fix' })]);
        offs.forEach(c => {
          const reps = replacementsFor(c, key);
          sec.append(el('div', { class: 'fix' }, [
            el('div', { class: 'fix-top' }, [el('b', { text: T.chordName(c) }), ' doesn’t fit ' + T.keyName(key) + '. Try:']),
            el('div', { class: 'fix-chips' }, reps.map(r => el('button', { class: 'fix-chip', onclick: () => { audio.chord(r.chord); store.update(c.id, r.chord); undoToast('Changed ' + T.chordName(c) + ' to ' + T.chordName(r.chord)); } }, [el('b', { text: T.chordName(r.chord) }), el('span', { text: r.tag })]))),
          ]));
        });
        body.append(sec);
      }
      const moods = st.chords.length ? makeovers(st.chords, key) : [];
      if (moods.length) {
        const sec = el('div', { class: 'sh-sec' }, [el('div', { class: 'sh-label', text: 'Change the mood' })]);
        moods.forEach(m => sec.append(el('button', { class: 'idea', onclick: () => { store.replaceAll(m.list); undoToast(m.name + ' applied'); S.close(); } }, [
          el('span', { class: 'idea-top' }, [el('span', { class: 'idea-name', text: m.name }), el('span', { class: 'idea-desc', text: m.desc })]),
          chordsRow(m.list, st.chords), ...notesFor(m.list.filter(c => !st.chords.some(o => same(o, c)))),
        ])));
        body.append(sec);
      }
      const ords = orderings(st.chords, an);
      const osec = el('div', { class: 'sh-sec' }, [el('div', { class: 'sh-label', text: 'Try a new order' })]);
      if (ords.length) {
        ords.forEach(o => osec.append(el('button', { class: 'idea', onclick: () => { store.setOrder(o.list.map(c => c.id)); undoToast(o.name + ' order'); S.close(); } }, [
          el('span', { class: 'idea-top' }, [el('span', { class: 'idea-name', text: o.name }), el('span', { class: 'idea-desc', text: o.desc })]),
          chordsRow(o.list),
        ])));
        body.append(osec);
      } else if (st.chords.length) { osec.append(el('p', { class: 'note', text: 'Add at least 3 chords to get order ideas.' })); body.append(osec); }
    }
    unsubIdeas = store.subscribe(draw);
    draw();
  }

  const drag = ui.reorder(grid, {
    item: '.pad[data-id]', longPress: 280, axis: 'grid', scroller: main,
    onCommit: (from, to) => store.move(from, to),
  });

  const unsub = store.subscribe(render);
  const unsubSave = store.subscribe(() => autosave());
  drawSongBtn();
  render(store.state, store.analysis, { type: 'load' });
  applyFrets(false);

  return { unmount() { unsub(); unsubSave(); drag.destroy(); clearInterval(scrambleTimer); root.remove(); } };
}

mount(document.getElementById('app'));
})();
