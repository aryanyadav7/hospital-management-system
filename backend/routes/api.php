<?php

use App\Http\Controllers\Api\Auth\AuthController;
use App\Http\Controllers\Api\DepartmentController;
use App\Http\Controllers\Api\DashboardController;
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

    Route::middleware(['auth:sanctum', 'role:admin'])->group(function () {
        Route::get('/departments', [DepartmentController::class, 'index']);
        Route::post('/departments', [DepartmentController::class, 'store']);
        Route::get('/departments/{department}', [DepartmentController::class, 'show']);
        Route::put('/departments/{department}', [DepartmentController::class, 'update']);
        Route::delete('/departments/{department}', [DepartmentController::class, 'destroy']);
    });

    Route::middleware('auth:sanctum')->get('/dashboard',[DashboardController::class, 'index']);

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