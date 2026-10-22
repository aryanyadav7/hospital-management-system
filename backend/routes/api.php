<?php

use App\Http\Controllers\Api\Auth\AuthController;
use App\Http\Controllers\Api\DashboardController;
use App\Http\Controllers\Api\DepartmentController;
use App\Http\Controllers\Api\DoctorController;
use App\Http\Controllers\Api\PatientController;
use App\Http\Controllers\Api\AppointmentController;
use App\Http\Controllers\Api\ProfileController;
use App\Http\Controllers\Api\HospitalSettingController;
use App\Http\Controllers\Api\TestController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

Route::prefix('v1')->group(function () {

    /*
    |--------------------------------------------------------------------------
    | Test Routes
    |--------------------------------------------------------------------------
    */

    Route::get('/test', [TestController::class, 'test']);

    /*
    |--------------------------------------------------------------------------
    | Admin Routes
    |--------------------------------------------------------------------------
    */

    Route::middleware(['auth:sanctum', 'role:admin'])->group(function () {

        Route::prefix('departments')->group(function () {
            Route::get('/', [DepartmentController::class, 'index']);
            Route::post('/', [DepartmentController::class, 'store']);
            Route::get('/{department}', [DepartmentController::class, 'show']);
            Route::put('/{department}', [DepartmentController::class, 'update']);
            Route::delete('/{department}', [DepartmentController::class, 'destroy']);
        });

        Route::prefix('doctors')->group(function () {
            Route::get('/', [DoctorController::class, 'index']);
            Route::post('/', [DoctorController::class, 'store']);
            Route::get('/{doctor}', [DoctorController::class, 'show']);
            Route::put('/{doctor}', [DoctorController::class, 'update']);
            Route::delete('/{doctor}', [DoctorController::class, 'destroy']);
        });

        Route::prefix('patients')->group(function () {
            Route::get('/', [PatientController::class, 'index']);
            Route::post('/', [PatientController::class, 'store']);
            Route::get('/{patient}', [PatientController::class, 'show']);
            Route::put('/{patient}', [PatientController::class, 'update']);
            Route::delete('/{patient}', [PatientController::class, 'destroy']);
        });

        
        Route::prefix('appointments')->group(function () {
            // Keep this route before /{appointment}.
            Route::get('/today', [AppointmentController::class, 'today']);

            Route::get('/', [AppointmentController::class, 'index']);
            Route::post('/', [AppointmentController::class, 'store']);
            Route::get('/{appointment}', [AppointmentController::class, 'show']);
            Route::put('/{appointment}', [AppointmentController::class, 'update']);
            Route::delete('/{appointment}', [AppointmentController::class, 'destroy']);
        });

        Route::prefix('hospital-settings')->group(function () {
            Route::put('/', [HospitalSettingController::class, 'update']);
            Route::post('/logo', [HospitalSettingController::class, 'uploadLogo']);
            Route::delete('/logo', [HospitalSettingController::class, 'removeLogo']);
        });


    });

    /*
    |--------------------------------------------------------------------------
    | Profile Routes
    |--------------------------------------------------------------------------
    */

    Route::middleware('auth:sanctum')->prefix('profile')->group(function () {
        Route::get('/', [ProfileController::class, 'show']);
        Route::put('/', [ProfileController::class, 'update']);
        Route::put('/password', [ProfileController::class, 'updatePassword']);
        Route::post('/photo', [ProfileController::class, 'uploadPhoto']);
        Route::delete('/photo', [ProfileController::class, 'removePhoto']);
    });

    /*
    |--------------------------------------------------------------------------
    | Dashboard Routes
    |--------------------------------------------------------------------------
    */

    Route::middleware('auth:sanctum')->get(
        '/dashboard',
        [DashboardController::class, 'index']
    );

    Route::middleware('auth:sanctum')->get(
        '/hospital-settings',
        [HospitalSettingController::class, 'show']
    );

    /*
    |--------------------------------------------------------------------------
    | Authentication Routes
    |--------------------------------------------------------------------------
    */

    Route::prefix('auth')->group(function () {

        Route::post('/register', [AuthController::class, 'register']);
        Route::post('/login', [AuthController::class, 'login']);

        Route::middleware('auth:sanctum')->get('/me', function (Request $request) {
            return response()->json([
                'success' => true,
                'data' => [
                    'user' => $request->user(),
                ],
            ]);
        });

        Route::middleware('auth:sanctum')->post('/logout', function (Request $request) {
            $request->user()->currentAccessToken()->delete();

            return response()->json([
                'success' => true,
                'message' => 'Logout successful',
            ]);
        });

    });

});