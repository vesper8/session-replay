<form id="erase-replays" method="post" action="{{ route('session-replay.destroy') }}">
    @csrf
    @method('DELETE')
    @isset($recording)<input type="hidden" name="ids[]" value="{{ $recording->id }}">@endisset
    <button type="button" id="erase-trigger" @disabled(!isset($recording))>{{ isset($recording) ? __('session-replay::viewer.erase.one') : __('session-replay::viewer.erase.selected') }}</button>
    <dialog id="erase-dialog" aria-labelledby="erase-heading">
        <h2 id="erase-heading">{{ __('session-replay::viewer.erase.heading') }}</h2>
        <p>{{ __('session-replay::viewer.erase.warning') }} (<output id="erase-count"></output>)</p>
        <button type="button" id="erase-cancel" autofocus>{{ __('session-replay::viewer.erase.cancel') }}</button>
        <button type="submit">{{ __('session-replay::viewer.erase.confirm') }}</button>
    </dialog>
</form>
<script>
    (() => {
        const form = document.getElementById('erase-replays');
        const trigger = document.getElementById('erase-trigger');
        const dialog = document.getElementById('erase-dialog');
        const boxes = () => [...form.elements].filter(el => el.type === 'checkbox' && el.name === 'ids[]');
        const selected = () => new FormData(form).getAll('ids[]').length;
        const update = () => {
            const count = selected();
            trigger.disabled = count === 0;
            const all = document.getElementById('select-all-replays');
            if (all) {
                all.checked = count > 0 && count === boxes().length;
                all.indeterminate = count > 0 && !all.checked;
            }
        };
        document.addEventListener('change', event => {
            if (event.target.id === 'select-all-replays') boxes().forEach(el => el.checked = event.target.checked);
            if (event.target.form === form || event.target.id === 'select-all-replays') update();
        });
        trigger.onclick = () => {
            document.getElementById('erase-count').textContent = selected();
            dialog.showModal();
        };
        document.getElementById('erase-cancel').onclick = () => dialog.close();
        form.onsubmit = event => { if (!dialog.open || !selected()) event.preventDefault(); };
    })();
</script>
