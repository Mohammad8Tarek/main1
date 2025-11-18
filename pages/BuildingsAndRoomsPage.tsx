
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Building, Room, Floor } from '../types';
import { buildingApi, roomApi, floorApi, logActivity } from '../services/apiService';
import { useAuth } from '../hooks/useAuth';
import { useLanguage } from '../context/LanguageContext';
import { useToast } from '../context/ToastContext';
import { useExportSettings } from '../context/ExportSettingsContext';
import { exportToPdf, exportToExcel } from '../services/exportService';
import ExportOptionsModal from '../components/ExportOptionsModal';
import PaginationControls from '../components/PaginationControls';

type ModalState = 'building' | 'floor' | 'room' | null;
type EditingState = Building | Floor | Room | null;

const BuildingsAndRoomsPage: React.FC = () => {
    const { user } = useAuth();
    const { language, t } = useLanguage();
    const { showToast } = useToast();
    const { settings: exportSettings } = useExportSettings();

    // Global state
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'buildings' | 'floors' | 'rooms'>('buildings');
    const [isExportModalOpen, setIsExportModalOpen] = useState(false);
    const [isPdfExporting, setIsPdfExporting] = useState(false);
    const [isExcelExporting, setIsExcelExporting] = useState(false);

    // Data state
    const [buildings, setBuildings] = useState<Building[]>([]);
    const [floors, setFloors] = useState<Floor[]>([]);
    const [rooms, setRooms] = useState<Room[]>([]);
    
    // Permissions
    const canManage = user?.role && ['SUPER_ADMIN', 'ADMIN', 'MANAGER'].includes(user.role);
    const canDelete = user?.role && ['SUPER_ADMIN', 'ADMIN'].includes(user.role);

    // Memoized maps for performance
    const buildingMap = useMemo(() => new Map(buildings.map(b => [b.id, b.name])), [buildings]);
    
    const roomCountByFloor = useMemo(() => {
        return rooms.reduce((acc, room) => {
            acc[room.floorId] = (acc[room.floorId] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);
    }, [rooms]);

    const getRoomDetails = useCallback((roomId: string) => {
        const room = rooms.find(r => r.id === roomId);
        if (!room) return { roomNumber: '', floorNumber: '', buildingName: '' };
        const floor = floors.find(f => f.id === room.floorId);
        if (!floor) return { roomNumber: room.roomNumber, floorNumber: '', buildingName: '' };
        const building = buildings.find(b => b.id === floor.buildingId);
        return {
            roomNumber: room.roomNumber,
            floorNumber: floor.floorNumber,
            buildingName: building ? building.name : '',
        };
    }, [rooms, floors, buildings]);

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const [buildingsData, floorsData, roomsData] = await Promise.all([
                buildingApi.getAll(),
                floorApi.getAll(),
                roomApi.getAll(),
            ]);
            setBuildings(buildingsData.sort((a,b) => a.name.localeCompare(b.name)));
            setFloors(floorsData);
            setRooms(roomsData);
        } catch (error) {
            console.error("Failed to fetch housing data", error);
            showToast(t('errors.fetchFailed'), 'error');
        } finally {
            setLoading(false);
        }
    }, [showToast, t]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handlePdfExport = async (filteredData: any[]) => {
        setIsPdfExporting(true);
        showToast(t('exporting'), 'info');
        try {
            let headers: string[], data: (string | number)[][], reportTitle: string;
            switch (activeTab) {
                case 'buildings':
                    reportTitle = t('housing.buildingsReportTitle');
                    headers = [t('housing.buildingName'), t('housing.location'), t('housing.capacity'), t('housing.status')];
                    data = filteredData.map(b => [b.name, b.location, b.capacity, t(`statuses.${b.status.toLowerCase()}`)]);
                    break;
                case 'floors':
                    reportTitle = t('housing.floorsReportTitle');
                    headers = [t('housing.floorNumber'), t('housing.building'), t('housing.description')];
                    data = filteredData.map(f => [f.floorNumber, buildingMap.get(f.buildingId) || t('unknown'), f.description]);
                    break;
                default: // rooms
                    reportTitle = t('housing.roomsReportTitle');
                    headers = [t('housing.roomNumber'), t('housing.building'), t('housing.floor'), t('housing.capacity'), t('housing.occupancy'), t('housing.status')];
                    data = filteredData.map(r => {
                        const details = getRoomDetails(r.id);
                        return [details.roomNumber, details.buildingName, details.floorNumber, r.capacity, r.currentOccupancy, t(`statuses.${r.status.toLowerCase()}`)];
                    });
                    break;
            }

            const filename = `report_housing_${activeTab}_${new Date().toISOString().split('T')[0]}.pdf`;
            exportToPdf({ headers, data, title: reportTitle, filename, settings: exportSettings, language });
            logActivity(user!.username, `Exported ${activeTab} to PDF`);
        } catch (error) {
            showToast(t('errors.generic'), 'error');
        } finally {
            setIsPdfExporting(false);
            setIsExportModalOpen(false);
        }
    };
    
    const handleExcelExport = async (filteredData: any[]) => {
        setIsExcelExporting(true);
        showToast(t('exporting'), 'info');
        try {
            let headers: string[], data: (string | number)[][], reportTitle: string;
            switch (activeTab) {
                case 'buildings':
                    reportTitle = t('housing.buildingsReportTitle');
                    headers = [t('housing.buildingName'), t('housing.location'), t('housing.capacity'), t('housing.status')];
                    data = filteredData.map(b => [b.name, b.location, b.capacity, t(`statuses.${b.status.toLowerCase()}`)]);
                    break;
                case 'floors':
                    reportTitle = t('housing.floorsReportTitle');
                    headers = [t('housing.floorNumber'), t('housing.building'), t('housing.description')];
                    data = filteredData.map(f => [f.floorNumber, buildingMap.get(f.buildingId) || t('unknown'), f.description]);
                    break;
                default: // rooms
                    reportTitle = t('housing.roomsReportTitle');
                    headers = [t('housing.roomNumber'), t('housing.building'), t('housing.floor'), t('housing.capacity'), t('housing.occupancy'), t('housing.status')];
                    data = filteredData.map(r => {
                        const details = getRoomDetails(r.id);
                        return [details.roomNumber, details.buildingName, details.floorNumber, r.capacity, r.currentOccupancy, t(`statuses.${r.status.toLowerCase()}`)];
                    });
                    break;
            }

            const filename = `report_housing_${activeTab}_${new Date().toISOString().split('T')[0]}.xlsx`;
            exportToExcel({ headers, data, filename, settings: exportSettings });
            logActivity(user!.username, `Exported ${activeTab} to Excel`);
        } catch (error) {
            showToast(t('errors.generic'), 'error');
        } finally {
            setIsExcelExporting(false);
            setIsExportModalOpen(false);
        }
    };

    // --- Render Logic ---
    const renderContent = () => {
        if (loading) {
            return <div className="p-6 text-center text-slate-500 dark:text-slate-400">{t('loading')}...</div>;
        }

        switch (activeTab) {
            case 'buildings':
                return <BuildingsTab buildings={buildings} rooms={rooms} floors={floors} canManage={canManage} canDelete={canDelete} onExport={(filtered) => { setExportData(filtered); setIsExportModalOpen(true); }} fetchData={fetchData} />;
            case 'floors':
                return <FloorsTab floors={floors} buildings={buildings} roomCountByFloor={roomCountByFloor} canManage={canManage} canDelete={canDelete} onExport={(filtered) => { setExportData(filtered); setIsExportModalOpen(true); }} fetchData={fetchData} />;
            case 'rooms':
                return <RoomsTab rooms={rooms} floors={floors} buildings={buildings} getRoomDetails={getRoomDetails} canManage={canManage} onExport={(filtered) => { setExportData(filtered); setIsExportModalOpen(true); }} fetchData={fetchData} />;
            default:
                return null;
        }
    };
    
    const [exportData, setExportData] = useState<any[]>([]);

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold text-slate-800 dark:text-white">{t('layout.housing')}</h1>
            </div>
            
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md">
                <div className="p-4 border-b dark:border-slate-700">
                    <div className="flex items-center space-x-2 rtl:space-x-reverse flex-wrap gap-y-2">
                        <button onClick={() => setActiveTab('buildings')} className={`px-3 py-2 text-sm rounded-md ${activeTab === 'buildings' ? 'bg-primary-600 text-white font-semibold' : 'bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600'}`}>{t('housing.tabs.buildings')}</button>
                        <button onClick={() => setActiveTab('floors')} className={`px-3 py-2 text-sm rounded-md ${activeTab === 'floors' ? 'bg-primary-600 text-white font-semibold' : 'bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600'}`}>{t('housing.tabs.floors')}</button>
                        <button onClick={() => setActiveTab('rooms')} className={`px-3 py-2 text-sm rounded-md ${activeTab === 'rooms' ? 'bg-primary-600 text-white font-semibold' : 'bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600'}`}>{t('housing.tabs.rooms')}</button>
                    </div>
                </div>
                 {renderContent()}
            </div>
             <ExportOptionsModal
                isOpen={isExportModalOpen}
                onClose={() => setIsExportModalOpen(false)}
                onExportPdf={() => handlePdfExport(exportData)}
                onExportExcel={() => handleExcelExport(exportData)}
                isPdfExporting={isPdfExporting}
                isExcelExporting={isExcelExporting}
            />
        </div>
    );
};

const formInputClass = "w-full p-2 border border-slate-300 rounded bg-slate-50 dark:bg-slate-700 dark:border-slate-600 text-slate-900 dark:text-slate-200";
const formLabelClass = "block text-sm font-medium mb-1 text-slate-700 dark:text-slate-300";

// FIX: Add explicit types for component props to ensure type safety.
const BuildingsTab = ({ buildings, rooms, floors, canManage, onExport, fetchData }: { buildings: Building[], rooms: Room[], floors: Floor[], canManage?: boolean, canDelete?: boolean, onExport: (data: Building[]) => void, fetchData: () => void }) => {
    const { t } = useLanguage();
    const { user } = useAuth();
    const { showToast } = useToast();
    const [currentPage, setCurrentPage] = useState(1);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingBuilding, setEditingBuilding] = useState<Building | null>(null);
    const [formData, setFormData] = useState({ name: '', location: '', status: 'ACTIVE' as Building['status'] });
    const [selected, setSelected] = useState<Set<string>>(new Set());
    const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
    const [bulkStatus, setBulkStatus] = useState<Building['status']>('ACTIVE');


    const paginated = useMemo(() => {
        const startIndex = (currentPage - 1) * rowsPerPage;
        return buildings.slice(startIndex, startIndex + rowsPerPage);
    }, [buildings, currentPage, rowsPerPage]);

    const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.checked) {
            setSelected(new Set(paginated.map(b => b.id)));
        } else {
            setSelected(new Set());
        }
    };
    
    const handleSelectOne = (id: string) => {
        const newSelection = new Set(selected);
        if (newSelection.has(id)) newSelection.delete(id);
        else newSelection.add(id);
        setSelected(newSelection);
    };

    const openAddModal = () => {
        setEditingBuilding(null);
        setFormData({ name: '', location: '', status: 'ACTIVE' });
        setIsModalOpen(true);
    };

    const openEditModal = (building: Building) => {
        setEditingBuilding(building);
        setFormData({ name: building.name, location: building.location, status: building.status });
        setIsModalOpen(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const isDuplicate = buildings.some(b => b.name.trim().toLowerCase() === formData.name.trim().toLowerCase() && b.id !== editingBuilding?.id);
        if (isDuplicate) {
            showToast(t('errors.duplicateBuildingName', { name: formData.name }), 'error');
            return;
        }

        setIsSubmitting(true);
        try {
            if (editingBuilding) {
                await buildingApi.update(editingBuilding.id, formData);
                showToast(t('housing.buildingUpdated'), 'success');
                logActivity(user!.username, `Updated building: ${formData.name}`);
            } else {
                await buildingApi.create(formData);
                showToast(t('housing.buildingAdded'), 'success');
                logActivity(user!.username, `Added building: ${formData.name}`);
            }
            setIsModalOpen(false);
            fetchData();
        } catch (error) {
            showToast(t('errors.generic'), 'error');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleBulkStatusChange = async () => {
        setIsSubmitting(true);
        const floorToBuildingMap = new Map(floors.map(f => [f.id, f.buildingId]));
        let skippedCount = 0;
        const updates: Promise<any>[] = [];

        selected.forEach(buildingId => {
            if (bulkStatus === 'INACTIVE') {
                const hasOccupiedRooms = rooms.some(room => {
                    const roomBuildingId = floorToBuildingMap.get(room.floorId);
                    return roomBuildingId === buildingId && (room.status === 'OCCUPIED' || room.status === 'RESERVED');
                });
                if (hasOccupiedRooms) {
                    skippedCount++;
                    return;
                }
            }
            updates.push(buildingApi.update(buildingId, { status: bulkStatus }));
        });

        await Promise.allSettled(updates);
        if (updates.length > 0) showToast(t('housing.bulkBuildingStatusUpdated', { count: updates.length }), 'success');
        if (skippedCount > 0) showToast(t('errors.bulkUpdateBuildingsSkipped', { count: skippedCount }), 'info');
        
        setIsSubmitting(false);
        setIsBulkModalOpen(false);
        setSelected(new Set());
        fetchData();
    };

    return (
        <div>
            <div className="p-4 flex justify-end items-center gap-2">
                {selected.size > 0 && canManage && (
                    <button onClick={() => setIsBulkModalOpen(true)} className="px-3 py-1 text-sm bg-primary-600 text-white rounded-md hover:bg-primary-700">{t('housing.changeStatus')}</button>
                )}
                <button onClick={() => onExport(buildings)} className="px-4 py-2 bg-slate-600 text-white rounded-lg hover:bg-slate-700 text-sm"><i className="fa-solid fa-download me-2"></i>{t('export')}</button>
                {canManage && <button onClick={openAddModal} className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 text-sm"><i className="fa-solid fa-plus me-2"></i>{t('housing.addBuilding')}</button>}
            </div>
            <div className="relative overflow-x-auto">
                <table className="w-full text-sm text-left rtl:text-right text-slate-500 dark:text-slate-400">
                    <thead className="text-xs text-slate-700 uppercase bg-slate-100 dark:bg-slate-700 dark:text-slate-400">
                        <tr>
                            {canManage && <th scope="col" className="p-4"><input type="checkbox" onChange={handleSelectAll} checked={selected.size === paginated.length && paginated.length > 0} /></th>}
                            <th scope="col" className="px-6 py-3">{t('housing.buildingName')}</th>
                            <th scope="col" className="px-6 py-3">{t('housing.location')}</th>
                            <th scope="col" className="px-6 py-3">{t('housing.status')}</th>
                            {canManage && <th scope="col" className="px-6 py-3">{t('actions')}</th>}
                        </tr>
                    </thead>
                    <tbody>
                        {paginated.map(b => (
                            <tr key={b.id} className="bg-white border-b dark:bg-slate-800 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-600">
                                {canManage && <td className="p-4"><input type="checkbox" checked={selected.has(b.id)} onChange={() => handleSelectOne(b.id)} /></td>}
                                <td className="px-6 py-4 font-medium text-slate-900 dark:text-white">{b.name}</td>
                                <td className="px-6 py-4">{b.location}</td>
                                <td className="px-6 py-4"><span className={`px-2 py-1 text-xs font-medium rounded-full ${b.status === 'ACTIVE' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'}`}>{t(`statuses.${b.status.toLowerCase()}`)}</span></td>
                                {canManage && <td className="px-6 py-4"><button onClick={() => openEditModal(b)} className="font-medium text-primary-600 dark:text-primary-500 hover:underline">{t('edit')}</button></td>}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            <PaginationControls currentPage={currentPage} totalPages={Math.ceil(buildings.length / rowsPerPage)} onPageChange={setCurrentPage} rowsPerPage={rowsPerPage} onRowsPerPageChange={setRowsPerPage} filteredRowCount={buildings.length} />
        
            {isModalOpen && canManage && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl p-6 w-full max-w-lg">
                        <h2 className="text-xl font-bold mb-4">{editingBuilding ? t('housing.editBuilding') : t('housing.addBuilding')}</h2>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div><label className={formLabelClass}>{t('housing.buildingName')}</label><input type="text" value={formData.name} onChange={e => setFormData(p => ({...p, name: e.target.value}))} required className={formInputClass} /></div>
                            <div><label className={formLabelClass}>{t('housing.location')}</label><input type="text" value={formData.location} onChange={e => setFormData(p => ({...p, location: e.target.value}))} className={formInputClass} /></div>
                            <div><label className={formLabelClass}>{t('housing.buildingStatus')}</label><select value={formData.status} onChange={e => setFormData(p => ({...p, status: e.target.value as any}))} className={formInputClass}><option value="ACTIVE">{t('statuses.active')}</option><option value="INACTIVE">{t('statuses.inactive')}</option></select></div>
                            <div className="flex justify-end gap-4 mt-6"><button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 bg-slate-200 text-slate-800 rounded">{t('cancel')}</button><button type="submit" disabled={isSubmitting} className="px-4 py-2 bg-primary-600 text-white rounded">{isSubmitting ? t('saving') : t('save')}</button></div>
                        </form>
                    </div>
                </div>
            )}
             {isBulkModalOpen && canManage && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl p-6 w-full max-w-md">
                        <h2 className="text-xl font-bold mb-4">{t('housing.bulkBuildingStatusModalTitle')}</h2>
                        <p className="mb-4">{t('housing.confirmBulkBuildingStatusChange', { count: selected.size, status: t(`statuses.${bulkStatus.toLowerCase()}`) })}</p>
                        <div className="mb-6"><label className={formLabelClass}>{t('housing.newStatus')}</label><select value={bulkStatus} onChange={e => setBulkStatus(e.target.value as any)} className={formInputClass}><option value="ACTIVE">{t('statuses.active')}</option><option value="INACTIVE">{t('statuses.inactive')}</option></select></div>
                        <div className="flex justify-end gap-4"><button type="button" onClick={() => setIsBulkModalOpen(false)} className="px-4 py-2 bg-slate-200 rounded">{t('cancel')}</button><button onClick={handleBulkStatusChange} disabled={isSubmitting} className="px-4 py-2 bg-primary-600 text-white rounded">{isSubmitting ? t('saving') : t('save')}</button></div>
                    </div>
                </div>
            )}
        </div>
    );
};

// FIX: Add explicit types for component props to ensure type safety and correct type inference.
const FloorsTab = ({ floors, buildings, roomCountByFloor, canManage, canDelete, onExport, fetchData }: { floors: Floor[], buildings: Building[], roomCountByFloor: Record<string, number>, canManage?: boolean, canDelete?: boolean, onExport: (data: Floor[]) => void, fetchData: () => void }) => {
    const { t } = useLanguage();
    const { showToast } = useToast();
    const [currentPage, setCurrentPage] = useState(1);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingFloor, setEditingFloor] = useState<Floor | null>(null);
    const [formData, setFormData] = useState({ buildingId: '', floorNumber: '', description: '' });
    const [selected, setSelected] = useState<Set<string>>(new Set());

    const buildingMap = useMemo(() => new Map(buildings.map((b: Building) => [b.id, b.name])), [buildings]);

    const paginated = useMemo(() => {
        const startIndex = (currentPage - 1) * rowsPerPage;
        return floors.slice(startIndex, startIndex + rowsPerPage);
    }, [floors, currentPage, rowsPerPage]);

    const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.checked) {
            setSelected(new Set(paginated.map((f: Floor) => f.id)));
        } else {
            setSelected(new Set());
        }
    };
    
    const handleSelectOne = (id: string) => {
        const newSelection = new Set(selected);
        if (newSelection.has(id)) newSelection.delete(id);
        else newSelection.add(id);
        setSelected(newSelection);
    };

    const openAddModal = () => {
        setEditingFloor(null);
        setFormData({ buildingId: buildings[0]?.id.toString() || '', floorNumber: '', description: '' });
        setIsModalOpen(true);
    };

    const openEditModal = (floor: Floor) => {
        setEditingFloor(floor);
        // FIX: Replace object spread with explicit property assignment to avoid type errors.
        setFormData({ buildingId: floor.buildingId, floorNumber: floor.floorNumber, description: floor.description });
        setIsModalOpen(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const isDuplicate = floors.some((f: Floor) => f.floorNumber.trim().toLowerCase() === formData.floorNumber.trim().toLowerCase() && f.buildingId === formData.buildingId && f.id !== editingFloor?.id);
        if (isDuplicate) {
            showToast(t('errors.duplicateFloorNumber', { number: formData.floorNumber, building: buildingMap.get(formData.buildingId) }), 'error');
            return;
        }

        setIsSubmitting(true);
        try {
            if (editingFloor) {
                await floorApi.update(editingFloor.id, formData);
                showToast(t('housing.floorUpdated'), 'success');
            } else {
                await floorApi.create(formData);
                showToast(t('housing.floorAdded'), 'success');
            }
            setIsModalOpen(false);
            fetchData();
        } catch (error) {
            showToast(t('errors.generic'), 'error');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleBulkDelete = async () => {
        if (!window.confirm(t('housing.confirmBulkDeleteFloors', { count: selected.size }))) return;
        setIsSubmitting(true);
        let skippedCount = 0;
        const deletes: Promise<any>[] = [];
        
        selected.forEach(floorId => {
            if (roomCountByFloor[floorId] > 0) {
                skippedCount++;
            } else {
                deletes.push(floorApi.delete(floorId));
            }
        });

        await Promise.allSettled(deletes);
        if (deletes.length > 0) showToast(t('housing.bulkFloorsDeleted', { count: deletes.length }), 'success');
        if (skippedCount > 0) showToast(t('errors.floorHasRooms', { count: skippedCount }), 'info');
        
        setIsSubmitting(false);
        setSelected(new Set());
        fetchData();
    };

    return (
        <div>
            <div className="p-4 flex justify-end items-center gap-2">
                {selected.size > 0 && canDelete && (
                    <button onClick={handleBulkDelete} disabled={isSubmitting} className="px-3 py-1 text-sm bg-red-600 text-white rounded-md hover:bg-red-700">{t('housing.bulkDelete')}</button>
                )}
                <button onClick={() => onExport(floors)} className="px-4 py-2 bg-slate-600 text-white rounded-lg hover:bg-slate-700 text-sm"><i className="fa-solid fa-download me-2"></i>{t('export')}</button>
                {canManage && <button onClick={openAddModal} className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 text-sm"><i className="fa-solid fa-plus me-2"></i>{t('housing.addFloor')}</button>}
            </div>
            <div className="relative overflow-x-auto">
                <table className="w-full text-sm text-left rtl:text-right text-slate-500 dark:text-slate-400">
                    <thead className="text-xs text-slate-700 uppercase bg-slate-100 dark:bg-slate-700 dark:text-slate-400">
                        <tr>
                            {canDelete && <th scope="col" className="p-4"><input type="checkbox" onChange={handleSelectAll} /></th>}
                            <th scope="col" className="px-6 py-3">{t('housing.floorNumber')}</th>
                            <th scope="col" className="px-6 py-3">{t('housing.building')}</th>
                            <th scope="col" className="px-6 py-3">{t('housing.rooms')}</th>
                            <th scope="col" className="px-6 py-3">{t('housing.description')}</th>
                            {canManage && <th scope="col" className="px-6 py-3">{t('actions')}</th>}
                        </tr>
                    </thead>
                    <tbody>
                        {paginated.map((f: Floor) => (
                            <tr key={f.id} className="bg-white border-b dark:bg-slate-800 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-600">
                                {canDelete && <td className="p-4"><input type="checkbox" checked={selected.has(f.id)} onChange={() => handleSelectOne(f.id)} /></td>}
                                <td className="px-6 py-4 font-medium text-slate-900 dark:text-white">{f.floorNumber}</td>
                                <td className="px-6 py-4">{buildingMap.get(f.buildingId) || t('unknown')}</td>
                                {/* FIX: With correctly typed props, this expression is now type-safe. */}
                                <td className="px-6 py-4">{roomCountByFloor[f.id] || 0}</td>
                                <td className="px-6 py-4">{f.description}</td>
                                {canManage && <td className="px-6 py-4"><button onClick={() => openEditModal(f)} className="font-medium text-primary-600 dark:text-primary-500 hover:underline">{t('edit')}</button></td>}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            <PaginationControls currentPage={currentPage} totalPages={Math.ceil(floors.length / rowsPerPage)} onPageChange={setCurrentPage} rowsPerPage={rowsPerPage} onRowsPerPageChange={setRowsPerPage} filteredRowCount={floors.length} />
        
            {isModalOpen && canManage && ( /* Floor Add/Edit Modal */
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl p-6 w-full max-w-lg">
                        <h2 className="text-xl font-bold mb-4">{editingFloor ? t('housing.editFloor') : t('housing.addFloor')}</h2>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div><label className={formLabelClass}>{t('housing.building')}</label><select value={formData.buildingId} onChange={e => setFormData(p => ({...p, buildingId: e.target.value}))} required className={formInputClass}><option value="" disabled>-- {t('select')} --</option>{buildings.map((b: Building) => <option key={b.id} value={b.id}>{b.name}</option>)}</select></div>
                            <div><label className={formLabelClass}>{t('housing.floorNumber')}</label><input type="text" value={formData.floorNumber} onChange={e => setFormData(p => ({...p, floorNumber: e.target.value}))} required className={formInputClass} /></div>
                            <div><label className={formLabelClass}>{t('housing.description')}</label><input type="text" value={formData.description} onChange={e => setFormData(p => ({...p, description: e.target.value}))} className={formInputClass} /></div>
                            <div className="flex justify-end gap-4 mt-6"><button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 bg-slate-200 rounded">{t('cancel')}</button><button type="submit" disabled={isSubmitting} className="px-4 py-2 bg-primary-600 text-white rounded">{isSubmitting ? t('saving') : t('save')}</button></div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

// FIX: Add explicit types for component props to ensure type safety.
const RoomsTab = ({ rooms, floors, buildings, getRoomDetails, canManage, onExport, fetchData }: { rooms: Room[], floors: Floor[], buildings: Building[], getRoomDetails: (roomId: string) => any, canManage?: boolean, onExport: (data: Room[]) => void, fetchData: () => void }) => {
    const { t } = useLanguage();
    const { showToast } = useToast();
    const [currentPage, setCurrentPage] = useState(1);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingRoom, setEditingRoom] = useState<Room | null>(null);
    const [formData, setFormData] = useState({ floorId: '', roomNumber: '', capacity: 1, status: 'AVAILABLE' as Room['status'] });
    
    // Filters
    const [buildingFilter, setBuildingFilter] = useState<string>('all');
    const [floorFilter, setFloorFilter] = useState<string>('all');
    
    const filteredFloors = useMemo(() => {
        if (buildingFilter === 'all') return floors;
        return floors.filter((f: Floor) => f.buildingId === buildingFilter);
    }, [floors, buildingFilter]);

    const filteredRooms = useMemo(() => {
        return rooms.filter((room: Room) => {
            const floor = floors.find((f: Floor) => f.id === room.floorId);
            if (!floor) return false;
            const buildingMatch = buildingFilter === 'all' || floor.buildingId === buildingFilter;
            const floorMatch = floorFilter === 'all' || room.floorId === floorFilter;
            return buildingMatch && floorMatch;
        });
    }, [rooms, floors, buildingFilter, floorFilter]);
    
    useEffect(() => { setCurrentPage(1); }, [buildingFilter, floorFilter]);

    const paginated = useMemo(() => {
        const startIndex = (currentPage - 1) * rowsPerPage;
        return filteredRooms.slice(startIndex, startIndex + rowsPerPage);
    }, [filteredRooms, currentPage, rowsPerPage]);

    const openAddModal = () => {
        setEditingRoom(null);
        setFormData({ floorId: '', roomNumber: '', capacity: 1, status: 'AVAILABLE' });
        setIsModalOpen(true);
    };

    const openEditModal = (room: Room) => {
        setEditingRoom(room);
        setFormData({ ...room, floorId: String(room.floorId), capacity: room.capacity });
        setIsModalOpen(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const isDuplicate = rooms.some((r: Room) => r.roomNumber.trim().toLowerCase() === formData.roomNumber.trim().toLowerCase() && r.id !== editingRoom?.id);
        if(isDuplicate) {
            showToast(t('errors.duplicateRoomNumber', {number: formData.roomNumber}), 'error');
            return;
        }

        setIsSubmitting(true);
        const dataToSubmit = { ...formData, capacity: formData.capacity, currentOccupancy: editingRoom?.currentOccupancy || 0 };
        try {
            if (editingRoom) {
                await roomApi.update(editingRoom.id, dataToSubmit);
                showToast(t('housing.roomUpdated'), 'success');
            } else {
                await roomApi.create(dataToSubmit);
                showToast(t('housing.roomAdded'), 'success');
            }
            setIsModalOpen(false);
            fetchData();
        } catch (error) { showToast(t('errors.generic'), 'error'); } finally { setIsSubmitting(false); }
    };
    
    return (
        <div>
            <div className="p-4 flex flex-col md:flex-row justify-between items-center gap-4 border-b dark:border-slate-700">
                <div className="flex items-center gap-4">
                    <select value={buildingFilter} onChange={e => { setBuildingFilter(e.target.value); setFloorFilter('all'); }} className={formInputClass}><option value="all">{t('housing.selectBuildingPrompt')}</option>{buildings.map((b: Building) => <option key={b.id} value={b.id}>{b.name}</option>)}</select>
                    <select value={floorFilter} onChange={e => setFloorFilter(e.target.value)} className={formInputClass}><option value="all">{t('housing.selectFloorPrompt')}</option>{filteredFloors.map((f: Floor) => <option key={f.id} value={f.id}>{f.floorNumber}</option>)}</select>
                </div>
                <div className="flex items-center gap-2">
                    <button onClick={() => onExport(filteredRooms)} className="px-4 py-2 bg-slate-600 text-white rounded-lg hover:bg-slate-700 text-sm"><i className="fa-solid fa-download me-2"></i>{t('export')}</button>
                    {canManage && <button onClick={openAddModal} className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 text-sm"><i className="fa-solid fa-plus me-2"></i>{t('housing.addRoom')}</button>}
                </div>
            </div>
            <div className="relative overflow-x-auto">
                 <table className="w-full text-sm text-left rtl:text-right text-slate-500 dark:text-slate-400">
                    <thead className="text-xs text-slate-700 uppercase bg-slate-100 dark:bg-slate-700 dark:text-slate-400">
                        <tr>
                            <th className="px-6 py-3">{t('housing.roomNumber')}</th><th className="px-6 py-3">{t('housing.building')}</th><th className="px-6 py-3">{t('housing.floor')}</th><th className="px-6 py-3">{t('housing.capacity')}</th><th className="px-6 py-3">{t('housing.occupancy')}</th><th className="px-6 py-3">{t('housing.status')}</th>{canManage && <th className="px-6 py-3">{t('actions')}</th>}
                        </tr>
                    </thead>
                    <tbody>
                        {paginated.map((r: Room) => {
                            const details = getRoomDetails(r.id);
                            return (
                                <tr key={r.id} className="bg-white border-b dark:bg-slate-800 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-600">
                                    <td className="px-6 py-4 font-medium text-slate-900 dark:text-white">{details.roomNumber}</td><td>{details.buildingName}</td><td>{details.floorNumber}</td><td>{r.capacity}</td><td>{r.currentOccupancy}</td><td><span className={`px-2 py-1 text-xs font-medium rounded-full ${r.status === 'AVAILABLE' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>{t(`statuses.${r.status.toLowerCase()}`)}</span></td>
                                    {canManage && <td className="px-6 py-4"><button onClick={() => openEditModal(r)} className="font-medium text-primary-600 hover:underline">{t('edit')}</button></td>}
                                </tr>
                            )
                        })}
                    </tbody>
                 </table>
            </div>
            <PaginationControls currentPage={currentPage} totalPages={Math.ceil(filteredRooms.length / rowsPerPage)} onPageChange={setCurrentPage} rowsPerPage={rowsPerPage} onRowsPerPageChange={setRowsPerPage} filteredRowCount={filteredRooms.length} />
       
            {isModalOpen && canManage && ( /* Room Add/Edit Modal */
                 <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl p-6 w-full max-w-lg">
                        <h2 className="text-xl font-bold mb-4">{editingRoom ? t('housing.editRoom') : t('housing.addRoom')}</h2>
                        <form onSubmit={handleSubmit} className="space-y-4">
                             <div><label className={formLabelClass}>{t('housing.floor')}</label><select value={formData.floorId} onChange={e => setFormData(p => ({...p, floorId: e.target.value}))} required className={formInputClass}><option value="" disabled>-- {t('select')} --</option>{floors.map((f: Floor) => <option key={f.id} value={f.id}>{`${buildings.find((b: Building)=>b.id===f.buildingId)?.name} - Floor ${f.floorNumber}`}</option>)}</select></div>
                             <div><label className={formLabelClass}>{t('housing.roomNumber')}</label><input type="text" value={formData.roomNumber} onChange={e => setFormData(p => ({...p, roomNumber: e.target.value}))} required className={formInputClass} /></div>
                             <div><label className={formLabelClass}>{t('housing.capacity')}</label><input type="number" value={formData.capacity} onChange={e => setFormData(p => ({...p, capacity: parseInt(e.target.value, 10)}))} min="1" required className={formInputClass} /></div>
                             {editingRoom && <div><label className={formLabelClass}>{t('housing.status')}</label><select value={formData.status} onChange={e => setFormData(p => ({...p, status: e.target.value as any}))} className={formInputClass}><option value="AVAILABLE">Available</option><option value="OCCUPIED">Occupied</option><option value="MAINTENANCE">Maintenance</option><option value="RESERVED">Reserved</option></select></div>}
                            <div className="flex justify-end gap-4 mt-6"><button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 bg-slate-200 rounded">{t('cancel')}</button><button type="submit" disabled={isSubmitting} className="px-4 py-2 bg-primary-600 text-white rounded">{isSubmitting ? t('saving') : t('save')}</button></div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};


export default BuildingsAndRoomsPage;
