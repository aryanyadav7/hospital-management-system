<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Doctor extends Model
{
    protected $fillable = [
        'department_id',
        'name',
        'email',
        'phone',
        'specialization',
        'experience',
        'qualification',
        'gender',
        'date_of_birth',
        'address',
        'status',
    ];

    protected $casts = [
        'date_of_birth' => 'date',
        'status' => 'boolean',
    ];

    // A doctor belongs to one department.
    public function department(): BelongsTo
    {
        return $this->belongsTo(Department::class);
    }

    // A doctor can have many appointments.
    public function appointments(): HasMany
    {
        return $this->hasMany(Appointment::class);
    }
}
