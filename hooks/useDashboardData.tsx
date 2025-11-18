import { useState, useEffect, useCallback } from 'react';
import { employeeApi, roomApi, maintenanceApi, assignmentApi, buildingApi, userApi, activityLogApi, floorApi } from '../services/apiService';
import { Employee, Room, MaintenanceRequest, Building, Assignment, User, ActivityLog, Floor } from '../types';

// Define the shape of the data this hook will return
export interface DashboardData {
    // Raw data
    employees: Employee[];
    rooms: Room[];
    maintenanceRequests: MaintenanceRequest[];
    buildings: Building[];
    assignments: Assignment[];
    users: User[];
    activityLogs: ActivityLog[];
    floors: Floor[];
    
    // Calculated stats
    stats: {
        totalEmployees: number;
        activeEmployees: number;
        unhousedEmployees: number;
        totalRooms: number;
        totalBuildings: number;
        occupiedRooms: number;
        availableRooms: number;
        occupancyRate: number;
        openMaintenance: number;
        expiringContracts: Employee[];
        overdueMaintenance: MaintenanceRequest[];
    };

    // Data for charts
    charts: {
        occupancyByBuilding: { name: string; occupancy: number; total: number }[];
        employeeDistributionByDept: { name: string; value: number }[];
        userRoleDistribution: { name: string; value: number }[];
        maintenanceStatusDistribution: { name: string; value: number }[];
    };
}

const useDashboardData = () => {
    const [data, setData] = useState<DashboardData | null>(null);
    const [loading, setLoading] = useState(true);

    const fetchData = useCallback(async () => {
        // Do not set loading to true for refreshes to avoid UI flicker
        try {
            const [employees, rooms, maintenanceRequests, buildings, assignments, users, activityLogs, floors] = await Promise.all([
                employeeApi.getAll(),
                roomApi.getAll(),
                maintenanceApi.getAll(),
                buildingApi.getAll(),
                assignmentApi.getAll(),
                userApi.getAll(),
                activityLogApi.getAll(),
                floorApi.getAll(),
            ]);

            // --- CALCULATIONS ---

            // Stats
            const activeEmployees = employees.filter(e => e.status === 'ACTIVE');
            const housedEmployeeIds = new Set(assignments.filter(a => !a.checkOutDate).map(a => a.employeeId));
            const unhousedEmployees = activeEmployees.filter(e => !housedEmployeeIds.has(e.id)).length;
            const occupiedOrReservedRooms = rooms.filter(r => r.status === 'OCCUPIED' || r.status === 'RESERVED').length;
            const availableRooms = rooms.filter(r => r.status === 'AVAILABLE').length;
            const occupancyRate = rooms.length > 0 ? Math.round((occupiedOrReservedRooms / rooms.length) * 100) : 0;
            
            const today = new Date();
            today.setHours(0, 0, 0, 0); // Normalize today's date
            const thirtyDaysFromNow = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);
            
            const expiringContracts = activeEmployees.filter(e => {
                const contractDate = new Date(e.contractEndDate);
                return contractDate <= thirtyDaysFromNow;
            });

            const overdueMaintenance = maintenanceRequests.filter(req => 
                req.status !== 'RESOLVED' && req.dueDate && new Date(req.dueDate) < today
            );


            // Chart data
            const floorToBuildingMap = new Map(floors.map(f => [f.id, f.buildingId]));
            const occupancyByBuilding = buildings.map(building => {
                const buildingRooms = rooms.filter(r => floorToBuildingMap.get(r.floorId) === building.id);
                const occupied = buildingRooms.filter(r => r.status === 'OCCUPIED' || r.status === 'RESERVED').length;
                return { name: building.name, occupancy: occupied, total: buildingRooms.length };
            });

            // FIX: Explicitly type the initial value in reduce to prevent 'value' from being inferred as 'unknown'.
            const employeeDistributionByDept = activeEmployees.reduce((acc, emp) => {
                acc[emp.department] = (acc[emp.department] || 0) + 1;
                return acc;
            }, {} as Record<string, number>);

            // FIX: Explicitly type the initial value in reduce to prevent 'value' from being inferred as 'unknown'.
            const maintenanceStatusDistribution = maintenanceRequests.reduce((acc, req) => {
                acc[req.status] = (acc[req.status] || 0) + 1;
                return acc;
            }, {} as Record<string, number>);

            // FIX: Explicitly type the initial value in reduce to prevent 'value' from being inferred as 'unknown'.
            const userRoleDistribution = users.reduce((acc, user) => {
                const role = user.role;
                acc[role] = (acc[role] || 0) + 1;
                return acc;
            }, {} as Record<string, number>);


            setData({
                employees, rooms, maintenanceRequests, buildings, assignments, users, activityLogs, floors,
                stats: {
                    totalEmployees: employees.length,
                    activeEmployees: activeEmployees.length,
                    unhousedEmployees,
                    totalRooms: rooms.length,
                    totalBuildings: buildings.length,
                    occupiedRooms: occupiedOrReservedRooms,
                    availableRooms,
                    occupancyRate,
                    openMaintenance: maintenanceRequests.filter(m => m.status === 'OPEN' || m.status === 'IN_PROGRESS').length,
                    expiringContracts,
                    overdueMaintenance,
                },
                charts: {
                    occupancyByBuilding,
                    employeeDistributionByDept: Object.entries(employeeDistributionByDept).map(([name, value]) => ({ name, value })),
                    userRoleDistribution: Object.entries(userRoleDistribution).map(([name, value]) => ({ name, value })),
                    maintenanceStatusDistribution: Object.entries(maintenanceStatusDistribution).map(([name, value]) => ({ name, value })),
                }
            });
        } catch (error) {
            console.error("Failed to fetch dashboard data", error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        const handleDataChange = () => {
            fetchData();
        };

        // Initial fetch
        fetchData();

        // No need to listen for 'datachanged' event since data is fetched from the backend.
        // We can implement polling or websockets later if real-time updates are needed.
    }, [fetchData]);

    return { data, loading };
};

export default useDashboardData;