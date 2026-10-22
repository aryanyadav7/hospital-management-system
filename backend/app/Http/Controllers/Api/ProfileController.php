<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;

class ProfileController extends Controller
{
    /**
     * Get the authenticated user's profile.
     */
    
    public function show(Request $request)
    {
        $user = $request->user();

        return response()->json([
            'success' => true,
            'data' => [
                'user' => [
                    ...$user->toArray(),
                    'profile_photo_url' => $user->profile_photo_path
                        ? asset('storage/' . $user->profile_photo_path)
                        : null,
                ],
            ],
        ]);
    }


    /**
     * Update the authenticated user's profile.
     */
    public function update(Request $request)
    {
        $user = $request->user();

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => [
                'required',
                'email',
                'max:255',
                Rule::unique('users', 'email')->ignore($user->id),
            ],
        ]);

        $user->update($validated);

        return response()->json([
            'success' => true,
            'message' => 'Profile updated successfully.',
            'data' => [
                'user' => $user->fresh(),
            ],
        ]);
    }

    
    public function updatePassword(Request $request)
    {
        $validated = $request->validate([
            'current_password' => ['required', 'string'],
            'password' => [
                'required',
                'string',
                'min:8',
                'confirmed',
                'different:current_password',
            ],
        ]);

        $user = $request->user();

        if (! Hash::check($validated['current_password'], $user->password)) {
            return response()->json([
                'success' => false,
                'message' => 'The current password is incorrect.',
                'errors' => [
                    'current_password' => [
                        'The current password is incorrect.',
                    ],
                ],
            ], 422);
        }

        $user->password = $validated['password'];
        $user->save();

        return response()->json([
            'success' => true,
            'message' => 'Password changed successfully.',
        ]);
    }


    
    /**
     * Upload or replace the authenticated user's profile photo.
     */
    public function uploadPhoto(Request $request)
    {
        $validated = $request->validate([
            'photo' => [
                'required',
                'image',
                'mimes:jpg,jpeg,png,webp',
                'max:2048',
            ],
        ]);

        $user = $request->user();

        // Store the new photo first, so the existing one is preserved
        // if the upload fails.
        $path = $validated['photo']->store('profile-photos', 'public');

        if (! $path) {
            return response()->json([
                'success' => false,
                'message' => 'Unable to store the profile photo.',
            ], 500);
        }

        $oldPath = $user->profile_photo_path;

        $user->profile_photo_path = $path;
        $user->save();

        // Delete the previous photo only after saving the new path.
        if ($oldPath && str_starts_with($oldPath, 'profile-photos/')) {
            Storage::disk('public')->delete($oldPath);
        }

        return response()->json([
            'success' => true,
            'message' => 'Profile photo uploaded successfully.',
            'data' => [
                'profile_photo_path' => $path,
                'profile_photo_url' => asset('storage/' . $path),
                'profile_photo_url' => Storage::url($path),
            ],
        ]);
    }

    /**
     * Remove the authenticated user's profile photo.
     */
    public function removePhoto(Request $request)
    {
        $user = $request->user();
        $path = $user->profile_photo_path;

        $user->profile_photo_path = null;
        $user->save();

        if ($path && str_starts_with($path, 'profile-photos/')) {
            Storage::disk('public')->delete($path);
        }

        return response()->json([
            'success' => true,
            'message' => 'Profile photo removed successfully.',
        ]);
    }


}
