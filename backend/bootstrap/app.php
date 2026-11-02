<?php

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Auth\AuthenticationException;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;
use Symfony\Component\HttpKernel\Exception\MethodNotAllowedHttpException;


return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        $middleware->alias([
            'role' => \App\Http\Middleware\RoleMiddleware::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions): void {

        /*
        |--------------------------------------------------------------------------
        | Validation Errors - 422
        |--------------------------------------------------------------------------
        */

        $exceptions->render(function (
            ValidationException $e,
            Request $request
        ) {
            if (!$request->is('api/*')) {
                return null;
            }

            return response()->json([
                'success' => false,
                'message' => 'The given data was invalid.',
                'errors' => $e->errors(),
            ], 422);
        });

        /*
        |--------------------------------------------------------------------------
        | Authentication Errors - 401
        |--------------------------------------------------------------------------
        */

        $exceptions->render(function (
            AuthenticationException $e,
            Request $request
        ) {
            if (!$request->is('api/*')) {
                return null;
            }

            return response()->json([
                'success' => false,
                'message' => 'Unauthenticated. Please log in.',
            ], 401);
        });

        /*
        |--------------------------------------------------------------------------
        | Authorization Errors - 403
        |--------------------------------------------------------------------------
        */

        $exceptions->render(function (
            AuthorizationException $e,
            Request $request
        ) {
            if (!$request->is('api/*')) {
                return null;
            }

            return response()->json([
                'success' => false,
                'message' => 'You are not authorized to perform this action.',
            ], 403);
        });

        /*
        |--------------------------------------------------------------------------
        | Resource Not Found - 404
        |--------------------------------------------------------------------------
        */

        $exceptions->render(function (
            ModelNotFoundException|NotFoundHttpException $e,
            Request $request
        ) {
            if (!$request->is('api/*')) {
                return null;
            }

            return response()->json([
                'success' => false,
                'message' => 'The requested resource was not found.',
            ], 404);
        });

        /*
        |--------------------------------------------------------------------------
        | Method Not Allowed - 405
        |--------------------------------------------------------------------------
        */

        $exceptions->render(function (
            MethodNotAllowedHttpException $e,
            Request $request
        ) {
            if (!$request->is('api/*')) {
                return null;
            }

            return response()->json([
                'success' => false,
                'message' => 'The requested HTTP method is not allowed for this endpoint.',
            ], 405);
        });

        /*
        |--------------------------------------------------------------------------
        | Internal Server Errors - 500
        |--------------------------------------------------------------------------
        */

        $exceptions->render(function (
            Throwable $e,
            Request $request
        ) {
            if (!$request->is('api/*') && !$request->expectsJson()) {
                return null;
            }

            report($e);

            return response()->json([
                'success' => false,
                'message' => 'An unexpected server error occurred. Please try again later.',
            ], 500);
        });

    })->create();