<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\HospitalSetting;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class HospitalSettingController extends Controller
{
    /**
     * Get hospital settings.
     */
    public function show()
    {
        $settings = HospitalSetting::firstOrCreate(
            ['id' => 1],
            ['hospital_name' => 'My Hospital']
        );

        return response()->json([
            'success' => true,
            'data' => ['settings' => $settings],
        ]);
    }

    /**
     * Update hospital details.
     */
    public function update(Request $request)
    {
        $validated = $request->validate([
            'hospital_name' => ['required', 'string', 'max:255'],
            'email' => ['nullable', 'email', 'max:255'],
            'phone' => ['nullable', 'string', 'max:30'],
            'address' => ['nullable', 'string', 'max:2000'],
        ]);

        $settings = HospitalSetting::firstOrCreate(
            ['id' => 1],
            ['hospital_name' => 'My Hospital']
        );

        $settings->update($validated);

        return response()->json([
            'success' => true,
            'message' => 'Hospital settings updated successfully.',
            'data' => ['settings' => $settings->fresh()],
        ]);
    }

    /**
     * Upload or replace the hospital logo.
     */
    public function uploadLogo(Request $request)
    {
        $validated = $request->validate([
            'logo' => [
                'required',
                'image',
                'mimes:jpg,jpeg,png,webp',
                'max:2048',
            ],
        ]);

        $settings = HospitalSetting::firstOrCreate(
            ['id' => 1],
            ['hospital_name' => 'My Hospital']
        );

        $path = $validated['logo']->store('hospital-logos', 'public');

        if (! $path) {
            return response()->json([
                'success' => false,
                'message' => 'Unable to store the hospital logo.',
            ], 500);
        }

        $oldPath = $settings->logo_path;

        $settings->logo_path = $path;
        $settings->save();

        if ($oldPath && str_starts_with($oldPath, 'hospital-logos/')) {
            Storage::disk('public')->delete($oldPath);
        }

        return response()->json([
            'success' => true,
            'message' => 'Hospital logo uploaded successfully.',
            'data' => [
                'logo_path' => $path,
                'logo_url' => Storage::url($path),
            ],
        ]);
    }

    /**
     * Remove the hospital logo.
     */
    public function removeLogo()
    {
        $settings = HospitalSetting::firstOrCreate(
            ['id' => 1],
            ['hospital_name' => 'My Hospital']
        );

        $oldPath = $settings->logo_path;

        $settings->logo_path = null;
        $settings->save();

        if ($oldPath && str_starts_with($oldPath, 'hospital-logos/')) {
            Storage::disk('public')->delete($oldPath);
        }

        return response()->json([
            'success' => true,
            'message' => 'Hospital logo removed successfully.',
        ]);
    }
}
