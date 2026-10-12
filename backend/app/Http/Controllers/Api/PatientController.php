<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Patient;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class PatientController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = Patient::query();

        if ($request->filled('search')) {
            $search = $request->input('search');

            $query->where(function ($q) use ($search) {
                $q->where('patient_id', 'like', "%{$search}%")
                    ->orWhere('name', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%")
                    ->orWhere('phone', 'like', "%{$search}%");
            });
        }

        if ($request->filled('gender')) {
            $query->where('gender', $request->input('gender'));
        }

        if ($request->filled('blood_group')) {
            $query->where('blood_group', $request->input('blood_group'));
        }

        if ($request->filled('status')) {
            $query->where('status', $request->input('status'));
        }

        $patients = $query->latest()->paginate(5);

        return response()->json([
            'success' => true,
            'data' => $patients,
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['nullable', 'email', 'max:255', 'unique:patients,email'],
            'phone' => ['required', 'string', 'max:20'],
            'date_of_birth' => ['nullable', 'date', 'before:today'],
            'gender' => ['required', 'in:male,female,other'],
            'blood_group' => [
                'nullable',
                'in:A+,A-,B+,B-,AB+,AB-,O+,O-',
            ],
            'address' => ['nullable', 'string'],
            'emergency_contact_name' => ['nullable', 'string', 'max:255'],
            'emergency_contact_phone' => ['nullable', 'string', 'max:20'],
            'status' => ['sometimes', 'boolean'],
        ]);

        // Never accept a patient ID supplied by the client.
        unset($validated['patient_id']);

        $patient = Patient::create([
            ...$validated,
            'patient_id' => null,
            'status' => $validated['status'] ?? true,
        ]);

        // Generate a readable, unique ID from the database primary key.
        $patient->patient_id = 'PAT-' . str_pad(
            (string) $patient->id,
            6,
            '0',
            STR_PAD_LEFT
        );

        $patient->save();

        return response()->json([
            'success' => true,
            'message' => 'Patient registered successfully',
            'data' => $patient,
        ], 201);
    }

    public function show(Patient $patient): JsonResponse
    {
        return response()->json([
            'success' => true,
            'data' => $patient,
        ]);
    }

    public function update(Request $request, Patient $patient): JsonResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => [
                'nullable',
                'email',
                'max:255',
                Rule::unique('patients', 'email')->ignore($patient->id),
            ],
            'phone' => ['required', 'string', 'max:20'],
            'date_of_birth' => ['nullable', 'date', 'before:today'],
            'gender' => ['required', 'in:male,female,other'],
            'blood_group' => [
                'nullable',
                'in:A+,A-,B+,B-,AB+,AB-,O+,O-',
            ],
            'address' => ['nullable', 'string'],
            'emergency_contact_name' => ['nullable', 'string', 'max:255'],
            'emergency_contact_phone' => ['nullable', 'string', 'max:20'],
            'status' => ['sometimes', 'boolean'],
        ]);

        // Keep patient_id immutable during updates.
        unset($validated['patient_id']);

        $patient->update($validated);

        return response()->json([
            'success' => true,
            'message' => 'Patient updated successfully',
            'data' => $patient->fresh(),
        ]);
    }

    public function destroy(Patient $patient): JsonResponse
    {
        $patient->delete();

        return response()->json([
            'success' => true,
            'message' => 'Patient deleted successfully',
        ]);
    }
}