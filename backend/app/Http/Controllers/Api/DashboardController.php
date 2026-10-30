<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Appointment;
use App\Models\Department;
use App\Models\Doctor;
use App\Models\Patient;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class DashboardController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();
        $today = today()->toDateString();

        // Dashboard statistic cards
        $counts = [
            'departments' => Department::count(),
            'doctors' => Doctor::count(),
            'active_doctors' => Doctor::where('status', true)->count(),
            'patients' => Patient::count(),
            'appointments' => Appointment::whereDate(
                'appointment_date',
                $today
            )->count(),
        ];

        // Today's appointments
        $todayAppointments = Appointment::with([
            'patient:id,name,patient_id',
            'doctor:id,name,specialization',
            'department:id,name',
        ])
            ->whereDate('appointment_date', $today)
            ->orderBy('appointment_time')
            ->limit(5)
            ->get();

        // Recently registered patients
        $recentPatients = Patient::select([
            'id',
            'patient_id',
            'name',
            'gender',
            'created_at',
        ])
            ->latest()
            ->limit(5)
            ->get();

        // Appointment status totals across all appointments
        $statuses = [
            'scheduled',
            'confirmed',
            'completed',
            'cancelled',
            'no_show',
        ];

        $appointmentStatusCounts = array_fill_keys($statuses, 0);

        $statusResults = Appointment::selectRaw(
            'status, COUNT(*) as total'
        )
            ->groupBy('status')
            ->pluck('total', 'status');

        foreach ($statusResults as $status => $total) {
            if (array_key_exists($status, $appointmentStatusCounts)) {
                $appointmentStatusCounts[$status] = (int) $total;
            }
        }

        // Appointment totals for the last six calendar months
        $firstMonth = Carbon::now()
            ->startOfMonth()
            ->subMonths(5);

        $monthlyResults = Appointment::selectRaw(
            "DATE_FORMAT(appointment_date, '%Y-%m') as month, COUNT(*) as total"
        )
            ->whereDate('appointment_date', '>=', $firstMonth->toDateString())
            ->groupBy('month')
            ->pluck('total', 'month');

        $monthlyAppointments = [];

        for ($i = 0; $i < 6; $i++) {
            $month = $firstMonth->copy()->addMonths($i);
            $monthKey = $month->format('Y-m');

            $monthlyAppointments[] = [
                'month' => $month->format('M'),
                'total' => (int) ($monthlyResults[$monthKey] ?? 0),
            ];
        }

        return response()->json([
            'success' => true,
            'data' => [
                'user' => [
                    'name' => $user->name,
                    'email' => $user->email,
                    'role' => $user->role,
                ],
                'counts' => $counts,
                'today_appointments' => $todayAppointments,
                'recent_patients' => $recentPatients,
                'appointment_status_counts' => $appointmentStatusCounts,
                'monthly_appointments' => $monthlyAppointments,
            ],
        ]);
    }
}