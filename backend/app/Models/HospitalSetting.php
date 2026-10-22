<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class HospitalSetting extends Model
{
    protected $fillable = [
        'hospital_name',
        'email',
        'phone',
        'address',
        'logo_path',
    ];
}
