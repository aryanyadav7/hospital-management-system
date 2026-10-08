<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use App\Models\Department;

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

    public function department(): BelongsTo
    {
        return $this->belongsTo(Department::class);
    }
}