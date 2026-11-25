<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function __construct()
    {
        $this->connection = config('session-replay.storage.connection');
    }

    public function up(): void
    {
        $schema = Schema::connection($this->connection);
        $schema->create('replay_capture_settings', function (Blueprint $table) {
            $table->unsignedTinyInteger('id')->primary();
            $table->boolean('anonymous');
        });
        $schema->create('replay_erased_ids', function (Blueprint $table) {
            $table->char('digest', 64)->primary();
        });
    }

    public function down(): void
    {
        $schema = Schema::connection($this->connection);
        $schema->dropIfExists('replay_erased_ids');
        $schema->dropIfExists('replay_capture_settings');
    }
};
