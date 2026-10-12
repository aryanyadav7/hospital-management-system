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
        Schema::create('patients', function (Blueprint $table) {
            $table->id();

            // Unique patient identification number
            $table->string('patient_id')->nullable()->unique();

            // Personal information
            $table->string('name');
            $table->string('email')->nullable();
            $table->string('phone', 20);
            $table->date('date_of_birth')->nullable();
            $table->string('gender');
            $table->string('blood_group', 5)->nullable();

            // Address and emergency contact
            $table->text('address')->nullable();
            $table->string('emergency_contact_name')->nullable();
            $table->string('emergency_contact_phone', 20)->nullable();

            // Patient status
            $table->boolean('status')->default(true);

            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('patients');
    }
};
