<style{!! ($nonce = \Illuminate\Support\Facades\Vite::cspNonce()) ? ' nonce="'.e($nonce).'"' : '' !!}>
    .sr-viewer {
        a { color: var(--accent); text-decoration: none; } a:hover { text-decoration: underline; }
        header.top { display: flex; align-items: baseline; justify-content: space-between; gap: 1rem; margin-bottom: 1.25rem; }
        header.top h1 { font-size: 1.25rem; margin: 0; }
        .muted { color: var(--muted); }
        .card { background: var(--card); border: 1px solid var(--border); border-radius: .5rem; }
        .filters { display: flex; flex-wrap: wrap; gap: .5rem; align-items: end; padding: .75rem; margin-bottom: 1rem; }
        .filters label { display: grid; gap: .2rem; font-size: .75rem; color: var(--muted); }
        .filters input[type=text], .filters input[type=date] { font: inherit; padding: .35rem .5rem; border: 1px solid var(--border); border-radius: .375rem; background: transparent; color: inherit; }
        .filters .check { display: flex; align-items: center; gap: .35rem; font-size: .8125rem; color: var(--text); padding-bottom: .4rem; }
        :where(.filters, #erase-replays, .assist-bar, td.actions) button, .button { font: inherit; padding: .4rem .8rem; border-radius: .375rem; border: 1px solid var(--border); background: var(--card); color: inherit; cursor: pointer; }
        button.primary { background: var(--accent); border-color: var(--accent); color: #fff; }
        table { width: 100%; border-collapse: collapse; }
        th, td { text-align: left; padding: .6rem .75rem; border-bottom: 1px solid var(--border); white-space: nowrap; }
        th { font-size: .75rem; font-weight: 600; color: var(--muted); text-transform: uppercase; letter-spacing: .03em; }
        tr:last-child td { border-bottom: 0; }
        td.url { max-width: 22rem; overflow: hidden; text-overflow: ellipsis; }
        .table-scroll { overflow-x: auto; }
        .badge { display: inline-block; padding: .05rem .45rem; border-radius: 999px; font-size: .75rem; border: 1px solid var(--border); }
        .badge.danger { color: var(--danger); border-color: currentColor; } .badge.warn { color: var(--warn); border-color: currentColor; } .badge.ok { color: var(--ok); border-color: currentColor; }
        .empty { padding: 3rem 1rem; text-align: center; color: var(--muted); }
        nav.pages { display: flex; justify-content: space-between; gap: 1rem; margin-top: 1rem; }
        dl.facts { display: grid; grid-template-columns: repeat(auto-fit, minmax(11rem, 1fr)); gap: .75rem 1.5rem; padding: 1rem; margin: 0 0 1rem; }
        td.message { white-space: pre-wrap; min-width: 14rem; max-width: 28rem; }
        td.actions { display: flex; gap: .4rem; }
        .flash { padding: .6rem .8rem; margin: 0 0 1rem; } .flash--error { color: var(--danger); }
        dl.facts dt { font-size: .75rem; color: var(--muted); } dl.facts dd { margin: 0; overflow: hidden; text-overflow: ellipsis; }
        nav.tabs { display: flex; gap: .25rem; margin: 0 0 .75rem; border-bottom: 1px solid var(--border); }
        nav.tabs a { padding: .4rem .8rem; color: var(--muted); border-bottom: 2px solid transparent; margin-bottom: -1px; }
        nav.tabs a[aria-current=page] { color: var(--text); border-color: var(--accent); font-weight: 600; }
        nav.tabs a:hover { text-decoration: none; color: var(--text); }
        td.actions { align-items: center; } td.actions form, .assist-bar form { margin: 0; }
        a.button.primary { background: var(--accent); border-color: var(--accent); color: #fff; } a.button:hover { text-decoration: none; }
        .assist-bar { display: flex; gap: .5rem; align-items: center; margin: 0 0 1rem; }
        :focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; }
    }
</style>
