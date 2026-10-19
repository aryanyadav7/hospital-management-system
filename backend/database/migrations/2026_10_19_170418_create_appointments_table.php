<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('appointments', function (Blueprint $table) {
            $table->id();

            // Generated automatically after the record is created
            $table->string('appointment_number')->nullable()->unique();

            // Relationships
            $table->foreignId('patient_id')
                ->constrained()
                ->restrictOnDelete();

            $table->foreignId('doctor_id')
                ->constrained()
                ->restrictOnDelete();

            $table->foreignId('department_id')
                ->constrained()
                ->restrictOnDelete();

            // Appointment schedule
            $table->date('appointment_date');
            $table->time('appointment_time');

            // Additional information
            $table->text('reason')->nullable();
            $table->text('notes')->nullable();

            // Appointment lifecycle
            $table->string('status', 20)->default('scheduled');

            $table->timestamps();

            // Useful for finding appointments by date and doctor
            $table->index(['doctor_id', 'appointment_date']);
            $table->index(['department_id', 'appointment_date']);
            $table->index(['status', 'appointment_date']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('appointments');
    }
};
