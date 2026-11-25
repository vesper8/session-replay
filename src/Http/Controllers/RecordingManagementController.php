<?php

namespace Packstub\SessionReplay\Http\Controllers;

use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Packstub\SessionReplay\Facades\SessionReplay;
use Packstub\SessionReplay\Models\ReplaySession;
use Packstub\SessionReplay\Support\RecordingManagement;
use Packstub\SessionReplay\Support\ReplayStorage;

final class RecordingManagementController
{
    public function privacy(Request $request): RedirectResponse
    {
        abort_unless(RecordingManagement::allowed(), 403);
        $input = $request->validate(['anonymous' => ['required', 'boolean']]);
        RecordingManagement::database()->table('replay_capture_settings')->upsert(
            [['id' => 1, 'anonymous' => (bool) $input['anonymous']]], ['id'], ['anonymous']
        );
        return redirect()->route('session-replay.index');
    }

    public function destroy(Request $request, RecordingManagement $management, ReplayStorage $storage): RedirectResponse
    {
        abort_unless(RecordingManagement::allowed(), 403);
        $ids = $request->validate(['ids' => 'required|array|min:1|max:100', 'ids.*' => 'required|uuid|distinct'])['ids'];
        $sessions = SessionReplay::visibleTo(ReplaySession::query())->whereKey($ids)->get();
        abort_unless($sessions->count() === count($ids) && $sessions->every(fn ($session) => SessionReplay::check($session)), 403);
        $erased = 0;
        foreach ($sessions as $session) {
            try {
                $management->erase($session, $storage);
                $erased++;
            } catch (\RuntimeException $e) {
                report($e);
                return redirect()->route('session-replay.index')
                    ->with('replays-erased', $erased)->with('erase-incomplete', true);
            }
        }

        return redirect()->route('session-replay.index')->with('replays-erased', count($ids));
    }
}
